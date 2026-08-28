import type { E1Document, E1Participant, E1Relation, E1Vec3 } from "./model.js";
import { E1_IDENTITY_QUAT, subtract } from "./spatial.js";

const ARM_PIVOT: E1Vec3 = { x: -1.6, y: 1.15, z: 0.1 };
const ARM_END_LOCAL: E1Vec3 = { x: 3.15, y: -0.25, z: 0.1 };
const DAMPER_UPPER: E1Vec3 = { x: -0.65, y: 3.2, z: 0.55 };
const ARM_END_WORLD: E1Vec3 = {
  x: ARM_PIVOT.x + ARM_END_LOCAL.x,
  y: ARM_PIVOT.y + ARM_END_LOCAL.y,
  z: ARM_PIVOT.z + ARM_END_LOCAL.z,
};

export const E1_IDS = {
  chassis: "participant-chassis",
  arm: "participant-arm",
  damper: "participant-damper",
  rocker: "participant-rocker",
  pushrod: "participant-pushrod",
  chassisUpper: "chassis-point-a",
  chassisAxis: "chassis-axis-a",
  armPivot: "arm-axis-a",
  armEnd: "arm-point-a",
  damperA: "damper-point-a",
  damperB: "damper-point-b",
  rockerPivot: "rocker-axis-a",
  rockerA: "rocker-point-a",
  rockerB: "rocker-point-b",
  pushrodA: "pushrod-point-a",
  pushrodB: "pushrod-point-b",
} as const;

function directParticipants(): readonly E1Participant[] {
  const chassis: E1Participant = {
    id: E1_IDS.chassis,
    kind: "fixed-fixture",
    label: "Chassis fixture",
    fixed: true,
    pose: { position: { x: 0, y: 0, z: 0 }, rotation: E1_IDENTITY_QUAT },
    references: [
      { id: E1_IDS.chassisUpper, kind: "point", label: "Mount point", localPosition: DAMPER_UPPER },
      {
        id: E1_IDS.chassisAxis,
        kind: "axis",
        label: "Mount axis",
        localOrigin: { x: 2.15, y: 1.75, z: 0.5 },
        localDirection: { x: 0.18, y: 0.08, z: 1 },
      },
    ],
  };
  const arm: E1Participant = {
    id: E1_IDS.arm,
    kind: "driven-arm",
    label: "Driven arm",
    fixed: true,
    pose: { position: ARM_PIVOT, rotation: E1_IDENTITY_QUAT },
    references: [
      {
        id: E1_IDS.armPivot,
        kind: "axis",
        label: "Pivot axis",
        localOrigin: { x: 0, y: 0, z: 0 },
        localDirection: { x: 0.2, y: 0.12, z: 1 },
      },
      { id: E1_IDS.armEnd, kind: "point", label: "Attachment point", localPosition: ARM_END_LOCAL },
    ],
  };
  const damper: E1Participant = {
    id: E1_IDS.damper,
    kind: "telescopic-damper",
    label: "Damper",
    fixed: false,
    pose: { position: DAMPER_UPPER, rotation: E1_IDENTITY_QUAT },
    references: [
      { id: E1_IDS.damperA, kind: "point", label: "Endpoint A", localPosition: { x: 0, y: 0, z: 0 } },
      {
        id: E1_IDS.damperB,
        kind: "point",
        label: "Endpoint B",
        localPosition: subtract(ARM_END_WORLD, DAMPER_UPPER),
      },
    ],
  };
  return [chassis, arm, damper];
}

export function createE1RockerParticipant(): E1Participant {
  return {
    id: E1_IDS.rocker,
    kind: "rocker",
    label: "Rocker",
    fixed: false,
    pose: { position: { x: 3.7, y: 2.6, z: 1.15 }, rotation: E1_IDENTITY_QUAT },
    references: [
      {
        id: E1_IDS.rockerPivot,
        kind: "axis",
        label: "Pivot axis",
        localOrigin: { x: 0, y: 0, z: 0 },
        localDirection: { x: 0, y: 0, z: 1 },
      },
      { id: E1_IDS.rockerA, kind: "point", label: "Attachment A", localPosition: { x: -0.78, y: 0, z: 0 } },
      { id: E1_IDS.rockerB, kind: "point", label: "Attachment B", localPosition: { x: 0, y: 0.88, z: 0 } },
    ],
  };
}

export function createE1PushrodParticipant(): E1Participant {
  return {
    id: E1_IDS.pushrod,
    kind: "rigid-link",
    label: "Rigid link",
    fixed: false,
    pose: { position: { x: 3.55, y: 0.72, z: 1.0 }, rotation: E1_IDENTITY_QUAT },
    references: [
      { id: E1_IDS.pushrodA, kind: "point", label: "Endpoint A", localPosition: { x: 0, y: 0, z: 0 } },
      { id: E1_IDS.pushrodB, kind: "point", label: "Endpoint B", localPosition: { x: 1.05, y: 0, z: 0 } },
    ],
  };
}

export function createE1DirectBaseline(): E1Document {
  const relations: readonly E1Relation[] = [
    {
      id: "relation-1",
      kind: "point-coincidence",
      sourceReferenceId: E1_IDS.damperA,
      targetReferenceId: E1_IDS.chassisUpper,
    },
    {
      id: "relation-2",
      kind: "point-coincidence",
      sourceReferenceId: E1_IDS.damperB,
      targetReferenceId: E1_IDS.armEnd,
    },
  ];
  return {
    experiment: "e1-structural-rewire",
    revision: 0,
    nextRelationOrdinal: 3,
    participants: directParticipants(),
    relations,
    driver: {
      participantId: E1_IDS.arm,
      pivotAxisReferenceId: E1_IDS.armPivot,
      drivenPointReferenceId: E1_IDS.armEnd,
      // Bounded motion shared by both supported E1 paths. The earlier wider
      // causal-spine range made the intended rocker fixture lose its root at an
      // extreme and would confound structural authoring with fixture geometry.
      angleMinRad: -0.22,
      angleMaxRad: 0.29,
    },
  };
}
