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
import {
  deriveS0TwoArmRelation,
  type S0TwoArmAuthority,
  type S0TwoArmDerivedRelation,
} from "../s0/two-arm-upright-probe.js";

const STEP_DT = 1 / 60;
const SUBSTEPS = 4;
const DEFAULT_STEPS = 90;
const ARM_MASS = 3;
const UPRIGHT_MASS = 5;
const ARM_INERTIA = 0.18;
const UPRIGHT_INERTIA = 0.12;
const SOLVER_EXTENT_HALF = 0.02;
const TWIST_IMPULSE = 0.08;
const TRAVEL_IMPULSE = Object.freeze(vec3(0, -0.8, 0));
const MIN_TIE_LENGTH = 1e-4;

export type Rep4TieMode = "TIE" | "FREE";
export type Rep4Excitation = "TWIST" | "TRAVEL";

export interface Rep4TieAuthority {
  readonly twoArm: S0TwoArmAuthority;
  readonly chassisTiePointWorld: Readonly<b3Vec3>;
  readonly uprightTiePickupWorld: Readonly<b3Vec3>;
}

export interface Rep4DerivedTieRelation {
  readonly twoArm: S0TwoArmDerivedRelation;
  readonly uprightTiePickupLocal: b3Vec3;
  readonly tieLength: number;
  readonly initialTwistAxisWorld: b3Vec3;
}

export interface Rep4TieSnapshot {
  readonly uprightPositionWorld: b3Vec3;
  readonly uprightRotation: b3Quat;
  readonly uprightAngularVelocity: b3Vec3;
  readonly upperArmOutboardWorld: b3Vec3;
  readonly lowerArmOutboardWorld: b3Vec3;
  readonly uprightUpperAnchorWorld: b3Vec3;
  readonly uprightLowerAnchorWorld: b3Vec3;
  readonly tieChassisPointWorld: b3Vec3 | null;
  readonly tieUprightPickupWorld: b3Vec3 | null;
  readonly tieCurrentLength: number | null;
}

export interface Rep4TieRunResult {
  readonly mode: Rep4TieMode;
  readonly excitation: Rep4Excitation;
  readonly authority: Rep4TieAuthority;
  readonly derived: Rep4DerivedTieRelation;
  readonly expectedBodies: {
    readonly support: b3BodyId;
    readonly upperArm: b3BodyId;
    readonly lowerArm: b3BodyId;
    readonly upright: b3BodyId;
  };
  readonly tieNativeBodies: {
    readonly bodyA: b3BodyId;
    readonly bodyB: b3BodyId;
  } | null;
  readonly tieNativeLength: number | null;
  readonly tieNativeLocalA: b3Vec3 | null;
  readonly tieNativeLocalB: b3Vec3 | null;
  readonly initial: Rep4TieSnapshot;
  readonly final: Rep4TieSnapshot;
  readonly steps: number;
  readonly maxUpperBallSeparation: number;
  readonly maxLowerBallSeparation: number;
  readonly maxTieLengthError: number | null;
  readonly maxUprightOrientationDeparture: number;
  readonly maxUprightDisplacement: number;
}

const clone = (v: Readonly<b3Vec3>) => vec3(v.x, v.y, v.z);
const add = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => vec3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => vec3(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (v: Readonly<b3Vec3>, s: number) => vec3(v.x * s, v.y * s, v.z * s);
const mag = (v: Readonly<b3Vec3>) => Math.hypot(v.x, v.y, v.z);
const dist = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => mag(sub(a, b));
const finite = (v: Readonly<b3Vec3>) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
const normalize = (v: Readonly<b3Vec3>) => mul(v, 1 / mag(v));

function orientationDeparture(q: b3Quat): number {
  const scalar = Math.max(-1, Math.min(1, Math.abs(q.s)));
  return 2 * Math.acos(scalar);
}

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

export function deriveRep4TieRelation(authority: Rep4TieAuthority): Rep4DerivedTieRelation {
  if (!finite(authority.chassisTiePointWorld) || !finite(authority.uprightTiePickupWorld)) {
    throw new RangeError("Rep4 tie hardpoints must be finite.");
  }
  const twoArm = deriveS0TwoArmRelation(authority.twoArm);
  const uprightTiePickupLocal = sub(
    authority.uprightTiePickupWorld,
    twoArm.uprightOriginWorld,
  );
  const tieLength = dist(authority.chassisTiePointWorld, authority.uprightTiePickupWorld);
  if (!Number.isFinite(tieLength) || tieLength <= MIN_TIE_LENGTH) {
    throw new RangeError(`Rep4 tie must span more than ${MIN_TIE_LENGTH} m.`);
  }
  const twistLine = sub(authority.twoArm.upper.outboardWorld, authority.twoArm.lower.outboardWorld);
  if (mag(twistLine) <= 1e-5) {
    throw new RangeError("Rep4 upright ball hardpoints must define a finite twist line.");
  }
  return Object.freeze({
    twoArm,
    uprightTiePickupLocal,
    tieLength,
    initialTwistAxisWorld: normalize(twistLine),
  });
}

class Rep4TieOwnedWorld {
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
  readonly #tieId: b3JointId | null;
  readonly #mode: Rep4TieMode;
  readonly #authority: Rep4TieAuthority;
  readonly #derived: Rep4DerivedTieRelation;
  #disposed = false;

  static async create(authority: Rep4TieAuthority, mode: Rep4TieMode): Promise<Rep4TieOwnedWorld> {
    return new Rep4TieOwnedWorld(await Box3DFactory(), authority, deriveRep4TieRelation(authority), mode);
  }

  private constructor(
    b3: Box3DModule,
    authority: Rep4TieAuthority,
    derived: Rep4DerivedTieRelation,
    mode: Rep4TieMode,
  ) {
    this.#b3 = b3;
    this.#mode = mode;
    this.#authority = Object.freeze({
      twoArm: Object.freeze({
        upper: Object.freeze({
          inboardAWorld: clone(authority.twoArm.upper.inboardAWorld),
          inboardBWorld: clone(authority.twoArm.upper.inboardBWorld),
          outboardWorld: clone(authority.twoArm.upper.outboardWorld),
        }),
        lower: Object.freeze({
          inboardAWorld: clone(authority.twoArm.lower.inboardAWorld),
          inboardBWorld: clone(authority.twoArm.lower.inboardBWorld),
          outboardWorld: clone(authority.twoArm.lower.outboardWorld),
        }),
      }),
      chassisTiePointWorld: clone(authority.chassisTiePointWorld),
      uprightTiePickupWorld: clone(authority.uprightTiePickupWorld),
    });
    this.#derived = derived;

    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3();
    this.#worldId = b3.b3CreateWorld(worldDef);

    const supportDef = b3.b3DefaultBodyDef();
    supportDef.position = vec3();
    this.#supportId = b3.b3CreateBody(this.#worldId, supportDef);

    this.#upperArmId = this.#createArm(derived.twoArm.upper);
    this.#lowerArmId = this.#createArm(derived.twoArm.lower);
    this.#uprightId = this.#createDynamicBody(derived.twoArm.uprightOriginWorld, UPRIGHT_MASS, vec3(), UPRIGHT_INERTIA);

    this.#upperHingeId = this.#createHinge(this.#upperArmId, derived.twoArm.upper.pivotWorld, derived.twoArm.upper.axisWorld);
    this.#lowerHingeId = this.#createHinge(this.#lowerArmId, derived.twoArm.lower.pivotWorld, derived.twoArm.lower.axisWorld);
    this.#upperBallId = this.#createBall(this.#upperArmId, derived.twoArm.upper.outboardLocal, derived.twoArm.uprightUpperLocal);
    this.#lowerBallId = this.#createBall(this.#lowerArmId, derived.twoArm.lower.outboardLocal, derived.twoArm.uprightLowerLocal);
    this.#tieId = mode === "TIE" ? this.#createTie() : null;
  }

  #createDynamicBody(position: Readonly<b3Vec3>, mass: number, center: b3Vec3, inertia: number): b3BodyId {
    const def = this.#b3.b3DefaultBodyDef();
    def.type = this.#b3.b3BodyType.b3_dynamicBody;
    def.position = clone(position);
    def.rotation = identityQuat();
    def.enableSleep = false;
    const id = this.#b3.b3CreateBody(this.#worldId, def);
    const shapeDef = this.#b3.b3DefaultShapeDef();
    shapeDef.density = 1;
    this.#b3.b3CreateBoxShape(id, shapeDef, SOLVER_EXTENT_HALF, SOLVER_EXTENT_HALF, SOLVER_EXTENT_HALF);
    this.#b3.b3Body_SetMassData(id, massData(mass, center, inertia));
    this.#b3.b3Body_SetTransform(id, this.#b3.b3Body_GetPosition(id), this.#b3.b3Body_GetRotation(id));
    return id;
  }

  #createArm(relation: S0TwoArmDerivedRelation["upper"]): b3BodyId {
    return this.#createDynamicBody(
      relation.pivotWorld,
      ARM_MASS,
      mul(relation.outboardLocal, 0.5),
      ARM_INERTIA,
    );
  }

  #createHinge(bodyId: b3BodyId, pivot: Readonly<b3Vec3>, axis: Readonly<b3Vec3>): b3JointId {
    const q = quaternionFromLocalZToAxis(axis);
    const def = this.#b3.b3DefaultRevoluteJointDef();
    def.base.bodyIdA = this.#supportId;
    def.base.bodyIdB = bodyId;
    def.base.localFrameA = { p: clone(pivot), q };
    def.base.localFrameB = { p: vec3(), q };
    def.base.collideConnected = false;
    return this.#b3.b3CreateRevoluteJoint(this.#worldId, def);
  }

  #createBall(armId: b3BodyId, armLocal: Readonly<b3Vec3>, uprightLocal: Readonly<b3Vec3>): b3JointId {
    const def = this.#b3.b3DefaultSphericalJointDef();
    def.base.bodyIdA = armId;
    def.base.bodyIdB = this.#uprightId;
    def.base.localFrameA = { p: clone(armLocal), q: identityQuat() };
    def.base.localFrameB = { p: clone(uprightLocal), q: identityQuat() };
    def.base.collideConnected = false;
    return this.#b3.b3CreateSphericalJoint(this.#worldId, def);
  }

  #createTie(): b3JointId {
    const def = this.#b3.b3DefaultDistanceJointDef();
    def.base.bodyIdA = this.#supportId;
    def.base.bodyIdB = this.#uprightId;
    def.base.localFrameA = { p: clone(this.#authority.chassisTiePointWorld), q: identityQuat() };
    def.base.localFrameB = { p: clone(this.#derived.uprightTiePickupLocal), q: identityQuat() };
    def.base.collideConnected = false;
    def.length = this.#derived.tieLength;
    def.enableSpring = false;
    return this.#b3.b3CreateDistanceJoint(this.#worldId, def);
  }

  snapshot(): Rep4TieSnapshot {
    this.#assertActive();
    const upperA = this.#b3.b3Joint_GetLocalFrameA(this.#upperBallId);
    const upperB = this.#b3.b3Joint_GetLocalFrameB(this.#upperBallId);
    const lowerA = this.#b3.b3Joint_GetLocalFrameA(this.#lowerBallId);
    const lowerB = this.#b3.b3Joint_GetLocalFrameB(this.#lowerBallId);
    let tieChassisPointWorld: b3Vec3 | null = null;
    let tieUprightPickupWorld: b3Vec3 | null = null;
    let tieCurrentLength: number | null = null;
    if (this.#tieId !== null) {
      const tieA = this.#b3.b3Joint_GetLocalFrameA(this.#tieId);
      const tieB = this.#b3.b3Joint_GetLocalFrameB(this.#tieId);
      tieChassisPointWorld = clone(this.#b3.b3Body_GetWorldPoint(this.#supportId, tieA.p));
      tieUprightPickupWorld = clone(this.#b3.b3Body_GetWorldPoint(this.#uprightId, tieB.p));
      tieCurrentLength = this.#b3.b3DistanceJoint_GetCurrentLength(this.#tieId);
    }
    return Object.freeze({
      uprightPositionWorld: clone(this.#b3.b3Body_GetPosition(this.#uprightId)),
      uprightRotation: this.#b3.b3Body_GetRotation(this.#uprightId),
      uprightAngularVelocity: clone(this.#b3.b3Body_GetAngularVelocity(this.#uprightId)),
      upperArmOutboardWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#upperArmId, upperA.p)),
      lowerArmOutboardWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#lowerArmId, lowerA.p)),
      uprightUpperAnchorWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#uprightId, upperB.p)),
      uprightLowerAnchorWorld: clone(this.#b3.b3Body_GetWorldPoint(this.#uprightId, lowerB.p)),
      tieChassisPointWorld,
      tieUprightPickupWorld,
      tieCurrentLength,
    });
  }

  run(excitation: Rep4Excitation, steps = DEFAULT_STEPS): Rep4TieRunResult {
    this.#assertActive();
    if (!Number.isInteger(steps) || steps <= 0) throw new RangeError("Rep4 step count must be positive.");
    const initial = this.snapshot();

    if (excitation === "TWIST") {
      this.#b3.b3Body_ApplyAngularImpulse(
        this.#uprightId,
        mul(this.#derived.initialTwistAxisWorld, TWIST_IMPULSE),
        true,
      );
    } else {
      this.#b3.b3Body_ApplyLinearImpulseToCenter(this.#uprightId, clone(TRAVEL_IMPULSE), true);
    }

    let maxUpperBallSeparation = 0;
    let maxLowerBallSeparation = 0;
    let maxTieLengthError: number | null = this.#tieId === null ? null : 0;
    let maxUprightOrientationDeparture = orientationDeparture(initial.uprightRotation);
    let maxUprightDisplacement = 0;

    for (let step = 0; step < steps; step += 1) {
      this.#b3.b3World_Step(this.#worldId, STEP_DT, SUBSTEPS);
      const s = this.snapshot();
      maxUpperBallSeparation = Math.max(maxUpperBallSeparation, dist(s.upperArmOutboardWorld, s.uprightUpperAnchorWorld));
      maxLowerBallSeparation = Math.max(maxLowerBallSeparation, dist(s.lowerArmOutboardWorld, s.uprightLowerAnchorWorld));
      if (s.tieCurrentLength !== null && maxTieLengthError !== null) {
        maxTieLengthError = Math.max(maxTieLengthError, Math.abs(s.tieCurrentLength - this.#derived.tieLength));
      }
      maxUprightOrientationDeparture = Math.max(maxUprightOrientationDeparture, orientationDeparture(s.uprightRotation));
      maxUprightDisplacement = Math.max(maxUprightDisplacement, dist(initial.uprightPositionWorld, s.uprightPositionWorld));
    }

    const final = this.snapshot();
    const tieFrameA = this.#tieId === null ? null : this.#b3.b3Joint_GetLocalFrameA(this.#tieId);
    const tieFrameB = this.#tieId === null ? null : this.#b3.b3Joint_GetLocalFrameB(this.#tieId);
    return Object.freeze({
      mode: this.#mode,
      excitation,
      authority: this.#authority,
      derived: this.#derived,
      expectedBodies: Object.freeze({
        support: this.#supportId,
        upperArm: this.#upperArmId,
        lowerArm: this.#lowerArmId,
        upright: this.#uprightId,
      }),
      tieNativeBodies: this.#tieId === null ? null : Object.freeze({
        bodyA: this.#b3.b3Joint_GetBodyA(this.#tieId),
        bodyB: this.#b3.b3Joint_GetBodyB(this.#tieId),
      }),
      tieNativeLength: this.#tieId === null ? null : this.#b3.b3DistanceJoint_GetLength(this.#tieId),
      tieNativeLocalA: tieFrameA === null ? null : clone(tieFrameA.p),
      tieNativeLocalB: tieFrameB === null ? null : clone(tieFrameB.p),
      initial,
      final,
      steps,
      maxUpperBallSeparation,
      maxLowerBallSeparation,
      maxTieLengthError,
      maxUprightOrientationDeparture,
      maxUprightDisplacement,
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#b3.b3DestroyWorld(this.#worldId);
  }

  #assertActive(): void {
    if (this.#disposed) throw new Error("Rep4 tie-owned world is disposed.");
  }
}

export async function runRep4TieOwnedProbe(
  authority: Rep4TieAuthority,
  mode: Rep4TieMode,
  excitation: Rep4Excitation,
  steps = DEFAULT_STEPS,
): Promise<Rep4TieRunResult> {
  const world = await Rep4TieOwnedWorld.create(authority, mode);
  try {
    return world.run(excitation, steps);
  } finally {
    world.dispose();
  }
}
