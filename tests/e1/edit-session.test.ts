import assert from "node:assert/strict";
import test from "node:test";
import { addParticipant, withParticipantPose } from "../../src/e1/construction.js";
import { E1EditSession } from "../../src/e1/edit-session.js";
import { e1DocumentEquals } from "../../src/e1/model.js";
import {
  createE1DirectBaseline,
  createE1RockerParticipant,
  E1_IDS,
} from "../../src/e1/scenario.js";

test("pose preview is non-authoritative and cancel leaves document and history exact", () => {
  const initial = createE1DirectBaseline();
  const session = new E1EditSession(initial);
  session.beginPreview("participant-pose");
  session.updatePreview((draft) => {
    const damper = draft.participants.find((participant) => participant.id === E1_IDS.damper)!;
    return withParticipantPose(draft, damper.id, {
      ...damper.pose,
      position: { x: 8, y: 9, z: 10 },
    });
  });

  assert.notDeepEqual(session.document, initial);
  assert.deepEqual(session.committedDocument, initial);
  assert.equal(session.historyLength, 0);
  assert.equal(session.cancelPreview(), true);
  assert.deepEqual(session.document, initial);
  assert.equal(session.historyLength, 0);
});

test("one pose drag commits one revision and Undo recovers the exact authored snapshot", () => {
  const initial = createE1DirectBaseline();
  const session = new E1EditSession(initial);
  session.beginPreview("participant-pose");
  session.updatePreview((draft) => {
    const damper = draft.participants.find((participant) => participant.id === E1_IDS.damper)!;
    return withParticipantPose(draft, damper.id, {
      ...damper.pose,
      position: { x: -0.2, y: 3.5, z: 0.8 },
    });
  });

  assert.equal(session.commitPreview(), true);
  assert.equal(session.document.revision, 1);
  assert.equal(session.historyLength, 1);
  assert.equal(session.undo(), true);
  assert.equal(e1DocumentEquals(session.document, initial), true);
  assert.equal(session.historyLength, 0);
});

test("one structural operation is one authored revision and Undo removes it exactly", () => {
  const initial = createE1DirectBaseline();
  const session = new E1EditSession(initial);
  assert.equal(
    session.commitOperation("add-participant", (draft) =>
      addParticipant(draft, createE1RockerParticipant()),
    ),
    true,
  );
  assert.equal(session.document.revision, 1);
  assert.equal(session.document.participants.some((participant) => participant.id === E1_IDS.rocker), true);
  assert.equal(session.undo(), true);
  assert.deepEqual(session.document, initial);
});

test("a no-op preview and no-op operation do not create artificial history", () => {
  const session = new E1EditSession(createE1DirectBaseline());
  session.beginPreview("participant-pose");
  session.updatePreview((draft) => draft);
  assert.equal(session.commitPreview(), false);
  assert.equal(session.commitOperation("add-participant", (draft) => draft), false);
  assert.equal(session.historyLength, 0);
  assert.equal(session.document.revision, 0);
});

test("deterministic task reset clears previews and history", () => {
  const baseline = createE1DirectBaseline();
  const session = new E1EditSession(baseline);
  session.commitOperation("add-participant", (draft) =>
    addParticipant(draft, createE1RockerParticipant()),
  );
  session.reset(baseline);
  assert.deepEqual(session.document, baseline);
  assert.equal(session.historyLength, 0);
  assert.equal(session.hasPreview, false);
});
