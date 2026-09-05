import assert from "node:assert/strict";
import test from "node:test";
import { vec3 } from "../../src/v0/math.js";
import {
  deriveRep3HingeRelation,
  REP3_STAGE_A_APPARATUS,
  runRep3GeometryDerivedHinge,
} from "../../src/rep3/geometry-derived-hinge-world.js";

const AXIS_ALIGNMENT_ERROR_MAX = 1e-6;
const PIVOT_ERROR_MAX = 1e-4;
const PATH_DRIFT_MAX = 2e-3;
const ANGULAR_OFF_AXIS_MAX = 2e-2;
const MATERIAL_ENDPOINT_MOTION_MIN = 2e-2;
const MATERIAL_PATH_SEPARATION_MIN = 2e-2;
const METAMORPHIC_PATH_SEPARATION_MAX = 5e-4;

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

function maxPathSeparation(
  a: readonly Readonly<{ x: number; y: number; z: number }>[],
  b: readonly Readonly<{ x: number; y: number; z: number }>[],
): number {
  assert.equal(a.length, b.length);
  let maximum = 0;
  for (let index = 0; index < a.length; index += 1) {
    maximum = Math.max(maximum, distance(a[index]!, b[index]!));
  }
  return maximum;
}

function assertStageAIntegrity(
  result: Awaited<ReturnType<typeof runRep3GeometryDerivedHinge>>,
) {
  assert.equal(result.apparatus.box3dPackage, "box3d.js@0.0.2");
  assert.deepEqual(result.final.nativeBodyA, result.final.expectedSupportBody);
  assert.deepEqual(result.final.nativeBodyB, result.final.expectedArmBody);
  assert.ok(
    result.nativeAxisAAlignmentError < AXIS_ALIGNMENT_ERROR_MAX,
    `native frame A axis alignment error ${result.nativeAxisAAlignmentError}`,
  );
  assert.ok(
    result.nativeAxisBAlignmentError < AXIS_ALIGNMENT_ERROR_MAX,
    `native frame B axis alignment error ${result.nativeAxisBAlignmentError}`,
  );
  assert.ok(
    result.nativePivotAError < PIVOT_ERROR_MAX,
    `native pivot A error ${result.nativePivotAError}`,
  );
  assert.ok(
    result.nativePivotBError < PIVOT_ERROR_MAX,
    `native pivot B error ${result.nativePivotBError}`,
  );
  assert.ok(
    result.nativePivotSeparation < PIVOT_ERROR_MAX,
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

test("Rep3 A1 derives the sole hinge line from physical mounts and reads the same native authority back", async () => {
  const mountAWorld = vec3(0.25, -0.1, -0.45);
  const mountBWorld = vec3(0.25, -0.1, 0.35);
  const result = await runRep3GeometryDerivedHinge({ mountAWorld, mountBWorld });
  assertStageAIntegrity(result);

  assert.deepEqual(Object.keys(result.authority).sort(), ["mountAWorld", "mountBWorld"]);
  assert.ok(distance(result.derived.pivotWorld, vec3(0.25, -0.1, -0.05)) < 1e-12);
  assert.ok(distance(result.derived.axisWorld, vec3(0, 0, 1)) < 1e-12);
  assert.ok(Math.abs(result.derived.mountSpan - 0.8) < 1e-12);
});

test("Rep3 A2 materially different mount-line direction changes the real endpoint motion plane", async () => {
  const midpoint = vec3(0.2, 0.1, -0.15);
  const halfSpan = 0.4;
  const tilted = normalized(vec3(0, 1, 1));

  const [worldZ, tiltedAxis] = await Promise.all([
    runRep3GeometryDerivedHinge({
      mountAWorld: vec3(midpoint.x, midpoint.y, midpoint.z - halfSpan),
      mountBWorld: vec3(midpoint.x, midpoint.y, midpoint.z + halfSpan),
    }),
    runRep3GeometryDerivedHinge({
      mountAWorld: vec3(
        midpoint.x - tilted.x * halfSpan,
        midpoint.y - tilted.y * halfSpan,
        midpoint.z - tilted.z * halfSpan,
      ),
      mountBWorld: vec3(
        midpoint.x + tilted.x * halfSpan,
        midpoint.y + tilted.y * halfSpan,
        midpoint.z + tilted.z * halfSpan,
      ),
    }),
  ]);

  assertStageAIntegrity(worldZ);
  assertStageAIntegrity(tiltedAxis);
  assert.ok(distance(worldZ.initial.endpointWorld, tiltedAxis.initial.endpointWorld) < 1e-12);

  const finalSeparation = distance(worldZ.final.endpointWorld, tiltedAxis.final.endpointWorld);
  assert.ok(
    finalSeparation > MATERIAL_PATH_SEPARATION_MIN,
    `different mount directions separated final endpoint by only ${finalSeparation}`,
  );

  assert.ok(
    Math.abs(worldZ.final.endpointWorld.z - midpoint.z) < PATH_DRIFT_MAX,
    `world-Z hinge escaped expected motion plane by ${worldZ.final.endpointWorld.z - midpoint.z}`,
  );
  assert.ok(
    Math.abs(tiltedAxis.final.endpointWorld.z - midpoint.z) > MATERIAL_ENDPOINT_MOTION_MIN,
    `tilted mount line produced only z delta ${tiltedAxis.final.endpointWorld.z - midpoint.z}`,
  );
});

test("Rep3 A3 line-preserving mount spacing is kinematically equivalent in the ideal rigid-hinge apparatus", async () => {
  const midpoint = vec3(-0.1, 0.2, 0.05);
  const [shortSpan, longSpan] = await Promise.all([
    runRep3GeometryDerivedHinge({
      mountAWorld: vec3(midpoint.x, midpoint.y, midpoint.z - 0.15),
      mountBWorld: vec3(midpoint.x, midpoint.y, midpoint.z + 0.15),
    }),
    runRep3GeometryDerivedHinge({
      mountAWorld: vec3(midpoint.x, midpoint.y, midpoint.z - 0.55),
      mountBWorld: vec3(midpoint.x, midpoint.y, midpoint.z + 0.55),
    }),
  ]);

  assertStageAIntegrity(shortSpan);
  assertStageAIntegrity(longSpan);
  assert.ok(Math.abs(shortSpan.derived.mountSpan - longSpan.derived.mountSpan) > 0.5);

  const separation = maxPathSeparation(shortSpan.endpointPath, longSpan.endpointPath);
  assert.ok(
    separation < METAMORPHIC_PATH_SEPARATION_MAX,
    `line-preserving spacing changed endpoint trajectory by ${separation}`,
  );
});

test("Rep3 A4 swapping mount labels does not create hidden free-hinge mechanical authority", async () => {
  const mountAWorld = vec3(0.05, -0.3, -0.45);
  const mountBWorld = vec3(0.05, 0.3, 0.15);
  const [forward, swapped] = await Promise.all([
    runRep3GeometryDerivedHinge({ mountAWorld, mountBWorld }),
    runRep3GeometryDerivedHinge({ mountAWorld: mountBWorld, mountBWorld: mountAWorld }),
  ]);

  assertStageAIntegrity(forward);
  assertStageAIntegrity(swapped);
  assert.ok(
    distance(forward.derived.axisWorld, vec3(
      -swapped.derived.axisWorld.x,
      -swapped.derived.axisWorld.y,
      -swapped.derived.axisWorld.z,
    )) < 1e-12,
  );

  const separation = maxPathSeparation(forward.endpointPath, swapped.endpointPath);
  assert.ok(
    separation < METAMORPHIC_PATH_SEPARATION_MAX,
    `mount endpoint order changed free-hinge trajectory by ${separation}`,
  );
});

test("Rep3 A5 rejects coincident, near-coincident, and non-finite mount authority instead of inventing an axis", async () => {
  const minSpan = REP3_STAGE_A_APPARATUS.minMountSpan;

  assert.throws(
    () => deriveRep3HingeRelation({
      mountAWorld: vec3(1, 2, 3),
      mountBWorld: vec3(1, 2, 3),
    }),
    /must span more than/,
  );
  assert.throws(
    () => deriveRep3HingeRelation({
      mountAWorld: vec3(),
      mountBWorld: vec3(0.5 * minSpan, 0, 0),
    }),
    /must span more than/,
  );
  assert.throws(
    () => deriveRep3HingeRelation({
      mountAWorld: vec3(Number.NaN, 0, 0),
      mountBWorld: vec3(0, 0, 1),
    }),
    /must be finite/,
  );
  assert.throws(
    () => deriveRep3HingeRelation({
      mountAWorld: vec3(0, 0, 0),
      mountBWorld: vec3(0, Number.POSITIVE_INFINITY, 1),
    }),
    /must be finite/,
  );

  await assert.rejects(
    runRep3GeometryDerivedHinge({
      mountAWorld: vec3(),
      mountBWorld: vec3(0, 0, minSpan),
    }),
    /must span more than/,
  );
});
