import assert from "node:assert/strict";
import test from "node:test";
import type { b3Vec3 } from "box3d.js";
import {
  deriveRep4DamperRelation,
  runRep4DamperedCornerProbe,
  type Rep4DamperedCornerAuthority,
} from "../../src/rep4/dampered-corner-world.js";
import {
  projectRep4BuildFrame,
  projectRep4PlayFrame,
  rep4StageBSegmentLength,
} from "../../src/rep4/stage-b-projection.js";

const v = (x = 0, y = 0, z = 0): b3Vec3 => ({ x, y, z });

function fixture(): Rep4DamperedCornerAuthority {
  return {
    twoArm: {
      upper: {
        inboardAWorld: v(0, 0.42, -0.3),
        inboardBWorld: v(0, 0.42, 0.3),
        outboardWorld: v(0.72, 0.2, 0),
      },
      lower: {
        inboardAWorld: v(0, -0.42, -0.3),
        inboardBWorld: v(0, -0.42, 0.3),
        outboardWorld: v(0.76, -0.22, 0),
      },
    },
    chassisTiePointWorld: v(0.28, -0.1, 0.32),
    uprightTiePickupWorld: v(0.74, 0, 0.18),
    damperChassisEyeWorld: v(0.18, 0.13, 0),
    damperLowerEyeWorld: v(0.418, -0.31, 0),
  };
}

function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function assertPoint(actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }, tolerance = 1e-12): void {
  assert.ok(distance(actual, expected) <= tolerance, `point error ${distance(actual, expected)} exceeds ${tolerance}`);
}

test("Rep4 B1 BUILD projection uses authored mechanical hardpoints directly", () => {
  const authority = fixture();
  const frame = projectRep4BuildFrame(authority);

  assert.equal(frame.phase, "BUILD");
  assertPoint(frame.upperArm[0].a, authority.twoArm.upper.inboardAWorld);
  assertPoint(frame.upperArm[1].a, authority.twoArm.upper.inboardBWorld);
  assertPoint(frame.upperArm[0].b, authority.twoArm.upper.outboardWorld);
  assertPoint(frame.upperArm[1].b, authority.twoArm.upper.outboardWorld);
  assertPoint(frame.lowerArm[0].a, authority.twoArm.lower.inboardAWorld);
  assertPoint(frame.lowerArm[1].a, authority.twoArm.lower.inboardBWorld);
  assertPoint(frame.lowerArm[0].b, authority.twoArm.lower.outboardWorld);
  assertPoint(frame.lowerArm[1].b, authority.twoArm.lower.outboardWorld);
  assertPoint(frame.upright.a, authority.twoArm.upper.outboardWorld);
  assertPoint(frame.upright.b, authority.twoArm.lower.outboardWorld);
  assertPoint(frame.tie.a, authority.chassisTiePointWorld);
  assertPoint(frame.tie.b, authority.uprightTiePickupWorld);
  assertPoint(frame.damper.a, authority.damperChassisEyeWorld);
  assertPoint(frame.damper.b, authority.damperLowerEyeWorld);
  assert.equal(frame.upperBallConstraintGap, 0);
  assert.equal(frame.lowerBallConstraintGap, 0);
});

test("Rep4 B1 PLAY projection is an observer of the real native trace, including native link lengths", async () => {
  const authority = fixture();
  const result = await runRep4DamperedCornerProbe(authority, "DAMPER", 30);
  const snapshot = result.final;
  const frame = projectRep4PlayFrame(authority, result.derived, snapshot);

  assert.equal(frame.phase, "PLAY");
  assertPoint(frame.upperArm[0].b, snapshot.upperArmOutboardWorld);
  assertPoint(frame.lowerArm[0].b, snapshot.lowerArmOutboardWorld);
  assertPoint(frame.upright.a, snapshot.uprightUpperAnchorWorld);
  assertPoint(frame.upright.b, snapshot.uprightLowerAnchorWorld);
  assertPoint(frame.wheelCenter, snapshot.uprightPositionWorld);

  assert.ok(
    Math.abs(rep4StageBSegmentLength(frame.tie) - snapshot.tieCurrentLength) < 1e-4,
    "visible tie endpoints must reproduce the native current tie length",
  );
  assert.notEqual(snapshot.damperCurrentLength, null);
  assert.ok(
    Math.abs(rep4StageBSegmentLength(frame.damper) - snapshot.damperCurrentLength!) < 1e-5,
    "visible damper endpoints must reproduce the native current damper length",
  );

  const upperGap = distance(snapshot.upperArmOutboardWorld, snapshot.uprightUpperAnchorWorld);
  const lowerGap = distance(snapshot.lowerArmOutboardWorld, snapshot.uprightLowerAnchorWorld);
  assert.ok(Math.abs(frame.upperBallConstraintGap - upperGap) < 1e-12);
  assert.ok(Math.abs(frame.lowerBallConstraintGap - lowerGap) < 1e-12);
  assert.ok(frame.upperBallConstraintGap < 1e-3);
  assert.ok(frame.lowerBallConstraintGap < 1e-3);
});

test("Rep4 B1 refuses to draw a fake damper when the real damper relation is absent", async () => {
  const authority = fixture();
  const result = await runRep4DamperedCornerProbe(authority, "FREE", 10);
  const derived = deriveRep4DamperRelation(authority);
  assert.throws(
    () => projectRep4PlayFrame(authority, derived, result.final),
    /requires the real damper relation/,
  );
});
