import Box3DFactory from "box3d.js/inline";
import type {
  Box3DModule,
  ContactsBuffer,
  b3BodyId,
  b3JointId,
  b3Quat,
  b3ShapeId,
  b3Vec3,
  b3WorldId,
} from "box3d.js";
import { headingRadians, identityQuat, rotateVector, vec3 } from "./math.js";
import {
  STEERING_GEOMETRIES,
  solveSteeringOracle,
  pickupLocal,
  straightTieRodLength,
  type SteeringGeometry,
  type SteeringOracleFrame,
  type SteeringSide,
  type SteeringVariantId,
} from "./steering-geometry.js";

const FIXED_DT = 1 / 60;
const SUBSTEPS = 4;
const CHASSIS_CENTER_Y = 0.53;
const CHASSIS_HALF = Object.freeze(vec3(0.9, 0.16, 0.5));
const REAR_AXLE_X = -0.66;
const WHEEL_RADIUS = 0.32;
const MAX_WHEEL_SPEED = 18;
const DRIVE_TORQUE = 36;
const RACK_SPEED_GAIN = 14;
const MAX_RACK_SPEED = 1.1;
const MAX_RACK_FORCE = 1_200;

export type LinkageMode = "PHYSICAL" | "REMOVED";

export interface V0BodyFrame {
  readonly position: b3Vec3;
  readonly rotation: b3Quat;
}

export interface V0CornerFrame extends V0BodyFrame {
  readonly side: SteeringSide;
  readonly wheel: V0BodyFrame;
  readonly steeringAngle: number;
  readonly oracleAngle: number;
  readonly oracleResidual: number;
  readonly contactCount: number;
  readonly steeringPickupWorld: b3Vec3;
  readonly rackEndpointWorld: b3Vec3;
  readonly tieRodLength: number;
  readonly tieRodCurrentLength: number | null;
  readonly tieRodError: number | null;
}

export interface PhysicalSteeringTrace {
  readonly step: number;
  readonly variant: SteeringVariantId;
  readonly linkage: LinkageMode;
  readonly steeringInput: number;
  readonly rackTarget: number;
  readonly rackTranslation: number;
  readonly rackLimitExcess: number;
  readonly rackTrackingError: number;
  readonly rackSpeed: number;
  readonly oracleStatus: "VALID" | "DIAGNOSED_OUTSIDE_ORACLE_DOMAIN";
  readonly chassis: V0BodyFrame;
  readonly chassisVelocity: b3Vec3;
  readonly headingRadians: number;
  readonly speed: number;
  readonly travelledDistance: number;
  readonly curvature: number;
  readonly rack: V0BodyFrame;
  readonly left: V0CornerFrame;
  readonly right: V0CornerFrame;
  readonly rearWheels: readonly [V0BodyFrame, V0BodyFrame];
  readonly worldContacts: number;
}

interface FrontCornerRuntime {
  readonly side: SteeringSide;
  readonly knuckleId: b3BodyId;
  readonly wheelId: b3BodyId;
  readonly spinJointId: b3JointId;
  readonly steeringJointId: b3JointId;
  readonly tieRodJointId: b3JointId | null;
  readonly steeringPickupLocal: b3Vec3;
  readonly rackEndpointLocal: b3Vec3;
  readonly tieRodLength: number;
}

interface RearWheelRuntime {
  readonly wheelId: b3BodyId;
  readonly spinJointId: b3JointId;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function diagonalMassData(mass: number, extent = 0.15) {
  const inertia = Math.max(0.001, mass * extent * extent * 0.4);
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

function cloneQuat(value: b3Quat): b3Quat {
  return { v: { ...value.v }, s: value.s };
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

export class PhysicalSteeringWorld {
  readonly #b3: Box3DModule;
  readonly #worldId: b3WorldId;
  readonly #contacts: ContactsBuffer;
  readonly #geometry: SteeringGeometry;
  readonly #linkage: LinkageMode;
  readonly #chassisId: b3BodyId;
  readonly #rackId: b3BodyId;
  readonly #rackJointId: b3JointId;
  readonly #front: readonly [FrontCornerRuntime, FrontCornerRuntime];
  readonly #rear: readonly [RearWheelRuntime, RearWheelRuntime];
  readonly #bodyIds: b3BodyId[] = [];
  readonly #jointIds: b3JointId[] = [];
  readonly #shapeIds: b3ShapeId[] = [];
  #steeringInput = 0;
  #driveInput = 0;
  #step = 0;
  #travelledDistance = 0;
  #lastChassisPosition: b3Vec3;
  #initialHeading = 0;
  #disposed = false;

  static async create(
    geometryOrVariant: SteeringVariantId | SteeringGeometry,
    linkage: LinkageMode = "PHYSICAL",
  ): Promise<PhysicalSteeringWorld> {
    const geometry =
      typeof geometryOrVariant === "string"
        ? STEERING_GEOMETRIES[geometryOrVariant]
        : geometryOrVariant;
    for (const side of ["LEFT", "RIGHT"] as const) {
      const pickup = pickupLocal(geometry, side);
      if (Math.hypot(pickup.x, pickup.z) <= 1e-4) {
        throw new RangeError(
          `${geometry.id}/${side} pickup is too close to its pivot for stable physical instantiation.`,
        );
      }
    }
    return new PhysicalSteeringWorld(
      await Box3DFactory(),
      geometry,
      linkage,
    );
  }

  get geometry(): SteeringGeometry {
    return this.#geometry;
  }

  private constructor(
    b3: Box3DModule,
    geometry: SteeringGeometry,
    linkage: LinkageMode,
  ) {
    this.#b3 = b3;
    this.#geometry = geometry;
    this.#linkage = linkage;
    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3(0, -10, 0);
    worldDef.enableContinuous = true;
    this.#worldId = b3.b3CreateWorld(worldDef);
    this.#contacts = b3.createContactsBuffer();

    const groundDef = b3.b3DefaultBodyDef();
    groundDef.position = vec3(0, -0.25, 0);
    const groundId = b3.b3CreateBody(this.#worldId, groundDef);
    const groundShapeDef = b3.b3DefaultShapeDef();
    groundShapeDef.baseMaterial.friction = 1.1;
    groundShapeDef.enableContactEvents = true;
    this.#shapeIds.push(
      b3.b3CreateBoxShape(groundId, groundShapeDef, 60, 0.25, 60),
    );

    this.#chassisId = dynamicBody(
      b3,
      this.#worldId,
      vec3(0, CHASSIS_CENTER_Y, 0),
    );
    this.#bodyIds.push(this.#chassisId);
    const chassisShapeDef = b3.b3DefaultShapeDef();
    chassisShapeDef.density = 120;
    chassisShapeDef.baseMaterial.friction = 0.5;
    chassisShapeDef.filter.groupIndex = -2;
    this.#shapeIds.push(
      b3.b3CreateBoxShape(
        this.#chassisId,
        chassisShapeDef,
        CHASSIS_HALF.x,
        CHASSIS_HALF.y,
        CHASSIS_HALF.z,
      ),
    );
    b3.b3Body_SetAngularDamping(this.#chassisId, 0.08);

    this.#rackId = dynamicBody(
      b3,
      this.#worldId,
      vec3(geometry.rackX, WHEEL_RADIUS, 0),
    );
    this.#bodyIds.push(this.#rackId);
    b3.b3Body_SetMassData(this.#rackId, diagonalMassData(3, 0.3));
    const rackFrame = b3.b3ComputeQuatBetweenUnitVectors(
      vec3(1, 0, 0),
      vec3(0, 0, 1),
    );
    const rackDef = b3.b3DefaultPrismaticJointDef();
    rackDef.base.bodyIdA = this.#chassisId;
    rackDef.base.bodyIdB = this.#rackId;
    rackDef.base.localFrameA = {
      p: vec3(
        geometry.rackX,
        WHEEL_RADIUS - CHASSIS_CENTER_Y,
        0,
      ),
      q: rackFrame,
    };
    rackDef.base.localFrameB = { p: vec3(), q: rackFrame };
    rackDef.base.collideConnected = false;
    rackDef.enableSpring = false;
    rackDef.enableLimit = true;
    rackDef.lowerTranslation = -geometry.rackTravel;
    rackDef.upperTranslation = geometry.rackTravel;
    rackDef.enableMotor = true;
    rackDef.motorSpeed = 0;
    rackDef.maxMotorForce = MAX_RACK_FORCE;
    this.#rackJointId = b3.b3CreatePrismaticJoint(this.#worldId, rackDef);
    this.#jointIds.push(this.#rackJointId);

    this.#front = [this.#createFront("LEFT"), this.#createFront("RIGHT")];
    this.#rear = [this.#createRear("LEFT"), this.#createRear("RIGHT")];
    this.#lastChassisPosition = {
      ...b3.b3Body_GetPosition(this.#chassisId),
    };
    this.#initialHeading = headingRadians(
      b3.b3Body_GetRotation(this.#chassisId),
    );
  }

  #createWheel(position: b3Vec3): b3BodyId {
    const wheelId = dynamicBody(this.#b3, this.#worldId, position);
    this.#bodyIds.push(wheelId);
    const shapeDef = this.#b3.b3DefaultShapeDef();
    shapeDef.density = 45;
    shapeDef.baseMaterial.friction = 1.15;
    shapeDef.baseMaterial.rollingResistance = 0.015;
    shapeDef.filter.groupIndex = -2;
    shapeDef.enableContactEvents = true;
    this.#shapeIds.push(
      this.#b3.b3CreateSphereShape(wheelId, shapeDef, {
        center: vec3(),
        radius: WHEEL_RADIUS,
      }),
    );
    return wheelId;
  }

  #createSpinJoint(
    parentId: b3BodyId,
    wheelId: b3BodyId,
    parentAnchor: b3Vec3,
    driven: boolean,
  ): b3JointId {
    const def = this.#b3.b3DefaultRevoluteJointDef();
    def.base.bodyIdA = parentId;
    def.base.bodyIdB = wheelId;
    def.base.localFrameA = { p: parentAnchor, q: identityQuat() };
    def.base.localFrameB = { p: vec3(), q: identityQuat() };
    def.base.collideConnected = false;
    def.enableMotor = driven;
    def.motorSpeed = 0;
    def.maxMotorTorque = 0;
    const id = this.#b3.b3CreateRevoluteJoint(this.#worldId, def);
    this.#jointIds.push(id);
    return id;
  }

  #createFront(side: SteeringSide): FrontCornerRuntime {
    const sign = side === "LEFT" ? -1 : 1;
    const position = vec3(
      this.#geometry.frontAxleX,
      WHEEL_RADIUS,
      sign * this.#geometry.trackHalfWidth,
    );
    const localPivot = vec3(
      position.x,
      position.y - CHASSIS_CENTER_Y,
      position.z,
    );
    const knuckleId = dynamicBody(this.#b3, this.#worldId, position);
    this.#bodyIds.push(knuckleId);
    this.#b3.b3Body_SetMassData(knuckleId, diagonalMassData(2));
    const kingpinFrame = this.#b3.b3ComputeQuatBetweenUnitVectors(
      vec3(0, 0, 1),
      vec3(0, 1, 0),
    );
    const steeringDef = this.#b3.b3DefaultRevoluteJointDef();
    steeringDef.base.bodyIdA = this.#chassisId;
    steeringDef.base.bodyIdB = knuckleId;
    steeringDef.base.localFrameA = { p: localPivot, q: kingpinFrame };
    steeringDef.base.localFrameB = { p: vec3(), q: kingpinFrame };
    steeringDef.base.collideConnected = false;
    steeringDef.enableLimit = true;
    steeringDef.lowerAngle = -Math.PI / 3;
    steeringDef.upperAngle = Math.PI / 3;
    const steeringJointId = this.#b3.b3CreateRevoluteJoint(
      this.#worldId,
      steeringDef,
    );
    this.#jointIds.push(steeringJointId);

    const wheelId = this.#createWheel(position);
    const spinJointId = this.#createSpinJoint(
      knuckleId,
      wheelId,
      vec3(),
      false,
    );
    const authoredPickup = pickupLocal(this.#geometry, side);
    const steeringPickupLocal = vec3(authoredPickup.x, 0, authoredPickup.z);
    const rackEndpointLocal = vec3(
      0,
      0,
      sign * this.#geometry.rackHalfWidth,
    );
    const tieRodLength = straightTieRodLength(this.#geometry, side);
    let tieRodJointId: b3JointId | null = null;
    if (this.#linkage === "PHYSICAL") {
      const tieRodDef = this.#b3.b3DefaultDistanceJointDef();
      tieRodDef.base.bodyIdA = this.#rackId;
      tieRodDef.base.bodyIdB = knuckleId;
      tieRodDef.base.localFrameA.p = rackEndpointLocal;
      tieRodDef.base.localFrameB.p = steeringPickupLocal;
      tieRodDef.base.collideConnected = false;
      tieRodDef.length = tieRodLength;
      tieRodDef.enableSpring = false;
      tieRodJointId = this.#b3.b3CreateDistanceJoint(
        this.#worldId,
        tieRodDef,
      );
      this.#jointIds.push(tieRodJointId);
    }
    return {
      side,
      knuckleId,
      wheelId,
      spinJointId,
      steeringJointId,
      tieRodJointId,
      steeringPickupLocal,
      rackEndpointLocal,
      tieRodLength,
    };
  }

  #createRear(side: SteeringSide): RearWheelRuntime {
    const sign = side === "LEFT" ? -1 : 1;
    const position = vec3(
      REAR_AXLE_X,
      WHEEL_RADIUS,
      sign * this.#geometry.trackHalfWidth,
    );
    const wheelId = this.#createWheel(position);
    const spinJointId = this.#createSpinJoint(
      this.#chassisId,
      wheelId,
      vec3(
        REAR_AXLE_X,
        WHEEL_RADIUS - CHASSIS_CENTER_Y,
        position.z,
      ),
      true,
    );
    return { wheelId, spinJointId };
  }

  setSteering(value: number): void {
    if (!Number.isFinite(value)) throw new RangeError("Steering must be finite.");
    this.#steeringInput = clamp(value, -1, 1);
  }

  setDrive(value: number): void {
    if (!Number.isFinite(value)) throw new RangeError("Drive must be finite.");
    this.#driveInput = clamp(value, -1, 1);
  }

  step(count = 1): PhysicalSteeringTrace {
    this.#assertActive();
    for (let index = 0; index < count; index += 1) {
      const rack = this.#b3.b3PrismaticJoint_GetTranslation(this.#rackJointId);
      const target = this.#steeringInput * this.#geometry.rackTravel;
      this.#b3.b3PrismaticJoint_SetMotorSpeed(
        this.#rackJointId,
        clamp((target - rack) * RACK_SPEED_GAIN, -MAX_RACK_SPEED, MAX_RACK_SPEED),
      );
      this.#b3.b3PrismaticJoint_SetMaxMotorForce(
        this.#rackJointId,
        MAX_RACK_FORCE,
      );
      this.#b3.b3Joint_WakeBodies(this.#rackJointId);

      for (const rear of this.#rear) {
        this.#b3.b3RevoluteJoint_EnableMotor(rear.spinJointId, true);
        this.#b3.b3RevoluteJoint_SetMotorSpeed(
          rear.spinJointId,
          -this.#driveInput * MAX_WHEEL_SPEED,
        );
        this.#b3.b3RevoluteJoint_SetMaxMotorTorque(
          rear.spinJointId,
          Math.abs(this.#driveInput) * DRIVE_TORQUE,
        );
        this.#b3.b3Joint_WakeBodies(rear.spinJointId);
      }
      this.#b3.b3World_Step(this.#worldId, FIXED_DT, SUBSTEPS);
      this.#step += 1;
      const current = this.#b3.b3Body_GetPosition(this.#chassisId);
      this.#travelledDistance += Math.hypot(
        current.x - this.#lastChassisPosition.x,
        current.z - this.#lastChassisPosition.z,
      );
      this.#lastChassisPosition = { ...current };
    }
    return this.trace();
  }

  #frame(bodyId: b3BodyId): V0BodyFrame {
    return {
      position: { ...this.#b3.b3Body_GetPosition(bodyId) },
      rotation: cloneQuat(this.#b3.b3Body_GetRotation(bodyId)),
    };
  }

  #contactCount(bodyId: b3BodyId): number {
    this.#b3.getBodyContactData(this.#contacts, bodyId);
    return this.#b3.getNumContacts(this.#contacts);
  }

  #cornerTrace(
    corner: FrontCornerRuntime,
    oracleAngle: number,
  ): V0CornerFrame {
    const actualAngle = this.#b3.b3RevoluteJoint_GetAngle(
      corner.steeringJointId,
    );
    const tieRodCurrentLength =
      corner.tieRodJointId === null
        ? null
        : this.#b3.b3DistanceJoint_GetCurrentLength(corner.tieRodJointId);
    return {
      ...this.#frame(corner.knuckleId),
      side: corner.side,
      wheel: this.#frame(corner.wheelId),
      steeringAngle: actualAngle,
      oracleAngle,
      oracleResidual: actualAngle - oracleAngle,
      contactCount: this.#contactCount(corner.wheelId),
      steeringPickupWorld: {
        ...this.#b3.b3Body_GetWorldPoint(
          corner.knuckleId,
          corner.steeringPickupLocal,
        ),
      },
      rackEndpointWorld: {
        ...this.#b3.b3Body_GetWorldPoint(
          this.#rackId,
          corner.rackEndpointLocal,
        ),
      },
      tieRodLength: corner.tieRodLength,
      tieRodCurrentLength,
      tieRodError:
        tieRodCurrentLength === null
          ? null
          : tieRodCurrentLength - corner.tieRodLength,
    };
  }

  trace(): PhysicalSteeringTrace {
    this.#assertActive();
    const rackTranslation = this.#b3.b3PrismaticJoint_GetTranslation(
      this.#rackJointId,
    );
    const rackTarget = this.#steeringInput * this.#geometry.rackTravel;
    const oracleRackTranslation = clamp(
      rackTranslation,
      -this.#geometry.rackTravel,
      this.#geometry.rackTravel,
    );
    let oracle: SteeringOracleFrame;
    let oracleStatus: PhysicalSteeringTrace["oracleStatus"] = "VALID";
    try {
      oracle = solveSteeringOracle(this.#geometry, oracleRackTranslation);
    } catch {
      // The oracle is diagnostic only. A strange but instantiated physical
      // layout must not be turned into hidden actuation or a runtime crash.
      oracle = solveSteeringOracle(this.#geometry, 0);
      oracleStatus = "DIAGNOSED_OUTSIDE_ORACLE_DOMAIN";
    }
    const chassis = this.#frame(this.#chassisId);
    const velocity = this.#b3.b3Body_GetLinearVelocity(this.#chassisId);
    const heading = headingRadians(chassis.rotation);
    const forward = rotateVector(chassis.rotation, vec3(1, 0, 0));
    const speed = velocity.x * forward.x + velocity.z * forward.z;
    const headingChange = heading - this.#initialHeading;
    return {
      step: this.#step,
      variant: this.#geometry.id,
      linkage: this.#linkage,
      steeringInput: this.#steeringInput,
      rackTarget,
      rackTranslation,
      rackLimitExcess: Math.max(
        0,
        Math.abs(rackTranslation) - this.#geometry.rackTravel,
      ),
      rackTrackingError: rackTranslation - rackTarget,
      rackSpeed: this.#b3.b3PrismaticJoint_GetSpeed(this.#rackJointId),
      oracleStatus,
      chassis,
      chassisVelocity: { ...velocity },
      headingRadians: heading,
      speed,
      travelledDistance: this.#travelledDistance,
      curvature:
        this.#travelledDistance > 0.05
          ? headingChange / this.#travelledDistance
          : 0,
      rack: this.#frame(this.#rackId),
      left: this.#cornerTrace(this.#front[0], oracle.left.angleRadians),
      right: this.#cornerTrace(this.#front[1], oracle.right.angleRadians),
      rearWheels: [
        this.#frame(this.#rear[0].wheelId),
        this.#frame(this.#rear[1].wheelId),
      ],
      worldContacts: this.#b3.b3World_GetCounters(this.#worldId).contactCount,
    };
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#b3.destroyContactsBuffer(this.#contacts);
    for (const id of [...this.#jointIds].reverse()) {
      if (this.#b3.b3Joint_IsValid(id)) this.#b3.b3DestroyJoint(id, false);
    }
    for (const id of [...this.#bodyIds].reverse()) {
      if (this.#b3.b3Body_IsValid(id)) this.#b3.b3DestroyBody(id);
    }
    if (this.#b3.b3World_IsValid(this.#worldId)) {
      this.#b3.b3DestroyWorld(this.#worldId);
    }
  }

  #assertActive(): void {
    if (this.#disposed) throw new Error("Physical steering world is disposed.");
  }
}
