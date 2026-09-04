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

function createDynamicArm(b3: Box3DModule, worldId: b3WorldId): b3BodyId {
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

test("C0 engine seam: manual-mass shapeless body responds to a pure Z torque", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createDynamicArm(b3, worldId);
    b3.b3Body_ApplyTorque(armId, vec3(0, 0, -20), true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(omega.z) > 1e-4, `expected free body omega.z, got ${JSON.stringify(omega)}`);
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

test("C0 engine seam: shaped body keeps force integration after explicit SetMassData", async () => {
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

test("C0 engine seam: revolute preserves response to torque on its documented free Z axis", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createDynamicArm(b3, worldId);
    attachRevolute(b3, worldId, armId);

    b3.b3Body_ApplyTorque(armId, vec3(0, 0, -20), true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(omega.z) > 1e-4, `expected revolute body omega.z, got ${JSON.stringify(omega)}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 engine seam: shaped revolute responds to an off-centre force", async () => {
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

test("C0 engine seam: revolute responds to an off-centre force with nonzero hinge moment", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createDynamicArm(b3, worldId);
    attachRevolute(b3, worldId, armId);

    b3.b3Body_ApplyForce(armId, vec3(0, 80, 0), { x: -0.25, y: 0, z: 0 }, true);
    step(b3, worldId);
    const omega = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(omega.z) > 1e-4, `expected off-centre-force omega.z, got ${JSON.stringify(omega)}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 engine seam: manual-mass body responds immediately to an angular impulse", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createDynamicArm(b3, worldId);
    b3.b3Body_ApplyAngularImpulse(armId, vec3(0, 0, -0.08), true);
    const omega = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(omega.z) > 1e-4, `expected immediate angular-impulse omega.z, got ${JSON.stringify(omega)}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});

test("C0 engine seam: revolute retains point-impulse response on the free Z axis", async () => {
  const b3 = await Box3DFactory();
  const worldId = createWorld(b3);
  try {
    const armId = createDynamicArm(b3, worldId);
    attachRevolute(b3, worldId, armId);

    b3.b3Body_ApplyLinearImpulse(armId, vec3(0, 0.32, 0), { x: -0.25, y: 0, z: 0 }, true);
    const immediate = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(immediate.z) > 1e-4, `expected immediate point-impulse omega.z, got ${JSON.stringify(immediate)}`);

    step(b3, worldId);
    const afterConstraint = b3.b3Body_GetAngularVelocity(armId);
    assert.ok(Math.abs(afterConstraint.z) > 1e-4, `expected revolute to retain free-axis impulse response, got ${JSON.stringify(afterConstraint)}`);
  } finally {
    b3.b3DestroyWorld(worldId);
  }
});
