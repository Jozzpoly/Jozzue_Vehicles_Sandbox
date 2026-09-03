import assert from "node:assert/strict";
import test from "node:test";
import { PhysicalSteeringWorld } from "../../src/v0/physical-steering-world.js";

const degrees = (radians: number): number => (radians * 180) / Math.PI;

for (const variant of ["A", "B"] as const) {
  test(`C2 ${variant} rack drives only the physical linkage`, async () => {
    const world = await PhysicalSteeringWorld.create(variant);
    try {
      world.step(180);
      world.setSteering(1);
      const trace = world.step(240);
      assert.ok(Math.abs(trace.rackTrackingError) < 0.002);
      assert.ok(trace.rackLimitExcess < 0.0005);
      assert.ok(Math.abs(trace.left.oracleResidual) < 0.035);
      assert.ok(Math.abs(trace.right.oracleResidual) < 0.035);
      assert.ok(Math.abs(trace.left.tieRodError ?? 1) < 0.001);
      assert.ok(Math.abs(trace.right.tieRodError ?? 1) < 0.001);
      assert.ok(Math.abs(degrees(trace.left.steeringAngle)) > 8);
      assert.ok(Math.abs(degrees(trace.right.steeringAngle)) > 8);
      assert.equal(trace.left.contactCount, 1);
      assert.equal(trace.right.contactCount, 1);
    } finally {
      world.dispose();
    }
  });
}

test("C2 removed linkage leaves no substitute rack-to-wheel steering", async () => {
  const world = await PhysicalSteeringWorld.create("A", "REMOVED");
  try {
    world.step(180);
    world.setSteering(1);
    const trace = world.step(240);
    assert.ok(Math.abs(trace.rackTrackingError) < 0.002);
    assert.ok(trace.rackLimitExcess < 0.0005);
    assert.ok(Math.abs(trace.left.steeringAngle) < 0.02);
    assert.ok(Math.abs(trace.right.steeringAngle) < 0.02);
    assert.equal(trace.left.tieRodCurrentLength, null);
    assert.equal(trace.right.tieRodCurrentLength, null);
  } finally {
    world.dispose();
  }
});

test("C2 physical linkage is deterministic for the same rack trace", async () => {
  async function run() {
    const world = await PhysicalSteeringWorld.create("B");
    try {
      world.step(180);
      world.setSteering(-0.7);
      return world.step(180);
    } finally {
      world.dispose();
    }
  }
  const first = await run();
  const second = await run();
  assert.ok(Math.abs(first.rackTranslation - second.rackTranslation) < 1e-10);
  assert.ok(Math.abs(first.left.steeringAngle - second.left.steeringAngle) < 1e-10);
  assert.ok(Math.abs(first.right.steeringAngle - second.right.steeringAngle) < 1e-10);
});
