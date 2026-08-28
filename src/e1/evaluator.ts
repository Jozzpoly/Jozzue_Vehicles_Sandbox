import type { E1Document, E1Participant, E1ReferenceId, E1Vec3 } from "./model.js";
import {
  allRelationStatuses,
  linearParticipantLength,
  resolveReference,
  worldReference,
  type E1WorldAxisReference,
  type E1WorldPointReference,
  type E1WorldReference,
} from "./construction.js";
import {
  add,
  angularDistance,
  distance,
  rotateAroundAxis,
  subtract,
} from "./spatial.js";

export type E1EvaluationStatus = "resolved" | "diagnosed-static" | "frozen-last-valid";

export interface E1Diagnostic {
  readonly code:
    | "E1_RELATION_GEOMETRY_VIOLATED"
    | "E1_UNSUPPORTED_TOPOLOGY"
    | "E1_INVALID_AUTHORED_GEOMETRY"
    | "E1_LINKAGE_NO_ROOT"
    | "E1_LINKAGE_MULTIPLE_ROOTS";
  readonly message: string;
}

export interface E1EvaluationFrame {
  readonly phase: number;
  readonly status: E1EvaluationStatus;
  readonly inputAngleRad: number;
  readonly drivenAngleRad?: number;
  readonly pivot: E1Vec3;
  readonly armEnd: E1Vec3;
  readonly damperUpper: E1Vec3;
  readonly damperLower: E1Vec3;
  readonly damperLength: number;
  readonly rockerPivot?: E1Vec3;
  readonly rockerAxis?: E1Vec3;
  readonly rockerInput?: E1Vec3;
  readonly rockerOutput?: E1Vec3;
  readonly pushrodStart?: E1Vec3;
  readonly pushrodEnd?: E1Vec3;
  readonly pushrodLength?: number;
  readonly diagnostics: readonly E1Diagnostic[];
}

export interface E1PlayResult {
  readonly topology: "direct" | "rocker" | "unsupported";
  readonly frames: readonly E1EvaluationFrame[];
  readonly diagnostics: readonly E1Diagnostic[];
}

interface E1DriverGeometry {
  readonly pivot: E1Vec3;
  readonly axis: E1Vec3;
  readonly restVector: E1Vec3;
  readonly angleMinRad: number;
  readonly angleMaxRad: number;
}

interface E1DirectTopology {
  readonly kind: "direct";
  readonly driver: E1DriverGeometry;
  readonly damperUpper: E1Vec3;
}

interface E1RockerTopology {
  readonly kind: "rocker";
  readonly driver: E1DriverGeometry;
  readonly rockerPivot: E1Vec3;
  readonly rockerAxis: E1Vec3;
  readonly rockerInputVector: E1Vec3;
  readonly rockerOutputVector: E1Vec3;
  readonly pushrodLength: number;
  readonly damperUpper: E1Vec3;
}

type E1SupportedTopology = E1DirectTopology | E1RockerTopology;

const TWO_PI = Math.PI * 2;
const ROOT_BRACKETS = 360;
const BISECTION_ITERATIONS = 52;
const ROOT_EPSILON = 1e-9;

function participantByKind(document: E1Document, kind: E1Participant["kind"]): E1Participant | null {
  const matches = document.participants.filter((participant) => participant.kind === kind);
  return matches.length === 1 ? matches[0]! : null;
}

function referencesOfParticipant(
  document: E1Document,
  participant: E1Participant,
  kind: "point",
): E1WorldPointReference[];
function referencesOfParticipant(
  document: E1Document,
  participant: E1Participant,
  kind: "axis",
): E1WorldAxisReference[];
function referencesOfParticipant(
  document: E1Document,
  participant: E1Participant,
  kind: "point" | "axis",
): E1WorldReference[] {
  return participant.references
    .filter((reference) => reference.kind === kind)
    .map((reference) => worldReference(document, reference.id))
    .filter((reference) => reference.kind === kind);
}

function relationNeighbor(document: E1Document, referenceId: E1ReferenceId): E1ReferenceId[] {
  return document.relations
    .filter(
      (relation) =>
        relation.sourceReferenceId === referenceId || relation.targetReferenceId === referenceId,
    )
    .map((relation) =>
      relation.sourceReferenceId === referenceId
        ? relation.targetReferenceId
        : relation.sourceReferenceId,
    );
}

function connectedReferenceOnParticipant(
  document: E1Document,
  referenceId: E1ReferenceId,
  participantId: string,
): E1ReferenceId | null {
  const matches = relationNeighbor(document, referenceId).filter(
    (neighborId) => resolveReference(document, neighborId).participant.id === participantId,
  );
  return matches.length === 1 ? matches[0]! : null;
}

function driverGeometry(document: E1Document): E1DriverGeometry | null {
  try {
    const axis = worldReference(document, document.driver.pivotAxisReferenceId);
    const point = worldReference(document, document.driver.drivenPointReferenceId);
    if (axis.kind !== "axis" || point.kind !== "point") {
      return null;
    }
    return {
      pivot: axis.worldOrigin,
      axis: axis.worldDirection,
      restVector: subtract(point.worldPosition, axis.worldOrigin),
      angleMinRad: document.driver.angleMinRad,
      angleMaxRad: document.driver.angleMaxRad,
    };
  } catch {
    return null;
  }
}

function deriveTopology(document: E1Document): E1SupportedTopology | null {
  const driver = driverGeometry(document);
  const chassis = participantByKind(document, "fixed-fixture");
  const arm = participantByKind(document, "driven-arm");
  const damper = participantByKind(document, "telescopic-damper");
  if (!driver || !chassis || !arm || !damper) {
    return null;
  }
  const damperPoints = referencesOfParticipant(document, damper, "point");
  if (damperPoints.length !== 2) {
    return null;
  }
  const chassisDamperPoint = damperPoints.find((point) =>
    connectedReferenceOnParticipant(document, point.reference.id, chassis.id),
  );
  if (!chassisDamperPoint) {
    return null;
  }
  const chassisTargetId = connectedReferenceOnParticipant(
    document,
    chassisDamperPoint.reference.id,
    chassis.id,
  );
  if (!chassisTargetId) {
    return null;
  }
  const damperUpperTarget = worldReference(document, chassisTargetId);
  if (damperUpperTarget.kind !== "point") {
    return null;
  }
  const otherDamperPoint = damperPoints.find(
    (point) => point.reference.id !== chassisDamperPoint.reference.id,
  );
  if (!otherDamperPoint) {
    return null;
  }

  const directTarget = connectedReferenceOnParticipant(document, otherDamperPoint.reference.id, arm.id);
  if (directTarget && document.relations.length === 2) {
    return { kind: "direct", driver, damperUpper: damperUpperTarget.worldPosition };
  }

  const rocker = participantByKind(document, "rocker");
  const pushrod = participantByKind(document, "rigid-link");
  if (!rocker || !pushrod) {
    return null;
  }
  const rockerPoints = referencesOfParticipant(document, rocker, "point");
  const rockerAxes = referencesOfParticipant(document, rocker, "axis");
  const chassisAxes = referencesOfParticipant(document, chassis, "axis");
  const pushrodPoints = referencesOfParticipant(document, pushrod, "point");
  if (rockerPoints.length !== 2 || rockerAxes.length !== 1 || chassisAxes.length < 1 || pushrodPoints.length !== 2) {
    return null;
  }
  const rockerAxis = rockerAxes[0]!;
  const chassisAxisId = connectedReferenceOnParticipant(document, rockerAxis.reference.id, chassis.id);
  if (!chassisAxisId) {
    return null;
  }
  const pushrodAtArm = pushrodPoints.find((point) =>
    connectedReferenceOnParticipant(document, point.reference.id, arm.id),
  );
  const pushrodAtRocker = pushrodPoints.find((point) =>
    connectedReferenceOnParticipant(document, point.reference.id, rocker.id),
  );
  if (!pushrodAtArm || !pushrodAtRocker) {
    return null;
  }
  const rockerInputId = connectedReferenceOnParticipant(
    document,
    pushrodAtRocker.reference.id,
    rocker.id,
  );
  const rockerOutputId = connectedReferenceOnParticipant(
    document,
    otherDamperPoint.reference.id,
    rocker.id,
  );
  if (!rockerInputId || !rockerOutputId || rockerInputId === rockerOutputId) {
    return null;
  }
  const rockerInput = worldReference(document, rockerInputId);
  const rockerOutput = worldReference(document, rockerOutputId);
  if (rockerInput.kind !== "point" || rockerOutput.kind !== "point") {
    return null;
  }
  const authoredPushrodLength = linearParticipantLength(pushrod);
  if (!authoredPushrodLength || document.relations.length !== 5) {
    return null;
  }
  return {
    kind: "rocker",
    driver,
    rockerPivot: rockerAxis.worldOrigin,
    rockerAxis: rockerAxis.worldDirection,
    rockerInputVector: subtract(rockerInput.worldPosition, rockerAxis.worldOrigin),
    rockerOutputVector: subtract(rockerOutput.worldPosition, rockerAxis.worldOrigin),
    pushrodLength: authoredPushrodLength,
    damperUpper: damperUpperTarget.worldPosition,
  };
}

function inputAngleAtPhase(driver: E1DriverGeometry, phase: number): number {
  const centered = (driver.angleMinRad + driver.angleMaxRad) / 2;
  const amplitude = (driver.angleMaxRad - driver.angleMinRad) / 2;
  return centered + amplitude * Math.sin(phase * TWO_PI);
}

function staticFrame(document: E1Document, phase: number, diagnostics: readonly E1Diagnostic[]): E1EvaluationFrame {
  const driver = driverGeometry(document);
  const pivot = driver?.pivot ?? { x: 0, y: 0, z: 0 };
  const armEnd = driver ? add(driver.pivot, driver.restVector) : pivot;
  const damper = participantByKind(document, "telescopic-damper");
  const damperPoints = damper ? referencesOfParticipant(document, damper, "point") : [];
  const first = damperPoints[0];
  const second = damperPoints[1];
  const damperUpper = first?.worldPosition ?? pivot;
  const damperLower = second?.worldPosition ?? armEnd;
  return {
    phase,
    status: "diagnosed-static",
    inputAngleRad: 0,
    pivot,
    armEnd,
    damperUpper,
    damperLower,
    damperLength: distance(damperUpper, damperLower),
    diagnostics,
  };
}

function staticResult(
  document: E1Document,
  diagnostic: E1Diagnostic,
  frameCount: number,
): E1PlayResult {
  return {
    topology: "unsupported",
    diagnostics: [diagnostic],
    frames: Array.from({ length: frameCount }, (_, index) =>
      staticFrame(document, index / (frameCount - 1), [diagnostic]),
    ),
  };
}

function evaluateDirect(topology: E1DirectTopology, frameCount: number): E1PlayResult {
  const frames = Array.from({ length: frameCount }, (_, index): E1EvaluationFrame => {
    const phase = index / (frameCount - 1);
    const inputAngleRad = inputAngleAtPhase(topology.driver, phase);
    const armEnd = add(
      topology.driver.pivot,
      rotateAroundAxis(topology.driver.restVector, topology.driver.axis, inputAngleRad),
    );
    return {
      phase,
      status: "resolved",
      inputAngleRad,
      pivot: topology.driver.pivot,
      armEnd,
      damperUpper: topology.damperUpper,
      damperLower: armEnd,
      damperLength: distance(topology.damperUpper, armEnd),
      diagnostics: [],
    };
  });
  return { topology: "direct", frames, diagnostics: [] };
}

interface E1RockerRoot {
  readonly angleRad: number;
  readonly multipleRoots: boolean;
}

function rockerInputPoint(topology: E1RockerTopology, angleRad: number): E1Vec3 {
  return add(
    topology.rockerPivot,
    rotateAroundAxis(topology.rockerInputVector, topology.rockerAxis, angleRad),
  );
}

function rootFunction(topology: E1RockerTopology, inputPoint: E1Vec3, angleRad: number): number {
  return distance(inputPoint, rockerInputPoint(topology, angleRad)) ** 2 - topology.pushrodLength ** 2;
}

function solveRockerRoot(
  topology: E1RockerTopology,
  inputPoint: E1Vec3,
  preferredAngleRad: number,
): E1RockerRoot | null {
  const candidates: number[] = [];
  let previousAngle = -Math.PI;
  let previousValue = rootFunction(topology, inputPoint, previousAngle);
  for (let index = 1; index <= ROOT_BRACKETS; index += 1) {
    const nextAngle = -Math.PI + (index / ROOT_BRACKETS) * TWO_PI;
    const nextValue = rootFunction(topology, inputPoint, nextAngle);
    if (Math.abs(previousValue) <= ROOT_EPSILON) {
      candidates.push(previousAngle);
    }
    if (previousValue * nextValue < 0) {
      let lower = previousAngle;
      let upper = nextAngle;
      let lowerValue = previousValue;
      for (let iteration = 0; iteration < BISECTION_ITERATIONS; iteration += 1) {
        const middle = (lower + upper) / 2;
        const middleValue = rootFunction(topology, inputPoint, middle);
        if (lowerValue * middleValue <= 0) {
          upper = middle;
        } else {
          lower = middle;
          lowerValue = middleValue;
        }
      }
      candidates.push((lower + upper) / 2);
    }
    previousAngle = nextAngle;
    previousValue = nextValue;
  }
  const unique = candidates
    .sort((a, b) => a - b)
    .filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]!) > 1e-6);
  if (unique.length === 0) {
    return null;
  }
  unique.sort((a, b) => {
    const delta = angularDistance(a, preferredAngleRad) - angularDistance(b, preferredAngleRad);
    return Math.abs(delta) <= 1e-12 ? a - b : delta;
  });
  return { angleRad: unique[0]!, multipleRoots: unique.length > 1 };
}

function evaluateRocker(topology: E1RockerTopology, frameCount: number): E1PlayResult {
  const frames: E1EvaluationFrame[] = [];
  const aggregateDiagnostics: E1Diagnostic[] = [];
  let previousAngle = 0;
  let lastValid: E1EvaluationFrame | null = null;
  for (let index = 0; index < frameCount; index += 1) {
    const phase = index / (frameCount - 1);
    const inputAngleRad = inputAngleAtPhase(topology.driver, phase);
    const armEnd = add(
      topology.driver.pivot,
      rotateAroundAxis(topology.driver.restVector, topology.driver.axis, inputAngleRad),
    );
    const root = solveRockerRoot(topology, armEnd, previousAngle);
    if (!root) {
      const diagnostic: E1Diagnostic = {
        code: "E1_LINKAGE_NO_ROOT",
        message: "The authored linkage has no continuous root at this sample; the whole mechanism freezes at its last valid frame.",
      };
      if (!aggregateDiagnostics.some((entry) => entry.code === diagnostic.code)) {
        aggregateDiagnostics.push(diagnostic);
      }
      if (lastValid) {
        frames.push({ ...lastValid, phase, status: "frozen-last-valid", diagnostics: [diagnostic] });
      } else {
        frames.push({
          phase,
          status: "diagnosed-static",
          inputAngleRad,
          pivot: topology.driver.pivot,
          armEnd,
          damperUpper: topology.damperUpper,
          damperLower: topology.rockerPivot,
          damperLength: distance(topology.damperUpper, topology.rockerPivot),
          rockerPivot: topology.rockerPivot,
          rockerAxis: topology.rockerAxis,
          rockerInput: add(topology.rockerPivot, topology.rockerInputVector),
          rockerOutput: add(topology.rockerPivot, topology.rockerOutputVector),
          pushrodStart: armEnd,
          pushrodEnd: add(topology.rockerPivot, topology.rockerInputVector),
          pushrodLength: topology.pushrodLength,
          diagnostics: [diagnostic],
        });
      }
      continue;
    }
    previousAngle = root.angleRad;
    const rockerInput = rockerInputPoint(topology, root.angleRad);
    const rockerOutput = add(
      topology.rockerPivot,
      rotateAroundAxis(topology.rockerOutputVector, topology.rockerAxis, root.angleRad),
    );
    const diagnostics: E1Diagnostic[] = root.multipleRoots
      ? [{
          code: "E1_LINKAGE_MULTIPLE_ROOTS",
          message: "Multiple geometric roots exist; deterministic continuity selected the closest prior branch.",
        }]
      : [];
    const frame: E1EvaluationFrame = {
      phase,
      status: "resolved",
      inputAngleRad,
      drivenAngleRad: root.angleRad,
      pivot: topology.driver.pivot,
      armEnd,
      damperUpper: topology.damperUpper,
      damperLower: rockerOutput,
      damperLength: distance(topology.damperUpper, rockerOutput),
      rockerPivot: topology.rockerPivot,
      rockerAxis: topology.rockerAxis,
      rockerInput,
      rockerOutput,
      pushrodStart: armEnd,
      pushrodEnd: rockerInput,
      pushrodLength: topology.pushrodLength,
      diagnostics,
    };
    frames.push(frame);
    lastValid = frame;
  }
  return { topology: "rocker", frames, diagnostics: aggregateDiagnostics };
}

export function evaluateE1Play(document: E1Document, frameCount = 241): E1PlayResult {
  if (!Number.isInteger(frameCount) || frameCount < 2) {
    throw new Error("E1 PLAY requires at least two deterministic frames.");
  }
  let statuses;
  try {
    statuses = allRelationStatuses(document);
  } catch {
    return staticResult(document, {
      code: "E1_INVALID_AUTHORED_GEOMETRY",
      message: "A spatial reference cannot be resolved. PLAY remains available but static.",
    }, frameCount);
  }
  const violated = statuses.filter((status) => !status.satisfied);
  if (violated.length > 0) {
    return staticResult(document, {
      code: "E1_RELATION_GEOMETRY_VIOLATED",
      message: `${violated.length} authored relation${violated.length === 1 ? " is" : "s are"} geometrically violated. Relations remain authored; PLAY diagnoses the whole mechanism as static.`,
    }, frameCount);
  }
  const topology = deriveTopology(document);
  if (!topology) {
    return staticResult(document, {
      code: "E1_UNSUPPORTED_TOPOLOGY",
      message: "The current explicit relations do not form a supported direct or rocker E1 motion path. PLAY remains available but static.",
    }, frameCount);
  }
  return topology.kind === "direct"
    ? evaluateDirect(topology, frameCount)
    : evaluateRocker(topology, frameCount);
}

export function e1FrameSignature(frame: E1EvaluationFrame): string {
  const values = [
    frame.phase,
    frame.inputAngleRad,
    frame.drivenAngleRad ?? 0,
    frame.armEnd.x,
    frame.armEnd.y,
    frame.armEnd.z,
    frame.damperLength,
    frame.pushrodLength ?? 0,
  ];
  return `${frame.status}|${values.map((value) => value.toFixed(12)).join("|")}`;
}
