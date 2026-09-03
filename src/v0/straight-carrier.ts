import Box3DFactory from "box3d.js/inline";
import type {
  Box3DModule,
  b3BodyId,
  b3JointId,
  b3Quat,
  b3ShapeId,
  b3Vec3,
  b3WorldId,
} from "box3d.js";
import { headingRadians, identityQuat, vec3 } from "./math.js";

export const V0_BOX3D_IDENTITY = Object.freeze({
  package: "box3d.js",
  version: "0.0.2",
  donorCommit: "98849cfe3263dca09e30fca8bb5a216c9924fff4",
} as const);

export const STRAIGHT_CARRIER_CONFIG = Object.freeze({
  fixedDt: 1 / 60,
  substeps: 4,
  chassisHalf: Object.freeze(vec3(0.9, 0.16, 0.5)),
  chassisCenterY: 0.53,
  axleHalfSpacing: 0.66,
  trackHalfWidth: 0.62,
  wheelRadius: 0.32,
  wheelDensity: 45,
  maxWheelSpeed: 18,
  driveTorque: 36,
} as const);

type Corner = Readonly<{
  bodyId: b3BodyId;
  spinJointId: b3JointId;
  driven: boolean;
}>;

export interface StraightCarrierTrace {
  readonly step: number;
  readonly chassisPosition: b3Vec3;
  readonly chassisRotation: b3Quat;
  readonly chassisVelocity: b3Vec3;
  readonly headingRadians: number;
  readonly worldContacts: number;
}

function diagonalMassData(mass: number) {
  const inertia = Math.max(0.01, mass * 0.02);
  return {
    mass,
    center: vec3(),
    inertia: {
      cx: vec3(inertia, 0, 0),
      cy: vec3(0, inertia, 0),
      cz: vec3(0, 0, inertia),
    },
  };
}

function dynamicBody(
  b3: Box3DModule,
  worldId: b3WorldId,
  position: b3Vec3,
): b3BodyId {
  const def = b3.b3DefaultBodyDef();
  def.type = b3.b3BodyType.b3_dynamicBody;
  def.position = position;
  def.rotation = identityQuat();
  return b3.b3CreateBody(worldId, def);
}

export class StraightCarrierWorld {
  readonly #b3: Box3DModule;
  readonly #worldId: b3WorldId;
  readonly #chassisId: b3BodyId;
  readonly #bodyIds: b3BodyId[] = [];
  readonly #jointIds: b3JointId[] = [];
  readonly #shapeIds: b3ShapeId[] = [];
  readonly #corners: Corner[] = [];
  #drive = 0;
  #step = 0;
  #disposed = false;

  static async create(): Promise<StraightCarrierWorld> {
    return new StraightCarrierWorld(await Box3DFactory());
  }

  private constructor(b3: Box3DModule) {
    this.#b3 = b3;
    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3(0, -10, 0);
    worldDef.enableContinuous = true;
    this.#worldId = b3.b3CreateWorld(worldDef);

    const groundDef = b3.b3DefaultBodyDef();
    groundDef.position = vec3(0, -0.25, 0);
    const ground = b3.b3CreateBody(this.#worldId, groundDef);
    const groundShapeDef = b3.b3DefaultShapeDef();
    groundShapeDef.baseMaterial.friction = 1.1;
    groundShapeDef.enableContactEvents = true;
    this.#shapeIds.push(
      b3.b3CreateBoxShape(ground, groundShapeDef, 60, 0.25, 60),
    );

    this.#chassisId = dynamicBody(
      b3,
      this.#worldId,
      vec3(0, STRAIGHT_CARRIER_CONFIG.chassisCenterY, 0),
    );
    this.#bodyIds.push(this.#chassisId);
    const chassisShapeDef = b3.b3DefaultShapeDef();
    chassisShapeDef.density = 120;
    chassisShapeDef.baseMaterial.friction = 0.5;
    chassisShapeDef.filter.groupIndex = -1;
    this.#shapeIds.push(
      b3.b3CreateBoxShape(
        this.#chassisId,
        chassisShapeDef,
        STRAIGHT_CARRIER_CONFIG.chassisHalf.x,
        STRAIGHT_CARRIER_CONFIG.chassisHalf.y,
        STRAIGHT_CARRIER_CONFIG.chassisHalf.z,
      ),
    );
    b3.b3Body_SetAngularDamping(this.#chassisId, 0.08);

    for (const front of [true, false]) {
      for (const left of [true, false]) this.#createCorner(front, left);
    }
  }

  #createCorner(front: boolean, left: boolean): void {
    const cfg = STRAIGHT_CARRIER_CONFIG;
    const local = vec3(
      front ? cfg.axleHalfSpacing : -cfg.axleHalfSpacing,
      cfg.wheelRadius - cfg.chassisCenterY,
      left ? -cfg.trackHalfWidth : cfg.trackHalfWidth,
    );
    let spinParent = this.#chassisId;
    let spinParentAnchor = local;

    if (front) {
      const knuckleId = dynamicBody(
        this.#b3,
        this.#worldId,
        vec3(local.x, cfg.wheelRadius, local.z),
      );
      this.#bodyIds.push(knuckleId);
      this.#b3.b3Body_SetMassData(knuckleId, diagonalMassData(2));
      const kingpinFrame = this.#b3.b3ComputeQuatBetweenUnitVectors(
        vec3(0, 0, 1),
        vec3(0, 1, 0),
      );
      const steeringDef = this.#b3.b3DefaultRevoluteJointDef();
      steeringDef.base.bodyIdA = this.#chassisId;
      steeringDef.base.bodyIdB = knuckleId;
      steeringDef.base.localFrameA = { p: local, q: kingpinFrame };
      steeringDef.base.localFrameB = { p: vec3(), q: kingpinFrame };
      steeringDef.base.collideConnected = false;
      steeringDef.enableLimit = true;
      steeringDef.lowerAngle = 0;
      steeringDef.upperAngle = 0;
      this.#jointIds.push(
        this.#b3.b3CreateRevoluteJoint(this.#worldId, steeringDef),
      );
      spinParent = knuckleId;
      spinParentAnchor = vec3();
    }

    const wheelId = dynamicBody(
      this.#b3,
      this.#worldId,
      vec3(local.x, cfg.wheelRadius, local.z),
    );
    this.#bodyIds.push(wheelId);
    const wheelShapeDef = this.#b3.b3DefaultShapeDef();
    wheelShapeDef.density = cfg.wheelDensity;
    wheelShapeDef.baseMaterial.friction = 1.15;
    wheelShapeDef.baseMaterial.rollingResistance = 0.015;
    wheelShapeDef.filter.groupIndex = -1;
    wheelShapeDef.enableContactEvents = true;
    this.#shapeIds.push(
      this.#b3.b3CreateSphereShape(wheelId, wheelShapeDef, {
        center: vec3(),
        radius: cfg.wheelRadius,
      }),
    );

    const spinDef = this.#b3.b3DefaultRevoluteJointDef();
    spinDef.base.bodyIdA = spinParent;
    spinDef.base.bodyIdB = wheelId;
    spinDef.base.localFrameA = { p: spinParentAnchor, q: identityQuat() };
    spinDef.base.localFrameB = { p: vec3(), q: identityQuat() };
    spinDef.base.collideConnected = false;
    spinDef.enableMotor = !front;
    spinDef.motorSpeed = 0;
    spinDef.maxMotorTorque = 0;
    const spinJointId = this.#b3.b3CreateRevoluteJoint(this.#worldId, spinDef);
    this.#jointIds.push(spinJointId);
    this.#corners.push({ bodyId: wheelId, spinJointId, driven: !front });
  }

  setDrive(value: number): void {
    if (!Number.isFinite(value)) throw new RangeError("Drive must be finite.");
    this.#drive = Math.max(-1, Math.min(1, value));
  }

  step(count = 1): StraightCarrierTrace {
    this.#assertActive();
    for (let index = 0; index < count; index += 1) {
      for (const corner of this.#corners) {
        if (!corner.driven) continue;
        this.#b3.b3RevoluteJoint_EnableMotor(corner.spinJointId, true);
        this.#b3.b3RevoluteJoint_SetMotorSpeed(
          corner.spinJointId,
          -this.#drive * STRAIGHT_CARRIER_CONFIG.maxWheelSpeed,
        );
        this.#b3.b3RevoluteJoint_SetMaxMotorTorque(
          corner.spinJointId,
          Math.abs(this.#drive) * STRAIGHT_CARRIER_CONFIG.driveTorque,
        );
        this.#b3.b3Joint_WakeBodies(corner.spinJointId);
      }
      this.#b3.b3World_Step(
        this.#worldId,
        STRAIGHT_CARRIER_CONFIG.fixedDt,
        STRAIGHT_CARRIER_CONFIG.substeps,
      );
      this.#step += 1;
    }
    return this.trace();
  }

  trace(): StraightCarrierTrace {
    this.#assertActive();
    const rotation = this.#b3.b3Body_GetRotation(this.#chassisId);
    return {
      step: this.#step,
      chassisPosition: { ...this.#b3.b3Body_GetPosition(this.#chassisId) },
      chassisRotation: { v: { ...rotation.v }, s: rotation.s },
      chassisVelocity: { ...this.#b3.b3Body_GetLinearVelocity(this.#chassisId) },
      headingRadians: headingRadians(rotation),
      worldContacts: this.#b3.b3World_GetCounters(this.#worldId).contactCount,
    };
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    for (const jointId of [...this.#jointIds].reverse()) {
      if (this.#b3.b3Joint_IsValid(jointId)) {
        this.#b3.b3DestroyJoint(jointId, false);
      }
    }
    for (const bodyId of [...this.#bodyIds].reverse()) {
      if (this.#b3.b3Body_IsValid(bodyId)) this.#b3.b3DestroyBody(bodyId);
    }
    if (this.#b3.b3World_IsValid(this.#worldId)) {
      this.#b3.b3DestroyWorld(this.#worldId);
    }
  }

  #assertActive(): void {
    if (this.#disposed) throw new Error("Straight carrier is disposed.");
  }
}
