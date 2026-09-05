import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { applyC1DamperBetween } from "../../src/rep2/c1-damper-adapter.js";
import { bindRep4DamperDonorAtPhysicalRestLength } from "../../src/rep4/stage-b-damper-visual.js";

function makeSyntheticDonor(): THREE.Group {
  const scene = new THREE.Group();
  const rigRoot = new THREE.Group();
  rigRoot.position.set(0, 0.5, 0.5625);
  scene.add(rigRoot);

  const upper = new THREE.Bone();
  upper.name = "Part_Upper";
  upper.position.set(0, 1, -0.5625);
  const stretch = new THREE.Bone();
  stretch.name = "Part_Stretch";
  stretch.position.set(0, -0.0078125, -0.5625);
  const lower = new THREE.Bone();
  lower.name = "Part_Lower";
  lower.position.set(0, -0.96875, -0.5625);
  rigRoot.add(upper, stretch, lower);
  scene.updateMatrixWorld(true);
  return scene;
}

const almost = (actual: number, expected: number, tolerance = 1e-9): void => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected} within ${tolerance}`);
};

test("Rep4 B1 scales the visual donor uniformly to the physical component rest length before endpoint adaptation", () => {
  const scene = makeSyntheticDonor();
  const result = bindRep4DamperDonorAtPhysicalRestLength(scene, 0.5);

  almost(result.sourceRestGap, 1.96875);
  almost(result.scaleFactor, 0.5 / 1.96875);
  almost(result.binding.bind.restGap, 0.5);
  almost(scene.scale.x, result.scaleFactor);
  almost(scene.scale.y, result.scaleFactor);
  almost(scene.scale.z, result.scaleFactor);

  const top = { x: 0.18, y: 0.13, z: 0 };
  const bottom = { x: 0.418, y: -0.31, z: 0 };
  const adapted = applyC1DamperBetween(result.binding, top, bottom);
  almost(adapted.upperError, 0, 1e-10);
  almost(adapted.lowerError, 0, 1e-10);
  almost(adapted.liveGap, Math.hypot(bottom.x - top.x, bottom.y - top.y), 1e-10);
});

test("Rep4 B1 visual donor scaling rejects invalid physical rest lengths", () => {
  assert.throws(() => bindRep4DamperDonorAtPhysicalRestLength(makeSyntheticDonor(), 0), /finite and positive/);
  assert.throws(() => bindRep4DamperDonorAtPhysicalRestLength(makeSyntheticDonor(), Number.NaN), /finite and positive/);
});
