import assert from "node:assert/strict";
import test from "node:test";
import { vec3 } from "../../src/v0/math.js";
import {
  deriveS0TwoArmRelation,
  runS0TwoArmProbe,
  S0_TWO_ARM_APPARATUS,
  type S0TwoArmAuthority,
} from "../../src/s0/two-arm-upright-probe.js";

const BALL_SEPARATION_MAX = 5e-3;
const HINGE_PIVOT_SEPARATION_MAX = 5e-4;
const AXIS_ALIGNMENT_ERROR_MAX = 1e-6;
const PLANAR_DRIFT_MAX = 3e-3;
const MATERIAL_MOTION_MIN = 1e-3;
const MATERIAL_MUTATION_SEPARATION_MIN = 1e-3;
const PATHOLOGICAL_LINEAR_SPEED_MAX = 20;
const PATHOLOGICAL_ANGULAR_SPEED_MAX = 100;

function baselineAuthority(): S0TwoArmAuthority {
  return Object.freeze({
    upper: Object.freeze({
      inboardAWorld: vec3(0, 0.42, -0.3),
      inboardBWorld: vec3(0, 0.42, 0.3),
      outboardWorld: vec3(0.72, 0.2, 0),
    }),
    lower: Object.freeze({
      inboardAWorld: vec3(0, -0.42, -0.3),
      inboardBWorld: vec3(0, -0.42, 0.3),
      outboardWorld: vec3(0.76, -0.22, 0),
    }),
  });
}

function mutatedUpperInboardAuthority(): S0TwoArmAuthority {
  const baseline = baselineAuthority();
  return Object.freeze({
    upper: Object.freeze({
      inboardAWorld: vec3(0.08, 0.52, -0.3),
      inboardBWorld: vec3(0.08, 0.52, 0.3),
      outboardWorld: baseline.upper.outboardWorld,
    }),
    lower: baseline.lower,
  });
}

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function maxPathSeparation(
  a: readonly Readonly<{ x: number; y: number; z: number }>[],
  b: readonly Readonly<{ x: number; y: number; z: number }>[],
): number {
  assert.equal(a.length, b.length);
  let maximum = 0;
  for (let index = 0; index < a.length; index += 1) {
    maximum = Math.max(maximum, distance(a[index]!, b[index]!));
  }
  return maximum;
}

function assertFiniteResult(result: Awaited<ReturnType<typeof runS0TwoArmProbe>>) {
  for (const value of [
    result.maxUpperBallSeparation,
    result.maxLowerBallSeparation,
    result.maxUpperHingePivotSeparation,
    result.maxLowerHingePivotSeparation,
    result.maxPlanarDrift,
    result.maxUprightLinearSpeed,
    result.maxUprightAngularSpeed,
    result.maxUprightDisplacement,
    result.upperHingeAxisAAlignmentError,
    result.upperHingeAxisBAlignmentError,
    result.lowerHingeAxisAAlignmentError,
    result.lowerHingeAxisBAlignmentError,
  ]) {
    assert.ok(Number.isFinite(value), `non-finite S0 metric ${value}`);
  }
}

function assertClosedChainIntegrity(result: Awaited<ReturnType<typeof runS0TwoArmProbe>>) {
  assert.equal(result.apparatus.box3dPackage, "box3d.js@0.0.2");
  assertFiniteResult(result);

  assert.deepEqual(result.nativeJointBodies.upperHingeA, result.expectedBodies.support);
  assert.deepEqual(result.nativeJointBodies.upperHingeB, result.expectedBodies.upperArm);
  assert.deepEqual(result.nativeJointBodies.lowerHingeA, result.expectedBodies.support);
  assert.deepEqual(result.nativeJointBodies.lowerHingeB, result.expectedBodies.lowerArm);
  assert.deepEqual(result.nativeJointBodies.upperBallA, result.expectedBodies.upperArm);
  assert.deepEqual(result.nativeJointBodies.upperBallB, result.expectedBodies.upright);
  assert.deepEqual(result.nativeJointBodies.lowerBallA, result.expectedBodies.lowerArm);
  assert.deepEqual(result.nativeJointBodies.lowerBallB, result.expectedBodies.upright);

  assert.ok(
    result.maxUpperBallSeparation < BALL_SEPARATION_MAX,
    `upper spherical anchor separation ${result.maxUpperBallSeparation}`,
  );
  assert.ok(
    result.maxLowerBallSeparation < BALL_SEPARATION_MAX,
    `lower spherical anchor separation ${result.maxLowerBallSeparation}`,
  );
  assert.ok(
    result.maxUpperHingePivotSeparation < HINGE_PIVOT_SEPARATION_MAX,
    `upper hinge pivot separation ${result.maxUpperHingePivotSeparation}`,
  );
  assert.ok(
    result.maxLowerHingePivotSeparation < HINGE_PIVOT_SEPARATION_MAX,
    `lower hinge pivot separation ${result.maxLowerHingePivotSeparation}`,
  );

  for (const [label, error] of [
    ["upper frame A", result.upperHingeAxisAAlignmentError],
    ["upper frame B", result.upperHingeAxisBAlignmentError],
    ["lower frame A", result.lowerHingeAxisAAlignmentError],
    ["lower frame B", result.lowerHingeAxisBAlignmentError],
  ] as const) {
    assert.ok(error < AXIS_ALIGNMENT_ERROR_MAX, `${label} axis alignment error ${error}`);
  }

  assert.ok(
    result.maxUprightDisplacement > MATERIAL_MOTION_MIN,
    `upright moved only ${result.maxUprightDisplacement}`,
  );
  assert.ok(
    result.maxUprightLinearSpeed < PATHOLOGICAL_LINEAR_SPEED_MAX,
    `upright linear speed blew up to ${result.maxUprightLinearSpeed}`,
  );
  assert.ok(
    result.maxUprightAngularSpeed < PATHOLOGICAL_ANGULAR_SPEED_MAX,
    `upright angular speed blew up to ${result.maxUprightAngularSpeed}`,
  );
}

test("S0 exact pinned package exposes a usable spherical-joint closed chain with native body/readback integrity", async () => {
  const result = await runS0TwoArmProbe(baselineAuthority());
  assertClosedChainIntegrity(result);
  assert.equal(result.uprightPath.length, S0_TWO_ARM_APPARATUS.defaultSteps + 1);
  assert.ok(
    result.maxPlanarDrift < PLANAR_DRIFT_MAX,
    `symmetric no-Z load drifted out of plane by ${result.maxPlanarDrift}`,
  );
});

test("S0 authored upper hardpoint mutation materially changes the real upright path without breaking the closed chain", async () => {
  const [baseline, mutated] = await Promise.all([
    runS0TwoArmProbe(baselineAuthority()),
    runS0TwoArmProbe(mutatedUpperInboardAuthority()),
  ]);

  assertClosedChainIntegrity(baseline);
  assertClosedChainIntegrity(mutated);
  const separation = maxPathSeparation(baseline.uprightPath, mutated.uprightPath);
  assert.ok(
    separation > MATERIAL_MUTATION_SEPARATION_MIN,
    `hardpoint mutation separated upright paths by only ${separation}`,
  );
});

test("S0 derives solver relation data from hardpoints and rejects singular authored geometry", () => {
  const authority = baselineAuthority();
  const derived = deriveS0TwoArmRelation(authority);
  assert.deepEqual(derived.upper.pivotWorld, vec3(0, 0.42, 0));
  assert.deepEqual(derived.lower.pivotWorld, vec3(0, -0.42, 0));
  assert.deepEqual(derived.upper.axisWorld, vec3(0, 0, 1));
  assert.deepEqual(derived.lower.axisWorld, vec3(0, 0, 1));

  assert.throws(
    () => deriveS0TwoArmRelation({
      ...authority,
      upper: {
        ...authority.upper,
        inboardBWorld: authority.upper.inboardAWorld,
      },
    }),
    /hinge must span more than/,
  );

  assert.throws(
    () => deriveS0TwoArmRelation({
      ...authority,
      lower: {
        ...authority.lower,
        outboardWorld: vec3(Number.NaN, 0, 0),
      },
    }),
    /must be finite/,
  );
});
