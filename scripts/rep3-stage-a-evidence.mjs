import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveRep3HingeRelation,
  REP3_STAGE_A_APPARATUS,
  runRep3GeometryDerivedHinge,
} from "../.e1-test-build/src/rep3/geometry-derived-hinge-world.js";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const outputPath = resolve(
  repositoryRoot,
  process.argv[2] ?? "artifacts/rep3-stage-a-geometry-derived-hinge.json",
);

function vec3(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

function normalize(value) {
  const length = Math.hypot(value.x, value.y, value.z);
  return { x: value.x / length, y: value.y / length, z: value.z / length };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function maxPathSeparation(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Rep3 Stage A path sample count mismatch: ${a.length} vs ${b.length}`);
  }
  let maximum = 0;
  for (let index = 0; index < a.length; index += 1) {
    maximum = Math.max(maximum, distance(a[index], b[index]));
  }
  return maximum;
}

function sameId(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function rejectionReceipt(label, authority) {
  try {
    deriveRep3HingeRelation(authority);
    return { label, rejected: false, message: null };
  } catch (error) {
    return {
      label,
      rejected: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// A1 — native authority correspondence from two physical mounts only.
const a1 = await runRep3GeometryDerivedHinge({
  mountAWorld: vec3(0.25, -0.1, -0.45),
  mountBWorld: vec3(0.25, -0.1, 0.35),
});

// A2 — same midpoint/start/apparatus/load, materially different mount direction.
const a2Midpoint = vec3(0.2, 0.1, -0.15);
const a2HalfSpan = 0.4;
const a2Tilted = normalize(vec3(0, 1, 1));
const [a2WorldZ, a2TiltedAxis] = await Promise.all([
  runRep3GeometryDerivedHinge({
    mountAWorld: vec3(a2Midpoint.x, a2Midpoint.y, a2Midpoint.z - a2HalfSpan),
    mountBWorld: vec3(a2Midpoint.x, a2Midpoint.y, a2Midpoint.z + a2HalfSpan),
  }),
  runRep3GeometryDerivedHinge({
    mountAWorld: vec3(
      a2Midpoint.x - a2Tilted.x * a2HalfSpan,
      a2Midpoint.y - a2Tilted.y * a2HalfSpan,
      a2Midpoint.z - a2Tilted.z * a2HalfSpan,
    ),
    mountBWorld: vec3(
      a2Midpoint.x + a2Tilted.x * a2HalfSpan,
      a2Midpoint.y + a2Tilted.y * a2HalfSpan,
      a2Midpoint.z + a2Tilted.z * a2HalfSpan,
    ),
  }),
]);

// A3 — same midpoint/line direction with materially different bearing spacing.
const a3Midpoint = vec3(-0.1, 0.2, 0.05);
const [a3Short, a3Long] = await Promise.all([
  runRep3GeometryDerivedHinge({
    mountAWorld: vec3(a3Midpoint.x, a3Midpoint.y, a3Midpoint.z - 0.15),
    mountBWorld: vec3(a3Midpoint.x, a3Midpoint.y, a3Midpoint.z + 0.15),
  }),
  runRep3GeometryDerivedHinge({
    mountAWorld: vec3(a3Midpoint.x, a3Midpoint.y, a3Midpoint.z - 0.55),
    mountBWorld: vec3(a3Midpoint.x, a3Midpoint.y, a3Midpoint.z + 0.55),
  }),
]);

// A4 — identical physical endpoints, labels swapped.
const a4MountA = vec3(0.05, -0.3, -0.45);
const a4MountB = vec3(0.05, 0.3, 0.15);
const [a4Forward, a4Swapped] = await Promise.all([
  runRep3GeometryDerivedHinge({ mountAWorld: a4MountA, mountBWorld: a4MountB }),
  runRep3GeometryDerivedHinge({ mountAWorld: a4MountB, mountBWorld: a4MountA }),
]);
const reversedA4Axis = vec3(
  -a4Swapped.derived.axisWorld.x,
  -a4Swapped.derived.axisWorld.y,
  -a4Swapped.derived.axisWorld.z,
);

// A5 — explicit singularity rejection receipts. These cases are also hard-gated
// by source tests; this artifact records exactly what was rejected and why.
const minSpan = REP3_STAGE_A_APPARATUS.minMountSpan;
const a5 = [
  rejectionReceipt("coincident", {
    mountAWorld: vec3(1, 2, 3),
    mountBWorld: vec3(1, 2, 3),
  }),
  rejectionReceipt("near-coincident", {
    mountAWorld: vec3(),
    mountBWorld: vec3(0.5 * minSpan, 0, 0),
  }),
  rejectionReceipt("non-finite-A", {
    mountAWorld: vec3(Number.NaN, 0, 0),
    mountBWorld: vec3(0, 0, 1),
  }),
  rejectionReceipt("non-finite-B", {
    mountAWorld: vec3(),
    mountBWorld: vec3(0, Number.POSITIVE_INFINITY, 1),
  }),
];

const evidence = Object.freeze({
  schema: "rep3-stage-a-geometry-derived-hinge-v1",
  generatedAt: new Date().toISOString(),
  claimBoundary:
    "Rep3 Stage A bounded technical authority/metamorphism evidence only; no Stage B, Owner, product, vehicle or architecture PASS.",
  apparatus: REP3_STAGE_A_APPARATUS,
  a1: {
    authorityKeys: Object.keys(a1.authority).sort(),
    authority: a1.authority,
    derived: a1.derived,
    nativeBodiesMatchExpected:
      sameId(a1.final.nativeBodyA, a1.final.expectedSupportBody) &&
      sameId(a1.final.nativeBodyB, a1.final.expectedArmBody),
    nativeAxisAAlignmentError: a1.nativeAxisAAlignmentError,
    nativeAxisBAlignmentError: a1.nativeAxisBAlignmentError,
    nativePivotAError: a1.nativePivotAError,
    nativePivotBError: a1.nativePivotBError,
    nativePivotSeparation: a1.nativePivotSeparation,
    endpointMotion: a1.endpointMotion,
    maxAxialCoordinateDrift: a1.maxAxialCoordinateDrift,
    maxRadialDistanceDrift: a1.maxRadialDistanceDrift,
    maxAngularVelocityOffAxis: a1.maxAngularVelocityOffAxis,
  },
  a2: {
    midpoint: a2Midpoint,
    worldZDerivedAxis: a2WorldZ.derived.axisWorld,
    tiltedDerivedAxis: a2TiltedAxis.derived.axisWorld,
    initialEndpointSeparation: distance(
      a2WorldZ.initial.endpointWorld,
      a2TiltedAxis.initial.endpointWorld,
    ),
    finalEndpointSeparation: distance(
      a2WorldZ.final.endpointWorld,
      a2TiltedAxis.final.endpointWorld,
    ),
    maxPathSeparation: maxPathSeparation(a2WorldZ.endpointPath, a2TiltedAxis.endpointPath),
    worldZFinalZDeltaFromMidpoint: a2WorldZ.final.endpointWorld.z - a2Midpoint.z,
    tiltedFinalZDeltaFromMidpoint: a2TiltedAxis.final.endpointWorld.z - a2Midpoint.z,
    worldZEndpointMotion: a2WorldZ.endpointMotion,
    tiltedEndpointMotion: a2TiltedAxis.endpointMotion,
  },
  a3: {
    shortMountSpan: a3Short.derived.mountSpan,
    longMountSpan: a3Long.derived.mountSpan,
    mountSpanDifference: Math.abs(a3Short.derived.mountSpan - a3Long.derived.mountSpan),
    initialEndpointSeparation: distance(
      a3Short.initial.endpointWorld,
      a3Long.initial.endpointWorld,
    ),
    finalEndpointSeparation: distance(
      a3Short.final.endpointWorld,
      a3Long.final.endpointWorld,
    ),
    maxPathSeparation: maxPathSeparation(a3Short.endpointPath, a3Long.endpointPath),
  },
  a4: {
    forwardAxis: a4Forward.derived.axisWorld,
    swappedAxis: a4Swapped.derived.axisWorld,
    axisOppositionError: distance(a4Forward.derived.axisWorld, reversedA4Axis),
    initialEndpointSeparation: distance(
      a4Forward.initial.endpointWorld,
      a4Swapped.initial.endpointWorld,
    ),
    finalEndpointSeparation: distance(
      a4Forward.final.endpointWorld,
      a4Swapped.final.endpointWorld,
    ),
    maxPathSeparation: maxPathSeparation(a4Forward.endpointPath, a4Swapped.endpointPath),
  },
  a5,
});

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify(evidence, null, 2));
