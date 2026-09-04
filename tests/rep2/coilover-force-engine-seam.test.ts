import assert from "node:assert/strict";
import test from "node:test";
import Box3DFactory from "box3d.js/inline";
import type { Box3DModule, b3BodyId, b3WorldId } from "box3d.js";
import { identityQuat, vec3 } from "../../src/v0/math.js";

const DT = 1 / 240;

function diagonalMassData() {
  return {
    mass: 8,
    center: vec3(-0.35, 0, 0),
    inertia: {
      cx: vec3(0.01, 0, 0),
      cy: vec3(0, 0.3266666667, 0),
      cz: vec3(0, 0, 0.3266666667),
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
): b3BodyId {
  const def = b3.b3DefaultBodyDef();
  def.type = b3.b3BodyType.b3_dynamicBody;
  def.enableSleep = false;
  const armId = b3.b3CreateBody(worldId, def);
  const shapeDef = b3.b3DefaultShapeDef();
  shapeDef.density = 40;
  b3.b3CreateBoxShape(armId, shapeDef, 0.35, 0.04, 0.04);
  if (overrideMass) b3.b3Body_SetMassData(armId, diagonalMassData());
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

test("C0 pinned-engine characterization: shapeless manual-mass body misses accumulated torque integration", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createShapelessManualMassArm(b3, worldId);
    b3.b3Body_ApplyTorque(armId, vec3(0, 0, -20), true);
    step(b3, worldId);
    const afterTorqueStep = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(
      Math.abs(afterTorqueStep.z) < 1e-10,
      `expected pinned shapeless edge to reproduce zero accumulated-torque response, got ${JSON.stringify(afterTorqueStep)}`,
    );

    b3.b3Body_ApplyAngularImpulse(armId, vec3(0, 0, -0.08), true);
    const afterImpulse = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(
      Math.abs(afterImpulse.z) > 1e-4,
      `expected explicit inertia to remain usable by angular impulse, got ${JSON.stringify(afterImpulse)}`,
    );
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 engine seam: shaped body with shape-derived mass responds to a pure Z torque", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createShapedArm(b3, worldId, false);
    b3.b3Body_ApplyTorque(armId, vec3(0, 0, -20), true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(omega.z) > 1e-4, `expected shaped body omega.z, got ${JSON.stringify(omega)}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 engine seam: shaped body keeps accumulated-force integration after explicit SetMassData", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createShapedArm(b3, worldId, true);
    b3.b3Body_ApplyTorque(armId, vec3(0, 0, -20), true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(omega.z) > 1e-4, `expected shaped+manual-mass omega.z, got ${JSON.stringify(omega)}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 engine seam: shaped manual-mass revolute preserves torque on its documented free Z axis", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createShapedArm(b3, worldId, true);
    attachRevolute(b3, worldId, armId);

    b3.b3Body_ApplyTorque(armId, vec3(0, 0, -20), true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(omega.z) > 1e-4, `expected shaped revolute body omega.z, got ${JSON.stringify(omega)}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 engine seam: shaped manual-mass revolute responds to an off-centre force", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createShapedArm(b3, worldId, true);
    attachRevolute(b3, worldId, armId);

    b3.b3Body_ApplyForce(armId, vec3(0, 80, 0), { x: -0.25, y: 0, z: 0 }, true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(omega.z) > 1e-4, `expected shaped off-centre-force omega.z, got ${JSON.stringify(omega)}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});
