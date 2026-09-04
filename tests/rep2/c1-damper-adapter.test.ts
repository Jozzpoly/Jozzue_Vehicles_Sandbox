import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { applyC1DamperBetween, bindC1DamperDonor } from "../../src/rep2/c1-damper-adapter.js";

function makeSyntheticDonor(): THREE.Group {
  const scene = new THREE.Group();
  scene.name = "synthetic-damper";
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

function almost(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected} within ${tolerance}`);
}

function pointAlmost(
  actual: Readonly<{ x: number; y: number; z: number }>,
  expected: Readonly<{ x: number; y: number; z: number }>,
  tolerance = 1e-9,
): void {
  almost(actual.x, expected.x, tolerance);
  almost(actual.y, expected.y, tolerance);
  almost(actual.z, expected.z, tolerance);
}

test("C1.1 pins rigid end references exactly and stretches only the middle part", () => {
  const scene = makeSyntheticDonor();
  const binding = bindC1DamperDonor(scene);
  almost(binding.bind.restGap, 1.96875);

  const upperScaleBefore = binding.upper.scale.clone();
  const lowerScaleBefore = binding.lower.scale.clone();
  const stretchScaleBefore = binding.stretch.scale.clone();
  const top = { x: 1.25, y: 2.1, z: -0.4 };
  const bottom = { x: -0.6, y: 0.35, z: 1.1 };
  const result = applyC1DamperBetween(binding, top, bottom);

  pointAlmost(result.visualUpperWorld, top);
  pointAlmost(result.visualLowerWorld, bottom);
  almost(result.upperError, 0, 1e-10);
  almost(result.lowerError, 0, 1e-10);
  pointAlmost(binding.upper.scale, upperScaleBefore);
  pointAlmost(binding.lower.scale, lowerScaleBefore);
  almost(binding.stretch.scale.x, stretchScaleBefore.x);
  almost(binding.stretch.scale.z, stretchScaleBefore.z);
  almost(binding.stretch.scale.y, stretchScaleBefore.y * result.stretchScaleRatio);

  const expectedStretch = new THREE.Vector3(top.x, top.y, top.z).lerp(
    new THREE.Vector3(bottom.x, bottom.y, bottom.z),
    binding.bind.stretchFractionFromUpper,
  );
  pointAlmost(result.visualStretchWorld, expectedStretch);
});

test("C1.1 materially different direction/length still reconstructs exact endpoints", () => {
  const scene = makeSyntheticDonor();
  const binding = bindC1DamperDonor(scene);
  const specimens = [
    {
      top: { x: -2.0, y: 0.25, z: 1.75 },
      bottom: { x: 1.5, y: -1.0, z: -0.5 },
    },
    {
      top: { x: 0, y: -1.4, z: 0 },
      bottom: { x: 0, y: 1.2, z: 0 },
    },
  ];

  for (const specimen of specimens) {
    const result = applyC1DamperBetween(binding, specimen.top, specimen.bottom);
    pointAlmost(result.visualUpperWorld, specimen.top, 1e-8);
    pointAlmost(result.visualLowerWorld, specimen.bottom, 1e-8);
    assert.ok(Number.isFinite(result.stretchScaleRatio));
    assert.ok(result.stretchScaleRatio > 0);
  }
});

test("C1.1 rejects coincident and non-finite endpoint singularities instead of inventing a direction", () => {
  const scene = makeSyntheticDonor();
  const binding = bindC1DamperDonor(scene);

  assert.throws(
    () => applyC1DamperBetween(binding, { x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 }),
    /finite non-zero span/,
  );
  assert.throws(
    () => applyC1DamperBetween(binding, { x: Number.NaN, y: 2, z: 3 }, { x: 1, y: 2, z: 3 }),
    /must be finite/,
  );
});
