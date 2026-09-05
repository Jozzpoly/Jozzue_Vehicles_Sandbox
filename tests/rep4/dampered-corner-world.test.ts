import assert from "node:assert/strict";
import test from "node:test";
import { vec3 } from "../../src/v0/math.js";
import {
  deriveRep4DamperRelation,
  REP4_DAMPER_COMPONENT,
  runRep4DamperedCornerProbe,
  type Rep4DamperedCornerAuthority,
} from "../../src/rep4/dampered-corner-world.js";

const READBACK_TOLERANCE = 1e-5;
const BALL_SEPARATION_MAX = 5e-3;
const TIE_LENGTH_ERROR_MAX = 5e-4;

function baselineAuthority(): Rep4DamperedCornerAuthority {
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
    damperChassisEyeWorld: vec3(0.18, 0.13, 0),
    damperLowerEyeWorld: vec3(0.418, -0.31, 0),
  });
}

function innerDamperAuthority(): Rep4DamperedCornerAuthority {
  const baseline = baselineAuthority();
  return Object.freeze({
    ...baseline,
    damperLowerEyeWorld: vec3(0.228, -0.36, 0),
  });
}

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function assertDamperIntegrity(
  result: Awaited<ReturnType<typeof runRep4DamperedCornerProbe>>,
): void {
  assert.equal(result.mode, "DAMPER");
  assert.notEqual(result.damperNativeBodies, null);
  assert.notEqual(result.damperNativeLocalA, null);
  assert.notEqual(result.damperNativeLocalB, null);
  assert.notEqual(result.damperNativeRestLength, null);
  assert.notEqual(result.damperNativeHertz, null);
  assert.notEqual(result.damperNativeDampingRatio, null);
  assert.deepEqual(result.damperNativeBodies!.bodyA, result.expectedBodies.support);
  assert.deepEqual(result.damperNativeBodies!.bodyB, result.expectedBodies.lowerArm);
  assert.equal(result.damperNativeSpringEnabled, true);
  assert.ok(
    distance(result.damperNativeLocalA!, result.authority.damperChassisEyeWorld) < READBACK_TOLERANCE,
  );
  assert.ok(
    distance(result.damperNativeLocalB!, result.derived.damperLowerEyeLocal) < READBACK_TOLERANCE,
  );
  assert.ok(
    Math.abs(result.damperNativeRestLength! - REP4_DAMPER_COMPONENT.restLength) < READBACK_TOLERANCE,
  );
  assert.ok(
    Math.abs(result.damperNativeHertz! - result.derived.hertz) < READBACK_TOLERANCE,
  );
  assert.ok(
    Math.abs(result.damperNativeDampingRatio! - result.derived.dampingRatio) < READBACK_TOLERANCE,
  );
  assert.ok(result.maxUpperBallSeparation < BALL_SEPARATION_MAX);
  assert.ok(result.maxLowerBallSeparation < BALL_SEPARATION_MAX);
  assert.ok(result.maxTieLengthError < TIE_LENGTH_ERROR_MAX);
  assert.ok(Number.isFinite(result.maxUprightDisplacement));
  assert.ok(result.initial.damperCurrentLength !== null);
  assert.ok(result.final.damperCurrentLength !== null);
  assert.ok(result.maxAbsDamperAxialForce !== null && Number.isFinite(result.maxAbsDamperAxialForce));
}

test("Rep4 A4 native damper consumes the authored support/lower-arm eyes and qualified physical component semantics", async () => {
  const authority = baselineAuthority();
  const derived = deriveRep4DamperRelation(authority);
  const result = await runRep4DamperedCornerProbe(authority, "DAMPER", 60);

  assertDamperIntegrity(result);
  assert.deepEqual(result.component, REP4_DAMPER_COMPONENT);
  assert.ok(
    Math.abs(result.initial.damperCurrentLength! - derived.initialDamperLength) < READBACK_TOLERANCE,
  );
  assert.ok(derived.axialMass > 0);
  assert.ok(derived.hertz > 0);
  assert.ok(derived.dampingRatio > 0);
});

test("Rep4 A4 geometry-only variants keep physical k/c/restLength exact while deriving their own native mapping", async () => {
  const baselineAuthorityValue = baselineAuthority();
  const innerAuthorityValue = innerDamperAuthority();
  const baselineDerived = deriveRep4DamperRelation(baselineAuthorityValue);
  const innerDerived = deriveRep4DamperRelation(innerAuthorityValue);
  const [baseline, inner] = await Promise.all([
    runRep4DamperedCornerProbe(baselineAuthorityValue, "DAMPER", 60),
    runRep4DamperedCornerProbe(innerAuthorityValue, "DAMPER", 60),
  ]);

  assertDamperIntegrity(baseline);
  assertDamperIntegrity(inner);
  assert.deepEqual(baseline.component, inner.component);
  assert.deepEqual(baseline.component, REP4_DAMPER_COMPONENT);
  assert.notEqual(baselineDerived.rotationalJacobian, innerDerived.rotationalJacobian);
  assert.notEqual(baselineDerived.axialMass, innerDerived.axialMass);
  assert.notEqual(baselineDerived.hertz, innerDerived.hertz);
  assert.notEqual(baselineDerived.dampingRatio, innerDerived.dampingRatio);
});

test("Rep4 A4 FREE control removes the spring relation rather than substituting hidden forces", async () => {
  const result = await runRep4DamperedCornerProbe(baselineAuthority(), "FREE", 60);

  assert.equal(result.damperNativeBodies, null);
  assert.equal(result.damperNativeLocalA, null);
  assert.equal(result.damperNativeLocalB, null);
  assert.equal(result.damperNativeRestLength, null);
  assert.equal(result.damperNativeSpringEnabled, null);
  assert.equal(result.damperNativeHertz, null);
  assert.equal(result.damperNativeDampingRatio, null);
  assert.equal(result.initial.damperCurrentLength, null);
  assert.equal(result.final.damperCurrentLength, null);
  assert.equal(result.maxAbsDamperAxialForce, null);
  assert.ok(result.maxUpperBallSeparation < BALL_SEPARATION_MAX);
  assert.ok(result.maxLowerBallSeparation < BALL_SEPARATION_MAX);
  assert.ok(result.maxTieLengthError < TIE_LENGTH_ERROR_MAX);
});

test("Rep4 A4 rejects non-finite and coincident damper hardpoints instead of inventing fallback geometry", () => {
  const authority = baselineAuthority();
  assert.throws(
    () => deriveRep4DamperRelation({
      ...authority,
      damperChassisEyeWorld: vec3(Number.NaN, 0, 0),
    }),
    /damper hardpoints must be finite/,
  );
  assert.throws(
    () => deriveRep4DamperRelation({
      ...authority,
      damperLowerEyeWorld: authority.damperChassisEyeWorld,
    }),
    /damper must span more than/,
  );
});
