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

const STEP_DT = 1 / 240;
const MIN_EYE_SEPARATION = 1e-4;

export interface Rep2CoiloverComponent {
  readonly springStiffness: number;
  readonly dampingCoefficient: number;
  readonly restLength: number;
}

export interface Rep2CoiloverBenchGeometry {
  readonly chassisEyeLocal: Readonly<b3Vec3>;
  readonly armEyeLocal: Readonly<b3Vec3>;
}

export interface Rep2CoiloverForceTrace {
  readonly hingeAngle: number;
  readonly chassisEyeWorld: b3Vec3;
  readonly armEyeWorld: b3Vec3;
  readonly chassisEyeVelocity: b3Vec3;
  readonly armEyeVelocity: b3Vec3;
  readonly axisFromChassisToArm: b3Vec3;
  readonly currentLength: number;
  readonly extension: number;
  readonly relativeAxialSpeed: number;
  readonly springContribution: number;
  readonly dampingContribution: number;
  readonly axialForceOnArm: number;
  readonly forceOnChassis: b3Vec3;
  readonly forceOnArm: b3Vec3;
  readonly armEyeLeverFromHinge: b3Vec3;
  readonly momentOnArmAboutHinge: b3Vec3;
  readonly armAngularVelocity: b3Vec3;
}

export interface Rep2CoiloverBenchOptions {
  readonly geometry: Rep2CoiloverBenchGeometry;
  readonly component: Rep2CoiloverComponent;
  readonly initialArmAngleRadians?: number;
  readonly armMass?: number;
  readonly armLength?: number;
}

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function finitePoint(value: Readonly<b3Vec3>): boolean {
  return finite(value.x) && finite(value.y) && finite(value.z);
}

function add(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): b3Vec3 {
  return vec3(a.x + b.x, a.y + b.y, a.z + b.z);
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

function negate(value: Readonly<b3Vec3>): b3Vec3 {
  return vec3(-value.x, -value.y, -value.z);
}

function quatAboutZ(angle: number): b3Quat {
  const half = 0.5 * angle;
  return { v: vec3(0, 0, Math.sin(half)), s: Math.cos(half) };
}

function diagonalMassData(
  mass: number,
  center: b3Vec3,
  inertia: b3Vec3,
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

function clonePoint(value: Readonly<b3Vec3>): b3Vec3 {
  return vec3(value.x, value.y, value.z);
}

function validateOptions(options: Rep2CoiloverBenchOptions): Required<Rep2CoiloverBenchOptions> {
  const geometry: Rep2CoiloverBenchGeometry = Object.freeze({
    chassisEyeLocal: Object.freeze(clonePoint(options.geometry.chassisEyeLocal)),
    armEyeLocal: Object.freeze(clonePoint(options.geometry.armEyeLocal)),
  });
  const component: Rep2CoiloverComponent = Object.freeze({
    springStiffness: options.component.springStiffness,
    dampingCoefficient: options.component.dampingCoefficient,
    restLength: options.component.restLength,
  });
  const initialArmAngleRadians = options.initialArmAngleRadians ?? 0;
  const armMass = options.armMass ?? 8;
  const armLength = options.armLength ?? 0.7;

  if (!finitePoint(geometry.chassisEyeLocal) || !finitePoint(geometry.armEyeLocal)) {
    throw new RangeError("Rep2 C0 attachment points must be finite.");
  }
  if (
    !finite(component.springStiffness) ||
    !finite(component.dampingCoefficient) ||
    !finite(component.restLength) ||
    component.springStiffness < 0 ||
    component.dampingCoefficient < 0 ||
    component.restLength < MIN_EYE_SEPARATION
  ) {
    throw new RangeError("Rep2 C0 spring properties must be finite and non-negative with a positive rest length.");
  }
  if (!finite(initialArmAngleRadians) || !finite(armMass) || !finite(armLength) || armMass <= 0 || armLength <= 0) {
    throw new RangeError("Rep2 C0 arm properties must be finite and positive.");
  }

  return {
    geometry,
    component,
    initialArmAngleRadians,
    armMass,
    armLength,
  };
}

export function makeRep2VerticalCoiloverGeometry(
  attachmentRadius: number,
  verticalSeparation: number,
): Rep2CoiloverBenchGeometry {
  if (!finite(attachmentRadius) || !finite(verticalSeparation) || verticalSeparation <= MIN_EYE_SEPARATION) {
    throw new RangeError("Rep2 C0 vertical fixture dimensions must be finite with positive separation.");
  }
  return Object.freeze({
    chassisEyeLocal: Object.freeze(vec3(-attachmentRadius, verticalSeparation, 0)),
    armEyeLocal: Object.freeze(vec3(-attachmentRadius, 0, 0)),
  });
}

export class Rep2CoiloverForceBench {
  readonly #b3: Box3DModule;
  readonly #worldId: b3WorldId;
  readonly #baseId: b3BodyId;
  readonly #armId: b3BodyId;
  readonly #hingeId: b3JointId;
  readonly #geometry: Rep2CoiloverBenchGeometry;
  readonly #component: Rep2CoiloverComponent;
  #disposed = false;

  static async create(options: Rep2CoiloverBenchOptions): Promise<Rep2CoiloverForceBench> {
    const validated = validateOptions(options);
    return new Rep2CoiloverForceBench(await Box3DFactory(), validated);
  }

  private constructor(
    b3: Box3DModule,
    options: Required<Rep2CoiloverBenchOptions>,
  ) {
    this.#b3 = b3;
    this.#geometry = options.geometry;
    this.#component = options.component;

    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3();
    this.#worldId = b3.b3CreateWorld(worldDef);

    const baseDef = b3.b3DefaultBodyDef();
    baseDef.position = vec3();
    baseDef.rotation = identityQuat();
    this.#baseId = b3.b3CreateBody(this.#worldId, baseDef);

    const armDef = b3.b3DefaultBodyDef();
    armDef.type = b3.b3BodyType.b3_dynamicBody;
    armDef.position = vec3();
    armDef.rotation = quatAboutZ(options.initialArmAngleRadians);
    armDef.enableSleep = false;
    this.#armId = b3.b3CreateBody(this.#worldId, armDef);

    const rodInertia = (options.armMass * options.armLength * options.armLength) / 12;
    b3.b3Body_SetMassData(
      this.#armId,
      diagonalMassData(
        options.armMass,
        vec3(-0.5 * options.armLength, 0, 0),
        vec3(Math.max(0.002, 0.05 * rodInertia), rodInertia, rodInertia),
      ),
    );

    const hingeDef = b3.b3DefaultRevoluteJointDef();
    hingeDef.base.bodyIdA = this.#baseId;
    hingeDef.base.bodyIdB = this.#armId;
    hingeDef.base.localFrameA = { p: vec3(), q: identityQuat() };
    hingeDef.base.localFrameB = { p: vec3(), q: identityQuat() };
    hingeDef.base.collideConnected = false;
    this.#hingeId = b3.b3CreateRevoluteJoint(this.#worldId, hingeDef);
  }

  get geometry(): Rep2CoiloverBenchGeometry {
    return this.#geometry;
  }

  get component(): Rep2CoiloverComponent {
    return this.#component;
  }

  #eyeVelocity(bodyId: b3BodyId, eyeWorld: Readonly<b3Vec3>): b3Vec3 {
    const linearVelocity = this.#b3.b3Body_GetLinearVelocity(bodyId);
    const angularVelocity = this.#b3.b3Body_GetAngularVelocity(bodyId);
    const centerOfMass = this.#b3.b3Body_GetWorldCenterOfMass(bodyId);
    const lever = subtract(eyeWorld, centerOfMass);
    return add(linearVelocity, cross(angularVelocity, lever));
  }

  trace(): Rep2CoiloverForceTrace {
    this.#assertActive();

    const chassisEyeWorld = this.#b3.b3Body_GetWorldPoint(
      this.#baseId,
      this.#geometry.chassisEyeLocal,
    );
    const armEyeWorld = this.#b3.b3Body_GetWorldPoint(
      this.#armId,
      this.#geometry.armEyeLocal,
    );
    const span = subtract(armEyeWorld, chassisEyeWorld);
    const currentLength = length(span);
    if (!finite(currentLength) || currentLength < MIN_EYE_SEPARATION) {
      throw new RangeError("Rep2 C0 live eye separation is singular.");
    }
    const axisFromChassisToArm = scale(span, 1 / currentLength);
    const chassisEyeVelocity = this.#eyeVelocity(this.#baseId, chassisEyeWorld);
    const armEyeVelocity = this.#eyeVelocity(this.#armId, armEyeWorld);
    const relativeVelocity = subtract(armEyeVelocity, chassisEyeVelocity);
    const relativeAxialSpeed = dot(relativeVelocity, axisFromChassisToArm);
    const extension = currentLength - this.#component.restLength;
    const springContribution = this.#component.springStiffness * extension;
    const dampingContribution = this.#component.dampingCoefficient * relativeAxialSpeed;
    const axialForceOnArm = -(springContribution + dampingContribution);
    const forceOnArm = scale(axisFromChassisToArm, axialForceOnArm);
    const forceOnChassis = negate(forceOnArm);
    const hingeWorld = this.#b3.b3Body_GetWorldPoint(this.#armId, vec3());
    const armEyeLeverFromHinge = subtract(armEyeWorld, hingeWorld);
    const momentOnArmAboutHinge = cross(armEyeLeverFromHinge, forceOnArm);

    return {
      hingeAngle: this.#b3.b3RevoluteJoint_GetAngle(this.#hingeId),
      chassisEyeWorld: clonePoint(chassisEyeWorld),
      armEyeWorld: clonePoint(armEyeWorld),
      chassisEyeVelocity,
      armEyeVelocity,
      axisFromChassisToArm,
      currentLength,
      extension,
      relativeAxialSpeed,
      springContribution,
      dampingContribution,
      axialForceOnArm,
      forceOnChassis,
      forceOnArm,
      armEyeLeverFromHinge,
      momentOnArmAboutHinge,
      armAngularVelocity: clonePoint(this.#b3.b3Body_GetAngularVelocity(this.#armId)),
    };
  }

  applyForce(): Rep2CoiloverForceTrace {
    const trace = this.trace();
    this.#b3.b3Body_ApplyForce(this.#baseId, trace.forceOnChassis, trace.chassisEyeWorld, true);
    this.#b3.b3Body_ApplyForce(this.#armId, trace.forceOnArm, trace.armEyeWorld, true);
    return trace;
  }

  step(count = 1): Rep2CoiloverForceTrace {
    this.#assertActive();
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError("Rep2 C0 step count must be a non-negative integer.");
    }
    for (let index = 0; index < count; index += 1) {
      this.applyForce();
      this.#b3.b3World_Step(this.#worldId, STEP_DT, 1);
    }
    return this.trace();
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#b3.b3DestroyWorld(this.#worldId);
  }

  #assertActive(): void {
    if (this.#disposed) throw new Error("Rep2 C0 bench is disposed.");
  }
}
