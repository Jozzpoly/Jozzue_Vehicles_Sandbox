import type { E1Document, E1Vec3 } from "./model.js";
import {
  add,
  angularDistance,
  distance,
  finiteVec3,
  lengthSquared,
  rotateAroundAxis,
  scale,
  subtract,
} from "./spatial.js";

export type E1EvaluationStatus = "resolved" | "diagnosed-static" | "frozen-last-valid";

export interface E1Diagnostic {
  readonly code:
    | "E1_DISCONNECTED_DAMPER"
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
  readonly diagnostics: readonly E1Diagnostic[];
}

export interface E1PlayResult {
  readonly frames: readonly E1EvaluationFrame[];
  readonly diagnostics: readonly E1Diagnostic[];
}

const TWO_PI = Math.PI * 2;

export function inputAngleAtPhase(document: E1Document, phase: number): number {
  const centered = (document.arm.angleMinRad + document.arm.angleMaxRad) / 2;
  const amplitude = (document.arm.angleMaxRad - document.arm.angleMinRad) / 2;
  return centered + amplitude * Math.sin(phase * TWO_PI);
}

export function authoredArmEnd(document: E1Document, angleRad = 0): E1Vec3 {
  const restVector = scale(document.arm.restDirection, document.arm.length);
  return add(document.pivot.origin, rotateAroundAxis(restVector, document.pivot.axis, angleRad));
}

function staticFrame(
  document: E1Document,
  phase: number,
  diagnostics: readonly E1Diagnostic[],
): E1EvaluationFrame {
  const finiteOrZero = (value: E1Vec3): E1Vec3 =>
    finiteVec3(value) ? value : { x: 0, y: 0, z: 0 };
  const pivot = finiteOrZero(document.pivot.origin);
  const damperUpper = finiteOrZero(document.damper.upperHardpoint);
  let armEnd = pivot;
  try {
    const candidate = authoredArmEnd(document, 0);
    armEnd = finiteOrZero(candidate);
  } catch {
    // A diagnosed/static frame must remain renderable even when authored axes
    // are invalid; it is not a hidden attempt to solve the broken chain.
  }
  return {
    phase,
    status: "diagnosed-static",
    inputAngleRad: 0,
    pivot,
    armEnd,
    damperUpper,
    damperLower: armEnd,
    damperLength: distance(damperUpper, armEnd),
    diagnostics,
  };
}

export function evaluateDirectFrame(document: E1Document, phase: number): E1EvaluationFrame {
  if (
    !finiteVec3(document.pivot.origin) ||
    !finiteVec3(document.pivot.axis) ||
    lengthSquared(document.pivot.axis) <= 1e-12 ||
    !finiteVec3(document.arm.restDirection) ||
    lengthSquared(document.arm.restDirection) <= 1e-12 ||
    !finiteVec3(document.damper.upperHardpoint) ||
    document.arm.length <= 0
  ) {
    return staticFrame(document, phase, [
      {
        code: "E1_INVALID_AUTHORED_GEOMETRY",
        message: "Authored geometry is non-finite or has a non-positive arm length. PLAY is static.",
      },
    ]);
  }

  if (document.damper.lowerConnection !== "arm-end") {
    return staticFrame(document, phase, [
      {
        code: "E1_DISCONNECTED_DAMPER",
        message: "Damper lower reference is unresolved. PLAY remains available but the whole chain is static.",
      },
    ]);
  }

  const inputAngleRad = inputAngleAtPhase(document, phase);
  const armEnd = authoredArmEnd(document, inputAngleRad);
  return {
    phase,
    status: "resolved",
    inputAngleRad,
    pivot: document.pivot.origin,
    armEnd,
    damperUpper: document.damper.upperHardpoint,
    damperLower: armEnd,
    damperLength: distance(document.damper.upperHardpoint, armEnd),
    diagnostics: [],
  };
}

export function evaluateDirectPlay(document: E1Document, frameCount = 241): E1PlayResult {
  if (!Number.isInteger(frameCount) || frameCount < 2) {
    throw new Error("E1 PLAY requires at least two deterministic frames.");
  }
  const frames = Array.from({ length: frameCount }, (_, index) =>
    evaluateDirectFrame(document, index / (frameCount - 1)),
  );
  const diagnostics = frames.find((frame) => frame.diagnostics.length > 0)?.diagnostics ?? [];
  return { frames, diagnostics };
}

export interface E1PreparedRockerFixture {
  readonly inputPivot: E1Vec3;
  readonly inputAxis: E1Vec3;
  readonly inputVector: E1Vec3;
  readonly inputAngleMinRad: number;
  readonly inputAngleMaxRad: number;
  readonly rockerPivot: E1Vec3;
  readonly rockerAxis: E1Vec3;
  readonly rockerInputVector: E1Vec3;
  readonly rockerOutputVector: E1Vec3;
  readonly rockerNeutralAngleRad: number;
  readonly pushrodLength: number;
  readonly damperUpper: E1Vec3;
}

interface E1RockerRoot {
  readonly angleRad: number;
  readonly multipleRoots: boolean;
}

const ROOT_BRACKETS = 360;
const BISECTION_ITERATIONS = 52;
const ROOT_EPSILON = 1e-9;

function rockerInputPoint(fixture: E1PreparedRockerFixture, angleRad: number): E1Vec3 {
  return add(
    fixture.rockerPivot,
    rotateAroundAxis(fixture.rockerInputVector, fixture.rockerAxis, angleRad),
  );
}

function rootFunction(
  fixture: E1PreparedRockerFixture,
  inputPoint: E1Vec3,
  angleRad: number,
): number {
  const delta = subtract(inputPoint, rockerInputPoint(fixture, angleRad));
  return delta.x * delta.x + delta.y * delta.y + delta.z * delta.z - fixture.pushrodLength ** 2;
}

function solveRockerRoot(
  fixture: E1PreparedRockerFixture,
  inputPoint: E1Vec3,
  preferredAngleRad: number,
): E1RockerRoot | null {
  const candidates: number[] = [];
  let previousAngle = -Math.PI;
  let previousValue = rootFunction(fixture, inputPoint, previousAngle);

  for (let index = 1; index <= ROOT_BRACKETS; index += 1) {
    const nextAngle = -Math.PI + (index / ROOT_BRACKETS) * TWO_PI;
    const nextValue = rootFunction(fixture, inputPoint, nextAngle);

    if (Math.abs(previousValue) <= ROOT_EPSILON) {
      candidates.push(previousAngle);
    }
    if (previousValue * nextValue < 0) {
      let lower = previousAngle;
      let upper = nextAngle;
      let lowerValue = previousValue;
      for (let iteration = 0; iteration < BISECTION_ITERATIONS; iteration += 1) {
        const middle = (lower + upper) / 2;
        const middleValue = rootFunction(fixture, inputPoint, middle);
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
    const distanceDelta = angularDistance(a, preferredAngleRad) - angularDistance(b, preferredAngleRad);
    return Math.abs(distanceDelta) <= 1e-12 ? a - b : distanceDelta;
  });
  return { angleRad: unique[0]!, multipleRoots: unique.length > 1 };
}

export function evaluatePreparedRockerPlay(
  fixture: E1PreparedRockerFixture,
  frameCount = 241,
): E1PlayResult {
  if (!Number.isInteger(frameCount) || frameCount < 2) {
    throw new Error("E1 prepared PLAY requires at least two deterministic frames.");
  }
  const frames: E1EvaluationFrame[] = [];
  const aggregateDiagnostics: E1Diagnostic[] = [];
  let previousAngle = fixture.rockerNeutralAngleRad;
  let lastValid: E1EvaluationFrame | null = null;

  for (let index = 0; index < frameCount; index += 1) {
    const phase = index / (frameCount - 1);
    const centered = (fixture.inputAngleMinRad + fixture.inputAngleMaxRad) / 2;
    const amplitude = (fixture.inputAngleMaxRad - fixture.inputAngleMinRad) / 2;
    const inputAngleRad = centered + amplitude * Math.sin(phase * TWO_PI);
    const armEnd = add(
      fixture.inputPivot,
      rotateAroundAxis(fixture.inputVector, fixture.inputAxis, inputAngleRad),
    );
    const root = solveRockerRoot(fixture, armEnd, previousAngle);

    if (!root) {
      const diagnostic: E1Diagnostic = {
        code: "E1_LINKAGE_NO_ROOT",
        message: "The prepared linkage has no continuous root at this sample; the whole chain freezes at its last valid frame.",
      };
      if (!aggregateDiagnostics.some((entry) => entry.code === diagnostic.code)) {
        aggregateDiagnostics.push(diagnostic);
      }
      if (lastValid) {
        frames.push({ ...lastValid, phase, status: "frozen-last-valid", diagnostics: [diagnostic] });
      } else {
        const damperLower = fixture.rockerPivot;
        frames.push({
          phase,
          status: "diagnosed-static",
          inputAngleRad,
          pivot: fixture.inputPivot,
          armEnd,
          damperUpper: fixture.damperUpper,
          damperLower,
          damperLength: distance(fixture.damperUpper, damperLower),
          diagnostics: [diagnostic],
        });
      }
      continue;
    }

    previousAngle = root.angleRad;
    const damperLower = add(
      fixture.rockerPivot,
      rotateAroundAxis(fixture.rockerOutputVector, fixture.rockerAxis, root.angleRad),
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
      pivot: fixture.inputPivot,
      armEnd,
      damperUpper: fixture.damperUpper,
      damperLower,
      damperLength: distance(fixture.damperUpper, damperLower),
      diagnostics,
    };
    frames.push(frame);
    lastValid = frame;
  }

  return { frames, diagnostics: aggregateDiagnostics };
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
  ];
  return `${frame.status}|${values.map((value) => value.toFixed(12)).join("|")}`;
}
