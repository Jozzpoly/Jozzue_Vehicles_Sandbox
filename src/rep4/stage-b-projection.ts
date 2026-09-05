import type { b3Vec3 } from "box3d.js";
import { rotateVector, vec3 } from "../v0/math.js";
import type {
  Rep4DamperDerivedRelation,
  Rep4DamperedCornerAuthority,
  Rep4DamperedCornerSnapshot,
} from "./dampered-corner-world.js";

export interface Rep4StageBPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Rep4StageBSegment {
  readonly a: Rep4StageBPoint;
  readonly b: Rep4StageBPoint;
}

export interface Rep4StageBProjectionFrame {
  readonly phase: "BUILD" | "PLAY";
  readonly upperArm: readonly [Rep4StageBSegment, Rep4StageBSegment];
  readonly lowerArm: readonly [Rep4StageBSegment, Rep4StageBSegment];
  readonly upright: Rep4StageBSegment;
  readonly tie: Rep4StageBSegment;
  readonly damper: Rep4StageBSegment;
  readonly wheelCenter: Rep4StageBPoint;
  readonly upperBallConstraintGap: number;
  readonly lowerBallConstraintGap: number;
}

const point = (v: Readonly<b3Vec3>): Rep4StageBPoint => ({ x: v.x, y: v.y, z: v.z });
const add = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): b3Vec3 => vec3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): b3Vec3 => vec3(a.x - b.x, a.y - b.y, a.z - b.z);
const dist = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const midpoint = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): b3Vec3 => vec3(
  (a.x + b.x) * 0.5,
  (a.y + b.y) * 0.5,
  (a.z + b.z) * 0.5,
);
const segment = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): Rep4StageBSegment => ({ a: point(a), b: point(b) });

/**
 * BUILD projection is intentionally boring: every visible endpoint comes from
 * authored physical hardpoints. Derived hinge frames/solver coefficients are
 * not alternative visual authority.
 */
export function projectRep4BuildFrame(
  authority: Rep4DamperedCornerAuthority,
): Rep4StageBProjectionFrame {
  const upper = authority.twoArm.upper;
  const lower = authority.twoArm.lower;
  const wheelCenter = midpoint(upper.outboardWorld, lower.outboardWorld);

  return Object.freeze({
    phase: "BUILD",
    upperArm: Object.freeze([
      segment(upper.inboardAWorld, upper.outboardWorld),
      segment(upper.inboardBWorld, upper.outboardWorld),
    ] as const),
    lowerArm: Object.freeze([
      segment(lower.inboardAWorld, lower.outboardWorld),
      segment(lower.inboardBWorld, lower.outboardWorld),
    ] as const),
    upright: segment(upper.outboardWorld, lower.outboardWorld),
    tie: segment(authority.chassisTiePointWorld, authority.uprightTiePickupWorld),
    damper: segment(authority.damperChassisEyeWorld, authority.damperLowerEyeWorld),
    wheelCenter: point(wheelCenter),
    upperBallConstraintGap: 0,
    lowerBallConstraintGap: 0,
  });
}

/**
 * PLAY projection consumes only native observer state plus the neutral local
 * tie pickup derived by the same Stage-A authority path. It does not solve or
 * animate a second suspension model.
 *
 * Arm-side and upright-side spherical anchors are kept distinct so numerical
 * joint error is not silently hidden by inventing a visual midpoint.
 */
export function projectRep4PlayFrame(
  authority: Rep4DamperedCornerAuthority,
  derived: Rep4DamperDerivedRelation,
  snapshot: Rep4DamperedCornerSnapshot,
): Rep4StageBProjectionFrame {
  if (snapshot.damperChassisEyeWorld === null || snapshot.damperLowerEyeWorld === null) {
    throw new Error("Rep4 Stage B PLAY projection requires the real damper relation.");
  }

  const liveTiePickup = add(
    snapshot.uprightPositionWorld,
    rotateVector(snapshot.uprightRotation, derived.uprightTiePickupLocal),
  );

  return Object.freeze({
    phase: "PLAY",
    upperArm: Object.freeze([
      segment(authority.twoArm.upper.inboardAWorld, snapshot.upperArmOutboardWorld),
      segment(authority.twoArm.upper.inboardBWorld, snapshot.upperArmOutboardWorld),
    ] as const),
    lowerArm: Object.freeze([
      segment(authority.twoArm.lower.inboardAWorld, snapshot.lowerArmOutboardWorld),
      segment(authority.twoArm.lower.inboardBWorld, snapshot.lowerArmOutboardWorld),
    ] as const),
    upright: segment(snapshot.uprightUpperAnchorWorld, snapshot.uprightLowerAnchorWorld),
    tie: segment(authority.chassisTiePointWorld, liveTiePickup),
    damper: segment(snapshot.damperChassisEyeWorld, snapshot.damperLowerEyeWorld),
    wheelCenter: point(snapshot.uprightPositionWorld),
    upperBallConstraintGap: dist(snapshot.upperArmOutboardWorld, snapshot.uprightUpperAnchorWorld),
    lowerBallConstraintGap: dist(snapshot.lowerArmOutboardWorld, snapshot.uprightLowerAnchorWorld),
  });
}

export function rep4StageBSegmentLength(value: Rep4StageBSegment): number {
  return dist(value.a, value.b);
}

export function rep4StageBPointDelta(
  a: Rep4StageBPoint,
  b: Rep4StageBPoint,
): Rep4StageBPoint {
  return point(sub(a, b));
}
