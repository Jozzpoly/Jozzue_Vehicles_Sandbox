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
import { identityQuat, vec3 } from "../v0/math.js";

const FIXED_DT = 1 / 60;
const SUBSTEPS = 4;
const MIN_ARM_LENGTH = 0.05;

export const REP2_CARRIER_CONFIG = Object.freeze({
  chassisHalf: Object.freeze(vec3(0.9, 0.16, 0.5)),
  chassisCenterY: 0.53,
  axleHalfSpacing: 0.66,
  trackHalfWidth: 0.62,
  wheelRadius: 0.32,
  wheelDensity: 45,
  armMass: 6,
  maxWheelSpeed: 18,
  driveTorque: 36,
} as const);

export interface Rep2SuspensionGeometry {
  readonly armPivotLocal: Readonly<{ x: number; y: number; z: number }>;
  readonly wheelEndpointLocal: Readonly<{ x: number; y: number; z: number }>;
}

export const REP2_BASELINE_GEOMETRY: Rep2SuspensionGeometry = Object.freeze({
  armPivotLocal: Object.freeze({ x: -0.36, y: -0.02, z: -0.62 }),
  wheelEndpointLocal: Object.freeze({ x: -0.66, y: -0.21, z: -0.62 }),
});

export interface Rep2BodyFrame {
  readonly position: b3Vec3;
  readonly rotation: b3Quat;
}

export interface Rep2SuspensionTrace {
  readonly step: number;
  readonly chassis: Rep2BodyFrame;
  readonly chassisVelocity: b3Vec3;
  readonly arm: Rep2BodyFrame;
  readonly selectedWheel: Rep2BodyFrame;
  readonly oppositeRearWheel: Rep2BodyFrame;
  readonly hingeWorldFromChassis: b3Vec3;
  readonly hingeWorldFromArm: b3Vec3;
  readonly wheelEndpointWorldFromArm: b3Vec3;
  readonly wheelCenterWorld: b3Vec3;
  readonly oppositeRearAnchorWorld: b3Vec3;
  readonly armLength: number;
  readonly hingeAngle: number;
  readonly selectedWheelContacts: number;
  readonly worldContacts: number;
  readonly ownedBodyCount: number;
  readonly ownedJointCount: number;
}

type DirectWheel = Readonly<{
  wheelId: b3BodyId;
  spinJointId: b3JointId;
  driven: boolean;
}>;

function cloneQuat(value: b3Quat): b3Quat {
  return { v: { ...value.v }, s: value.s };
}

function subtract(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): b3Vec3 {
  return vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

function magnitude(value: Readonly<b3Vec3>): number {
  return Math.hypot(value.x, value.y, value.z);
}

function finitePoint(value: Readonly<b3Vec3>): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function validateGeometry(geometry: Rep2SuspensionGeometry): {
  readonly geometry: Rep2SuspensionGeometry;
  readonly armToWheel: b3Vec3;
  readonly armLength: number;
} {
  const armPivotLocal = vec3(
    geometry.armPivotLocal.x,
    geometry.armPivotLocal.y,
    geometry.armPivotLocal.z,
  );
  const wheelEndpointLocal = vec3(
    geometry.wheelEndpointLocal.x,
    geometry.wheelEndpointLocal.y,
    geometry.wheelEndpointLocal.z,
  );
  if (!finitePoint(armPivotLocal) || !finitePoint(wheelEndpointLocal)) {
    throw new RangeError("Rep2 suspension geometry must contain only finite coordinates.");
  }
  const armToWheel = subtract(wheelEndpointLocal, armPivotLocal);
  const armLength = magnitude(armToWheel);
  if (armLength < MIN_ARM_LENGTH) {
    throw new RangeError(
      `Rep2 suspension arm length ${armLength.toFixed(6)} m is below the ${MIN_ARM_LENGTH.toFixed(2)} m structural minimum.`,
    );
  }
  return {
    geometry: Object.freeze({
      armPivotLocal: Object.freeze({ ...armPivotLocal }),
      wheelEndpointLocal: Object.freeze({ ...wheelEndpointLocal }),
    }),
    armToWheel,
    armLength,
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

function diagonalMassData(
  mass: number,
  inertia: b3Vec3,
  center: b3Vec3 = vec3(),
) {
  return {
    mass,
    center,
    inertia: {
      cx: vec3(inertia.x, 0, 0),
      cy: vec3(0, inertia.y, 0),
      cz: vec3(0, 0, inertia.z),
    },
  };
}

export class Rep2SuspensionLinkWorld {
  readonly #b3: Box3DModule;
  readonly #worldId: b3WorldId;
  readonly #contacts: ContactsBuffer;
  readonly #geometry: Rep2SuspensionGeometry;
  readonly #armToWheel: b3Vec3;
  readonly #armLength: number;
  readonly #chassisId: b3BodyId;
  readonly #armId: b3BodyId;
  readonly #hingeId: b3JointId;
  readonly #selectedWheelId: b3BodyId;
  readonly #selectedSpinJointId: b3JointId;
  readonly #oppositeRear: DirectWheel;
  readonly #directWheels: DirectWheel[] = [];
  readonly #drivenSpinJoints: b3JointId[] = [];
  readonly #bodyIds: b3BodyId[] = [];
  readonly #jointIds: b3JointId[] = [];
  readonly #shapeIds: b3ShapeId[] = [];
  #drive = 0;
  #step = 0;
  #disposed = false;

  static async create(
    geometry: Rep2SuspensionGeometry = REP2_BASELINE_GEOMETRY,
  ): Promise<Rep2SuspensionLinkWorld> {
    const validated = validateGeometry(geometry);
    return new Rep2SuspensionLinkWorld(await Box3DFactory(), validated);
  }

  private constructor(
    b3: Box3DModule,
    validated: ReturnType<typeof validateGeometry>,
  ) {
    this.#b3 = b3;
    this.#geometry = validated.geometry;
    this.#armToWheel = validated.armToWheel;
    this.#armLength = validated.armLength;

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
      vec3(0, REP2_CARRIER_CONFIG.chassisCenterY, 0),
    );
    this.#bodyIds.push(this.#chassisId);
    const chassisShapeDef = b3.b3DefaultShapeDef();
    chassisShapeDef.density = 120;
    chassisShapeDef.baseMaterial.friction = 0.5;
    chassisShapeDef.filter.groupIndex = -3;
    this.#shapeIds.push(
      b3.b3CreateBoxShape(
        this.#chassisId,
        chassisShapeDef,
        REP2_CARRIER_CONFIG.chassisHalf.x,
        REP2_CARRIER_CONFIG.chassisHalf.y,
        REP2_CARRIER_CONFIG.chassisHalf.z,
      ),
    );
    b3.b3Body_SetAngularDamping(this.#chassisId, 0.08);

    const pivotWorld = b3.b3Body_GetWorldPoint(
      this.#chassisId,
      this.#geometry.armPivotLocal,
    );
    this.#armId = dynamicBody(b3, this.#worldId, pivotWorld);
    this.#bodyIds.push(this.#armId);
    const armMass = REP2_CARRIER_CONFIG.armMass;
    const rodInertia = Math.max(0.002, (armMass * this.#armLength * this.#armLength) / 12);
    const armCenter = vec3(
      0.5 * this.#armToWheel.x,
      0.5 * this.#armToWheel.y,
      0.5 * this.#armToWheel.z,
    );
    b3.b3Body_SetMassData(
      this.#armId,
      diagonalMassData(
        armMass,
        vec3(0.35 * rodInertia + 0.002, rodInertia + 0.002, rodInertia + 0.002),
        armCenter,
      ),
    );

    const hingeDef = b3.b3DefaultRevoluteJointDef();
    hingeDef.base.bodyIdA = this.#chassisId;
    hingeDef.base.bodyIdB = this.#armId;
    hingeDef.base.localFrameA = {
      p: vec3(
        this.#geometry.armPivotLocal.x,
        this.#geometry.armPivotLocal.y,
        this.#geometry.armPivotLocal.z,
      ),
      q: identityQuat(),
    };
    hingeDef.base.localFrameB = { p: vec3(), q: identityQuat() };
    hingeDef.base.collideConnected = false;
    this.#hingeId = b3.b3CreateRevoluteJoint(this.#worldId, hingeDef);
    this.#jointIds.push(this.#hingeId);

    const selectedWheelWorld = b3.b3Body_GetWorldPoint(
      this.#chassisId,
      this.#geometry.wheelEndpointLocal,
    );
    this.#selectedWheelId = this.#createWheel(selectedWheelWorld);
    this.#selectedSpinJointId = this.#createSpinJoint(
      this.#armId,
      this.#selectedWheelId,
      this.#armToWheel,
      true,
    );

    for (const front of [true, false]) {
      for (const left of [true, false]) {
        if (!front && left) continue;
        const local = vec3(
          front
            ? REP2_CARRIER_CONFIG.axleHalfSpacing
            : -REP2_CARRIER_CONFIG.axleHalfSpacing,
          REP2_CARRIER_CONFIG.wheelRadius - REP2_CARRIER_CONFIG.chassisCenterY,
          left ? -REP2_CARRIER_CONFIG.trackHalfWidth : REP2_CARRIER_CONFIG.trackHalfWidth,
        );
        const wheelWorld = b3.b3Body_GetWorldPoint(this.#chassisId, local);
        const wheelId = this.#createWheel(wheelWorld);
        const driven = !front;
        const spinJointId = this.#createSpinJoint(
          this.#chassisId,
          wheelId,
          local,
          driven,
        );
        this.#directWheels.push({ wheelId, spinJointId, driven });
      }
    }
    const oppositeRear = this.#directWheels.find((wheel) => wheel.driven);
    if (oppositeRear === undefined) {
      throw new Error("Rep2 opposite rear baseline wheel was not created.");
    }
    this.#oppositeRear = oppositeRear;
  }

  get geometry(): Rep2SuspensionGeometry {
    return this.#geometry;
  }

  #createWheel(position: b3Vec3): b3BodyId {
    const wheelId = dynamicBody(this.#b3, this.#worldId, position);
    this.#bodyIds.push(wheelId);
    const shapeDef = this.#b3.b3DefaultShapeDef();
    shapeDef.density = REP2_CARRIER_CONFIG.wheelDensity;
    shapeDef.baseMaterial.friction = 1.15;
    shapeDef.baseMaterial.rollingResistance = 0.015;
    shapeDef.filter.groupIndex = -3;
    shapeDef.enableContactEvents = true;
    this.#shapeIds.push(
      this.#b3.b3CreateSphereShape(wheelId, shapeDef, {
        center: vec3(),
        radius: REP2_CARRIER_CONFIG.wheelRadius,
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
    if (driven) this.#drivenSpinJoints.push(id);
    return id;
  }

  setDrive(value: number): void {
    if (!Number.isFinite(value)) throw new RangeError("Drive must be finite.");
    this.#drive = Math.max(-1, Math.min(1, value));
  }

  step(count = 1): Rep2SuspensionTrace {
    this.#assertActive();
    for (let index = 0; index < count; index += 1) {
      for (const jointId of this.#drivenSpinJoints) {
        this.#b3.b3RevoluteJoint_EnableMotor(jointId, true);
        this.#b3.b3RevoluteJoint_SetMotorSpeed(
          jointId,
          -this.#drive * REP2_CARRIER_CONFIG.maxWheelSpeed,
        );
        this.#b3.b3RevoluteJoint_SetMaxMotorTorque(
          jointId,
          Math.abs(this.#drive) * REP2_CARRIER_CONFIG.driveTorque,
        );
        this.#b3.b3Joint_WakeBodies(jointId);
      }
      this.#b3.b3World_Step(this.#worldId, FIXED_DT, SUBSTEPS);
      this.#step += 1;
    }
    return this.trace();
  }

  #frame(bodyId: b3BodyId): Rep2BodyFrame {
    return {
      position: { ...this.#b3.b3Body_GetPosition(bodyId) },
      rotation: cloneQuat(this.#b3.b3Body_GetRotation(bodyId)),
    };
  }

  #contactCount(bodyId: b3BodyId): number {
    this.#b3.getBodyContactData(this.#contacts, bodyId);
    return this.#b3.getNumContacts(this.#contacts);
  }

  trace(): Rep2SuspensionTrace {
    this.#assertActive();
    return {
      step: this.#step,
      chassis: this.#frame(this.#chassisId),
      chassisVelocity: { ...this.#b3.b3Body_GetLinearVelocity(this.#chassisId) },
      arm: this.#frame(this.#armId),
      selectedWheel: this.#frame(this.#selectedWheelId),
      oppositeRearWheel: this.#frame(this.#oppositeRear.wheelId),
      hingeWorldFromChassis: {
        ...this.#b3.b3Body_GetWorldPoint(
          this.#chassisId,
          this.#geometry.armPivotLocal,
        ),
      },
      hingeWorldFromArm: {
        ...this.#b3.b3Body_GetWorldPoint(this.#armId, vec3()),
      },
      wheelEndpointWorldFromArm: {
        ...this.#b3.b3Body_GetWorldPoint(this.#armId, this.#armToWheel),
      },
      wheelCenterWorld: {
        ...this.#b3.b3Body_GetPosition(this.#selectedWheelId),
      },
      oppositeRearAnchorWorld: {
        ...this.#b3.b3Body_GetWorldPoint(
          this.#chassisId,
          vec3(
            -REP2_CARRIER_CONFIG.axleHalfSpacing,
            REP2_CARRIER_CONFIG.wheelRadius - REP2_CARRIER_CONFIG.chassisCenterY,
            REP2_CARRIER_CONFIG.trackHalfWidth,
          ),
        ),
      },
      armLength: this.#armLength,
      hingeAngle: this.#b3.b3RevoluteJoint_GetAngle(this.#hingeId),
      selectedWheelContacts: this.#contactCount(this.#selectedWheelId),
      worldContacts: this.#b3.b3World_GetCounters(this.#worldId).contactCount,
      ownedBodyCount: this.#bodyIds.length,
      ownedJointCount: this.#jointIds.length,
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
    if (this.#disposed) throw new Error("Rep2 suspension-link world is disposed.");
  }
}
