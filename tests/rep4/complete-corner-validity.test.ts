import assert from "node:assert/strict";
import test from "node:test";
import { vec3 } from "../../src/v0/math.js";
import {
  deriveRep4DamperRelation,
  runRep4DamperedCornerProbe,
  type Rep4DamperedCornerAuthority,
} from "../../src/rep4/dampered-corner-world.js";

const BALL_SEPARATION_MAX = 5e-3;
const TIE_LENGTH_ERROR_MAX = 5e-4;
const MATERIAL_MOTION_MIN = 1e-3;

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
    damperLowerEyeWorld: vec3(0.228, -0.36, 0),
  });
}

function strangeFiniteAuthority(): Rep4DamperedCornerAuthority {
  const baseline = baselineAuthority();
  return Object.freeze({
    ...baseline,
    twoArm: Object.freeze({
      ...baseline.twoArm,
      upper: Object.freeze({
        // Same bearing midpoint, but a deliberately nonparallel spatial bearing
        // line. This was already safe at S0; A6 verifies it remains safe after
        // the real tie and real damper are composed into the same corner.
        inboardAWorld: vec3(-0.06, 0.42, -0.3),
        inboardBWorld: vec3(0.06, 0.42, 0.3),
        outboardWorld: baseline.twoArm.upper.outboardWorld,
      }),
    }),
  });
}

function assertFinite(value: unknown, label: string): void {
  assert.equal(typeof value, "number", `${label} is not numeric`);
  assert.ok(Number.isFinite(value as number), `${label} is not finite: ${value}`);
}

test("Rep4 A6 finite nonparallel bearing geometry remains permitted in the complete tied and dampered corner", async () => {
  const authority = strangeFiniteAuthority();
  const derived = deriveRep4DamperRelation(authority);
  const result = await runRep4DamperedCornerProbe(authority, "DAMPER", 120);

  for (const [label, value] of [
    ["tie length", derived.tieLength],
    ["damper neutral length", derived.initialDamperLength],
    ["damper axial mass", derived.axialMass],
    ["damper hertz", derived.hertz],
    ["damper damping ratio", derived.dampingRatio],
    ["upper ball separation", result.maxUpperBallSeparation],
    ["lower ball separation", result.maxLowerBallSeparation],
    ["tie length error", result.maxTieLengthError],
    ["upright displacement", result.maxUprightDisplacement],
    ["final upright x", result.final.uprightPositionWorld.x],
    ["final upright y", result.final.uprightPositionWorld.y],
    ["final upright z", result.final.uprightPositionWorld.z],
  ] as const) {
    assertFinite(value, label);
  }

  assert.ok(result.maxUpperBallSeparation < BALL_SEPARATION_MAX);
  assert.ok(result.maxLowerBallSeparation < BALL_SEPARATION_MAX);
  assert.ok(result.maxTieLengthError < TIE_LENGTH_ERROR_MAX);
  assert.ok(result.maxUprightDisplacement > MATERIAL_MOTION_MIN);
  assert.equal(result.damperNativeSpringEnabled, true);
  assert.notEqual(result.damperNativeBodies, null);
});

test("Rep4 A6 complete authority rejects a singular authored bearing line instead of inventing a fallback hinge", () => {
  const authority = baselineAuthority();
  assert.throws(
    () => deriveRep4DamperRelation({
      ...authority,
      twoArm: {
        ...authority.twoArm,
        upper: {
          ...authority.twoArm.upper,
          inboardBWorld: authority.twoArm.upper.inboardAWorld,
        },
      },
    }),
    /hinge must span more than/,
  );
});

test("Rep4 A6 complete authority rejects non-finite mechanical hardpoints instead of sanitizing them", () => {
  const authority = baselineAuthority();
  assert.throws(
    () => deriveRep4DamperRelation({
      ...authority,
      twoArm: {
        ...authority.twoArm,
        lower: {
          ...authority.twoArm.lower,
          outboardWorld: vec3(Number.NaN, -0.22, 0),
        },
      },
    }),
    /must be finite/,
  );
});

test("Rep4 A6 complete authority rejects true tie and damper span singularities explicitly", () => {
  const authority = baselineAuthority();
  assert.throws(
    () => deriveRep4DamperRelation({
      ...authority,
      uprightTiePickupWorld: authority.chassisTiePointWorld,
    }),
    /tie must span more than/,
  );
  assert.throws(
    () => deriveRep4DamperRelation({
      ...authority,
      damperLowerEyeWorld: authority.damperChassisEyeWorld,
    }),
    /damper must span more than/,
  );
});
