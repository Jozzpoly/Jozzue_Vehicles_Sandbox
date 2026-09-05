import Box3DFactory from "box3d.js/inline";
import type {
  Box3DModule,
  b3BodyId,
  b3JointId,
  b3Quat,
  b3Vec3,
  b3WorldId,
} from "box3d.js";
import { identityQuat, vec3 } from "../v0/math.js";

const STEP_DT = 1 / 60;
const SUBSTEPS = 4;
const ARM_MASS = 8;
const ARM_LENGTH = 0.7;
const INITIAL_ARM_ANGLE = 0.08;
const SOLVER_EXTENT_HALF = 0.02;
const MIN_EYE_SEPARATION = 1e-6;

export const C1_NATIVE_SUBSTRATE = Object.freeze({
  timeStep: STEP_DT,
  substeps: SUBSTEPS,
  armMass: ARM_MASS,
  armLength: ARM_LENGTH,
  initialArmAngle: INITIAL_ARM_ANGLE,
  mappingPolicy: "axial-once-at-initial-state" as const,
});

export const C1_NATIVE_COMPONENT = Object.freeze({
  springStiffness: 900,
  dampingCoefficient: 18,
  restLength: 0.5,
} as const);

export const C1_NATIVE_GEOMETRIES = Object.freeze({
  baseline: Object.freeze({ attachmentRadius: 0.35 }),
  "half-radius": Object.freeze({ attachmentRadius: 0.175 }),
} as const);

export type C1NativeGeometryId = keyof typeof C1_NATIVE_GEOMETRIES;

export interface C1SerializableBodyId {
  readonly index1: number;
  readonly world0: number;
  readonly generation: number;
}

export interface C1NativeAuthority {
  readonly relationId: string;
  readonly geometryId: C1NativeGeometryId;
  readonly bodyA: Readonly<{
    identity: "fixed-base";
    solverId: C1SerializableBodyId;
    eyeLocal: Readonly<b3Vec3>;
  }>;
  readonly bodyB: Readonly<{
    identity: "hinged-arm";
    solverId: C1SerializableBodyId;
    eyeLocal: Readonly<b3Vec3>;
  }>;
  readonly component: Readonly<{
    springStiffness: number;
    dampingCoefficient: number;
    restLength: number;
  }>;
}

export interface C1NativeDamperSnapshot {
  readonly relationId: string;
  readonly geometryId: C1NativeGeometryId;
  readonly step: number;
  readonly bodyAIdentity: "fixed-base";
  readonly bodyBIdentity: "hinged-arm";
  readonly bodyASolverId: C1SerializableBodyId;
  readonly bodyBSolverId: C1SerializableBodyId;
  readonly eyeALocal: b3Vec3;
  readonly eyeBLocal: b3Vec3;
  readonly eyeAWorld: b3Vec3;
  readonly eyeBWorld: b3Vec3;
  readonly hingeWorld: b3Vec3;
  readonly hingeAngle: number;
  readonly armAngularVelocityZ: number;
  readonly currentLength: number;
  readonly nativeCurrentLength: number;
  readonly nativeRestLength: number;
  readonly nativeSpringEnabled: boolean;
  readonly nativeSpringHertz: number;
  readonly nativeSpringDampingRatio: number;
  readonly nativeBodyASolverId: C1SerializableBodyId;
  readonly nativeBodyBSolverId: C1SerializableBodyId;
  readonly nativeEyeALocal: b3Vec3;
  readonly nativeEyeBLocal: b3Vec3;
  readonly extension: number;
  readonly nativeConstraintForce: b3Vec3;
  readonly nativeAxialForce: number;
  readonly springStiffness: number;
  readonly dampingCoefficient: number;
  readonly restLength: number;
  readonly mappingPolicy: "axial-once-at-initial-state";
  readonly appliedInitialHertz: number;
  readonly appliedInitialDampingRatio: number;
  readonly appliedInitialAxialMass: number;
  readonly substrate: typeof C1_NATIVE_SUBSTRATE;
}

function clonePoint(value: Readonly<b3Vec3>): b3Vec3 {
  return vec3(value.x, value.y, value.z);
}

function cloneBodyId(value: b3BodyId): C1SerializableBodyId {
  return Object.freeze({
    index1: value.index1,
    world0: value.world0,
    generation: value.generation,
  });
}

function subtract(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): b3Vec3 {
  return vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

function scale(value: Readonly<b3Vec3>, scalar: number): b3Vec3 {
  return vec3(value.x * scalar, value.y * scalar, value.z * scalar);
}

function dot(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): b3Vec3 {
  return vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

function length(value: Readonly<b3Vec3>): number {
  return Math.hypot(value.x, value.y, value.z);
}

function normalize(value: Readonly<b3Vec3>): b3Vec3 {
  const magnitude = length(value);
  if (!Number.isFinite(magnitude) || magnitude <= MIN_EYE_SEPARATION) {
    throw new RangeError("Rep2 C1 native spring eyes must define a finite non-zero span.");
  }
  return scale(value, 1 / magnitude);
}

function rotateZ(value: Readonly<b3Vec3>, angle: number): b3Vec3 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return vec3(
    cosine * value.x - sine * value.y,
    sine * value.x + cosine * value.y,
    value.z,
  );
}

function quatAboutZ(angle: number): b3Quat {
  const half = 0.5 * angle;
  return { v: vec3(0, 0, Math.sin(half)), s: Math.cos(half) };
}

function diagonalMassData(
  mass: number,
  center: b3Vec3,
  ix: number,
  iy: number,
  iz: number,
) {
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

function axialMapping(
  eyeALocal: Readonly<b3Vec3>,
  eyeBLocal: Readonly<b3Vec3>,
  component: typeof C1_NATIVE_COMPONENT,
): Readonly<{
  hertz: number;
  dampingRatio: number;
  axialMass: number;
}> {
  const inertiaComZ = (ARM_MASS * ARM_LENGTH * ARM_LENGTH) / 12;
  const centerOfMassLocal = vec3(-0.5 * ARM_LENGTH, 0, 0);
  const eyeAWorld = eyeALocal;
  const eyeBWorld = rotateZ(eyeBLocal, INITIAL_ARM_ANGLE);
  const axis = normalize(subtract(eyeBWorld, eyeAWorld));
  const eyeBLeverFromCom = rotateZ(
    subtract(eyeBLocal, centerOfMassLocal),
    INITIAL_ARM_ANGLE,
  );
  const rotationalJacobian = cross(eyeBLeverFromCom, axis).z;
  const inverseAxialMass =
    1 / ARM_MASS + (rotationalJacobian * rotationalJacobian) / inertiaComZ;
  const axialMass = 1 / inverseAxialMass;
  if (!Number.isFinite(axialMass) || axialMass <= 0) {
    throw new RangeError("Rep2 C1 native spring axial mass must be finite and positive.");
  }
  const omega = Math.sqrt(component.springStiffness / axialMass);
  return Object.freeze({
    hertz: omega / (2 * Math.PI),
    dampingRatio:
      component.dampingCoefficient /
      (2 * Math.sqrt(component.springStiffness * axialMass)),
    axialMass,
  });
}

export class C1NativeDamperWorld {
  readonly #b3: Box3DModule;
  readonly #worldId: b3WorldId;
  readonly #bodyAId: b3BodyId;
  readonly #bodyBId: b3BodyId;
  readonly #hingeId: b3JointId;
  readonly #distanceId: b3JointId;
  readonly #mapping: ReturnType<typeof axialMapping>;
  readonly #authority: C1NativeAuthority;
  #step = 0;
  #disposed = false;

  static async create(
    geometryId: C1NativeGeometryId = "baseline",
  ): Promise<C1NativeDamperWorld> {
    if (!(geometryId in C1_NATIVE_GEOMETRIES)) {
      throw new RangeError(`Unknown Rep2 C1 geometry ${String(geometryId)}.`);
    }
    return new C1NativeDamperWorld(await Box3DFactory(), geometryId);
  }

  private constructor(b3: Box3DModule, geometryId: C1NativeGeometryId) {
    this.#b3 = b3;
    const attachmentRadius = C1_NATIVE_GEOMETRIES[geometryId].attachmentRadius;
    const eyeALocal = Object.freeze(
      vec3(-attachmentRadius, C1_NATIVE_COMPONENT.restLength, 0),
    );
    const eyeBLocal = Object.freeze(vec3(-attachmentRadius, 0, 0));
    this.#mapping = axialMapping(eyeALocal, eyeBLocal, C1_NATIVE_COMPONENT);

    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3();
    this.#worldId = b3.b3CreateWorld(worldDef);

    const bodyADef = b3.b3DefaultBodyDef();
    this.#bodyAId = b3.b3CreateBody(this.#worldId, bodyADef);

    const bodyBDef = b3.b3DefaultBodyDef();
    bodyBDef.type = b3.b3BodyType.b3_dynamicBody;
    bodyBDef.rotation = quatAboutZ(INITIAL_ARM_ANGLE);
    bodyBDef.enableSleep = false;
    this.#bodyBId = b3.b3CreateBody(this.#worldId, bodyBDef);

    const extentShapeDef = b3.b3DefaultShapeDef();
    extentShapeDef.density = 1;
    b3.b3CreateBoxShape(
      this.#bodyBId,
      extentShapeDef,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
    );

    const inertiaComZ = (ARM_MASS * ARM_LENGTH * ARM_LENGTH) / 12;
    b3.b3Body_SetMassData(
      this.#bodyBId,
      diagonalMassData(
        ARM_MASS,
        vec3(-0.5 * ARM_LENGTH, 0, 0),
        Math.max(0.002, 0.05 * inertiaComZ),
        inertiaComZ,
        inertiaComZ,
      ),
    );
    // Pinned box3d.js 0.0.2 does not refresh world inertia after SetMassData.
    // This no-op transform uses the engine's own normal refresh path. It is
    // substrate compatibility inherited from C0a/C0c, not relation authority.
    b3.b3Body_SetTransform(
      this.#bodyBId,
      b3.b3Body_GetPosition(this.#bodyBId),
      b3.b3Body_GetRotation(this.#bodyBId),
    );

    const hingeDef = b3.b3DefaultRevoluteJointDef();
    hingeDef.base.bodyIdA = this.#bodyAId;
    hingeDef.base.bodyIdB = this.#bodyBId;
    hingeDef.base.localFrameA = { p: vec3(), q: identityQuat() };
    hingeDef.base.localFrameB = { p: vec3(), q: identityQuat() };
    hingeDef.base.collideConnected = false;
    this.#hingeId = b3.b3CreateRevoluteJoint(this.#worldId, hingeDef);

    this.#authority = Object.freeze({
      relationId: `rep2-c1-native-damper:${geometryId}`,
      geometryId,
      bodyA: Object.freeze({
        identity: "fixed-base" as const,
        solverId: cloneBodyId(this.#bodyAId),
        eyeLocal: eyeALocal,
      }),
      bodyB: Object.freeze({
        identity: "hinged-arm" as const,
        solverId: cloneBodyId(this.#bodyBId),
        eyeLocal: eyeBLocal,
      }),
      component: C1_NATIVE_COMPONENT,
    });

    const distanceDef = b3.b3DefaultDistanceJointDef();
    distanceDef.base.bodyIdA = this.#bodyAId;
    distanceDef.base.bodyIdB = this.#bodyBId;
    distanceDef.base.localFrameA = {
      p: clonePoint(this.#authority.bodyA.eyeLocal),
      q: identityQuat(),
    };
    distanceDef.base.localFrameB = {
      p: clonePoint(this.#authority.bodyB.eyeLocal),
      q: identityQuat(),
    };
    distanceDef.base.collideConnected = false;
    distanceDef.length = this.#authority.component.restLength;
    distanceDef.enableSpring = true;
    distanceDef.hertz = this.#mapping.hertz;
    distanceDef.dampingRatio = this.#mapping.dampingRatio;
    this.#distanceId = b3.b3CreateDistanceJoint(this.#worldId, distanceDef);
    b3.b3DistanceJoint_EnableSpring(this.#distanceId, true);
    b3.b3DistanceJoint_SetLength(
      this.#distanceId,
      this.#authority.component.restLength,
    );
    b3.b3DistanceJoint_SetSpringHertz(this.#distanceId, this.#mapping.hertz);
    b3.b3DistanceJoint_SetSpringDampingRatio(
      this.#distanceId,
      this.#mapping.dampingRatio,
    );
  }

  get authority(): C1NativeAuthority {
    return this.#authority;
  }

  snapshot(): C1NativeDamperSnapshot {
    this.#assertActive();
    const eyeAWorld = this.#b3.b3Body_GetWorldPoint(
      this.#bodyAId,
      this.#authority.bodyA.eyeLocal,
    );
    const eyeBWorld = this.#b3.b3Body_GetWorldPoint(
      this.#bodyBId,
      this.#authority.bodyB.eyeLocal,
    );
    const span = subtract(eyeBWorld, eyeAWorld);
    const currentLength = length(span);
    const axis = normalize(span);
    const nativeConstraintForce = this.#b3.b3Joint_GetConstraintForce(this.#distanceId);
    const nativeFrameA = this.#b3.b3Joint_GetLocalFrameA(this.#distanceId);
    const nativeFrameB = this.#b3.b3Joint_GetLocalFrameB(this.#distanceId);
    return {
      relationId: this.#authority.relationId,
      geometryId: this.#authority.geometryId,
      step: this.#step,
      bodyAIdentity: this.#authority.bodyA.identity,
      bodyBIdentity: this.#authority.bodyB.identity,
      bodyASolverId: this.#authority.bodyA.solverId,
      bodyBSolverId: this.#authority.bodyB.solverId,
      eyeALocal: clonePoint(this.#authority.bodyA.eyeLocal),
      eyeBLocal: clonePoint(this.#authority.bodyB.eyeLocal),
      eyeAWorld: clonePoint(eyeAWorld),
      eyeBWorld: clonePoint(eyeBWorld),
      hingeWorld: clonePoint(this.#b3.b3Body_GetWorldPoint(this.#bodyBId, vec3())),
      hingeAngle: this.#b3.b3RevoluteJoint_GetAngle(this.#hingeId),
      armAngularVelocityZ: this.#b3.b3Body_GetAngularVelocity(this.#bodyBId).z,
      currentLength,
      nativeCurrentLength: this.#b3.b3DistanceJoint_GetCurrentLength(this.#distanceId),
      nativeRestLength: this.#b3.b3DistanceJoint_GetLength(this.#distanceId),
      nativeSpringEnabled: this.#b3.b3DistanceJoint_IsSpringEnabled(this.#distanceId),
      nativeSpringHertz: this.#b3.b3DistanceJoint_GetSpringHertz(this.#distanceId),
      nativeSpringDampingRatio:
        this.#b3.b3DistanceJoint_GetSpringDampingRatio(this.#distanceId),
      nativeBodyASolverId: cloneBodyId(this.#b3.b3Joint_GetBodyA(this.#distanceId)),
      nativeBodyBSolverId: cloneBodyId(this.#b3.b3Joint_GetBodyB(this.#distanceId)),
      nativeEyeALocal: clonePoint(nativeFrameA.p),
      nativeEyeBLocal: clonePoint(nativeFrameB.p),
      extension: currentLength - this.#authority.component.restLength,
      nativeConstraintForce: clonePoint(nativeConstraintForce),
      nativeAxialForce: dot(nativeConstraintForce, axis),
      springStiffness: this.#authority.component.springStiffness,
      dampingCoefficient: this.#authority.component.dampingCoefficient,
      restLength: this.#authority.component.restLength,
      mappingPolicy: C1_NATIVE_SUBSTRATE.mappingPolicy,
      appliedInitialHertz: this.#mapping.hertz,
      appliedInitialDampingRatio: this.#mapping.dampingRatio,
      appliedInitialAxialMass: this.#mapping.axialMass,
      substrate: C1_NATIVE_SUBSTRATE,
    };
  }

  step(count = 1): C1NativeDamperSnapshot {
    this.#assertActive();
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError("Rep2 C1 native step count must be a non-negative integer.");
    }
    for (let index = 0; index < count; index += 1) {
      this.#b3.b3World_Step(this.#worldId, STEP_DT, SUBSTEPS);
      this.#step += 1;
    }
    return this.snapshot();
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#b3.b3DestroyWorld(this.#worldId);
  }

  #assertActive(): void {
    if (this.#disposed) throw new Error("Rep2 C1 native damper world is disposed.");
  }
}
