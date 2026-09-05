import assert from "node:assert/strict";
import test from "node:test";
import { vec3 } from "../../src/v0/math.js";
import {
  REP4_DAMPER_COMPONENT,
  runRep4DamperedCornerProbe,
  type Rep4DamperedCornerAuthority,
} from "../../src/rep4/dampered-corner-world.js";

const TIE_TWIST_SEPARATION_MIN = 0.04;
const TIE_TRAVEL_CONFUND_MAX = 0.003;
const TIE_OBSERVATION_MIN_TRAVEL = 0.04;
const DAMPER_TRAVEL_SEPARATION_MIN = 0.02;

function authority(
  tieHeight: number,
  damperKind: "inner" | "outer",
): Rep4DamperedCornerAuthority {
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
    chassisTiePointWorld: vec3(0.28, tieHeight, 0.32),
    uprightTiePickupWorld: vec3(0.74, 0, 0.18),
    damperChassisEyeWorld: vec3(0.18, 0.13, 0),
    damperLowerEyeWorld: damperKind === "inner"
      ? vec3(0.228, -0.36, 0)
      : vec3(0.418, -0.31, 0),
  });
}

function wrapRadians(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function signedTwist(
  q: Readonly<{ v: Readonly<{ x: number; y: number; z: number }>; s: number }>,
  authorityValue: Rep4DamperedCornerAuthority,
): number {
  const axis = vec3(
    authorityValue.twoArm.upper.outboardWorld.x - authorityValue.twoArm.lower.outboardWorld.x,
    authorityValue.twoArm.upper.outboardWorld.y - authorityValue.twoArm.lower.outboardWorld.y,
    authorityValue.twoArm.upper.outboardWorld.z - authorityValue.twoArm.lower.outboardWorld.z,
  );
  const magnitude = Math.hypot(axis.x, axis.y, axis.z);
  assert.ok(magnitude > 1e-8, "A5 twist observer requires a finite upright ball-joint axis");
  const projected = (
    q.v.x * axis.x + q.v.y * axis.y + q.v.z * axis.z
  ) / magnitude;
  return wrapRadians(2 * Math.atan2(projected, q.s));
}

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

test("Rep4 A5 tie geometry produces a toe-dominant consequence during the same dampered compression", async () => {
  const baselineAuthority = authority(0, "inner");
  const tieEditAuthority = authority(-0.1, "inner");

  // 0.5 s is an in-motion observation selected from the prior bounded trajectory
  // diagnostic, before the spring/damper has returned the mechanism toward neutral.
  const [baseline, tieEdit] = await Promise.all([
    runRep4DamperedCornerProbe(baselineAuthority, "DAMPER", 30),
    runRep4DamperedCornerProbe(tieEditAuthority, "DAMPER", 30),
  ]);

  assert.deepEqual(baseline.component, REP4_DAMPER_COMPONENT);
  assert.deepEqual(tieEdit.component, REP4_DAMPER_COMPONENT);
  assert.deepEqual(
    baselineAuthority.damperChassisEyeWorld,
    tieEditAuthority.damperChassisEyeWorld,
  );
  assert.deepEqual(
    baselineAuthority.damperLowerEyeWorld,
    tieEditAuthority.damperLowerEyeWorld,
  );
  assert.deepEqual(baselineAuthority.twoArm, tieEditAuthority.twoArm);
  assert.deepEqual(
    baselineAuthority.uprightTiePickupWorld,
    tieEditAuthority.uprightTiePickupWorld,
  );

  const baselineTravel = distance(
    baseline.initial.uprightPositionWorld,
    baseline.final.uprightPositionWorld,
  );
  const tieEditTravel = distance(
    tieEdit.initial.uprightPositionWorld,
    tieEdit.final.uprightPositionWorld,
  );
  const baselineTwist = signedTwist(baseline.final.uprightRotation, baselineAuthority);
  const tieEditTwist = signedTwist(tieEdit.final.uprightRotation, tieEditAuthority);
  const twistSeparation = Math.abs(wrapRadians(tieEditTwist - baselineTwist));
  const travelDifference = Math.abs(tieEditTravel - baselineTravel);

  assert.ok(
    baselineTravel > TIE_OBSERVATION_MIN_TRAVEL && tieEditTravel > TIE_OBSERVATION_MIN_TRAVEL,
    `A5 tie observation did not reach representative compression: ${baselineTravel} / ${tieEditTravel} m`,
  );
  assert.ok(
    twistSeparation > TIE_TWIST_SEPARATION_MIN,
    `tie-only authored edit separated signed upright twist by only ${twistSeparation} rad`,
  );
  assert.ok(
    travelDifference < TIE_TRAVEL_CONFUND_MAX,
    `tie-only authored edit changed same-time suspension travel by ${travelDifference} m`,
  );
});

test("Rep4 A5 damper geometry produces a travel-dominant consequence with tie geometry held exact", async () => {
  const baselineAuthority = authority(0, "inner");
  const damperEditAuthority = authority(0, "outer");
  const [baseline, damperEdit] = await Promise.all([
    runRep4DamperedCornerProbe(baselineAuthority, "DAMPER", 120),
    runRep4DamperedCornerProbe(damperEditAuthority, "DAMPER", 120),
  ]);

  assert.deepEqual(baseline.component, REP4_DAMPER_COMPONENT);
  assert.deepEqual(damperEdit.component, REP4_DAMPER_COMPONENT);
  assert.deepEqual(baselineAuthority.twoArm, damperEditAuthority.twoArm);
  assert.deepEqual(
    baselineAuthority.chassisTiePointWorld,
    damperEditAuthority.chassisTiePointWorld,
  );
  assert.deepEqual(
    baselineAuthority.uprightTiePickupWorld,
    damperEditAuthority.uprightTiePickupWorld,
  );

  const travelSeparation = Math.abs(
    baseline.maxUprightDisplacement - damperEdit.maxUprightDisplacement,
  );
  assert.ok(
    travelSeparation > DAMPER_TRAVEL_SEPARATION_MIN,
    `damper-only authored edit separated max upright travel by only ${travelSeparation} m`,
  );
});
