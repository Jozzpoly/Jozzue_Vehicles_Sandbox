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
const TIE_GEOMETRY_TWIST_SEPARATION_MIN = 0.05;
const MIN_TRAVEL_DISPLACEMENT = 0.1;

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
    // Change only rack-side height inside the mechanism's actual XY travel plane.
    // The previous Z-only mutation changed neutral tie length but was kinematically
    // neutral for the nearly planar suspension path and therefore was not a fair
    // bump-steer falsification.
    chassisTiePointWorld: vec3(0.28, -0.1, 0.32),
    uprightTiePickupWorld: baseline.uprightTiePickupWorld,
  });
}

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function wrapRadians(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function signedTwistAroundAxis(
  q: Readonly<{ v: Readonly<{ x: number; y: number; z: number }>; s: number }>,
  axis: Readonly<{ x: number; y: number; z: number }>,
): number {
  const axisMagnitude = Math.hypot(axis.x, axis.y, axis.z);
  assert.ok(axisMagnitude > 1e-8, "twist observer requires a finite axis");
  const ax = axis.x / axisMagnitude;
  const ay = axis.y / axisMagnitude;
  const az = axis.z / axisMagnitude;
  const projectedVectorPart = q.v.x * ax + q.v.y * ay + q.v.z * az;
  return wrapRadians(2 * Math.atan2(projectedVectorPart, q.s));
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

test("Rep4 A3 rack-side tie geometry materially changes real upright twist during the same suspension travel impulse", async () => {
  const [baseline, alternate] = await Promise.all([
    runRep4TieOwnedProbe(baselineAuthority(), "TIE", "TRAVEL"),
    runRep4TieOwnedProbe(alternateTieGeometry(), "TIE", "TRAVEL"),
  ]);

  assertTieIntegrity(baseline);
  assertTieIntegrity(alternate);
  assert.ok(baseline.maxUprightDisplacement > MIN_TRAVEL_DISPLACEMENT);
  assert.ok(alternate.maxUprightDisplacement > MIN_TRAVEL_DISPLACEMENT);

  const baselineTwist = signedTwistAroundAxis(
    baseline.final.uprightRotation,
    baseline.derived.initialTwistAxisWorld,
  );
  const alternateTwist = signedTwistAroundAxis(
    alternate.final.uprightRotation,
    alternate.derived.initialTwistAxisWorld,
  );
  const twistSeparation = Math.abs(wrapRadians(alternateTwist - baselineTwist));
  assert.ok(
    twistSeparation > TIE_GEOMETRY_TWIST_SEPARATION_MIN,
    `rack-side tie geometry changed final upright twist by only ${twistSeparation} rad (baseline ${baselineTwist}, alternate ${alternateTwist})`,
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
