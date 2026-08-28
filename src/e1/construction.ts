// E1-LOCAL structural operations. Geometry status is always derived; there is
// deliberately no persistent "unresolved transaction" or automatic repair state.

import type {
  E1AxisReference,
  E1Document,
  E1Participant,
  E1ParticipantId,
  E1PointReference,
  E1Pose,
  E1ReferenceId,
  E1Relation,
  E1RelationId,
  E1SpatialReference,
  E1Vec3,
} from "./model.js";
import {
  add,
  distance,
  dot,
  length,
  multiplyQuats,
  normalize,
  quatFromUnitVectors,
  scale,
  subtract,
  transformDirection,
  transformPoint,
} from "./spatial.js";

export interface E1ResolvedReference {
  readonly participant: E1Participant;
  readonly reference: E1SpatialReference;
}

export interface E1WorldPointReference extends E1ResolvedReference {
  readonly kind: "point";
  readonly reference: E1PointReference;
  readonly worldPosition: E1Vec3;
}

export interface E1WorldAxisReference extends E1ResolvedReference {
  readonly kind: "axis";
  readonly reference: E1AxisReference;
  readonly worldOrigin: E1Vec3;
  readonly worldDirection: E1Vec3;
}

export type E1WorldReference = E1WorldPointReference | E1WorldAxisReference;

export interface E1RelationGeometryStatus {
  readonly relation: E1Relation;
  readonly satisfied: boolean;
  readonly positionError: number;
  readonly angleErrorRad?: number;
  readonly sourcePosition: E1Vec3;
  readonly targetPosition: E1Vec3;
}

const POINT_TOLERANCE = 0.11;
const AXIS_ORIGIN_TOLERANCE = 0.11;
const AXIS_ANGLE_TOLERANCE_RAD = (3 * Math.PI) / 180;

export function getParticipant(document: E1Document, participantId: E1ParticipantId): E1Participant {
  const participant = document.participants.find((candidate) => candidate.id === participantId);
  if (!participant) {
    throw new Error(`Unknown E1 participant: ${participantId}`);
  }
  return participant;
}

export function resolveReference(document: E1Document, referenceId: E1ReferenceId): E1ResolvedReference {
  for (const participant of document.participants) {
    const reference = participant.references.find((candidate) => candidate.id === referenceId);
    if (reference) {
      return { participant, reference };
    }
  }
  throw new Error(`Unknown E1 spatial reference: ${referenceId}`);
}

export function worldReference(document: E1Document, referenceId: E1ReferenceId): E1WorldReference {
  const resolved = resolveReference(document, referenceId);
  if (resolved.reference.kind === "point") {
    return {
      ...resolved,
      kind: "point",
      reference: resolved.reference,
      worldPosition: transformPoint(resolved.participant.pose, resolved.reference.localPosition),
    };
  }
  return {
    ...resolved,
    kind: "axis",
    reference: resolved.reference,
    worldOrigin: transformPoint(resolved.participant.pose, resolved.reference.localOrigin),
    worldDirection: transformDirection(resolved.participant.pose, resolved.reference.localDirection),
  };
}

export function relationGeometryStatus(
  document: E1Document,
  relation: E1Relation,
): E1RelationGeometryStatus {
  const source = worldReference(document, relation.sourceReferenceId);
  const target = worldReference(document, relation.targetReferenceId);
  if (relation.kind === "point-coincidence") {
    if (source.kind !== "point" || target.kind !== "point") {
      throw new Error(`Point relation ${relation.id} does not resolve to two point references.`);
    }
    const positionError = distance(source.worldPosition, target.worldPosition);
    return {
      relation,
      satisfied: positionError <= POINT_TOLERANCE,
      positionError,
      sourcePosition: source.worldPosition,
      targetPosition: target.worldPosition,
    };
  }
  if (source.kind !== "axis" || target.kind !== "axis") {
    throw new Error(`Axis relation ${relation.id} does not resolve to two axis references.`);
  }
  const positionError = distance(source.worldOrigin, target.worldOrigin);
  const cosine = Math.min(1, Math.max(-1, Math.abs(dot(source.worldDirection, target.worldDirection))));
  const angleErrorRad = Math.acos(cosine);
  return {
    relation,
    satisfied: positionError <= AXIS_ORIGIN_TOLERANCE && angleErrorRad <= AXIS_ANGLE_TOLERANCE_RAD,
    positionError,
    angleErrorRad,
    sourcePosition: source.worldOrigin,
    targetPosition: target.worldOrigin,
  };
}

export function allRelationStatuses(document: E1Document): readonly E1RelationGeometryStatus[] {
  return document.relations.map((relation) => relationGeometryStatus(document, relation));
}

export function relationsForReference(
  document: E1Document,
  referenceId: E1ReferenceId,
): readonly E1Relation[] {
  return document.relations.filter(
    (relation) =>
      relation.sourceReferenceId === referenceId || relation.targetReferenceId === referenceId,
  );
}

export function withParticipantPose(
  document: E1Document,
  participantId: E1ParticipantId,
  pose: E1Pose,
): E1Document {
  const participant = getParticipant(document, participantId);
  if (participant.fixed) {
    return document;
  }
  return {
    ...document,
    participants: document.participants.map((candidate) =>
      candidate.id === participantId ? { ...candidate, pose } : candidate,
    ),
  };
}

export function addParticipant(document: E1Document, participant: E1Participant): E1Document {
  if (document.participants.some((candidate) => candidate.id === participant.id)) {
    return document;
  }
  return { ...document, participants: [...document.participants, participant] };
}

function snapPointSourcePose(
  sourceParticipant: E1Participant,
  sourcePosition: E1Vec3,
  targetPosition: E1Vec3,
): E1Pose {
  return {
    ...sourceParticipant.pose,
    position: add(sourceParticipant.pose.position, subtract(targetPosition, sourcePosition)),
  };
}

function snapAxisSourcePose(
  sourceParticipant: E1Participant,
  source: E1WorldAxisReference,
  target: E1WorldAxisReference,
): E1Pose {
  const alignment = quatFromUnitVectors(source.worldDirection, target.worldDirection);
  const rotation = multiplyQuats(alignment, sourceParticipant.pose.rotation);
  const rotatedOrigin = transformPoint(
    { position: sourceParticipant.pose.position, rotation },
    source.reference.localOrigin,
  );
  return {
    position: add(sourceParticipant.pose.position, subtract(target.worldOrigin, rotatedOrigin)),
    rotation,
  };
}

export function connectReferences(
  document: E1Document,
  kind: E1Relation["kind"],
  sourceReferenceId: E1ReferenceId,
  targetReferenceId: E1ReferenceId,
): E1Document {
  if (sourceReferenceId === targetReferenceId) {
    return document;
  }
  const source = worldReference(document, sourceReferenceId);
  const target = worldReference(document, targetReferenceId);
  if (source.participant.fixed) {
    throw new Error("Choose a reference on a movable participant as the connection source.");
  }
  if (source.participant.id === target.participant.id) {
    throw new Error("E1 does not create a mechanical relation inside one participant.");
  }
  const expectedReferenceKind = kind === "point-coincidence" ? "point" : "axis";
  if (source.kind !== expectedReferenceKind || target.kind !== expectedReferenceKind) {
    throw new Error(`${kind} requires two ${expectedReferenceKind} references.`);
  }
  const duplicate = document.relations.some(
    (relation) =>
      relation.kind === kind &&
      ((relation.sourceReferenceId === sourceReferenceId && relation.targetReferenceId === targetReferenceId) ||
        (relation.sourceReferenceId === targetReferenceId && relation.targetReferenceId === sourceReferenceId)),
  );
  if (duplicate) {
    return document;
  }

  const snappedPose = kind === "point-coincidence"
    ? snapPointSourcePose(
        source.participant,
        (source as E1WorldPointReference).worldPosition,
        (target as E1WorldPointReference).worldPosition,
      )
    : snapAxisSourcePose(
        source.participant,
        source as E1WorldAxisReference,
        target as E1WorldAxisReference,
      );
  const relation: E1Relation = {
    id: `relation-${document.nextRelationOrdinal}`,
    kind,
    sourceReferenceId,
    targetReferenceId,
  };
  return {
    ...document,
    nextRelationOrdinal: document.nextRelationOrdinal + 1,
    participants: document.participants.map((participant) =>
      participant.id === source.participant.id ? { ...participant, pose: snappedPose } : participant,
    ),
    relations: [...document.relations, relation],
  };
}

export function disconnectRelation(document: E1Document, relationId: E1RelationId): E1Document {
  if (!document.relations.some((relation) => relation.id === relationId)) {
    return document;
  }
  return {
    ...document,
    relations: document.relations.filter((relation) => relation.id !== relationId),
  };
}

export function linearParticipantLength(participant: E1Participant): number | null {
  if (participant.kind !== "rigid-link" && participant.kind !== "telescopic-damper") {
    return null;
  }
  const points = participant.references.filter(
    (reference): reference is E1PointReference => reference.kind === "point",
  );
  if (points.length !== 2) {
    return null;
  }
  return distance(points[0]!.localPosition, points[1]!.localPosition);
}

export function setLinearParticipantLength(
  document: E1Document,
  participantId: E1ParticipantId,
  nextLength: number,
): E1Document {
  if (!Number.isFinite(nextLength) || nextLength <= 0.1) {
    return document;
  }
  const participant = getParticipant(document, participantId);
  if (participant.kind !== "rigid-link" && participant.kind !== "telescopic-damper") {
    return document;
  }
  const points = participant.references.filter(
    (reference): reference is E1PointReference => reference.kind === "point",
  );
  if (points.length !== 2) {
    return document;
  }
  const direction = normalize(subtract(points[1]!.localPosition, points[0]!.localPosition));
  const nextEnd = add(points[0]!.localPosition, scale(direction, nextLength));
  const nextReferences = participant.references.map((reference) =>
    reference.id === points[1]!.id ? { ...reference, localPosition: nextEnd } : reference,
  );
  return {
    ...document,
    participants: document.participants.map((candidate) =>
      candidate.id === participantId ? { ...candidate, references: nextReferences } : candidate,
    ),
  };
}

export function connectedTargetSpan(document: E1Document, participantId: E1ParticipantId): number | null {
  const participant = getParticipant(document, participantId);
  const points = participant.references.filter(
    (reference): reference is E1PointReference => reference.kind === "point",
  );
  if (points.length !== 2) {
    return null;
  }
  const targets: E1Vec3[] = [];
  for (const point of points) {
    const relation = relationsForReference(document, point.id).find(
      (candidate) => candidate.kind === "point-coincidence",
    );
    if (!relation) {
      return null;
    }
    const otherId = relation.sourceReferenceId === point.id
      ? relation.targetReferenceId
      : relation.sourceReferenceId;
    const target = worldReference(document, otherId);
    if (target.kind !== "point") {
      return null;
    }
    targets.push(target.worldPosition);
  }
  return targets.length === 2 ? length(subtract(targets[1]!, targets[0]!)) : null;
}
