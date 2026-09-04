import assert from "node:assert/strict";
import test from "node:test";
import Box3DFactory from "box3d.js/inline";
import type { Box3DModule, b3BodyId, b3WorldId } from "box3d.js";
import { identityQuat, vec3 } from "../../src/v0/math.js";

const DT = 1 / 240;
const CUSTOM_IZZ = 0.3266666667;
const TORQUE_Z = -20;
const EXPECTED_FREE_OMEGA_Z = (TORQUE_Z / CUSTOM_IZZ) * DT;

function diagonalMassData() {
  return {
    mass: 8,
    center: vec3(-0.35, 0, 0),
    inertia: {
      cx: vec3(0.01, 0, 0),
      cy: vec3(0, CUSTOM_IZZ, 0),
      cz: vec3(0, 0, CUSTOM_IZZ),
    },
  };
}

function createShapelessManualMassArm(b3: Box3DModule, worldId: b3WorldId): b3BodyId {
  const def = b3.b3DefaultBodyDef();
  def.type = b3.b3BodyType.b3_dynamicBody;
  def.enableSleep = false;
  const armId = b3.b3CreateBody(worldId, def);
  b3.b3Body_SetMassData(armId, diagonalMassData());
  return armId;
}

function createShapedArm(
  b3: Box3DModule,
  worldId: b3WorldId,
  overrideMass: boolean,
  refreshWorldInertia = false,
): b3BodyId {
  const def = b3.b3DefaultBodyDef();
  def.type = b3.b3BodyType.b3_dynamicBody;
  def.enableSleep = false;
  const armId = b3.b3CreateBody(worldId, def);
  const shapeDef = b3.b3DefaultShapeDef();
  shapeDef.density = 40;
  b3.b3CreateBoxShape(armId, shapeDef, 0.35, 0.04, 0.04);
  if (overrideMass) {
    b3.b3Body_SetMassData(armId, diagonalMassData());
    if (refreshWorldInertia) {
      b3.b3Body_SetTransform(
        armId,
        b3.b3Body_GetPosition(armId),
        b3.b3Body_GetRotation(armId),
      );
    }
  }
  return armId;
}

function createWorld(b3: Box3DModule): b3WorldId {
  const def = b3.b3DefaultWorldDef();
  def.gravity = vec3();
  return b3.b3CreateWorld(def);
}

function step(b3: Box3DModule, worldId: b3WorldId): void {
  b3.b3World_Step(worldId, DT, 1);
}

function attachRevolute(b3: Box3DModule, worldId: b3WorldId, armId: b3BodyId): void {
  const baseDef = b3.b3DefaultBodyDef();
  const baseId = b3.b3CreateBody(worldId, baseDef);
  const jointDef = b3.b3DefaultRevoluteJointDef();
  jointDef.base.bodyIdA = baseId;
  jointDef.base.bodyIdB = armId;
  jointDef.base.localFrameA = { p: vec3(), q: identityQuat() };
  jointDef.base.localFrameB = { p: vec3(), q: identityQuat() };
  b3.b3CreateRevoluteJoint(worldId, jointDef);
}

test("C0 pinned-engine characterization: SetMassData alone leaves force integration without the requested world inertia", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const shapeless = createShapelessManualMassArm(b3, worldId);
    b3.b3Body_ApplyTorque(shapeless, vec3(0, 0, TORQUE_Z), true);
    step(b3, worldId);
    const shapelessOmega = b3.b3Body_GetAngularVelocity(shapeless).z;
    assert.ok(
      Math.abs(shapelessOmega) < 1e-10,
      `expected pinned shapeless SetMassData path to retain zero world inverse inertia, got ${shapelessOmega}`,
    );

    b3.b3Body_ApplyAngularImpulse(shapeless, vec3(0, 0, -0.08), true);
    const afterImpulse = b3.b3Body_GetAngularVelocity(shapeless).z;
    assert.ok(
      Math.abs(afterImpulse) > 1e-4,
      `expected local custom inertia to remain usable by angular impulse, got ${afterImpulse}`,
    );
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 pinned-engine characterization: shaped SetMassData without refresh does not honor requested inertia quantitatively", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createShapedArm(b3, worldId, true, false);
    b3.b3Body_ApplyTorque(armId, vec3(0, 0, TORQUE_Z), true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId).z;
    assert.ok(
      Math.abs(omega - EXPECTED_FREE_OMEGA_Z) > Math.abs(EXPECTED_FREE_OMEGA_Z) * 0.5,
      `expected stale shape-derived world inertia before refresh; omega=${omega}, requested-model=${EXPECTED_FREE_OMEGA_Z}`,
    );
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 compatibility seam: no-op transform refresh makes torque honor the requested custom inertia", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createShapedArm(b3, worldId, true, true);
    b3.b3Body_ApplyTorque(armId, vec3(0, 0, TORQUE_Z), true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId).z;
    assert.ok(
      Math.abs(omega - EXPECTED_FREE_OMEGA_Z) < 2e-3,
      `expected Δω≈τ/I*dt after world-inertia refresh; omega=${omega}, expected=${EXPECTED_FREE_OMEGA_Z}`,
    );
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 compatibility seam: refreshed custom-mass revolute preserves torque on its free Z axis", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createShapedArm(b3, worldId, true, true);
    attachRevolute(b3, worldId, armId);

    b3.b3Body_ApplyTorque(armId, vec3(0, 0, TORQUE_Z), true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId).z;
    assert.ok(Math.abs(omega) > 1e-4 && Math.abs(omega) < 1, `unexpected refreshed revolute omega.z=${omega}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 compatibility seam: refreshed custom-mass revolute converts off-centre force into bounded angular response", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createShapedArm(b3, worldId, true, true);
    attachRevolute(b3, worldId, armId);

    b3.b3Body_ApplyForce(armId, vec3(0, 80, 0), { x: -0.25, y: 0, z: 0 }, true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId).z;
    assert.ok(Math.abs(omega) > 1e-4 && Math.abs(omega) < 1, `unexpected refreshed off-centre-force omega.z=${omega}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});
