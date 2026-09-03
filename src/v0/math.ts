import type { b3Quat, b3Vec3 } from "box3d.js";

export const vec3 = (x = 0, y = 0, z = 0): b3Vec3 => ({ x, y, z });

export const identityQuat = (): b3Quat => ({ v: vec3(), s: 1 });

export function rotateVector(q: b3Quat, v: b3Vec3): b3Vec3 {
  const tx = 2 * (q.v.y * v.z - q.v.z * v.y);
  const ty = 2 * (q.v.z * v.x - q.v.x * v.z);
  const tz = 2 * (q.v.x * v.y - q.v.y * v.x);
  return {
    x: v.x + q.s * tx + (q.v.y * tz - q.v.z * ty),
    y: v.y + q.s * ty + (q.v.z * tx - q.v.x * tz),
    z: v.z + q.s * tz + (q.v.x * ty - q.v.y * tx),
  };
}

export function headingRadians(rotation: b3Quat): number {
  const forward = rotateVector(rotation, vec3(1, 0, 0));
  return Math.atan2(forward.z, forward.x);
}
