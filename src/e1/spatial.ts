import type { E1Pose, E1Quat, E1Vec3 } from "./model.js";

const EPSILON = 1e-10;

export const e1Vec3 = (x: number, y: number, z: number): E1Vec3 => ({ x, y, z });
export const e1Quat = (x: number, y: number, z: number, w: number): E1Quat => ({ x, y, z, w });
export const E1_IDENTITY_QUAT: E1Quat = e1Quat(0, 0, 0, 1);

export function add(a: E1Vec3, b: E1Vec3): E1Vec3 {
  return e1Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

export function subtract(a: E1Vec3, b: E1Vec3): E1Vec3 {
  return e1Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function scale(value: E1Vec3, scalar: number): E1Vec3 {
  return e1Vec3(value.x * scalar, value.y * scalar, value.z * scalar);
}

export function dot(a: E1Vec3, b: E1Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: E1Vec3, b: E1Vec3): E1Vec3 {
  return e1Vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

export function lengthSquared(value: E1Vec3): number {
  return dot(value, value);
}

export function length(value: E1Vec3): number {
  return Math.sqrt(lengthSquared(value));
}

export function distance(a: E1Vec3, b: E1Vec3): number {
  return length(subtract(a, b));
}

export function normalize(value: E1Vec3): E1Vec3 {
  const magnitude = length(value);
  if (magnitude <= EPSILON) {
    throw new Error("E1 axis or direction must have non-zero length.");
  }
  return scale(value, 1 / magnitude);
}

export function normalizeQuat(value: E1Quat): E1Quat {
  const magnitude = Math.hypot(value.x, value.y, value.z, value.w);
  if (magnitude <= EPSILON) {
    throw new Error("E1 rotation must have non-zero length.");
  }
  return e1Quat(value.x / magnitude, value.y / magnitude, value.z / magnitude, value.w / magnitude);
}

export function multiplyQuats(a: E1Quat, b: E1Quat): E1Quat {
  return normalizeQuat(e1Quat(
    a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  ));
}

export function conjugateQuat(value: E1Quat): E1Quat {
  return e1Quat(-value.x, -value.y, -value.z, value.w);
}

export function rotateByQuat(value: E1Vec3, rotation: E1Quat): E1Vec3 {
  const unit = normalizeQuat(rotation);
  const vectorQuat = e1Quat(value.x, value.y, value.z, 0);
  const left = {
    x: unit.w * vectorQuat.x + unit.x * vectorQuat.w + unit.y * vectorQuat.z - unit.z * vectorQuat.y,
    y: unit.w * vectorQuat.y - unit.x * vectorQuat.z + unit.y * vectorQuat.w + unit.z * vectorQuat.x,
    z: unit.w * vectorQuat.z + unit.x * vectorQuat.y - unit.y * vectorQuat.x + unit.z * vectorQuat.w,
    w: unit.w * vectorQuat.w - unit.x * vectorQuat.x - unit.y * vectorQuat.y - unit.z * vectorQuat.z,
  };
  const inverse = conjugateQuat(unit);
  return e1Vec3(
    left.w * inverse.x + left.x * inverse.w + left.y * inverse.z - left.z * inverse.y,
    left.w * inverse.y - left.x * inverse.z + left.y * inverse.w + left.z * inverse.x,
    left.w * inverse.z + left.x * inverse.y - left.y * inverse.x + left.z * inverse.w,
  );
}

export function quatFromAxisAngle(axis: E1Vec3, angleRad: number): E1Quat {
  const unit = normalize(axis);
  const half = angleRad / 2;
  const sine = Math.sin(half);
  return e1Quat(unit.x * sine, unit.y * sine, unit.z * sine, Math.cos(half));
}

export function quatFromUnitVectors(fromValue: E1Vec3, toValue: E1Vec3): E1Quat {
  const from = normalize(fromValue);
  const to = normalize(toValue);
  const cosine = dot(from, to);
  if (cosine < -1 + 1e-8) {
    const helper = Math.abs(from.x) < 0.8 ? e1Vec3(1, 0, 0) : e1Vec3(0, 1, 0);
    return quatFromAxisAngle(normalize(cross(from, helper)), Math.PI);
  }
  const axis = cross(from, to);
  return normalizeQuat(e1Quat(axis.x, axis.y, axis.z, 1 + cosine));
}

export function transformPoint(pose: E1Pose, localPoint: E1Vec3): E1Vec3 {
  return add(pose.position, rotateByQuat(localPoint, pose.rotation));
}

export function transformDirection(pose: E1Pose, localDirection: E1Vec3): E1Vec3 {
  return normalize(rotateByQuat(localDirection, pose.rotation));
}

export function rotateAroundAxis(
  value: E1Vec3,
  axis: E1Vec3,
  angleRad: number,
): E1Vec3 {
  const unitAxis = normalize(axis);
  const cosine = Math.cos(angleRad);
  const sine = Math.sin(angleRad);
  return add(
    add(scale(value, cosine), scale(cross(unitAxis, value), sine)),
    scale(unitAxis, dot(unitAxis, value) * (1 - cosine)),
  );
}

export function angularDistance(a: number, b: number): number {
  const wrapped = ((a - b + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return Math.abs(wrapped);
}

export function finiteVec3(value: E1Vec3): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

export function finiteQuat(value: E1Quat): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z) && Number.isFinite(value.w);
}
