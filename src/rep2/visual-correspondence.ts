import * as THREE from "three";
import type { Rep2BodyFrame, Rep2SuspensionTrace } from "./suspension-link-world.js";

const UP = new THREE.Vector3(0, 1, 0);
const LOCAL_START = new THREE.Vector3(0, -0.5, 0);
const LOCAL_END = new THREE.Vector3(0, 0.5, 0);

export interface Rep2VisualCorrespondenceSnapshot {
  readonly visualPivotWorld: Readonly<{ x: number; y: number; z: number }>;
  readonly visualArmStartWorld: Readonly<{ x: number; y: number; z: number }>;
  readonly visualArmEndWorld: Readonly<{ x: number; y: number; z: number }>;
  readonly visualWheelCenterWorld: Readonly<{ x: number; y: number; z: number }>;
  readonly pivotError: number;
  readonly armStartError: number;
  readonly armEndError: number;
  readonly wheelCenterError: number;
}

function vector(value: Readonly<{ x: number; y: number; z: number }>): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function point(value: THREE.Vector3): Readonly<{ x: number; y: number; z: number }> {
  return { x: value.x, y: value.y, z: value.z };
}

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function applyBodyFrame(object: THREE.Object3D, frame: Rep2BodyFrame): void {
  object.position.set(frame.position.x, frame.position.y, frame.position.z);
  object.quaternion.set(
    frame.rotation.v.x,
    frame.rotation.v.y,
    frame.rotation.v.z,
    frame.rotation.s,
  );
}

export function placeUnitYSegment(
  object: THREE.Object3D,
  start: Readonly<{ x: number; y: number; z: number }>,
  end: Readonly<{ x: number; y: number; z: number }>,
  radius = 1,
): void {
  const a = vector(start);
  const b = vector(end);
  const delta = b.clone().sub(a);
  const length = delta.length();
  if (!Number.isFinite(length) || length <= 1e-8) {
    throw new RangeError("Rep2 visual segment endpoints must define a finite non-zero span.");
  }
  object.position.copy(a).add(b).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(UP, delta.normalize());
  object.scale.set(radius, length, radius);
  object.updateMatrixWorld(true);
}

export function unitYSegmentWorldEndpoints(object: THREE.Object3D): {
  readonly start: Readonly<{ x: number; y: number; z: number }>;
  readonly end: Readonly<{ x: number; y: number; z: number }>;
} {
  object.updateMatrixWorld(true);
  return {
    start: point(LOCAL_START.clone().applyMatrix4(object.matrixWorld)),
    end: point(LOCAL_END.clone().applyMatrix4(object.matrixWorld)),
  };
}

export function measureRep2VisualCorrespondence(
  trace: Rep2SuspensionTrace,
  armObject: THREE.Object3D,
  pivotObject: THREE.Object3D,
  wheelObject: THREE.Object3D,
): Rep2VisualCorrespondenceSnapshot {
  armObject.updateMatrixWorld(true);
  pivotObject.updateMatrixWorld(true);
  wheelObject.updateMatrixWorld(true);

  const arm = unitYSegmentWorldEndpoints(armObject);
  const visualPivotWorld = point(pivotObject.getWorldPosition(new THREE.Vector3()));
  const visualWheelCenterWorld = point(wheelObject.getWorldPosition(new THREE.Vector3()));

  return {
    visualPivotWorld,
    visualArmStartWorld: arm.start,
    visualArmEndWorld: arm.end,
    visualWheelCenterWorld,
    pivotError: distance(visualPivotWorld, trace.hingeWorldFromArm),
    armStartError: distance(arm.start, trace.hingeWorldFromArm),
    armEndError: distance(arm.end, trace.wheelEndpointWorldFromArm),
    wheelCenterError: distance(visualWheelCenterWorld, trace.wheelCenterWorld),
  };
}
