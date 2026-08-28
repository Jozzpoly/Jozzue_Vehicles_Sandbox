import assert from "node:assert/strict";
import test from "node:test";
import { E1EditSession } from "../../src/e1/edit-session.js";
import { e1DocumentEquals } from "../../src/e1/model.js";
import { createE1DirectBaseline } from "../../src/e1/scenario.js";

test("preview is non-authoritative and cancel leaves document and history exact", () => {
  const initial = createE1DirectBaseline();
  const session = new E1EditSession(initial);
  session.beginPreview("upper-hardpoint-drag");
  session.updatePreview((draft) => ({
    ...draft,
    damper: { ...draft.damper, upperHardpoint: { x: 8, y: 9, z: 10 } },
  }));

  assert.notDeepEqual(session.document, initial);
  assert.deepEqual(session.committedDocument, initial);
  assert.equal(session.historyLength, 0);
  assert.equal(session.cancelPreview(), true);
  assert.deepEqual(session.document, initial);
  assert.equal(session.historyLength, 0);
});

test("one drag commits one revision and Undo recovers the exact authored snapshot", () => {
  const initial = createE1DirectBaseline();
  const session = new E1EditSession(initial);
  session.beginPreview("upper-hardpoint-drag");
  session.updatePreview((draft) => ({
    ...draft,
    damper: { ...draft.damper, upperHardpoint: { x: -0.2, y: 3.5, z: 0.8 } },
  }));

  assert.equal(session.commitPreview(), true);
  assert.equal(session.document.revision, 1);
  assert.equal(session.historyLength, 1);
  assert.equal(session.undo(), true);
  assert.equal(e1DocumentEquals(session.document, initial), true);
  assert.equal(session.historyLength, 0);
});

test("a no-op preview does not create artificial history", () => {
  const session = new E1EditSession(createE1DirectBaseline());
  session.beginPreview("upper-hardpoint-drag");
  session.updatePreview((draft) => draft);
  assert.equal(session.commitPreview(), false);
  assert.equal(session.historyLength, 0);
  assert.equal(session.document.revision, 0);
});
