// E1-LOCAL / PROVISIONAL / NOT JV ARCHITECTURE.
// These shapes exist only to give the strong-simple Structural Rewire hypothesis
// a fair test. Their names and layout carry no compatibility promise.

export interface E1Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface E1Quat {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface E1Pose {
  readonly position: E1Vec3;
  readonly rotation: E1Quat;
}

export type E1ParticipantId = string;
export type E1ReferenceId = string;
export type E1RelationId = string;

export type E1ParticipantKind =
  | "fixed-fixture"
  | "driven-arm"
  | "telescopic-damper"
  | "rocker"
  | "rigid-link";

export interface E1PointReference {
  readonly id: E1ReferenceId;
  readonly kind: "point";
  readonly label: string;
  readonly localPosition: E1Vec3;
}

export interface E1AxisReference {
  readonly id: E1ReferenceId;
  readonly kind: "axis";
  readonly label: string;
  readonly localOrigin: E1Vec3;
  readonly localDirection: E1Vec3;
}

export type E1SpatialReference = E1PointReference | E1AxisReference;

export interface E1Participant {
  readonly id: E1ParticipantId;
  readonly kind: E1ParticipantKind;
  readonly label: string;
  readonly fixed: boolean;
  readonly pose: E1Pose;
  readonly references: readonly E1SpatialReference[];
}

export interface E1PointCoincidenceRelation {
  readonly id: E1RelationId;
  readonly kind: "point-coincidence";
  readonly sourceReferenceId: E1ReferenceId;
  readonly targetReferenceId: E1ReferenceId;
}

export interface E1RevoluteAxisRelation {
  readonly id: E1RelationId;
  readonly kind: "revolute-axis";
  readonly sourceReferenceId: E1ReferenceId;
  readonly targetReferenceId: E1ReferenceId;
}

export type E1Relation = E1PointCoincidenceRelation | E1RevoluteAxisRelation;

export interface E1Driver {
  readonly participantId: E1ParticipantId;
  readonly pivotAxisReferenceId: E1ReferenceId;
  readonly drivenPointReferenceId: E1ReferenceId;
  readonly angleMinRad: number;
  readonly angleMaxRad: number;
}

export interface E1Document {
  readonly experiment: "e1-structural-rewire";
  readonly revision: number;
  readonly nextRelationOrdinal: number;
  readonly participants: readonly E1Participant[];
  readonly relations: readonly E1Relation[];
  readonly driver: E1Driver;
}

export type E1EditReason =
  | "participant-pose"
  | "participant-geometry"
  | "add-participant"
  | "connect-references"
  | "disconnect-relation";

export interface E1HistoryEntry {
  readonly reason: E1EditReason;
  readonly before: E1Document;
  readonly after: E1Document;
}

export function cloneE1Document(document: E1Document): E1Document {
  return structuredClone(document);
}

export function e1DocumentEquals(a: E1Document, b: E1Document): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
