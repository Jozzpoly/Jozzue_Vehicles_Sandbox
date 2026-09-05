import Box3DFactory from "box3d.js/inline";
import type {
  Box3DModule,
  b3BodyId,
  b3JointId,
  b3Quat,
  b3Vec3,
  b3WorldId,
} from "box3d.js";
import { identityQuat, rotateVector, vec3 } from "../v0/math.js";
import { quaternionFromLocalZToAxis } from "../rep3/hinge-axis-probe.js";

const STEP_DT = 1 / 60;
const SUBSTEPS = 4;
const DEFAULT_STEPS = 90;
const ARM_MASS = 3;
const UPRIGHT_MASS = 5;
const ARM_INERTIA = 0.18;
const UPRIGHT_INERTIA = 0.12;
const SOLVER_EXTENT_HALF = 0.02;
const INITIAL_UPRIGHT_IMPULSE = Object.freeze(vec3(0, -0.8, 0));
const MIN_HINGE_SPAN = 1e-5;
const MIN_ARM_REACH = 1e-4;

export const S0_TWO_ARM_APPARATUS = Object.freeze({
  box3dPackage: "box3d.js@0.0.2" as const,
  timeStep: STEP_DT,
  substeps: SUBSTEPS,
  defaultSteps: DEFAULT_STEPS,
  armMass: ARM_MASS,
  uprightMass: UPRIGHT_MASS,
  initialUprightImpulse: INITIAL_UPRIGHT_IMPULSE,
  minHingeSpan: MIN_HINGE_SPAN,
  minArmReach: MIN_ARM_REACH,
});

export interface S0ArmAuthority {
  readonly inboardAWorld: Readonly<b3Vec3>;
  readonly inboardBWorld: Readonly<b3Vec3>;
  readonly outboardWorld: Readonly<b3Vec3>;
}

export interface S0TwoArmAuthority {
  readonly upper: S0ArmAuthority;
  readonly lower: S0ArmAuthority;
}

export interface S0DerivedArmRelation {
  readonly pivotWorld: b3Vec3;
  readonly axisWorld: b3Vec3;
  readonly hingeSpan: number;
  readonly outboardLocal: b3Vec3;
  readonly armReach: number;
}

export interface S0TwoArmDerivedRelation {
  readonly upper: S0DerivedArmRelation;
  readonly lower: S0DerivedArmRelation;
  readonly uprightOriginWorld: b3Vec3;
  readonly uprightUpperLocal: b3Vec3;
  readonly uprightLowerLocal: b3Vec3;
}

export interface S0TwoArmSnapshot {
  readonly uprightOriginWorld: b3Vec3;
  readonly upperArmOutboardWorld: b3Vec3;
  readonly lowerArmOutboardWorld: b3Vec3;
  readonly uprightUpperAnchorWorld: b3Vec3;
  readonly uprightLowerAnchorWorld: b3Vec3;
  readonly upperHingePivotAWorld: b3Vec3;
  readonly upperHingePivotBWorld: b3Vec3;
  readonly lowerHingePivotAWorld: b3Vec3;
  readonly lowerHingePivotBWorld: b3Vec3;
  readonly upperHingeAxisAWorld: b3Vec3;
  readonly upperHingeAxisBWorld: b3Vec3;
  readonly lowerHingeAxisAWorld: b3Vec3;
  readonly lowerHingeAxisBWorld: b3Vec3;
  readonly uprightLinearVelocity: b3Vec3;
  readonly uprightAngularVelocity: b3Vec3;
}

export interface S0TwoArmResult {
  readonly apparatus: typeof S0_TWO_ARM_APPARATUS;
  readonly authority: S0TwoArmAuthority;
  readonly derived: S0TwoArmDerivedRelation;
  readonly expectedBodies: {
    readonly support: b3BodyId;
    readonly upperArm: b3BodyId;
    readonly lowerArm: b3BodyId;
    readonly upright: b3BodyId;
  };
  readonly nativeJointBodies: {
    readonly upperHingeA: b3BodyId;
    readonly upperHingeB: b3BodyId;
    readonly lowerHingeA: b3BodyId;
    readonly lowerHingeB: b3BodyId;
    readonly upperBallA: b3BodyId;
    readonly upperBallB: b3BodyId;
    readonly lowerBallA: b3BodyId;
    readonly lowerBallB: b3BodyId;
  };
  readonly initial: S0TwoArmSnapshot;
  readonly final: S0TwoArmSnapshot;
  readonly uprightPath: readonly b3Vec3[];
  readonly steps: number;
  readonly maxUpperBallSeparation: number;
  readonly maxLowerBallSeparation: number;
  readonly maxUpperHingePivotSeparation: number;
  readonly maxLowerHingePivotSeparation: number;
  readonly maxPlanarDrift: number;
  readonly maxUprightLinearSpeed: number;
  readonly maxUprightAngularSpeed: number;
  readonly maxUprightDisplacement: number;
  readonly upperHingeAxisAAlignmentError: number;
  readonly upperHingeAxisBAlignmentError: number;
  readonly lowerHingeAxisAAlignmentError: number;
  readonly lowerHingeAxisBAlignmentError: number;
}

const clone = (v: Readonly<b3Vec3>) => vec3(v.x, v.y, v.z);
const add = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => vec3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => vec3(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (v: Readonly<b3Vec3>, s: number) => vec3(v.x * s, v.y * s, v.z * s);
const mag = (v: Readonly<b3Vec3>) => Math.hypot(v.x, v.y, v.z);
const dist = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => mag(sub(a, b));
const dot = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => a.x * b.x + a.y * b.y + a.z * b.z;
const norm = (v: Readonly<b3Vec3>) => mul(v, 1 / mag(v));
const finite = (v: Readonly<b3Vec3>) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
const axisError = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => 1 - Math.abs(dot(norm(a), norm(b)));

function massData(mass: number, center: b3Vec3, inertia: number) {
  return {
    mass,
    center,
    inertia: {
      cx: vec3(inertia, 0, 0),
      cy: vec3(0, inertia, 0),
      cz: vec3(0, 0, inertia),
    },
  };
}

function frameWorldAxis(b3: Box3DModule, bodyId: b3BodyId, q: b3Quat): b3Vec3 {
  return norm(rotateVector(b3.b3Body_GetRotation(bodyId), rotateVector(q, vec3(0, 0, 1))));
}

function deriveArm(authority: S0ArmAuthority, label: string): S0DerivedArmRelation {
  if (!finite(authority.inboardAWorld) || !finite(authority.inboardBWorld) || !finite(authority.outboardWorld)) {
    throw new RangeError(`S0 ${label} hardpoints must be finite.`);
  }
  const hingeDelta = sub(authority.inboardBWorld, authority.inboardAWorld);
  const hingeSpan = mag(hingeDelta);
  if (hingeSpan <= MIN_HINGE_SPAN) {
    throw new RangeError(`S0 ${label} hinge must span more than ${MIN_HINGE_SPAN} m.`);
  }
  const pivotWorld = mul(add(authority.inboardAWorld, authority.inboardBWorld), 0.5);
  const outboardLocal = sub(authority.outboardWorld, pivotWorld);
  const armReach = mag(outboardLocal);
  if (armReach <= MIN_ARM_REACH) {
    throw new RangeError(`S0 ${label} arm reach must exceed ${MIN_ARM_REACH} m.`);
  }
  return Object.freeze({
    pivotWorld,
    axisWorld: mul(hingeDelta, 1 / hingeSpan),
    hingeSpan,
    outboardLocal,
    armReach,
  });
}

export function deriveS0TwoArmRelation(authority: S0TwoArmAuthority): S0TwoArmDerivedRelation {
  const upper = deriveArm(authority.upper, "upper");
  const lower = deriveArm(authority.lower, "lower");
  if (dist(authority.upper.outboardWorld, authority.lower.outboardWorld) <= MIN_ARM_REACH) {
    throw new RangeError("S0 upper/lower outboard hardpoints must be distinct.");
  }
  const uprightOriginWorld = mul(add(authority.upper.outboardWorld, authority.lower.outboardWorld), 0.5);
  return Object.freeze({
    upper,
    lower,
    uprightOriginWorld,
    uprightUpperLocal: sub(authority.upper.outboardWorld, uprightOriginWorld),
    uprightLowerLocal: sub(authority.lower.outboardWorld, uprightOriginWorld),
  });
}

class S0TwoArmWorld {
  readonly #b3: Box3DModule;
  readonly #worldId: b3WorldId;
  readonly #supportId: b3BodyId;
  readonly #upperArmId: b3BodyId;
  readonly #lowerArmId: b3BodyId;
  readonly #uprightId: b3BodyId;
  readonly #upperHingeId: b3JointId;
  readonly #lowerHingeId: b3JointId;
  readonly #upperBallId: b3JointId;
  readonly #lowerBallId: b3JointId;
  readonly #authority: S0TwoArmAuthority;
  readonly #derived: S0TwoArmDerivedRelation;
  #disposed = false;

  static async create(authority: S0TwoArmAuthority): Promise<S0TwoArmWorld> {
    const derived = deriveS0TwoArmRelation(authority);
    const owned = Object.freeze({
      upper: Object.freeze({
        inboardAWorld: clone(authority.upper.inboardAWorld),
        inboardBWorld: clone(authority.upper.inboardBWorld),
        outboardWorld: clone(authority.upper.outboardWorld),
      }),
      lower: Object.freeze({
        inboardAWorld: clone(authority.lower.inboardAWorld),
        inboardBWorld: clone(authority.lower.inboardBWorld),
        outboardWorld: clone(authority.lower.outboardWorld),
      }),
    });
    return new S0TwoArmWorld(await Box3DFactory(), owned, derived);
  }

  private constructor(b3: Box3DModule, authority: S0TwoArmAuthority, derived: S0TwoArmDerivedRelation) {
    this.#b3 = b3;
    this.#authority = authority;
    this.#derived = derived;

    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3();
    this.#worldId = b3.b3CreateWorld(worldDef);

    const supportDef = b3.b3DefaultBodyDef();
    supportDef.position = vec3();
    this.#supportId = b3.b3CreateBody(this.#worldId, supportDef);

    this.#upperArmId = this.#createArm(derived.upper);
    this.#lowerArmId = this.#createArm(derived.lower);
    this.#uprightId = this.#createUpright(derived.uprightOriginWorld);
    this.#upperHingeId = this.#createHinge(this.#upperArmId, derived.upper);
    this.#lowerHingeId = this.#createHinge(this.#lowerArmId, derived.lower);
    this.#upperBallId = this.#createBall(this.#upperArmId, derived.upper.outboardLocal, derived.uprightUpperLocal);
    this.#lowerBallId = this.#createBall(this.#lowerArmId, derived.lower.outboardLocal, derived.uprightLowerLocal);
  }

  #createDynamicBody(position: Readonly<b3Vec3>, mass: number, center: b3Vec3, inertia: number): b3BodyId {
    const def = this.#b3.b3DefaultBodyDef();
    def.type = this.#b3.b3BodyType.b3_dynamicBody;
    def.position = clone(position);
    def.enableSleep = false;
    const id = this.#b3.b3CreateBody(this.#worldId, def);
    const shapeDef = this.#b3.b3DefaultShapeDef();
    shapeDef.density = 1;
    this.#b3.b3CreateBoxShape(id, shapeDef, SOLVER_EXTENT_HALF, SOLVER_EXTENT_HALF, SOLVER_EXTENT_HALF);
    this.#b3.b3Body_SetMassData(id, massData(mass, center, inertia));
    this.#b3.b3Body_SetTransform(id, this.#b3.b3Body_GetPosition(id), this.#b3.b3Body_GetRotation(id));
    return id;
  }

  #createArm(relation: S0DerivedArmRelation): b3BodyId {
    return this.#createDynamicBody(relation.pivotWorld, ARM_MASS, mul(relation.outboardLocal, 0.5), ARM_INERTIA);
  }

  #createUpright(position: Readonly<b3Vec3>): b3BodyId {
    return this.#createDynamicBody(position, UPRIGHT_MASS, vec3(), UPRIGHT_INERTIA);
  }

  #createHinge(bodyId: b3BodyId, relation: S0DerivedArmRelation): b3JointId {
    const q = quaternionFromLocalZToAxis(relation.axisWorld);
    const def = this.#b3.b3DefaultRevoluteJointDef();
    def.base.bodyIdA = this.#supportId;
    def.base.bodyIdB = bodyId;
    def.base.localFrameA = { p: clone(relation.pivotWorld), q };
    def.base.localFrameB = { p: vec3(), q };
    def.base.collideConnected = false;
    return this.#b3.b3CreateRevoluteJoint(this.#worldId, def);
  }

  #createBall(armBodyId: b3BodyId, armLocal: Readonly<b3Vec3>, uprightLocal: Readonly<b3Vec3>): b3JointId {
    const def = this.#b3.b3DefaultSphericalJointDef();
    def.base.bodyIdA = armBodyId;
    def.base.bodyIdB = this.#uprightId;
    def.base.localFrameA = { p: clone(armLocal), q: identityQuat() };
    def.base.localFrameB = { p: clone(uprightLocal), q: identityQuat() };
    def.base.collideConnected = false;
    return this.#b3.b3CreateSphericalJoint(this.#worldId, def);
  }

  snapshot(): S0TwoArmSnapshot {
    this.#assertActive();
    const uhA = this.#b3.b3Joint_GetLocalFrameA(this.#upperHingeId);
    const uhB = this.#b3.b3Joint_GetLocalFrameB(this.#upperHingeId);
    const lhA = this.#b3.b3Joint_GetLocalFrameA(this.#lowerHingeId);
    const lhB = this.#b3.b3Joint_GetLocalFrameB(this.#lowerHingeId);
    const ubA = this.#b3.b3Joint_GetLocalFrameA(this.#upperBallId);
    const ubB = this.#b3.b3Joint_GetLocalFrameB(this.#upperBallId);
    const lbA = this.#b3.b3Joint_GetLocalFrameA(this.#lowerBallId);
    const lbB = this.#b3.b3Joint_GetLocalFrameB(this.#lowerBallId);

    return Object.freeze({
      uprightOriginWorld: clone(this.#b3.b3Body_GetPosition(this.#uprightId)),
      upperArmOutboardWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#upperArmId, ubA.p)),
      lowerArmOutboardWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#lowerArmId, lbA.p)),
      uprightUpperAnchorWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#uprightId, ubB.p)),
      uprightLowerAnchorWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#uprightId, lbB.p)),
      upperHingePivotAWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#supportId, uhA.p)),
      upperHingePivotBWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#upperArmId, uhB.p)),
      lowerHingePivotAWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#supportId, lhA.p)),
      lowerHingePivotBWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#lowerArmId, lhB.p)),
      upperHingeAxisAWorld: frameWorldAxis(this.#b3, this.#supportId, uhA.q),
      upperHingeAxisBWorld: frameWorldAxis(this.#b3, this.#upperArmId, uhB.q),
      lowerHingeAxisAWorld: frameWorldAxis(this.#b3, this.#supportId, lhA.q),
      lowerHingeAxisBWorld: frameWorldAxis(this.#b3, this.#lowerArmId, lhB.q),
      uprightLinearVelocity: clone(this.#b3.b3Body_GetLinearVelocity(this.#uprightId)),
      uprightAngularVelocity: clone(this.#b3.b3Body_GetAngularVelocity(this.#uprightId)),
    });
  }

  run(steps = DEFAULT_STEPS): S0TwoArmResult {
    this.#assertActive();
    if (!Number.isInteger(steps) || steps <= 0) throw new RangeError("S0 step count must be a positive integer.");

    const initial = this.snapshot();
    const uprightPath: b3Vec3[] = [clone(initial.uprightOriginWorld)];
    let maxUpperBallSeparation = 0;
    let maxLowerBallSeparation = 0;
    let maxUpperHingePivotSeparation = 0;
    let maxLowerHingePivotSeparation = 0;
    let maxPlanarDrift = Math.abs(initial.uprightOriginWorld.z);
    let maxUprightLinearSpeed = 0;
    let maxUprightAngularSpeed = 0;
    let maxUprightDisplacement = 0;

    this.#b3.b3Body_ApplyLinearImpulseToCenter(this.#uprightId, clone(INITIAL_UPRIGHT_IMPULSE), true);

    for (let i = 0; i < steps; i += 1) {
      this.#b3.b3World_Step(this.#worldId, STEP_DT, SUBSTEPS);
      const s = this.snapshot();
      uprightPath.push(clone(s.uprightOriginWorld));
      maxUpperBallSeparation = Math.max(maxUpperBallSeparation, dist(s.upperArmOutboardWorld, s.uprightUpperAnchorWorld));
      maxLowerBallSeparation = Math.max(maxLowerBallSeparation, dist(s.lowerArmOutboardWorld, s.uprightLowerAnchorWorld));
      maxUpperHingePivotSeparation = Math.max(maxUpperHingePivotSeparation, dist(s.upperHingePivotAWorld, s.upperHingePivotBWorld));
      maxLowerHingePivotSeparation = Math.max(maxLowerHingePivotSeparation, dist(s.lowerHingePivotAWorld, s.lowerHingePivotBWorld));
      maxPlanarDrift = Math.max(maxPlanarDrift, Math.abs(s.uprightOriginWorld.z), Math.abs(s.upperArmOutboardWorld.z), Math.abs(s.lowerArmOutboardWorld.z));
      maxUprightLinearSpeed = Math.max(maxUprightLinearSpeed, mag(s.uprightLinearVelocity));
      maxUprightAngularSpeed = Math.max(maxUprightAngularSpeed, mag(s.uprightAngularVelocity));
      maxUprightDisplacement = Math.max(maxUprightDisplacement, dist(initial.uprightOriginWorld, s.uprightOriginWorld));
    }

    const final = this.snapshot();
    return Object.freeze({
      apparatus: S0_TWO_ARM_APPARATUS,
      authority: this.#authority,
      derived: this.#derived,
      expectedBodies: Object.freeze({ support: this.#supportId, upperArm: this.#upperArmId, lowerArm: this.#lowerArmId, upright: this.#uprightId }),
      nativeJointBodies: Object.freeze({
        upperHingeA: this.#b3.b3Joint_GetBodyA(this.#upperHingeId),
        upperHingeB: this.#b3.b3Joint_GetBodyB(this.#upperHingeId),
        lowerHingeA: this.#b3.b3Joint_GetBodyA(this.#lowerHingeId),
        lowerHingeB: this.#b3.b3Joint_GetBodyB(this.#lowerHingeId),
        upperBallA: this.#b3.b3Joint_GetBodyA(this.#upperBallId),
        upperBallB: this.#b3.b3Joint_GetBodyB(this.#upperBallId),
        lowerBallA: this.#b3.b3Joint_GetBodyA(this.#lowerBallId),
        lowerBallB: this.#b3.b3Joint_GetBodyB(this.#lowerBallId),
      }),
      initial,
      final,
      uprightPath: Object.freeze(uprightPath),
      steps,
      maxUpperBallSeparation,
      maxLowerBallSeparation,
      maxUpperHingePivotSeparation,
      maxLowerHingePivotSeparation,
      maxPlanarDrift,
      maxUprightLinearSpeed,
      maxUprightAngularSpeed,
      maxUprightDisplacement,
      upperHingeAxisAAlignmentError: axisError(final.upperHingeAxisAWorld, this.#derived.upper.axisWorld),
      upperHingeAxisBAlignmentError: axisError(final.upperHingeAxisBWorld, this.#derived.upper.axisWorld),
      lowerHingeAxisAAlignmentError: axisError(final.lowerHingeAxisAWorld, this.#derived.lower.axisWorld),
      lowerHingeAxisBAlignmentError: axisError(final.lowerHingeAxisBWorld, this.#derived.lower.axisWorld),
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#b3.b3DestroyWorld(this.#worldId);
  }

  #assertActive(): void {
    if (this.#disposed) throw new Error("S0 two-arm world is disposed.");
  }
}

export async function runS0TwoArmProbe(authority: S0TwoArmAuthority, steps = DEFAULT_STEPS): Promise<S0TwoArmResult> {
  const world = await S0TwoArmWorld.create(authority);
  try {
    return world.run(steps);
  } finally {
    world.dispose();
  }
}
