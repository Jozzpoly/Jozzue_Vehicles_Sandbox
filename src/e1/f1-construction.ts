// Disposable final E1 treatment. C1 construction functions, schema and evaluator
// stay untouched. There is no remembered anchor role or pending repair state.
import type { E1Document, E1ParticipantId, E1PointReference, E1ReferenceId, E1Relation } from "./model.js";
import {
  connectReferences, getParticipant, linearParticipantLength, relationGeometryStatus,
  relationsForReference, withParticipantPose, worldReference,
} from "./construction.js";
import { add, cross, distance, dot, length, multiplyQuats, normalize, quatFromAxisAngle, quatFromUnitVectors, scale, subtract, transformPoint } from "./spatial.js";

function linearPoints(document: E1Document, participantId: E1ParticipantId) {
  const participant = getParticipant(document, participantId);
  const ownLength = linearParticipantLength(participant);
  if (participant.fixed || ownLength === null || ownLength <= 1e-10 || participant.references.length !== 2) return null;
  return participant.references as readonly E1PointReference[];
}

function singlePointRelation(document: E1Document, referenceId: E1ReferenceId) {
  const relations = relationsForReference(document, referenceId);
  return relations.length === 1 && relations[0]!.kind === "point-coincidence" ? relations[0]! : null;
}

function otherTarget(document: E1Document, relation: E1Relation, referenceId: E1ReferenceId) {
  return worldReference(document, relation.sourceReferenceId === referenceId ? relation.targetReferenceId : relation.sourceReferenceId);
}

// Shared UI selection aid: discover from the pre-operation document, never from
// endpoint order, relation age, an input/output tag, or the post-snap residual.
export function f1SecondConnectAnchor(
  document: E1Document, kind: E1Relation["kind"], sourceId: E1ReferenceId, targetId: E1ReferenceId,
): E1ReferenceId | null {
  if (kind !== "point-coincidence") return null;
  const source = worldReference(document, sourceId);
  const target = worldReference(document, targetId);
  if (source.kind !== "point" || target.kind !== "point" || source.participant.id === target.participant.id) return null;
  const points = linearPoints(document, source.participant.id);
  if (!points || relationsForReference(document, sourceId).length !== 0) return null;
  const anchor = points.find((point) => point.id !== sourceId)!;
  const relation = singlePointRelation(document, anchor.id);
  if (!relation || !relationGeometryStatus(document, relation).satisfied) return null;
  const worldAnchor = worldReference(document, anchor.id);
  if (worldAnchor.kind !== "point" || distance(worldAnchor.worldPosition, target.worldPosition) <= 1e-10) return null;
  return anchor.id;
}

export function connectReferencesF1(
  document: E1Document, kind: E1Relation["kind"], sourceId: E1ReferenceId, targetId: E1ReferenceId,
): E1Document {
  // Preserve every existing validation, duplicate and relation-creation rule.
  const connected = connectReferences(document, kind, sourceId, targetId);
  if (connected === document) return document;
  const anchorId = f1SecondConnectAnchor(document, kind, sourceId, targetId);
  if (!anchorId) return connected;
  const source = worldReference(document, sourceId);
  const target = worldReference(document, targetId);
  const anchor = worldReference(document, anchorId);
  if (source.kind !== "point" || target.kind !== "point" || anchor.kind !== "point") return connected;
  const pose = source.participant.pose;
  const from = normalize(subtract(source.worldPosition, anchor.worldPosition));
  const to = normalize(subtract(target.worldPosition, anchor.worldPosition));
  const axis = cross(from, to);
  const sine = length(axis);
  // Existing shared helper approximates near-antiparallel vectors by exactly PI.
  // F1 needs actual alignment for length-only FIT; leave C1/shared math unchanged.
  const alignment = sine > 1e-12
    ? quatFromAxisAngle(axis, Math.atan2(sine, dot(from, to)))
    : quatFromUnitVectors(from, to);
  const rotation = multiplyQuats(alignment, pose.rotation);
  const rotatedAnchor = transformPoint({ position: pose.position, rotation }, anchor.reference.localPosition);
  return withParticipantPose(connected, source.participant.id, {
    rotation,
    position: add(pose.position, subtract(anchor.worldPosition, rotatedAnchor)),
  });
}

export function f1SoleSatisfiedAnchor(document: E1Document, participantId: E1ParticipantId): E1ReferenceId | null {
  const points = linearPoints(document, participantId);
  if (!points || points.some((point) => !singlePointRelation(document, point.id))) return null;
  const anchors = points.filter((point) => relationGeometryStatus(document, singlePointRelation(document, point.id)!).satisfied);
  return anchors.length === 1 ? anchors[0]!.id : null;
}

function fitPlan(document: E1Document, anchorId: E1ReferenceId) {
  const anchor = worldReference(document, anchorId);
  if (anchor.kind !== "point") return null;
  const points = linearPoints(document, anchor.participant.id);
  if (!points || points.some((point) => !singlePointRelation(document, point.id))) return null;
  const anchorRelation = singlePointRelation(document, anchorId)!;
  if (!relationGeometryStatus(document, anchorRelation).satisfied) return null;
  const free = points.find((point) => point.id !== anchorId)!;
  const worldFree = worldReference(document, free.id);
  const target = otherTarget(document, singlePointRelation(document, free.id)!, free.id);
  if (worldFree.kind !== "point" || target.kind !== "point") return null;
  const nextLength = distance(anchor.worldPosition, target.worldPosition);
  if (!Number.isFinite(nextLength) || nextLength <= 0.1) return null;
  // FIT only changes length. Refuse arbitrary pose repair rather than silently
  // projecting an off-axis target onto the part. This is not a solver tolerance.
  const direction = normalize(subtract(worldFree.worldPosition, anchor.worldPosition));
  const targetDirection = normalize(subtract(target.worldPosition, anchor.worldPosition));
  if (distance(direction, targetDirection) > 1e-8) return null;
  const localDirection = normalize(subtract(free.localPosition, anchor.reference.localPosition));
  return { participant: anchor.participant, free, nextEnd: add(anchor.reference.localPosition, scale(localDirection, nextLength)) };
}

export function canFitLinearParticipantF1(document: E1Document, anchorId: E1ReferenceId): boolean {
  return fitPlan(document, anchorId) !== null;
}

export function fitLinearParticipantF1(document: E1Document, anchorId: E1ReferenceId): E1Document {
  const plan = fitPlan(document, anchorId);
  if (!plan || distance(plan.free.localPosition, plan.nextEnd) < 1e-10) return document;
  return {
    ...document,
    participants: document.participants.map((participant) => participant.id !== plan.participant.id ? participant : {
      ...participant,
      references: participant.references.map((reference) => reference.id === plan.free.id ? { ...reference, localPosition: plan.nextEnd } : reference),
    }),
  };
}
