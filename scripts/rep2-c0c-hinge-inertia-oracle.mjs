import Box3DFactory from "box3d.js/inline";

const MASS = 8;
const ARM_LENGTH = 0.7;
const COM_X = -0.5 * ARM_LENGTH;
const I_COM_Z = (MASS * ARM_LENGTH * ARM_LENGTH) / 12;
const I_HINGE_ANALYTIC = I_COM_Z + MASS * COM_X * COM_X;
const TORQUE_Z = 10;
const DTS = [1 / 60, 1 / 120, 1 / 240, 1 / 480, 1 / 960, 1 / 1920, 1 / 3840];

function vec3(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

function identityQuat() {
  return { v: vec3(), s: 1 };
}

function diagonalMassData(mass, center, ix, iy, iz) {
  return {
    mass,
    center,
    inertia: {
      cx: vec3(ix, 0, 0),
      cy: vec3(0, iy, 0),
      cz: vec3(0, 0, iz),
    },
  };
}

async function run(dt, useInternalSubsteps = false) {
  const b3 = await Box3DFactory();
  const worldDef = b3.b3DefaultWorldDef();
  worldDef.gravity = vec3();
  const worldId = b3.b3CreateWorld(worldDef);

  try {
    const baseDef = b3.b3DefaultBodyDef();
    const baseId = b3.b3CreateBody(worldId, baseDef);

    const armDef = b3.b3DefaultBodyDef();
    armDef.type = b3.b3BodyType.b3_dynamicBody;
    armDef.enableSleep = false;
    const armId = b3.b3CreateBody(worldId, armDef);

    const shapeDef = b3.b3DefaultShapeDef();
    shapeDef.density = 1;
    b3.b3CreateBoxShape(armId, shapeDef, 0.02, 0.02, 0.02);

    const rodInertia = I_COM_Z;
    b3.b3Body_SetMassData(
      armId,
      diagonalMassData(
        MASS,
        vec3(COM_X, 0, 0),
        Math.max(0.002, 0.05 * rodInertia),
        rodInertia,
        rodInertia,
      ),
    );

    // Same pinned-engine compatibility refresh qualified in C0a.
    b3.b3Body_SetTransform(
      armId,
      b3.b3Body_GetPosition(armId),
      b3.b3Body_GetRotation(armId),
    );

    const hingeDef = b3.b3DefaultRevoluteJointDef();
    hingeDef.base.bodyIdA = baseId;
    hingeDef.base.bodyIdB = armId;
    hingeDef.base.localFrameA = { p: vec3(), q: identityQuat() };
    hingeDef.base.localFrameB = { p: vec3(), q: identityQuat() };
    hingeDef.base.collideConnected = false;
    b3.b3CreateRevoluteJoint(worldId, hingeDef);

    b3.b3Body_ApplyTorque(armId, vec3(0, 0, TORQUE_Z), true);
    if (useInternalSubsteps) {
      b3.b3World_Step(worldId, dt * 4, 4);
    } else {
      b3.b3World_Step(worldId, dt, 1);
    }

    const omegaZ = b3.b3Body_GetAngularVelocity(armId).z;
    const inferredInertia = (TORQUE_Z * dt) / omegaZ;
    return {
      dt,
      omegaZ,
      inferredInertia,
      relativeError: (inferredInertia - I_HINGE_ANALYTIC) / I_HINGE_ANALYTIC,
    };
  } finally {
    b3.b3DestroyWorld(worldId);
  }
}

const singleStep = [];
for (const dt of DTS) singleStep.push(await run(dt));

// Same total h=1/240 velocity microstep, but reached as one 1/60 outer step
// with four internal substeps. The external torque remains accumulated across
// all four substeps, matching the exact pinned semantics characterized by C0b.
const internalFour = await run(1 / 240, true);

console.log(
  `REP2_C0C_HINGE_INERTIA ${JSON.stringify({
    authored: {
      mass: MASS,
      armLength: ARM_LENGTH,
      comX: COM_X,
      inertiaComZ: I_COM_Z,
      parallelAxisHingeInertia: I_HINGE_ANALYTIC,
      torqueZ: TORQUE_Z,
    },
    singleStep,
    internalFour,
  })}`,
);
