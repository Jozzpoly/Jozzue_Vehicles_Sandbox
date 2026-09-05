import type { b3Vec3 } from "box3d.js";
import type { Rep4DamperedCornerAuthority } from "./dampered-corner-world.js";

export type Rep4B2HardpointId = "upper-bearing-a" | "chassis-tie" | "damper-lower-eye";
export type Rep4B2HardpointClass = "bearing" | "tie" | "damper-eye";

export interface Rep4B2HardpointDescriptor {
  readonly id: Rep4B2HardpointId;
  readonly label: string;
  readonly mechanicalClass: Rep4B2HardpointClass;
}

export const REP4_B2_HARDPOINTS: readonly Rep4B2HardpointDescriptor[] = Object.freeze([
  Object.freeze({ id: "upper-bearing-a", label: "Upper arm bearing A", mechanicalClass: "bearing" }),
  Object.freeze({ id: "chassis-tie", label: "Chassis tie point", mechanicalClass: "tie" }),
  Object.freeze({ id: "damper-lower-eye", label: "Damper lower eye", mechanicalClass: "damper-eye" }),
]);

const clonePoint = (value: Readonly<b3Vec3>): b3Vec3 => ({ x: value.x, y: value.y, z: value.z });

function requireFinitePoint(value: Readonly<b3Vec3>, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must be finite.`);
  }
}

export function cloneRep4B2Authority(
  authority: Rep4DamperedCornerAuthority,
): Rep4DamperedCornerAuthority {
  return {
    twoArm: {
      upper: {
        inboardAWorld: clonePoint(authority.twoArm.upper.inboardAWorld),
        inboardBWorld: clonePoint(authority.twoArm.upper.inboardBWorld),
        outboardWorld: clonePoint(authority.twoArm.upper.outboardWorld),
      },
      lower: {
        inboardAWorld: clonePoint(authority.twoArm.lower.inboardAWorld),
        inboardBWorld: clonePoint(authority.twoArm.lower.inboardBWorld),
        outboardWorld: clonePoint(authority.twoArm.lower.outboardWorld),
      },
    },
    chassisTiePointWorld: clonePoint(authority.chassisTiePointWorld),
    uprightTiePickupWorld: clonePoint(authority.uprightTiePickupWorld),
    damperChassisEyeWorld: clonePoint(authority.damperChassisEyeWorld),
    damperLowerEyeWorld: clonePoint(authority.damperLowerEyeWorld),
  };
}

export function rep4B2Hardpoint(
  authority: Rep4DamperedCornerAuthority,
  id: Rep4B2HardpointId,
): b3Vec3 {
  switch (id) {
    case "upper-bearing-a":
      return clonePoint(authority.twoArm.upper.inboardAWorld);
    case "chassis-tie":
      return clonePoint(authority.chassisTiePointWorld);
    case "damper-lower-eye":
      return clonePoint(authority.damperLowerEyeWorld);
  }
}

export function withRep4B2Hardpoint(
  authority: Rep4DamperedCornerAuthority,
  id: Rep4B2HardpointId,
  nextPoint: Readonly<b3Vec3>,
): Rep4DamperedCornerAuthority {
  requireFinitePoint(nextPoint, `Rep4 B2 ${id}`);
  const value = clonePoint(nextPoint);
  const base = cloneRep4B2Authority(authority);

  switch (id) {
    case "upper-bearing-a":
      return {
        ...base,
        twoArm: {
          ...base.twoArm,
          upper: { ...base.twoArm.upper, inboardAWorld: value },
        },
      };
    case "chassis-tie":
      return { ...base, chassisTiePointWorld: value };
    case "damper-lower-eye":
      return { ...base, damperLowerEyeWorld: value };
  }
}
