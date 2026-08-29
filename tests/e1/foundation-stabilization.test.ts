import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  addParticipant,
  allRelationStatuses,
  connectionTargetReferenceIds,
  connectReferences,
  disconnectRelation,
  relationsForReference,
} from "../../src/e1/construction.js";
import { evaluateE1Play } from "../../src/e1/evaluator.js";
import {
  createE1DirectBaseline,
  createE1PushrodParticipant,
  createE1RockerParticipant,
  E1_IDS,
} from "../../src/e1/scenario.js";
import { E1ThreeProjection, type E1ProjectionVisualState } from "../../src/e1/three-projection.js";

const neutralVisualState: E1ProjectionVisualState = {
  selectedParticipantId: null,
  selectedReferenceId: null,
  hoveredReferenceId: null,
  connectionSourceReferenceId: null,
  connectionTargetReferenceId: null,
  connectionCandidateReferenceIds: null,
};

function resources(root: THREE.Object3D): {
  readonly geometries: Set<THREE.BufferGeometry>;
  readonly materials: Set<THREE.Material>;
} {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    const renderable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | readonly THREE.Material[];
    };
    if (renderable.geometry) geometries.add(renderable.geometry);
    if (Array.isArray(renderable.material)) {
      for (const material of renderable.material) materials.add(material);
    } else if (renderable.material) {
      materials.add(renderable.material as THREE.Material);
    }
  });
  return { geometries, materials };
}

test("repeated BUILD projection rebuilds dispose superseded resources and keep a bounded live set", () => {
  const projection = new E1ThreeProjection();
  const document = createE1DirectBaseline();
  const statuses = allRelationStatuses(document);
  let prior = resources(projection.buildRoot);
  let expectedLiveCount: number | null = null;

  for (let iteration = 0; iteration < 40; iteration += 1) {
    const disposedGeometries = new Set<THREE.BufferGeometry>();
    const disposedMaterials = new Set<THREE.Material>();
    for (const geometry of prior.geometries) {
      geometry.addEventListener("dispose", () => disposedGeometries.add(geometry));
    }
    for (const material of prior.materials) {
      material.addEventListener("dispose", () => disposedMaterials.add(material));
    }

    projection.renderBuild(document, statuses, {
      ...neutralVisualState,
      selectedParticipantId: iteration % 2 === 0 ? E1_IDS.damper : E1_IDS.arm,
      hoveredReferenceId: iteration % 3 === 0 ? E1_IDS.damperB : null,
    });

    assert.equal(disposedGeometries.size, prior.geometries.size);
    assert.equal(disposedMaterials.size, prior.materials.size);
    prior = resources(projection.buildRoot);
    const liveCount = prior.geometries.size + prior.materials.size;
    if (expectedLiveCount === null) {
      expectedLiveCount = liveCount;
    } else {
      assert.equal(liveCount, expectedLiveCount);
    }
  }

  assert.ok(expectedLiveCount !== null && expectedLiveCount > 0);
});

test("Connect candidates apply existing kind, source, fixed-source, and same-participant rules only", () => {
  const document = createE1DirectBaseline();
  const pointTargets = connectionTargetReferenceIds(
    document,
    "point-coincidence",
    E1_IDS.damperB,
  );
  assert.ok(pointTargets.includes(E1_IDS.armEnd));
  assert.ok(pointTargets.includes(E1_IDS.chassisUpper));
  assert.ok(!pointTargets.includes(E1_IDS.damperA));
  assert.ok(!pointTargets.includes(E1_IDS.damperB));
  assert.ok(!pointTargets.includes(E1_IDS.armPivot));
  assert.deepEqual(
    connectionTargetReferenceIds(document, "point-coincidence", E1_IDS.chassisUpper),
    [],
  );
});

test("a reference can reach multiple E1 relations without imposing a new cardinality rule", () => {
  const baseline = createE1DirectBaseline();
  const multiRelation = connectReferences(
    baseline,
    "point-coincidence",
    E1_IDS.damperB,
    E1_IDS.chassisUpper,
  );
  const relations = relationsForReference(multiRelation, E1_IDS.damperB);
  assert.equal(relations.length, 2);
  const explicitlyRemoved = disconnectRelation(multiRelation, relations[1]!.id);
  assert.deepEqual(relationsForReference(explicitlyRemoved, E1_IDS.damperB), [relations[0]!]);
});

test("diagnosed-static PLAY keeps authored rocker and rigid link visible in authored pose", () => {
  let document = createE1DirectBaseline();
  document = addParticipant(document, createE1RockerParticipant());
  document = addParticipant(document, createE1PushrodParticipant());
  document = disconnectRelation(document, "relation-2");
  const result = evaluateE1Play(document, 3);
  assert.equal(result.topology, "unsupported");
  assert.equal(result.frames[0]!.status, "diagnosed-static");

  const projection = new E1ThreeProjection();
  projection.renderFrame(document, result.frames[0]!);
  for (const name of [
    "e1-play-pushrod",
    "e1-play-rocker-a",
    "e1-play-rocker-b",
    "e1-play-rocker-hub",
    "e1-play-rocker-axis",
  ]) {
    const object = projection.playRoot.getObjectByName(name);
    assert.ok(object, `${name} should exist`);
    assert.equal(object.visible, true, `${name} should remain visible`);
    assert.ok(Number.isFinite(object.position.x));
    assert.ok(Number.isFinite(object.position.y));
    assert.ok(Number.isFinite(object.position.z));
  }
});
