import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthoredSteeringGeometry,
  solveSteeringOracle,
  straightTieRodLength,
} from "../../src/v0/steering-geometry.js";
import { PhysicalSteeringWorld } from "../../src/v0/physical-steering-world.js";

const baseline = () =>
  createAuthoredSteeringGeometry(
    { x: -0.18, z: 0 },
    { x: -0.18, z: 0 },
  );

async function runTrajectory(geometry: ReturnType<typeof baseline>) {
  const world = await PhysicalSteeringWorld.create(geometry);
  try {
    world.step(180);
    world.setDrive(0.38);
    world.step(90);
    world.setSteering(0.65);
    return world.step(300);
  } finally {
    world.dispose();
  }
}

test("R1 keeps left/right authored pickup vectors independent and auto-fits neutral tie-rods", () => {
  const geometry = createAuthoredSteeringGeometry(
    { x: -0.24, z: 0.06 },
    { x: -0.31, z: -0.04 },
  );
  const neutral = solveSteeringOracle(geometry, 0);
  assert.deepEqual(geometry.pickupLocal.LEFT, { x: -0.24, z: 0.06 });
  assert.deepEqual(geometry.pickupLocal.RIGHT, { x: -0.31, z: -0.04 });
  assert.equal(
    neutral.left.tieRodLength,
    straightTieRodLength(geometry, "LEFT"),
  );
  assert.equal(
    neutral.right.tieRodLength,
    straightTieRodLength(geometry, "RIGHT"),
  );
  assert.notEqual(neutral.left.tieRodLength, neutral.right.tieRodLength);
});

test("R1 neutral oracle is referenced to an authored non-axis pickup direction", () => {
  const radius = 0.24;
  const angle = Math.PI / 20;
  const geometry = createAuthoredSteeringGeometry(
    { x: -radius * Math.cos(angle), z: -radius * Math.sin(angle) },
    { x: -radius * Math.cos(angle), z: radius * Math.sin(angle) },
  );
  const neutral = solveSteeringOracle(geometry, 0);
  assert.ok(Math.abs(neutral.left.angleRadians) < 1e-10);
  assert.ok(Math.abs(neutral.right.angleRadians) < 1e-10);
});

test("R1 same-radius different-direction layouts separate physical response", async () => {
  const radius = 0.24;
  const angle = Math.PI / 20;
  const baselineGeometry = createAuthoredSteeringGeometry(
    { x: -radius, z: 0 },
    { x: -radius, z: 0 },
  );
  const directionalGeometry = createAuthoredSteeringGeometry(
    { x: -radius * Math.cos(angle), z: -radius * Math.sin(angle) },
    { x: -radius * Math.cos(angle), z: radius * Math.sin(angle) },
  );
  assert.equal(
    Math.hypot(directionalGeometry.pickupLocal.LEFT.x, directionalGeometry.pickupLocal.LEFT.z),
    Math.hypot(baselineGeometry.pickupLocal.LEFT.x, baselineGeometry.pickupLocal.LEFT.z),
  );
  assert.equal(
    Math.hypot(directionalGeometry.pickupLocal.RIGHT.x, directionalGeometry.pickupLocal.RIGHT.z),
    Math.hypot(baselineGeometry.pickupLocal.RIGHT.x, baselineGeometry.pickupLocal.RIGHT.z),
  );
  const baselineTrace = await runTrajectory(baselineGeometry);
  const directionalTrace = await runTrajectory(directionalGeometry);
  assert.ok(
    Math.abs(baselineTrace.curvature - directionalTrace.curvature) > 0.005,
    `expected direction edit to change curvature, got ${baselineTrace.curvature} vs ${directionalTrace.curvature}`,
  );
  assert.ok(
    Math.abs(baselineTrace.headingRadians - directionalTrace.headingRadians) > 0.05,
    `expected direction edit to change heading, got ${baselineTrace.headingRadians} vs ${directionalTrace.headingRadians}`,
  );
  assert.ok(
    Math.abs(baselineTrace.left.steeringAngle - directionalTrace.left.steeringAngle) > 0.01,
  );
});

test("R1 asymmetric authored edit changes only one pickup input and its physical response", async () => {
  const baselineGeometry = createAuthoredSteeringGeometry(
    { x: -0.24, z: 0 },
    { x: -0.24, z: 0 },
  );
  const asymmetricGeometry = createAuthoredSteeringGeometry(
    { x: -0.30, z: 0 },
    { x: -0.24, z: 0 },
  );
  assert.deepEqual(
    asymmetricGeometry.pickupLocal.RIGHT,
    baselineGeometry.pickupLocal.RIGHT,
  );
  const baselineTrace = await runTrajectory(baselineGeometry);
  const asymmetricTrace = await runTrajectory(asymmetricGeometry);
  assert.ok(
    Math.abs(baselineTrace.left.steeringAngle - asymmetricTrace.left.steeringAngle) > 0.03,
  );
  assert.equal(asymmetricTrace.linkage, "PHYSICAL");
});

test("R1 auto-fit length stays a physical fixed constraint after steering moves", async () => {
  const geometry = createAuthoredSteeringGeometry(
    { x: -0.23704520174283306, z: -0.03754427160965541 },
    { x: -0.23704520174283306, z: 0.03754427160965541 },
  );
  const world = await PhysicalSteeringWorld.create(geometry);
  try {
    world.step(180);
    const neutral = world.trace();
    world.setSteering(0.65);
    const driven = world.step(240);
    for (const trace of [neutral, driven]) {
      assert.ok(Math.abs((trace.left.tieRodCurrentLength ?? 0) - trace.left.tieRodLength) < 0.002);
      assert.ok(Math.abs((trace.right.tieRodCurrentLength ?? 0) - trace.right.tieRodLength) < 0.002);
    }
    assert.equal(driven.linkage, "PHYSICAL");
  } finally {
    world.dispose();
  }
});

test("R1 materially different authored layouts produce different physical trajectories", async () => {
  const short = await runTrajectory(baseline());
  const long = await runTrajectory(
    createAuthoredSteeringGeometry(
      { x: -0.30, z: 0 },
      { x: -0.30, z: 0 },
    ),
  );
  assert.equal(short.linkage, "PHYSICAL");
  assert.equal(long.linkage, "PHYSICAL");
  assert.ok(Math.abs(short.headingRadians - long.headingRadians) > 0.01);
  assert.ok(Math.abs(short.curvature - long.curvature) > 0.01);
  assert.ok(Math.abs((short.left.tieRodCurrentLength ?? 0) - short.left.tieRodLength) < 0.002);
  assert.ok(Math.abs((short.right.tieRodCurrentLength ?? 0) - short.right.tieRodLength) < 0.002);
});
