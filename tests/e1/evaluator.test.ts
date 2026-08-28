import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { E1EditSession } from "../../src/e1/edit-session.js";
import {
  e1FrameSignature,
  evaluateDirectPlay,
  evaluatePreparedRockerPlay,
  type E1PreparedRockerFixture,
} from "../../src/e1/evaluator.js";
import { createE1DirectBaseline } from "../../src/e1/scenario.js";

function preparedFixture(): E1PreparedRockerFixture {
  return {
    inputPivot: { x: 0, y: 0, z: 0 },
    inputAxis: { x: 0, y: 0, z: 1 },
    inputVector: { x: 1.5, y: 0, z: 0 },
    inputAngleMinRad: -0.2,
    inputAngleMaxRad: 0.2,
    rockerPivot: { x: 2.3, y: 1.2, z: 0 },
    rockerAxis: { x: 0, y: 0, z: 1 },
    rockerInputVector: { x: -0.7, y: 0, z: 0 },
    rockerOutputVector: { x: 0, y: 0.82, z: 0 },
    rockerNeutralAngleRad: 0,
    pushrodLength: Math.hypot(0.1, 1.2),
    damperUpper: { x: 2.8, y: 3.4, z: 0.25 },
  };
}

test("direct PLAY is byte-for-byte deterministic at its fixed samples", () => {
  const document = createE1DirectBaseline();
  const first = evaluateDirectPlay(document);
  const second = evaluateDirectPlay(document);
  assert.deepEqual(first, second);
  assert.equal(first.frames.length, 241);
  assert.equal(first.frames.every((frame) => frame.status === "resolved"), true);
});

test("changing the authored hardpoint changes the causal damper result", () => {
  const original = createE1DirectBaseline();
  const changed = {
    ...original,
    damper: { ...original.damper, upperHardpoint: { x: 0.25, y: 3.6, z: 1.2 } },
  };
  const originalFrame = evaluateDirectPlay(original, 9).frames[2]!;
  const changedFrame = evaluateDirectPlay(changed, 9).frames[2]!;
  assert.notEqual(originalFrame.damperLength.toFixed(8), changedFrame.damperLength.toFixed(8));
  assert.deepEqual(originalFrame.armEnd, changedFrame.armEnd);
});

test("an arbitrary authored pivot axis materially affects 3D motion", () => {
  const original = createE1DirectBaseline();
  const axisChanged = { ...original, pivot: { ...original.pivot, axis: { x: 0, y: 0, z: 1 } } };
  const originalFrame = evaluateDirectPlay(original, 7).frames[1]!;
  const changedFrame = evaluateDirectPlay(axisChanged, 7).frames[1]!;
  assert.notDeepEqual(originalFrame.armEnd, changedFrame.armEnd);
  assert.notEqual(originalFrame.armEnd.z.toFixed(8), changedFrame.armEnd.z.toFixed(8));
});

test("permissive PLAY diagnoses an unresolved chain and solves no subset", () => {
  const document = createE1DirectBaseline();
  const disconnected = {
    ...document,
    damper: { ...document.damper, lowerConnection: null },
  };
  const result = evaluateDirectPlay(disconnected, 11);
  assert.equal(result.frames.every((frame) => frame.status === "diagnosed-static"), true);
  assert.equal(result.frames.every((frame) => frame.inputAngleRad === 0), true);
  assert.equal(result.diagnostics[0]?.code, "E1_DISCONNECTED_DAMPER");
});

test("permissive PLAY remains renderable for an invalid zero-length pivot axis", () => {
  const document = createE1DirectBaseline();
  const invalid = { ...document, pivot: { ...document.pivot, axis: { x: 0, y: 0, z: 0 } } };
  const result = evaluateDirectPlay(invalid, 5);
  assert.equal(result.frames.every((frame) => frame.status === "diagnosed-static"), true);
  assert.equal(result.frames.every((frame) => Number.isFinite(frame.damperLength)), true);
  assert.equal(result.diagnostics[0]?.code, "E1_INVALID_AUTHORED_GEOMETRY");
});

test("PLAY does not mutate authored state or Undo history", () => {
  const session = new E1EditSession(createE1DirectBaseline());
  session.beginPreview("upper-hardpoint-drag");
  session.updatePreview((draft) => ({
    ...draft,
    damper: { ...draft.damper, upperHardpoint: { x: 0, y: 3.1, z: 0.5 } },
  }));
  session.commitPreview();
  const before = session.committedDocument;
  const historyBefore = session.historyLength;
  evaluateDirectPlay(session.committedDocument);
  assert.deepEqual(session.committedDocument, before);
  assert.equal(session.historyLength, historyBefore);
});

test("prepared rocker evaluator is deterministic and keeps one continuous branch", () => {
  const fixture = preparedFixture();
  const first = evaluatePreparedRockerPlay(fixture, 181);
  const second = evaluatePreparedRockerPlay(fixture, 181);
  assert.deepEqual(first.frames.map(e1FrameSignature), second.frames.map(e1FrameSignature));
  assert.equal(first.frames.some((frame) => frame.status !== "resolved"), false);

  const driven = first.frames.map((frame) => frame.drivenAngleRad!);
  const largestStep = driven.slice(1).reduce(
    (largest, value, index) => Math.max(largest, Math.abs(value - driven[index]!)),
    0,
  );
  assert.ok(largestStep < 0.15, `branch jump detected: ${largestStep}`);
});

test("prepared linkage freezes the whole chain after losing its root", () => {
  const fixture = { ...preparedFixture(), inputAngleMaxRad: 1.8 };
  const result = evaluatePreparedRockerPlay(fixture, 181);
  const frozenIndex = result.frames.findIndex((frame) => frame.status === "frozen-last-valid");
  assert.ok(frozenIndex > 0, "fixture should become impossible after a valid prefix");
  const frozen = result.frames[frozenIndex]!;
  const prior = result.frames[frozenIndex - 1]!;
  assert.deepEqual(frozen.armEnd, prior.armEnd);
  assert.deepEqual(frozen.damperLower, prior.damperLower);
  assert.equal(frozen.diagnostics[0]?.code, "E1_LINKAGE_NO_ROOT");
});

test("authored model and evaluator remain independent of Three.js", () => {
  const sources = [
    "src/e1/model.ts",
    "src/e1/spatial.ts",
    "src/e1/edit-session.ts",
    "src/e1/scenario.ts",
    "src/e1/evaluator.ts",
  ];
  for (const source of sources) {
    const contents = readFileSync(source, "utf8");
    assert.doesNotMatch(contents, /from\s+["']three/);
  }
});
