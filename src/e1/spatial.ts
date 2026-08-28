import type { E1Vec3 } from "./model.js";

const EPSILON = 1e-10;

export const e1Vec3 = (x: number, y: number, z: number): E1Vec3 => ({ x, y, z });

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
