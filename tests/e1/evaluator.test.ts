import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  addParticipant,
  allRelationStatuses,
  connectReferences,
  disconnectRelation,
  getParticipant,
  linearParticipantLength,
  relationGeometryStatus,
  setLinearParticipantLength,
  withParticipantPose,
  worldReference,
} from "../../src/e1/construction.js";
import { E1EditSession } from "../../src/e1/edit-session.js";
import { e1FrameSignature, evaluateE1Play } from "../../src/e1/evaluator.js";
import type { E1Document, E1Participant, E1Pose } from "../../src/e1/model.js";
import {
  createE1DirectBaseline,
  createE1PushrodParticipant,
  createE1RockerParticipant,
  E1_IDS,
} from "../../src/e1/scenario.js";
import {
  normalize,
  quatFromUnitVectors,
  subtract,
} from "../../src/e1/spatial.js";

function withoutDirectLower(document: E1Document): E1Document {
  const relation = document.relations.find((candidate) =>
    candidate.sourceReferenceId === E1_IDS.damperB || candidate.targetReferenceId === E1_IDS.damperB,
  )!;
  return disconnectRelation(document, relation.id);
}

function orientLinearParticipant(
  document: E1Document,
  participantId: string,
  startReferenceId: string,
  endReferenceId: string,
  startTargetReferenceId: string,
  endTargetReferenceId: string,
): E1Document {
  const participant = getParticipant(document, participantId);
  const start = participant.references.find((reference) => reference.id === startReferenceId);
  const end = participant.references.find((reference) => reference.id === endReferenceId);
  const startTarget = worldReference(document, startTargetReferenceId);
  const endTarget = worldReference(document, endTargetReferenceId);
  assert.equal(start?.kind, "point");
  assert.equal(end?.kind, "point");
  assert.equal(startTarget.kind, "point");
  assert.equal(endTarget.kind, "point");
  if (start?.kind !== "point" || end?.kind !== "point" || startTarget.kind !== "point" || endTarget.kind !== "point") {
    throw new Error("Linear E1 fixture requires point references.");
  }
  const localDirection = normalize(subtract(end.localPosition, start.localPosition));
  const targetDirection = normalize(subtract(endTarget.worldPosition, startTarget.worldPosition));
  const targetLength = Math.hypot(
    endTarget.worldPosition.x - startTarget.worldPosition.x,
    endTarget.worldPosition.y - startTarget.worldPosition.y,
    endTarget.worldPosition.z - startTarget.worldPosition.z,
  );
  let next = setLinearParticipantLength(document, participantId, targetLength);
  const pose: E1Pose = {
    position: startTarget.worldPosition,
    rotation: quatFromUnitVectors(localDirection, targetDirection),
  };
  next = withParticipantPose(next, participantId, pose);
  return next;
}

function authoredRockerDocument(): E1Document {
  let document = withoutDirectLower(createE1DirectBaseline());
  document = addParticipant(document, createE1RockerParticipant());
  document = addParticipant(document, createE1PushrodParticipant());
  document = connectReferences(
    document,
    "revolute-axis",
    E1_IDS.rockerPivot,
    E1_IDS.chassisAxis,
  );
  document = orientLinearParticipant(
    document,
    E1_IDS.pushrod,
    E1_IDS.pushrodA,
    E1_IDS.pushrodB,
    E1_IDS.armEnd,
    E1_IDS.rockerA,
  );
  document = connectReferences(document, "point-coincidence", E1_IDS.pushrodA, E1_IDS.armEnd);
  document = connectReferences(document, "point-coincidence", E1_IDS.pushrodB, E1_IDS.rockerA);
  document = orientLinearParticipant(
    document,
    E1_IDS.damper,
    E1_IDS.damperA,
    E1_IDS.damperB,
    E1_IDS.chassisUpper,
    E1_IDS.rockerB,
  );
  document = connectReferences(document, "point-coincidence", E1_IDS.damperB, E1_IDS.rockerB);
  return document;
}

test("direct baseline has explicit satisfied relations and deterministic causal PLAY", () => {
  const document = createE1DirectBaseline();
  assert.equal(allRelationStatuses(document).every((status) => status.satisfied), true);
  const first = evaluateE1Play(document);
  const second = evaluateE1Play(document);
  assert.deepEqual(first, second);
  assert.equal(first.topology, "direct");
  assert.equal(first.frames.length, 241);
  assert.equal(first.frames.every((frame) => frame.status === "resolved"), true);
});

test("disconnect preserves geometry while permissive PLAY diagnoses unsupported topology", () => {
  const baseline = createE1DirectBaseline();
  const damperBefore = getParticipant(baseline, E1_IDS.damper);
  const disconnected = withoutDirectLower(baseline);
  assert.deepEqual(getParticipant(disconnected, E1_IDS.damper), damperBefore);
  const result = evaluateE1Play(disconnected, 11);
  assert.equal(result.frames.every((frame) => frame.status === "diagnosed-static"), true);
  assert.equal(result.diagnostics[0]?.code, "E1_UNSUPPORTED_TOPOLOGY");
});

test("PLAY refuses to solve only the direct subset after an extra authored relation enters the mechanism", () => {
  let document = addParticipant(createE1DirectBaseline(), createE1RockerParticipant());
  document = connectReferences(document, "revolute-axis", E1_IDS.rockerPivot, E1_IDS.chassisAxis);
  const result = evaluateE1Play(document, 9);
  assert.equal(result.frames.every((frame) => frame.status === "diagnosed-static"), true);
  assert.equal(result.diagnostics[0]?.code, "E1_UNSUPPORTED_TOPOLOGY");
});

test("point connect snaps only participant pose and never deforms rigid-link reference layout", () => {
  let document = addParticipant(createE1DirectBaseline(), createE1PushrodParticipant());
  const before = getParticipant(document, E1_IDS.pushrod);
  const beforeReferences = structuredClone(before.references);
  const beforeLength = linearParticipantLength(before);
  document = connectReferences(document, "point-coincidence", E1_IDS.pushrodA, E1_IDS.armEnd);
  const after = getParticipant(document, E1_IDS.pushrod);
  assert.notDeepEqual(after.pose, before.pose);
  assert.deepEqual(after.references, beforeReferences);
  assert.equal(linearParticipantLength(after), beforeLength);
});

test("axis connect changes only rocker pose and leaves its reference layout exact", () => {
  let document = addParticipant(createE1DirectBaseline(), createE1RockerParticipant());
  const before = getParticipant(document, E1_IDS.rocker);
  const beforeReferences = structuredClone(before.references);
  document = connectReferences(document, "revolute-axis", E1_IDS.rockerPivot, E1_IDS.chassisAxis);
  const after = getParticipant(document, E1_IDS.rocker);
  assert.notDeepEqual(after.pose, before.pose);
  assert.deepEqual(after.references, beforeReferences);
  const relation = document.relations.at(-1)!;
  assert.equal(relationGeometryStatus(document, relation).satisfied, true);
});

test("moving a connected participant preserves relation identity but derives a geometry violation", () => {
  let document = addParticipant(createE1DirectBaseline(), createE1PushrodParticipant());
  document = connectReferences(document, "point-coincidence", E1_IDS.pushrodA, E1_IDS.armEnd);
  const relation = document.relations.at(-1)!;
  const participant = getParticipant(document, E1_IDS.pushrod);
  document = withParticipantPose(document, participant.id, {
    ...participant.pose,
    position: { x: participant.pose.position.x + 2, y: participant.pose.position.y, z: participant.pose.position.z },
  });
  assert.equal(document.relations.some((candidate) => candidate.id === relation.id), true);
  assert.equal(relationGeometryStatus(document, relation).satisfied, false);
  assert.equal("unresolved" in document, false);
});

test("own length changes only through an explicit geometry operation", () => {
  const document = addParticipant(createE1DirectBaseline(), createE1PushrodParticipant());
  const before = getParticipant(document, E1_IDS.pushrod);
  const beforePose = structuredClone(before.pose);
  const changed = setLinearParticipantLength(document, E1_IDS.pushrod, 2.4);
  const after = getParticipant(changed, E1_IDS.pushrod);
  assert.equal(linearParticipantLength(after)?.toFixed(3), "2.400");
  assert.deepEqual(after.pose, beforePose);
});

test("authored rocker topology is derived from neutral references and evaluates deterministically", () => {
  const document = authoredRockerDocument();
  assert.equal(allRelationStatuses(document).every((status) => status.satisfied), true);
  const first = evaluateE1Play(document, 181);
  const second = evaluateE1Play(document, 181);
  assert.equal(first.topology, "rocker");
  assert.deepEqual(first.frames.map(e1FrameSignature), second.frames.map(e1FrameSignature));
  assert.equal(first.frames.every((frame) => frame.status === "resolved"), true);
  assert.equal(first.frames.some((frame) => frame.rockerPivot === undefined), false);
  const authoredLength = linearParticipantLength(getParticipant(document, E1_IDS.pushrod));
  assert.equal(first.frames[0]?.pushrodLength, authoredLength);
});

test("root loss freezes the complete last-valid rocker chain rather than solving a subset", () => {
  const document = authoredRockerDocument();
  const stressed = {
    ...document,
    driver: { ...document.driver, angleMinRad: -0.32, angleMaxRad: 0.42 },
  };
  const result = evaluateE1Play(stressed, 181);
  const frozenIndex = result.frames.findIndex((frame) => frame.status === "frozen-last-valid");
  assert.ok(frozenIndex > 0);
  const frozen = result.frames[frozenIndex]!;
  const prior = result.frames[frozenIndex - 1]!;
  assert.deepEqual(frozen.armEnd, prior.armEnd);
  assert.deepEqual(frozen.rockerInput, prior.rockerInput);
  assert.deepEqual(frozen.rockerOutput, prior.rockerOutput);
  assert.deepEqual(frozen.damperLower, prior.damperLower);
  assert.deepEqual(frozen.pushrodStart, prior.pushrodStart);
  assert.deepEqual(frozen.pushrodEnd, prior.pushrodEnd);
  assert.equal(frozen.diagnostics[0]?.code, "E1_LINKAGE_NO_ROOT");
});

test("wrong 3D rocker orientation violates the real authored axis relation instead of being ignored", () => {
  let document = authoredRockerDocument();
  const rocker = getParticipant(document, E1_IDS.rocker);
  const wrong: E1Participant = {
    ...rocker,
    pose: {
      ...rocker.pose,
      rotation: quatFromUnitVectors({ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 0 }),
    },
  };
  document = {
    ...document,
    participants: document.participants.map((participant) => participant.id === wrong.id ? wrong : participant),
  };
  const result = evaluateE1Play(document, 9);
  assert.equal(result.frames.every((frame) => frame.status === "diagnosed-static"), true);
  assert.equal(result.diagnostics[0]?.code, "E1_RELATION_GEOMETRY_VIOLATED");
});

test("PLAY never mutates authored document or Undo history", () => {
  const session = new E1EditSession(authoredRockerDocument());
  const before = session.committedDocument;
  const historyBefore = session.historyLength;
  evaluateE1Play(session.committedDocument);
  assert.deepEqual(session.committedDocument, before);
  assert.equal(session.historyLength, historyBefore);
});

test("authored model, construction operations, and evaluator remain independent of Three.js", () => {
  const sources = [
    "src/e1/model.ts",
    "src/e1/spatial.ts",
    "src/e1/construction.ts",
    "src/e1/edit-session.ts",
    "src/e1/scenario.ts",
    "src/e1/evaluator.ts",
  ];
  for (const source of sources) {
    const contents = readFileSync(source, "utf8");
    assert.doesNotMatch(contents, /from\s+["']three/);
  }
});
