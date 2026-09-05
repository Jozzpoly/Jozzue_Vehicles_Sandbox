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
import { deriveRep4TieRelation } from "./tie-owned-upright-world.js";

const STEP_DT = 1 / 60;
const SUBSTEPS = 4;
const DEFAULT_STEPS = 120;
const ARM_MASS = 3;
const UPRIGHT_MASS = 5;
const ARM_INERTIA = 0.18;
const UPRIGHT_INERTIA = 0.12;
const SOLVER_EXTENT_HALF = 0.02;
const TRAVEL_IMPULSE = Object.freeze(vec3(0, -0.8, 0));
const MIN_SPAN = 1e-5;

export const REP4_DAMPER_COMPONENT = Object.freeze({
  springStiffness: 900,
  dampingCoefficient: 18,
  restLength: 0.5,
} as const);

export const REP4_DAMPER_SUBSTRATE = Object.freeze({
  timeStep: STEP_DT,
  substeps: SUBSTEPS,
  armMass: ARM_MASS,
  armInertia: ARM_INERTIA,
  mappingPolicy: "axial-once-at-initial-state" as const,
});

export type Rep4DamperMode = "DAMPER" | "FREE";

export interface Rep4DamperedCornerAuthority {
  readonly twoArm: S0TwoArmAuthority;
  readonly chassisTiePointWorld: Readonly<b3Vec3>;
  readonly uprightTiePickupWorld: Readonly<b3Vec3>;
  readonly damperChassisEyeWorld: Readonly<b3Vec3>;
  readonly damperLowerEyeWorld: Readonly<b3Vec3>;
}

export interface Rep4DamperDerivedRelation {
  readonly twoArm: S0TwoArmDerivedRelation;
  readonly uprightTiePickupLocal: b3Vec3;
  readonly tieLength: number;
  readonly damperLowerEyeLocal: b3Vec3;
  readonly initialDamperLength: number;
  readonly rotationalJacobian: number;
  readonly axialMass: number;
  readonly hertz: number;
  readonly dampingRatio: number;
}

export interface Rep4DamperedCornerSnapshot {
  readonly uprightPositionWorld: b3Vec3;
  readonly uprightRotation: b3Quat;
  readonly lowerArmAngle: number;
  readonly upperArmOutboardWorld: b3Vec3;
  readonly lowerArmOutboardWorld: b3Vec3;
  readonly uprightUpperAnchorWorld: b3Vec3;
  readonly uprightLowerAnchorWorld: b3Vec3;
  readonly tieCurrentLength: number;
  readonly damperChassisEyeWorld: b3Vec3 | null;
  readonly damperLowerEyeWorld: b3Vec3 | null;
  readonly damperCurrentLength: number | null;
  readonly damperExtension: number | null;
  readonly damperConstraintForce: b3Vec3 | null;
  readonly damperAxialForce: number | null;
}

export interface Rep4DamperedCornerResult {
  readonly mode: Rep4DamperMode;
  readonly authority: Rep4DamperedCornerAuthority;
  readonly derived: Rep4DamperDerivedRelation;
  readonly component: typeof REP4_DAMPER_COMPONENT;
  readonly expectedBodies: {
    readonly support: b3BodyId;
    readonly upperArm: b3BodyId;
    readonly lowerArm: b3BodyId;
    readonly upright: b3BodyId;
  };
  readonly damperNativeBodies: {
    readonly bodyA: b3BodyId;
    readonly bodyB: b3BodyId;
  } | null;
  readonly damperNativeLocalA: b3Vec3 | null;
  readonly damperNativeLocalB: b3Vec3 | null;
  readonly damperNativeRestLength: number | null;
  readonly damperNativeSpringEnabled: boolean | null;
  readonly damperNativeHertz: number | null;
  readonly damperNativeDampingRatio: number | null;
  readonly initial: Rep4DamperedCornerSnapshot;
  readonly final: Rep4DamperedCornerSnapshot;
  readonly maxUpperBallSeparation: number;
  readonly maxLowerBallSeparation: number;
  readonly maxTieLengthError: number;
  readonly maxUprightDisplacement: number;
  readonly minDamperLength: number | null;
  readonly maxDamperLength: number | null;
  readonly maxAbsDamperExtension: number | null;
  readonly maxAbsDamperAxialForce: number | null;
}

const clone = (v: Readonly<b3Vec3>) => vec3(v.x, v.y, v.z);
const add = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => vec3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => vec3(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (v: Readonly<b3Vec3>, s: number) => vec3(v.x * s, v.y * s, v.z * s);
const mag = (v: Readonly<b3Vec3>) => Math.hypot(v.x, v.y, v.z);
const dist = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => mag(sub(a, b));
const dot = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Readonly<b3Vec3>, b: Readonly<b3Vec3>) => vec3(
  a.y * b.z - a.z * b.y,
  a.z * b.x - a.x * b.z,
  a.x * b.y - a.y * b.x,
);
const finite = (v: Readonly<b3Vec3>) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
const normalize = (v: Readonly<b3Vec3>) => {
  const length = mag(v);
  if (!Number.isFinite(length) || length <= MIN_SPAN) {
    throw new RangeError("Rep4 damper eyes must define a finite non-zero span.");
  }
  return mul(v, 1 / length);
};

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

export function deriveRep4DamperRelation(
  authority: Rep4DamperedCornerAuthority,
): Rep4DamperDerivedRelation {
  if (!finite(authority.damperChassisEyeWorld) || !finite(authority.damperLowerEyeWorld)) {
    throw new RangeError("Rep4 damper hardpoints must be finite.");
  }

  const tie = deriveRep4TieRelation({
    twoArm: authority.twoArm,
    chassisTiePointWorld: authority.chassisTiePointWorld,
    uprightTiePickupWorld: authority.uprightTiePickupWorld,
  });
  const twoArm = deriveS0TwoArmRelation(authority.twoArm);
  const damperSpan = sub(authority.damperLowerEyeWorld, authority.damperChassisEyeWorld);
  const initialDamperLength = mag(damperSpan);
  if (!Number.isFinite(initialDamperLength) || initialDamperLength <= MIN_SPAN) {
    throw new RangeError(`Rep4 damper must span more than ${MIN_SPAN} m.`);
  }

  const damperAxisWorld = normalize(damperSpan);
  const damperLowerEyeLocal = sub(authority.damperLowerEyeWorld, twoArm.lower.pivotWorld);
  const lowerCenterLocal = mul(twoArm.lower.outboardLocal, 0.5);
  const eyeLeverFromCom = sub(damperLowerEyeLocal, lowerCenterLocal);
  const rotationalJacobian = dot(
    cross(eyeLeverFromCom, damperAxisWorld),
    twoArm.lower.axisWorld,
  );
  const inverseAxialMass =
    1 / ARM_MASS + (rotationalJacobian * rotationalJacobian) / ARM_INERTIA;
  const axialMass = 1 / inverseAxialMass;
  if (!Number.isFinite(axialMass) || axialMass <= 0) {
    throw new RangeError("Rep4 damper axial mass must be finite and positive.");
  }

  const omega = Math.sqrt(REP4_DAMPER_COMPONENT.springStiffness / axialMass);
  const hertz = omega / (2 * Math.PI);
  const dampingRatio = REP4_DAMPER_COMPONENT.dampingCoefficient /
    (2 * Math.sqrt(REP4_DAMPER_COMPONENT.springStiffness * axialMass));

  return Object.freeze({
    twoArm,
    uprightTiePickupLocal: clone(tie.uprightTiePickupLocal),
    tieLength: tie.tieLength,
    damperLowerEyeLocal,
    initialDamperLength,
    rotationalJacobian,
    axialMass,
    hertz,
    dampingRatio,
  });
}

class Rep4DamperedCornerWorld {
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
  readonly #tieId: b3JointId;
  readonly #damperId: b3JointId | null;
  readonly #mode: Rep4DamperMode;
  readonly #authority: Rep4DamperedCornerAuthority;
  readonly #derived: Rep4DamperDerivedRelation;
  #disposed = false;

  static async create(
    authority: Rep4DamperedCornerAuthority,
    mode: Rep4DamperMode,
  ): Promise<Rep4DamperedCornerWorld> {
    return new Rep4DamperedCornerWorld(
      await Box3DFactory(),
      authority,
      deriveRep4DamperRelation(authority),
      mode,
    );
  }

  private constructor(
    b3: Box3DModule,
    authority: Rep4DamperedCornerAuthority,
    derived: Rep4DamperDerivedRelation,
    mode: Rep4DamperMode,
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
      damperChassisEyeWorld: clone(authority.damperChassisEyeWorld),
      damperLowerEyeWorld: clone(authority.damperLowerEyeWorld),
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
    this.#uprightId = this.#createDynamicBody(
      derived.twoArm.uprightOriginWorld,
      UPRIGHT_MASS,
      vec3(),
      UPRIGHT_INERTIA,
    );

    this.#upperHingeId = this.#createHinge(
      this.#upperArmId,
      derived.twoArm.upper.pivotWorld,
      derived.twoArm.upper.axisWorld,
    );
    this.#lowerHingeId = this.#createHinge(
      this.#lowerArmId,
      derived.twoArm.lower.pivotWorld,
      derived.twoArm.lower.axisWorld,
    );
    this.#upperBallId = this.#createBall(
      this.#upperArmId,
      derived.twoArm.upper.outboardLocal,
      derived.twoArm.uprightUpperLocal,
    );
    this.#lowerBallId = this.#createBall(
      this.#lowerArmId,
      derived.twoArm.lower.outboardLocal,
      derived.twoArm.uprightLowerLocal,
    );
    this.#tieId = this.#createTie();
    this.#damperId = mode === "DAMPER" ? this.#createDamper() : null;
  }

  #createDynamicBody(
    position: Readonly<b3Vec3>,
    mass: number,
    center: b3Vec3,
    inertia: number,
  ): b3BodyId {
    const def = this.#b3.b3DefaultBodyDef();
    def.type = this.#b3.b3BodyType.b3_dynamicBody;
    def.position = clone(position);
    def.rotation = identityQuat();
    def.enableSleep = false;
    const id = this.#b3.b3CreateBody(this.#worldId, def);
    const shapeDef = this.#b3.b3DefaultShapeDef();
    shapeDef.density = 1;
    this.#b3.b3CreateBoxShape(
      id,
      shapeDef,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
    );
    this.#b3.b3Body_SetMassData(id, massData(mass, center, inertia));
    this.#b3.b3Body_SetTransform(
      id,
      this.#b3.b3Body_GetPosition(id),
      this.#b3.b3Body_GetRotation(id),
    );
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

  #createHinge(
    bodyId: b3BodyId,
    pivot: Readonly<b3Vec3>,
    axis: Readonly<b3Vec3>,
  ): b3JointId {
    const q = quaternionFromLocalZToAxis(axis);
    const def = this.#b3.b3DefaultRevoluteJointDef();
    def.base.bodyIdA = this.#supportId;
    def.base.bodyIdB = bodyId;
    def.base.localFrameA = { p: clone(pivot), q };
    def.base.localFrameB = { p: vec3(), q };
    def.base.collideConnected = false;
    return this.#b3.b3CreateRevoluteJoint(this.#worldId, def);
  }

  #createBall(
    armId: b3BodyId,
    armLocal: Readonly<b3Vec3>,
    uprightLocal: Readonly<b3Vec3>,
  ): b3JointId {
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
    def.base.localFrameA = {
      p: clone(this.#authority.chassisTiePointWorld),
      q: identityQuat(),
    };
    def.base.localFrameB = {
      p: clone(this.#derived.uprightTiePickupLocal),
      q: identityQuat(),
    };
    def.base.collideConnected = false;
    def.length = this.#derived.tieLength;
    def.enableSpring = false;
    return this.#b3.b3CreateDistanceJoint(this.#worldId, def);
  }

  #createDamper(): b3JointId {
    const def = this.#b3.b3DefaultDistanceJointDef();
    def.base.bodyIdA = this.#supportId;
    def.base.bodyIdB = this.#lowerArmId;
    def.base.localFrameA = {
      p: clone(this.#authority.damperChassisEyeWorld),
      q: identityQuat(),
    };
    def.base.localFrameB = {
      p: clone(this.#derived.damperLowerEyeLocal),
      q: identityQuat(),
    };
    def.base.collideConnected = false;
    def.length = REP4_DAMPER_COMPONENT.restLength;
    def.enableSpring = true;
    def.hertz = this.#derived.hertz;
    def.dampingRatio = this.#derived.dampingRatio;
    const id = this.#b3.b3CreateDistanceJoint(this.#worldId, def);
    this.#b3.b3DistanceJoint_EnableSpring(id, true);
    this.#b3.b3DistanceJoint_SetLength(id, REP4_DAMPER_COMPONENT.restLength);
    this.#b3.b3DistanceJoint_SetSpringHertz(id, this.#derived.hertz);
    this.#b3.b3DistanceJoint_SetSpringDampingRatio(id, this.#derived.dampingRatio);
    return id;
  }

  snapshot(): Rep4DamperedCornerSnapshot {
    this.#assertActive();
    const upperA = this.#b3.b3Joint_GetLocalFrameA(this.#upperBallId);
    const upperB = this.#b3.b3Joint_GetLocalFrameB(this.#upperBallId);
    const lowerA = this.#b3.b3Joint_GetLocalFrameA(this.#lowerBallId);
    const lowerB = this.#b3.b3Joint_GetLocalFrameB(this.#lowerBallId);
    let damperChassisEyeWorld: b3Vec3 | null = null;
    let damperLowerEyeWorld: b3Vec3 | null = null;
    let damperCurrentLength: number | null = null;
    let damperExtension: number | null = null;
    let damperConstraintForce: b3Vec3 | null = null;
    let damperAxialForce: number | null = null;

    if (this.#damperId !== null) {
      const frameA = this.#b3.b3Joint_GetLocalFrameA(this.#damperId);
      const frameB = this.#b3.b3Joint_GetLocalFrameB(this.#damperId);
      damperChassisEyeWorld = clone(
        this.#b3.b3Body_GetWorldPoint(this.#supportId, frameA.p),
      );
      damperLowerEyeWorld = clone(
        this.#b3.b3Body_GetWorldPoint(this.#lowerArmId, frameB.p),
      );
      damperCurrentLength = this.#b3.b3DistanceJoint_GetCurrentLength(this.#damperId);
      damperExtension = damperCurrentLength - REP4_DAMPER_COMPONENT.restLength;
      damperConstraintForce = clone(this.#b3.b3Joint_GetConstraintForce(this.#damperId));
      const liveAxis = normalize(sub(damperLowerEyeWorld, damperChassisEyeWorld));
      damperAxialForce = dot(damperConstraintForce, liveAxis);
    }

    return Object.freeze({
      uprightPositionWorld: clone(this.#b3.b3Body_GetPosition(this.#uprightId)),
      uprightRotation: this.#b3.b3Body_GetRotation(this.#uprightId),
      lowerArmAngle: this.#b3.b3RevoluteJoint_GetAngle(this.#lowerHingeId),
      upperArmOutboardWorld: clone(
        this.#b3.b3Body_GetWorldPoint(this.#upperArmId, upperA.p),
      ),
      lowerArmOutboardWorld: clone(
        this.#b3.b3Body_GetWorldPoint(this.#lowerArmId, lowerA.p),
      ),
      uprightUpperAnchorWorld: clone(
        this.#b3.b3Body_GetWorldPoint(this.#uprightId, upperB.p),
      ),
      uprightLowerAnchorWorld: clone(
        this.#b3.b3Body_GetWorldPoint(this.#uprightId, lowerB.p),
      ),
      tieCurrentLength: this.#b3.b3DistanceJoint_GetCurrentLength(this.#tieId),
      damperChassisEyeWorld,
      damperLowerEyeWorld,
      damperCurrentLength,
      damperExtension,
      damperConstraintForce,
      damperAxialForce,
    });
  }

  run(steps = DEFAULT_STEPS): Rep4DamperedCornerResult {
    this.#assertActive();
    if (!Number.isInteger(steps) || steps <= 0) {
      throw new RangeError("Rep4 dampered-corner step count must be positive.");
    }
    const initial = this.snapshot();
    this.#b3.b3Body_ApplyLinearImpulseToCenter(
      this.#uprightId,
      clone(TRAVEL_IMPULSE),
      true,
    );

    let maxUpperBallSeparation = 0;
    let maxLowerBallSeparation = 0;
    let maxTieLengthError = 0;
    let maxUprightDisplacement = 0;
    let minDamperLength: number | null = initial.damperCurrentLength;
    let maxDamperLength: number | null = initial.damperCurrentLength;
    let maxAbsDamperExtension: number | null = initial.damperExtension === null
      ? null
      : Math.abs(initial.damperExtension);
    let maxAbsDamperAxialForce: number | null = initial.damperAxialForce === null
      ? null
      : Math.abs(initial.damperAxialForce);

    for (let index = 0; index < steps; index += 1) {
      this.#b3.b3World_Step(this.#worldId, STEP_DT, SUBSTEPS);
      const state = this.snapshot();
      maxUpperBallSeparation = Math.max(
        maxUpperBallSeparation,
        dist(state.upperArmOutboardWorld, state.uprightUpperAnchorWorld),
      );
      maxLowerBallSeparation = Math.max(
        maxLowerBallSeparation,
        dist(state.lowerArmOutboardWorld, state.uprightLowerAnchorWorld),
      );
      maxTieLengthError = Math.max(
        maxTieLengthError,
        Math.abs(state.tieCurrentLength - this.#derived.tieLength),
      );
      maxUprightDisplacement = Math.max(
        maxUprightDisplacement,
        dist(initial.uprightPositionWorld, state.uprightPositionWorld),
      );
      if (state.damperCurrentLength !== null) {
        minDamperLength = minDamperLength === null
          ? state.damperCurrentLength
          : Math.min(minDamperLength, state.damperCurrentLength);
        maxDamperLength = maxDamperLength === null
          ? state.damperCurrentLength
          : Math.max(maxDamperLength, state.damperCurrentLength);
      }
      if (state.damperExtension !== null && maxAbsDamperExtension !== null) {
        maxAbsDamperExtension = Math.max(
          maxAbsDamperExtension,
          Math.abs(state.damperExtension),
        );
      }
      if (state.damperAxialForce !== null && maxAbsDamperAxialForce !== null) {
        maxAbsDamperAxialForce = Math.max(
          maxAbsDamperAxialForce,
          Math.abs(state.damperAxialForce),
        );
      }
    }

    const final = this.snapshot();
    const damperFrameA = this.#damperId === null
      ? null
      : this.#b3.b3Joint_GetLocalFrameA(this.#damperId);
    const damperFrameB = this.#damperId === null
      ? null
      : this.#b3.b3Joint_GetLocalFrameB(this.#damperId);

    return Object.freeze({
      mode: this.#mode,
      authority: this.#authority,
      derived: this.#derived,
      component: REP4_DAMPER_COMPONENT,
      expectedBodies: Object.freeze({
        support: this.#supportId,
        upperArm: this.#upperArmId,
        lowerArm: this.#lowerArmId,
        upright: this.#uprightId,
      }),
      damperNativeBodies: this.#damperId === null ? null : Object.freeze({
        bodyA: this.#b3.b3Joint_GetBodyA(this.#damperId),
        bodyB: this.#b3.b3Joint_GetBodyB(this.#damperId),
      }),
      damperNativeLocalA: damperFrameA === null ? null : clone(damperFrameA.p),
      damperNativeLocalB: damperFrameB === null ? null : clone(damperFrameB.p),
      damperNativeRestLength: this.#damperId === null
        ? null
        : this.#b3.b3DistanceJoint_GetLength(this.#damperId),
      damperNativeSpringEnabled: this.#damperId === null
        ? null
        : this.#b3.b3DistanceJoint_IsSpringEnabled(this.#damperId),
      damperNativeHertz: this.#damperId === null
        ? null
        : this.#b3.b3DistanceJoint_GetSpringHertz(this.#damperId),
      damperNativeDampingRatio: this.#damperId === null
        ? null
        : this.#b3.b3DistanceJoint_GetSpringDampingRatio(this.#damperId),
      initial,
      final,
      maxUpperBallSeparation,
      maxLowerBallSeparation,
      maxTieLengthError,
      maxUprightDisplacement,
      minDamperLength,
      maxDamperLength,
      maxAbsDamperExtension,
      maxAbsDamperAxialForce,
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#b3.b3DestroyWorld(this.#worldId);
  }

  #assertActive(): void {
    if (this.#disposed) throw new Error("Rep4 dampered-corner world is disposed.");
  }
}

export async function runRep4DamperedCornerProbe(
  authority: Rep4DamperedCornerAuthority,
  mode: Rep4DamperMode = "DAMPER",
  steps = DEFAULT_STEPS,
): Promise<Rep4DamperedCornerResult> {
  const world = await Rep4DamperedCornerWorld.create(authority, mode);
  try {
    return world.run(steps);
  } finally {
    world.dispose();
  }
}
