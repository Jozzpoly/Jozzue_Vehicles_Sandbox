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
