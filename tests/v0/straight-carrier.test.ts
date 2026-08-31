import assert from "node:assert/strict";
import test from "node:test";
import {
  StraightCarrierWorld,
  V0_BOX3D_IDENTITY,
} from "../../src/v0/straight-carrier.js";

test("C0 pins the donor Box3D package identity", () => {
  assert.equal(V0_BOX3D_IDENTITY.version, "0.0.2");
  assert.equal(
    V0_BOX3D_IDENTITY.donorCommit,
    "98849cfe3263dca09e30fca8bb5a216c9924fff4",
  );
});

test("C0 carrier settles and drives straight without steering authority", async () => {
  const world = await StraightCarrierWorld.create();
  try {
    world.step(180);
    const settled = world.trace();
    assert.ok(settled.worldContacts >= 4);

    world.setDrive(0.45);
    const driven = world.step(240);
    assert.ok(driven.chassisPosition.x > settled.chassisPosition.x + 0.8);
    assert.ok(Math.abs(driven.headingRadians - settled.headingRadians) < 0.08);
    assert.ok(Math.abs(driven.chassisPosition.z - settled.chassisPosition.z) < 0.12);
    assert.ok(driven.worldContacts >= 4);
  } finally {
    world.dispose();
  }
});
