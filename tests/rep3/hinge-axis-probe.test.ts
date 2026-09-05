import assert from "node:assert/strict";
import test from "node:test";
import { rotateVector, vec3 } from "../../src/v0/math.js";
import {
  quaternionFromLocalZToAxis,
  runRep3HingeAxisProbe,
} from "../../src/rep3/hinge-axis-probe.js";

const AXIS_ALIGNMENT_ERROR_MAX = 1e-6;
const PIVOT_SEPARATION_MAX = 1e-4;
const PATH_DRIFT_MAX = 2e-3;
const ANGULAR_OFF_AXIS_MAX = 2e-2;
const MATERIAL_ENDPOINT_MOTION_MIN = 2e-2;
const MATERIAL_AXIS_PATH_SEPARATION_MIN = 2e-2;

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function normalized(value: Readonly<{ x: number; y: number; z: number }>) {
  const length = Math.hypot(value.x, value.y, value.z);
  return vec3(value.x / length, value.y / length, value.z / length);
}

function assertProbeIntegrity(result: Awaited<ReturnType<typeof runRep3HingeAxisProbe>>) {
  assert.equal(result.substrate.box3dPackage, "box3d.js@0.0.2");
  assert.ok(
    result.nativeAxisAAlignmentError < AXIS_ALIGNMENT_ERROR_MAX,
    `native frame A axis alignment error ${result.nativeAxisAAlignmentError}`,
  );
  assert.ok(
    result.nativeAxisBAlignmentError < AXIS_ALIGNMENT_ERROR_MAX,
    `native frame B axis alignment error ${result.nativeAxisBAlignmentError}`,
  );
  assert.ok(
    result.nativePivotSeparation < PIVOT_SEPARATION_MAX,
    `native pivot separation ${result.nativePivotSeparation}`,
  );
  assert.ok(
    result.maxAxialCoordinateDrift < PATH_DRIFT_MAX,
    `endpoint axial-coordinate drift ${result.maxAxialCoordinateDrift}`,
  );
  assert.ok(
    result.maxRadialDistanceDrift < PATH_DRIFT_MAX,
    `endpoint radial-distance drift ${result.maxRadialDistanceDrift}`,
  );
  assert.ok(
    result.maxAngularVelocityOffAxis < ANGULAR_OFF_AXIS_MAX,
    `angular velocity off hinge axis ${result.maxAngularVelocityOffAxis}`,
  );
  assert.ok(
    result.endpointMotion > MATERIAL_ENDPOINT_MOTION_MIN,
    `endpoint motion ${result.endpointMotion}`,
  );
}

test("Rep3 frame helper maps local +Z onto arbitrary finite requested axes", () => {
  for (const requested of [
    vec3(0, 0, 1),
    normalized(vec3(0, 1, 1)),
    normalized(vec3(1, -2, 0.5)),
    vec3(0, 0, -1),
  ]) {
    const q = quaternionFromLocalZToAxis(requested);
    const mapped = normalized(rotateVector(q, vec3(0, 0, 1)));
    const target = normalized(requested);
    assert.ok(distance(mapped, target) < 1e-9, `${JSON.stringify({ requested, mapped })}`);
  }

  assert.throws(
    () => quaternionFromLocalZToAxis(vec3()),
    /finite non-zero span/,
  );
  assert.throws(
    () => quaternionFromLocalZToAxis(vec3(Number.NaN, 0, 1)),
    /must be finite/,
  );
});

test("Rep3 pinned substrate constrains a normal world-Z hinge around native readback frames", async () => {
  const result = await runRep3HingeAxisProbe(vec3(0, 0, 1));
  assertProbeIntegrity(result);

  // Rotation around world Z keeps the endpoint in the initial z=0 plane.
  assert.ok(Math.abs(result.final.endpointWorld.z) < PATH_DRIFT_MAX);
});

test("Rep3 pinned substrate constrains a materially tilted 3D hinge around the requested line", async () => {
  const requestedAxis = normalized(vec3(0, 1, 1));
  const result = await runRep3HingeAxisProbe(requestedAxis);
  assertProbeIntegrity(result);

  // A tilted Y/Z hinge rotates the +X arm into both Y and Z. This is a real
  // motion-plane consequence, not merely a quaternion/readback difference.
  assert.ok(
    Math.abs(result.final.endpointWorld.z) > MATERIAL_ENDPOINT_MOTION_MIN,
    `tilted hinge produced only z=${result.final.endpointWorld.z}`,
  );
});

test("Rep3 materially different hinge directions produce materially different live endpoint paths", async () => {
  const [baseline, tilted] = await Promise.all([
    runRep3HingeAxisProbe(vec3(0, 0, 1)),
    runRep3HingeAxisProbe(normalized(vec3(0, 1, 1))),
  ]);

  assertProbeIntegrity(baseline);
  assertProbeIntegrity(tilted);
  const separation = distance(baseline.final.endpointWorld, tilted.final.endpointWorld);
  assert.ok(
    separation > MATERIAL_AXIS_PATH_SEPARATION_MIN,
    `final endpoint separation only ${separation}`,
  );
});
