import assert from "node:assert/strict";
import test from "node:test";
import {
  addParticipant, allRelationStatuses, connectReferences, connectedTargetSpan,
  getParticipant, linearParticipantLength, relationsForReference, setLinearParticipantLength,
  withParticipantPose, worldReference,
} from "../../src/e1/construction.js";
import {
  canFitLinearParticipantF1, connectReferencesF1, f1SecondConnectAnchor,
  f1SoleSatisfiedAnchor, fitLinearParticipantF1,
} from "../../src/e1/f1-construction.js";
import { E1EditSession } from "../../src/e1/edit-session.js";
import { evaluateE1Play } from "../../src/e1/evaluator.js";
import type { E1Document, E1Vec3 } from "../../src/e1/model.js";
import { createE1DirectBaseline, createE1PushrodParticipant, createE1RockerParticipant, E1_IDS as I } from "../../src/e1/scenario.js";
import { add, distance, normalize, quatFromAxisAngle, subtract } from "../../src/e1/spatial.js";

function point(document: E1Document, id: string): E1Vec3 {
  const result = worldReference(document, id);
  assert.equal(result.kind, "point");
  if (result.kind !== "point") throw new Error("Point required");
  return result.worldPosition;
}
function near(a: E1Vec3, b: E1Vec3) { assert.ok(distance(a, b) < 1e-9, `${JSON.stringify(a)} != ${JSON.stringify(b)}`); }
function detached(): E1Document {
  const baseline = createE1DirectBaseline();
  return addParticipant({ ...baseline, relations: [] }, createE1PushrodParticipant());
}

for (const kind of ["pushrod", "damper"] as const) {
  for (const first of ["A", "B"] as const) {
    for (const reverseArray of [false, true]) {
      test(`T1 ${kind} ${first}-first, reordered=${reverseArray}: pose-only Connect + anchor-only FIT`, () => {
        let document = detached();
        const id = I[kind];
        const anchorId = I[`${kind}${first}`];
        const freeId = I[`${kind}${first === "A" ? "B" : "A"}`];
        const participant = getParticipant(document, id);
        // A non-origin anchor and non-identity pose for BOTH endpoint orders.
        const references = participant.references.map((ref) => ref.kind === "point"
          ? { ...ref, localPosition: add(ref.localPosition, { x: 0.43, y: -0.7, z: 0.29 }) } : ref);
        document = { ...document, participants: document.participants.map((p) => p.id !== id ? p : {
          ...p, references: reverseArray ? [...references].reverse() : references,
          pose: { position: { x: 2, y: -1, z: 0.5 }, rotation: quatFromAxisAngle({ x: 1, y: 2, z: -1 }, 1.3) },
        }) };
        document = connectReferencesF1(document, "point-coincidence", anchorId, I.armEnd);
        const before = structuredClone(document);
        const anchorWorld = point(document, anchorId);
        const refs = getParticipant(document, id).references;
        assert.equal(f1SecondConnectAnchor(document, "point-coincidence", freeId, I.chassisUpper), anchorId);
        const connected = connectReferencesF1(document, "point-coincidence", freeId, I.chassisUpper);
        assert.deepEqual(document, before);
        assert.deepEqual(getParticipant(connected, id).references, refs);
        assert.equal(linearParticipantLength(getParticipant(connected, id)), linearParticipantLength(getParticipant(document, id)));
        near(point(connected, anchorId), anchorWorld);
        near(normalize(subtract(point(connected, freeId), anchorWorld)), normalize(subtract(point(connected, I.chassisUpper), anchorWorld)));
        assert.equal(allRelationStatuses(connected)[0]!.satisfied, true);
        for (const p of document.participants.filter((p) => p.id !== id)) assert.deepEqual(getParticipant(connected, p.id), p);
        const fit = fitLinearParticipantF1(connected, anchorId);
        near(point(fit, anchorId), anchorWorld);
        near(point(fit, freeId), point(fit, I.chassisUpper));
        assert.deepEqual(getParticipant(fit, id).pose, getParticipant(connected, id).pose);
        assert.deepEqual(getParticipant(fit, id).references.find((r) => r.id === anchorId), refs.find((r) => r.id === anchorId));
        assert.deepEqual(fit.relations, connected.relations);
        assert.ok(allRelationStatuses(fit).every((r) => r.satisfied));
        assert.equal(fitLinearParticipantF1(fit, anchorId), fit);
      });
    }
  }
}

function rockerPath(linkFirst: "A" | "B", damperFirst: "A" | "B"): E1Document {
  let d = addParticipant(detached(), createE1RockerParticipant());
  d = connectReferencesF1(d, "revolute-axis", I.rockerPivot, I.chassisAxis);
  const pairs = [
    [I.pushrodA, I.armEnd, I.pushrodB, I.rockerA, linkFirst],
    [I.damperA, I.chassisUpper, I.damperB, I.rockerB, damperFirst],
  ];
  for (const [a, ta, b, tb, first] of pairs) {
    const anchor = first === "A" ? a! : b!;
    d = connectReferencesF1(d, "point-coincidence", anchor, first === "A" ? ta! : tb!);
    d = connectReferencesF1(d, "point-coincidence", first === "A" ? b! : a!, first === "A" ? tb! : ta!);
    d = fitLinearParticipantF1(d, anchor);
  }
  return d;
}

for (const linkFirst of ["A", "B"] as const) for (const damperFirst of ["A", "B"] as const) {
  test(`T1 complete rocker, link ${linkFirst}-first / damper ${damperFirst}-first, unchanged evaluator`, () => {
    const d = rockerPath(linkFirst, damperFirst);
    assert.equal(d.relations.length, 5);
    assert.ok(allRelationStatuses(d).every((r) => r.satisfied));
    const before = structuredClone(d);
    const result = evaluateE1Play(d);
    assert.equal(result.topology, "rocker");
    assert.ok(result.frames.every((frame) => frame.status === "resolved"));
    assert.deepEqual(result, evaluateE1Play(d));
    assert.deepEqual(d, before);
  });
}

test("two satisfied endpoints within existing tolerance do not imply an anchor role", () => {
  let d = addParticipant(detached(), createE1RockerParticipant());
  d = connectReferencesF1(d, "revolute-axis", I.rockerPivot, I.chassisAxis);
  d = connectReferencesF1(d, "point-coincidence", I.pushrodA, I.armEnd);
  d = connectReferencesF1(d, "point-coincidence", I.pushrodB, I.rockerA);
  assert.ok(allRelationStatuses(d).every((r) => r.satisfied));
  assert.equal(f1SoleSatisfiedAnchor(d, I.pushrod), null);
  assert.equal(canFitLinearParticipantF1(d, I.pushrodA), true);
  const fit = fitLinearParticipantF1(d, I.pushrodA);
  assert.notEqual(fit, d);
  near(point(fit, I.pushrodA), point(d, I.pushrodA));
  near(point(fit, I.pushrodB), point(fit, I.rockerA));
});

test("ambiguous/multi-anchor and unsatisfied cases retain C1; no recovery state", () => {
  let d = connectReferencesF1(detached(), "point-coincidence", I.pushrodA, I.armEnd);
  const relation = relationsForReference(d, I.pushrodA)[0]!;
  const ambiguous = { ...d, relations: [...d.relations, { ...relation, id: "additional-explicit-anchor" }] };
  const p = getParticipant(d, I.pushrod);
  const moved = withParticipantPose(d, I.pushrod, { ...p.pose, position: add(p.pose.position, { x: 2, y: 0, z: 0 }) });
  for (const before of [ambiguous, moved]) {
    assert.equal(f1SecondConnectAnchor(before, "point-coincidence", I.pushrodB, I.chassisUpper), null);
    assert.deepEqual(connectReferencesF1(before, "point-coincidence", I.pushrodB, I.chassisUpper), connectReferences(before, "point-coincidence", I.pushrodB, I.chassisUpper));
    assert.equal(fitLinearParticipantF1(before, I.pushrodA), before);
  }
  // Same destination: zero target span cannot invoke orientation completion.
  assert.equal(f1SecondConnectAnchor(d, "point-coincidence", I.pushrodB, I.armEnd), null);
  const connected = connectReferencesF1(d, "point-coincidence", I.pushrodB, I.chassisUpper);
  const multiSource = { ...connected, relations: [...connected.relations, { ...relation, id: "another" }] };
  assert.equal(fitLinearParticipantF1(multiSource, I.pushrodB), multiSource);
  assert.equal(connectReferencesF1(connected, "point-coincidence", I.pushrodB, I.chassisUpper), connected);
});

test("FIT rejects off-axis pose repair; C1 continues to move source then first-local-point length", () => {
  let d = connectReferences(detached(), "point-coincidence", I.pushrodB, I.armEnd);
  const anchor = point(d, I.pushrodB);
  d = connectReferences(d, "point-coincidence", I.pushrodA, I.chassisUpper);
  assert.ok(distance(point(d, I.pushrodB), anchor) > 0.11);
  near(point(d, I.pushrodA), point(d, I.chassisUpper));
  assert.equal(fitLinearParticipantF1(d, I.pushrodA), d);
  const a = point(d, I.pushrodA);
  const fit = setLinearParticipantLength(d, I.pushrod, connectedTargetSpan(d, I.pushrod)!);
  near(point(fit, I.pushrodA), a);
  assert.deepEqual(getParticipant(fit, I.pushrod).pose, getParticipant(d, I.pushrod).pose);
  assert.ok(allRelationStatuses(fit).some((r) => !r.satisfied));
});

test("Connect and FIT are independent Undo boundaries with exact authored recovery", () => {
  const d = connectReferencesF1(detached(), "point-coincidence", I.pushrodB, I.armEnd);
  const session = new E1EditSession(d);
  session.commitOperation("connect-references", (draft) => connectReferencesF1(draft, "point-coincidence", I.pushrodA, I.chassisUpper));
  const connected = session.committedDocument;
  session.commitOperation("participant-geometry", (draft) => fitLinearParticipantF1(draft, I.pushrodB));
  const fit = session.committedDocument;
  evaluateE1Play(fit);
  assert.deepEqual(session.committedDocument, fit);
  assert.equal(session.historyLength, 2);
  session.undo();
  assert.deepEqual(session.committedDocument, connected);
  session.undo();
  assert.deepEqual(session.committedDocument, d);
});

test("authoring order changes no endpoint world result in the supported rocker path", () => {
  const control = rockerPath("A", "A");
  for (const d of [rockerPath("A", "B"), rockerPath("B", "A"), rockerPath("B", "B")]) {
    for (const id of [I.pushrodA, I.pushrodB, I.damperA, I.damperB]) near(point(d, id), point(control, id));
  }
});

test("near-antiparallel and exact antiparallel targets align without manual pose repair", () => {
  for (const dy of [0, 0.0001, -0.0001]) {
    let d = connectReferencesF1(detached(), "point-coincidence", I.pushrodA, I.armEnd);
    const anchor = point(d, I.pushrodA);
    d = { ...d, participants: d.participants.map((p) => p.id !== I.chassis ? p : {
      ...p, references: p.references.map((r) => r.id !== I.chassisUpper ? r : { ...r, localPosition: add(anchor, { x: -2, y: dy, z: 0 }) }),
    }) };
    d = connectReferencesF1(d, "point-coincidence", I.pushrodB, I.chassisUpper);
    assert.equal(canFitLinearParticipantF1(d, I.pushrodA), true);
    d = fitLinearParticipantF1(d, I.pushrodA);
    near(point(d, I.pushrodA), anchor);
    near(point(d, I.pushrodB), point(d, I.chassisUpper));
  }
});
