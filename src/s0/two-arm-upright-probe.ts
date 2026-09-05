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

/**
 * S0 authored geometry only. There are deliberately no solver-local frames,
 * joint axes, or upright-local anchors in the authority record.
 */
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

function finiteVec3(value: Readonly<b3Vec3>): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function cloneVec3(value: Readonly<b3Vec3>): b3Vec3 {
  return vec3(value.x, value.y, value.z);
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

function magnitude(value: Readonly<b3Vec3>): number {
  return Math.hypot(value.x, value.y, value.z);
}

function distance(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): number {
  return magnitude(subtract(a, b));
}

function normalize(value: Readonly<b3Vec3>): b3Vec3 {
  return scale(value, 1 / magnitude(value));
}

function axisAlignmentError(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): number {
  return 1 - Math.abs(dot(normalize(a), normalize(b)));
}

function diagonalMassData(mass: number, center: b3Vec3, inertia: number) {
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

function frameWorldAxis(
  b3: Box3DModule,
  bodyId: b3BodyId,
  frameQ: b3Quat,
): b3Vec3 {
  const axisInBody = rotateVector(frameQ, vec3(0, 0, 1));
  return normalize(rotateVector(b3.b3Body_GetRotation(bodyId), axisInBody));
}

function deriveArm(authority: S0ArmAuthority, label: string): S0DerivedArmRelation {
  for (const [name, value] of [
    ["inboardAWorld", authority.inboardAWorld],
    ["inboardBWorld", authority.inboardBWorld],
    ["outboardWorld", authority.outboardWorld],
  ] as const) {
    if (!finiteVec3(value)) {
      throw new RangeError(`S0 ${label}.${name} must be finite.`);
    }
  }

  const hingeDelta = subtract(authority.inboardBWorld, authority.inboardAWorld);
  const hingeSpan = magnitude(hingeDelta);
  if (!Number.isFinite(hingeSpan) || hingeSpan <= MIN_HINGE_SPAN) {
    throw new RangeError(`S0 ${label} hinge must span more than ${MIN_HINGE_SPAN} m.`);
  }

  const pivotWorld = scale(add(authority.inboardAWorld, authority.inboardBWorld), 0.5);
  const outboardLocal = subtract(authority.outboardWorld, pivotWorld);
  const armReach = magnitude(outboardLocal);
  if (!Number.isFinite(armReach) || armReach <= MIN_ARM_REACH) {
    throw new RangeError(`S0 ${label} arm reach must exceed ${MIN_ARM_REACH} m.`);
  }

  return Object.freeze({
    pivotWorld,
    axisWorld: scale(hingeDelta, 1 / hingeSpan),
    hingeSpan,
    outboardLocal,
    armReach,
  });
}

export function deriveS0TwoArmRelation(authority: S0TwoArmAuthority): S0TwoArmDerivedRelation {
  const upper = deriveArm(authority.upper, "upper");
  const lower = deriveArm(authority.lower, "lower");
  const uprightOriginWorld = scale(
    add(authority.upper.outboardWorld, authority.lower.outboardWorld),
    0.5,
  );
  const uprightUpperLocal = subtract(authority.upper.outboardWorld, uprightOriginWorld);
  const uprightLowerLocal = subtract(authority.lower.outboardWorld, uprightOriginWorld);
  if (distance(authority.upper.outboardWorld, authority.lower.outboardWorld) <= MIN_ARM_REACH) {
    throw new RangeError("S0 upper/lower outboard hardpoints must be distinct.");
  }

  return Object.freeze({
    upper,
    lower,
    uprightOriginWorld,
    uprightUpperLocal,
    uprightLowerLocal,
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
    const ownedAuthority = Object.freeze({
      upper: Object.freeze({
        inboardAWorld: cloneVec3(authority.upper.inboardAWorld),
        inboardBWorld: cloneVec3(authority.upper.inboardBWorld),
        outboardWorld: cloneVec3(authority.upper.outboardWorld),
      }),
      lower: Object.freeze({
        inboardAWorld: cloneVec3(authority.lower.inboardAWorld),
        inboardBWorld: cloneVec3(authority.lower.inboardBWorld),
        outboardWorld: cloneVec3(authority.lower.outboardWorld),
      }),
    });
    return new S0TwoArmWorld(await Box3DFactory(), ownedAuthority, derived);
  }

  private constructor(
    b3: Box3DModule,
    authority: S0TwoArmAuthority,
    derived: S0TwoArmDerivedRelation,
  ) {
    this.#b3 = b3;
    this.#authority = authority;
    this.#derived = derived;

    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3();
    this.#worldId = b3.b3CreateWorld(worldDef);

    const supportDef = b3.b3DefaultBodyDef();
    supportDef.position = vec3();
    this.#supportId = b3.b3CreateBody(this.#worldId, supportDef);

    this.#upperArmId = this.#createArmBody(derived.upper);
    this.#lowerArmId = this.#createArmBody(derived.lower);

    const uprightDef = b3.b3DefaultBodyDef();
    uprightDef.type = b3.b3BodyType.b3_dynamicBody;
    uprightDef.position = cloneVec3(derived.uprightOriginWorld);
    uprightDef.enableSleep = false;
    this.#uprightId = b3.b3CreateBody(this.#worldId, uprightDef);
    const uprightShapeDef = b3.b3DefaultShapeDef();
    uprightShapeDef.density = 1;
    b3.b3CreateBoxShape(
      this.#uprightId,
      uprightShapeDef,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
    );
    b3.b3Body_SetMassData(
      this.#uprightId,
      diagonalMassData(UPRIGHT_MASS, vec3(), UPRIGHT_INERTIA),
    );
    b3.b3Body_SetTransform(
      this.#uprightId,
      b3.b3Body_GetPosition(this.#uprightId),
      b3.b3Body_GetRotation(this.#uprightId),
    );

    this.#upperHingeId = this.#createHinge(this.#upperArmId, derived.upper);
    this.#lowerHingeId = this.#createHinge(this.#lowerArmId, derived.lower);
    this.#upperBallId = this.#createBall(
      this.#upperArmId,
      derived.upper.outboardLocal,
      derived.uprightUpperLocal,
    );
    this.#lowerBallId = this.#createBall(
      this.#lowerArmId,
      derived.lower.outboardLocal,
      derived.uprightLowerLocal,
    );
  }

  #createArmBody(relation: S0DerivedArmRelation): b3BodyId {
    const def = this.#b3.b3DefaultBodyDef();
    def.type = this.#b3.b3BodyType.b3_dynamicBody;
    def.position = cloneVec3(relation.pivotWorld);
    def.enableSleep = false;
    const bodyId = this.#b3.b3CreateBody(this.#worldId, def);
    const shapeDef = this.#b3.b3DefaultShapeDef();
    shapeDef.density = 1;
    this.#b3.b3CreateBoxShape(
      bodyId,
      shapeDef,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
    );
    this.#b3.b3Body_SetMassData(
      bodyId,
      diagonalMassData(ARM_MASS, scale(relation.outboardLocal, 0.5), ARM_INERTIA),
    );
    this.#b3.b3Body_SetTransform(
      bodyId,
      this.#b3.b3Body_GetPosition(bodyId),
      this.#b3.b3Body_GetRotation(bodyId),
    );
    return bodyId;
  }

  #createHinge(bodyId: b3BodyId, relation: S0DerivedArmRelation): b3JointId {
    const frameQ = quaternionFromLocalZToAxis(relation.axisWorld);
    const def = this.#b3.b3DefaultRevoluteJointDef();
    def.base.bodyIdA = this.#supportId;
    def.base.bodyIdB = bodyId;
    def.base.localFrameA = { p: cloneVec3(relation.pivotWorld), q: frameQ };
    def.base.localFrameB = { p: vec3(), q: frameQ };
    def.base.collideConnected = false;
    return this.#b3.b3CreateRevoluteJoint(this.#worldId, def);
  }

  #createBall(
    armBodyId: b3BodyId,
    armLocalAnchor: Readonly<b3Vec3>,
    uprightLocalAnchor: Readonly<b3Vec3>,
  ): b3JointId {
    const def = this.#b3.b3DefaultSphericalJointDef();
    def.base.bodyIdA = armBodyId;
    def.base.bodyIdB = this.#uprightId;
    def.base.localFrameA = { p: cloneVec3(armLocalAnchor), q: identityQuat() };
    def.base.localFrameB = { p: cloneVec3(uprightLocalAnchor), q: identityQuat() };
    def.base.collideConnected = false;
    return this.#b3.b3CreateSphericalJoint(this.#worldId, def);
  }

  snapshot(): S0TwoArmSnapshot {
    this.#assertActive();
    const upperHingeA = this.#b3.b3Joint_GetLocalFrameA(this.#upperHingeId);
    const upperHingeB = this.#b3.b3Joint_GetLocalFrameB(this.#upperHingeId);
    const lowerHingeA = this.#b3.b3Joint_GetLocalFrameA(this.#lowerHingeId);
    const lowerHingeB = this.#b3.b3Joint_GetLocalFrameB(this.#lowerHingeId);
    const upperBallA = this.#b3.b3Joint_GetLocalFrameA(this.#upperBallId);
    const upperBallB = this.#b3.b3Joint_GetLocalFrameB(this.#upperBallId);
    const lowerBallA = this.#b3.b3Joint_GetLocalFrameA(this.#lowerBallId);
    const lowerBallB = this.#b3.b3Joint_GetLocalFrameB(this.#lowerBallId);

    return Object.freeze({
      uprightOriginWorld: cloneVec3(this.#b3.b3Body_GetPosition(this.#uprightId)),
      upperArmOutboardWorld: cloneVec3(
        this.#b3.b3Body_GetWorldPoint(this.#upperArmId, upperBallA.p),
      ),
      lowerArmOutboardWorld: cloneVec3(
        this.#b3.b3Body_GetWorldPoint(this.#lowerArmId, lowerBallA.p),
      ),
      uprightUpperAnchorWorld: cloneVec3(
        this.#b3.b3Body_GetWorldPoint(this.#uprightId, upperBallB.p),
      ),
      uprightLowerAnchorWorld: cloneVec3(
        this.#b3.b3Body_GetWorldPoint(this.#uprightId, lowerBallB.p),
      ),
      upperHingePivotAWorld: cloneVec3(
        this.#b3.b3Body_GetWorldPoint(this.#supportId, upperHingeA.p),
      ),
      upperHingePivotBWorld: cloneVec3(
        this.#b3.b3Body_GetWorldPoint(this.#upperArmId, upperHingeB.p),
      ),
      lowerHingePivotAWorld: cloneVec3(
        this.#b3.b3Body_GetWorldPoint(this.#supportId, lowerHingeA.p),
      ),
      lowerHingePivotBWorld: cloneVec3(
        this.#b3.b3Body_GetWorldPoint(this.#lowerArmId, lowerHingeB.p),
      ),
      upperHingeAxisAWorld: frameWorldAxis(this.#b3, this.#supportId, upperHingeA.q),
      upperHingeAxisBWorld: frameWorldAxis(this.#b3, this.#upperArmId, upperHingeB.q),
      lowerHingeAxisAWorld: frameWorldAxis(this.#b3, this.#supportId, lowerHingeA.q),
      lowerHingeAxisBWorld: frameWorldAxis(this.#b3, this.#lowerArmId, lowerHingeB.q),
      uprightLinearVelocity: cloneVec3(this.#b3.b3Body_GetLinearVelocity(this.#uprightId)),
      uprightAngularVelocity: cloneVec3(this.#b3.b3Body_GetAngularVelocity(this.#uprightId)),
    });
  }

  run(steps = DEFAULT_STEPS): S0TwoArmResult {
    this.#assertActive();
    if (!Number.isInteger(steps) || steps <= 0) {
      throw new RangeError("S0 step count must be a positive integer.");
    }

    const initial = this.snapshot();
    const uprightPath: b3Vec3[] = [cloneVec3(initial.uprightOriginWorld)];
    let maxUpperBallSeparation = 0;
    let maxLowerBallSeparation = 0;
    let maxUpperHingePivotSeparation = 0;
    let maxLowerHingePivotSeparation = 0;
    let maxPlanarDrift = Math.abs(initial.uprightOriginWorld.z);
    let maxUprightLinearSpeed = 0;
    let maxUprightAngularSpeed = 0;
    let maxUprightDisplacement = 0;

    this.#b3.b3Body_ApplyLinearImpulseToCenter(
      this.#uprightId,
      cloneVec3(INITIAL_UPRIGHT_IMPULSE),
      true,
    );

    for (let step = 0; step < steps; step += 1) {
      this.#b3.b3World_Step(this.#worldId, STEP_DT, SUBSTEPS);
      const snapshot = this.snapshot();
      uprightPath.push(cloneVec3(snapshot.uprightOriginWorld));

      maxUpperBallSeparation = Math.max(
        maxUpperBallSeparation,
        distance(snapshot.upperArmOutboardWorld, snapshot.uprightUpperAnchorWorld),
      );
      maxLowerBallSeparation = Math.max(
        maxLowerBallSeparation,
        distance(snapshot.lowerArmOutboardWorld, snapshot.uprightLowerAnchorWorld),
      );
      maxUpperHingePivotSeparation = Math.max(
        maxUpperHingePivotSeparation,
        distance(snapshot.upperHingePivotAWorld, snapshot.upperHingePivotBWorld),
      );
      maxLowerHingePivotSeparation = Math.max(
        maxLowerHingePivotSeparation,
        distance(snapshot.lowerHingePivotAWorld, snapshot.lowerHingePivotBWorld),
      );
      maxPlanarDrift = Math.max(
        maxPlanarDrift,
        Math.abs(snapshot.uprightOriginWorld.z),
        Math.abs(snapshot.upperArmOutboardWorld.z),
        Math.abs(snapshot.lowerArmOutboardWorld.z),
      );
      maxUprightLinearSpeed = Math.max(
        maxUprightLinearSpeed,
        magnitude(snapshot.uprightLinearVelocity),
      );
      maxUprightAngularSpeed = Math.max(
        maxUprightAngularSpeed,
        magnitude(snapshot.uprightAngularVelocity),
      );
      maxUprightDisplacement = Math.max(
        maxUprightDisplacement,
        distance(initial.uprightOriginWorld, snapshot.uprightOriginWorld),
      );
    }

    const final = this.snapshot();
    return Object.freeze({
      apparatus: S0_TWO_ARM_APPARATUS,
      authority: this.#authority,
      derived: this.#derived,
      expectedBodies: Object.freeze({
        support: this.#supportId,
        upperArm: this.#upperArmId,
        lowerArm: this.#lowerArmId,
        upright: this.#uprightId,
      }),
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
      upperHingeAxisAAlignmentError: axisAlignmentError(
        final.upperHingeAxisAWorld,
        derived.upper.axisWorld,
      ),
      upperHingeAxisBAlignmentError: axisAlignmentError(
        final.upperHingeAxisBWorld,
        derived.upper.axisWorld,
      ),
      lowerHingeAxisAAlignmentError: axisAlignmentError(
        final.lowerHingeAxisAWorld,
        derived.lower.axisWorld,
      ),
      lowerHingeAxisBAlignmentError: axisAlignmentError(
        final.lowerHingeAxisBWorld,
        derived.lower.axisWorld,
      ),
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#b3.b3DestroyWorld(this.#worldId);
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw new Error("S0 two-arm world is disposed.");
    }
  }
}

export async function runS0TwoArmProbe(
  authority: S0TwoArmAuthority,
  steps = DEFAULT_STEPS,
): Promise<S0TwoArmResult> {
  const world = await S0TwoArmWorld.create(authority);
  try {
    return world.run(steps);
  } finally {
    world.dispose();
  }
}
