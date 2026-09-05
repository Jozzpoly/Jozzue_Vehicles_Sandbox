import assert from "node:assert/strict";
import test from "node:test";
import { vec3 } from "../../src/v0/math.js";
import {
  deriveRep4TieRelation,
  runRep4TieOwnedProbe,
  type Rep4TieAuthority,
} from "../../src/rep4/tie-owned-upright-world.js";

const BALL_SEPARATION_MAX = 5e-3;
const TIE_LENGTH_ERROR_MAX = 5e-4;
const NATIVE_GEOMETRY_READBACK_MAX = 1e-6;
const TWIST_CONTROL_SEPARATION_MIN = 0.05;
const TIE_GEOMETRY_ORIENTATION_SEPARATION_MIN = 0.005;

function baselineAuthority(): Rep4TieAuthority {
  return Object.freeze({
    twoArm: Object.freeze({
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
    }),
    chassisTiePointWorld: vec3(0.28, 0, 0.32),
    uprightTiePickupWorld: vec3(0.74, 0, 0.18),
  });
}

function alternateTieGeometry(): Rep4TieAuthority {
  const baseline = baselineAuthority();
  return Object.freeze({
    twoArm: baseline.twoArm,
    chassisTiePointWorld: vec3(0.28, 0, -0.18),
    uprightTiePickupWorld: baseline.uprightTiePickupWorld,
  });
}

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function quaternionSeparation(
  a: Readonly<{ v: Readonly<{ x: number; y: number; z: number }>; s: number }>,
  b: Readonly<{ v: Readonly<{ x: number; y: number; z: number }>; s: number }>,
): number {
  const rawDot = a.v.x * b.v.x + a.v.y * b.v.y + a.v.z * b.v.z + a.s * b.s;
  const clamped = Math.max(-1, Math.min(1, Math.abs(rawDot)));
  return 2 * Math.acos(clamped);
}

function assertTieIntegrity(
  result: Awaited<ReturnType<typeof runRep4TieOwnedProbe>>,
): void {
  assert.equal(result.mode, "TIE");
  assert.notEqual(result.tieNativeBodies, null);
  assert.notEqual(result.tieNativeLength, null);
  assert.notEqual(result.tieNativeLocalA, null);
  assert.notEqual(result.tieNativeLocalB, null);
  assert.deepEqual(result.tieNativeBodies!.bodyA, result.expectedBodies.support);
  assert.deepEqual(result.tieNativeBodies!.bodyB, result.expectedBodies.upright);
  assert.ok(
    Math.abs(result.tieNativeLength! - result.derived.tieLength) < NATIVE_GEOMETRY_READBACK_MAX,
    `native tie length mismatch ${result.tieNativeLength} vs ${result.derived.tieLength}`,
  );
  assert.ok(
    distance(result.tieNativeLocalA!, result.authority.chassisTiePointWorld) < NATIVE_GEOMETRY_READBACK_MAX,
    "native support-side tie anchor does not match authored chassis point",
  );
  assert.ok(
    distance(result.tieNativeLocalB!, result.derived.uprightTiePickupLocal) < NATIVE_GEOMETRY_READBACK_MAX,
    "native upright-side tie anchor does not match derived body-local pickup",
  );
  assert.ok(
    result.maxTieLengthError !== null && result.maxTieLengthError < TIE_LENGTH_ERROR_MAX,
    `tie length error ${result.maxTieLengthError}`,
  );
  assert.ok(
    result.maxUpperBallSeparation < BALL_SEPARATION_MAX,
    `upper ball separation ${result.maxUpperBallSeparation}`,
  );
  assert.ok(
    result.maxLowerBallSeparation < BALL_SEPARATION_MAX,
    `lower ball separation ${result.maxLowerBallSeparation}`,
  );
}

test("Rep4 A3 tie authority is a real fixed-length native relation from authored chassis point to derived upright-local pickup", async () => {
  const authority = baselineAuthority();
  const derived = deriveRep4TieRelation(authority);
  const result = await runRep4TieOwnedProbe(authority, "TIE", "TRAVEL", 30);

  assertTieIntegrity(result);
  assert.ok(derived.tieLength > 0.1);
  assert.ok(Math.abs(result.tieNativeLength! - derived.tieLength) < NATIVE_GEOMETRY_READBACK_MAX);
  assert.ok(result.initial.tieChassisPointWorld !== null);
  assert.ok(result.initial.tieUprightPickupWorld !== null);
  assert.ok(
    distance(result.initial.tieChassisPointWorld!, authority.chassisTiePointWorld) < NATIVE_GEOMETRY_READBACK_MAX,
  );
  assert.ok(
    distance(result.initial.tieUprightPickupWorld!, authority.uprightTiePickupWorld) < NATIVE_GEOMETRY_READBACK_MAX,
  );
});

test("Rep4 A3 removing the tie materially restores the free upright twist DOF", async () => {
  const authority = baselineAuthority();
  const [tied, free] = await Promise.all([
    runRep4TieOwnedProbe(authority, "TIE", "TWIST", 45),
    runRep4TieOwnedProbe(authority, "FREE", "TWIST", 45),
  ]);

  assertTieIntegrity(tied);
  assert.equal(free.tieNativeBodies, null);
  assert.equal(free.tieNativeLength, null);
  assert.ok(free.maxUpperBallSeparation < BALL_SEPARATION_MAX);
  assert.ok(free.maxLowerBallSeparation < BALL_SEPARATION_MAX);
  const separation = free.maxUprightOrientationDeparture - tied.maxUprightOrientationDeparture;
  assert.ok(
    separation > TWIST_CONTROL_SEPARATION_MIN,
    `free-vs-tied orientation departure separated by only ${separation} rad (free ${free.maxUprightOrientationDeparture}, tied ${tied.maxUprightOrientationDeparture})`,
  );
});

test("Rep4 A3 tie installation geometry materially changes real upright orientation during the same suspension travel impulse", async () => {
  const [baseline, alternate] = await Promise.all([
    runRep4TieOwnedProbe(baselineAuthority(), "TIE", "TRAVEL"),
    runRep4TieOwnedProbe(alternateTieGeometry(), "TIE", "TRAVEL"),
  ]);

  assertTieIntegrity(baseline);
  assertTieIntegrity(alternate);
  const orientationSeparation = quaternionSeparation(
    baseline.final.uprightRotation,
    alternate.final.uprightRotation,
  );
  assert.ok(
    orientationSeparation > TIE_GEOMETRY_ORIENTATION_SEPARATION_MIN,
    `tie geometry changed final upright orientation by only ${orientationSeparation} rad`,
  );
});

test("Rep4 A3 rejects singular/non-finite tie authority instead of inventing a fallback relation", () => {
  const authority = baselineAuthority();
  assert.throws(
    () => deriveRep4TieRelation({
      ...authority,
      uprightTiePickupWorld: authority.chassisTiePointWorld,
    }),
    /tie must span more than/,
  );
  assert.throws(
    () => deriveRep4TieRelation({
      ...authority,
      chassisTiePointWorld: vec3(Number.NaN, 0, 0),
    }),
    /tie hardpoints must be finite/,
  );
});
