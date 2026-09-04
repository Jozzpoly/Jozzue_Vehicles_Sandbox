import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  applyBodyFrame,
  measureRep2VisualCorrespondence,
  placeUnitYSegment,
  unitYSegmentWorldEndpoints,
} from "../../src/rep2/visual-correspondence.js";
import type { Rep2SuspensionTrace } from "../../src/rep2/suspension-link-world.js";

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

test("B1 the actual unit-Y segment transform reconstructs arbitrary 3D endpoints", () => {
  const cases = [
    [{ x: 0, y: 0, z: 0 }, { x: 1.2, y: -0.4, z: 0.7 }],
    [{ x: -3.5, y: 2.1, z: 1.4 }, { x: -3.4, y: 2.9, z: -1.1 }],
    [{ x: 0.42, y: -0.73, z: 2.6 }, { x: -1.7, y: -0.81, z: 2.55 }],
  ] as const;

  for (const [start, end] of cases) {
    const object = new THREE.Object3D();
    placeUnitYSegment(object, start, end, 0.043);
    const reconstructed = unitYSegmentWorldEndpoints(object);
    assert.ok(distance(reconstructed.start, start) < 1e-9);
    assert.ok(distance(reconstructed.end, end) < 1e-9);
  }
});

test("B2 correspondence measurement compares rendered objects only against live trace positions", () => {
  const trace = {
    step: 17,
    chassis: {
      position: { x: 1, y: 0.5, z: -0.2 },
      rotation: { v: { x: 0, y: 0, z: 0 }, s: 1 },
    },
    chassisVelocity: { x: 0, y: 0, z: 0 },
    arm: {
      position: { x: 0.3, y: 0.6, z: -0.7 },
      rotation: { v: { x: 0, y: 0, z: 0 }, s: 1 },
    },
    selectedWheel: {
      position: { x: -0.4, y: 0.32, z: -0.62 },
      rotation: { v: { x: 0, y: 0, z: 0 }, s: 1 },
    },
    oppositeRearWheel: {
      position: { x: -0.66, y: 0.32, z: 0.62 },
      rotation: { v: { x: 0, y: 0, z: 0 }, s: 1 },
    },
    hingeWorldFromChassis: { x: 0.2, y: 0.58, z: -0.62 },
    hingeWorldFromArm: { x: 0.2, y: 0.58, z: -0.62 },
    wheelEndpointWorldFromArm: { x: -0.4, y: 0.32, z: -0.62 },
    wheelCenterWorld: { x: -0.4, y: 0.32, z: -0.62 },
    oppositeRearAnchorWorld: { x: -0.66, y: 0.32, z: 0.62 },
    armLength: Math.hypot(0.6, 0.26),
    hingeAngle: 0.2,
    selectedWheelContacts: 1,
    worldContacts: 4,
    ownedBodyCount: 6,
    ownedJointCount: 5,
  } satisfies Rep2SuspensionTrace;

  const arm = new THREE.Object3D();
  const pivot = new THREE.Object3D();
  const wheel = new THREE.Object3D();
  placeUnitYSegment(arm, trace.hingeWorldFromArm, trace.wheelEndpointWorldFromArm, 0.045);
  pivot.position.set(
    trace.hingeWorldFromArm.x,
    trace.hingeWorldFromArm.y,
    trace.hingeWorldFromArm.z,
  );
  applyBodyFrame(wheel, trace.selectedWheel);

  const result = measureRep2VisualCorrespondence(trace, arm, pivot, wheel);
  assert.ok(result.pivotError < 1e-9);
  assert.ok(result.armStartError < 1e-9);
  assert.ok(result.armEndError < 1e-9);
  assert.ok(result.wheelCenterError < 1e-9);
});
