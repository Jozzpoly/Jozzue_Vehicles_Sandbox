import Box3DFactory from "box3d.js/inline";
import type {
  Box3DModule,
  b3BodyId,
  b3Quat,
  b3Vec3,
  b3WorldId,
} from "box3d.js";
import { rotateVector, vec3 } from "../v0/math.js";
import { quaternionFromLocalZToAxis } from "./hinge-axis-probe.js";

const STEP_DT = 1 / 60;
const SUBSTEPS = 4;
const ARM_LENGTH = 0.7;
const ARM_MASS = 8;
const ARM_INERTIA = 0.5;
const SOLVER_EXTENT_HALF = 0.02;
const DRIVE_FORCE = 3;
const DEFAULT_STEPS = 45;
const MIN_MOUNT_SPAN = 1e-5;

export const REP3_STAGE_A_APPARATUS = Object.freeze({
  box3dPackage: "box3d.js@0.0.2" as const,
  timeStep: STEP_DT,
  substeps: SUBSTEPS,
  armLength: ARM_LENGTH,
  armMass: ARM_MASS,
  isotropicComInertia: ARM_INERTIA,
  driveForce: DRIVE_FORCE,
  defaultSteps: DEFAULT_STEPS,
  minMountSpan: MIN_MOUNT_SPAN,
});

/**
 * Rep3 Stage-A authored spatial authority.
 *
 * Deliberately no axis/euler/quaternion field exists here. The hinge relation
 * is derived solely from the two physical mount positions.
 */
export interface Rep3GeometryDerivedHingeAuthority {
  readonly mountAWorld: Readonly<b3Vec3>;
  readonly mountBWorld: Readonly<b3Vec3>;
}

export interface Rep3DerivedHingeRelation {
  readonly pivotWorld: b3Vec3;
  readonly axisWorld: b3Vec3;
  readonly mountSpan: number;
}

export interface Rep3GeometryDerivedHingeSnapshot {
  readonly derivedPivotWorld: b3Vec3;
  readonly derivedAxisWorld: b3Vec3;
  readonly nativeBodyA: b3BodyId;
  readonly nativeBodyB: b3BodyId;
  readonly expectedSupportBody: b3BodyId;
  readonly expectedArmBody: b3BodyId;
  readonly nativeAxisAWorld: b3Vec3;
  readonly nativeAxisBWorld: b3Vec3;
  readonly nativePivotAWorld: b3Vec3;
  readonly nativePivotBWorld: b3Vec3;
  readonly endpointWorld: b3Vec3;
  readonly angularVelocityWorld: b3Vec3;
  readonly axialCoordinate: number;
  readonly radialDistance: number;
}

export interface Rep3GeometryDerivedHingeResult {
  readonly apparatus: typeof REP3_STAGE_A_APPARATUS;
  readonly authority: {
    readonly mountAWorld: b3Vec3;
    readonly mountBWorld: b3Vec3;
  };
  readonly derived: Rep3DerivedHingeRelation;
  readonly initial: Rep3GeometryDerivedHingeSnapshot;
  readonly final: Rep3GeometryDerivedHingeSnapshot;
  readonly endpointPath: readonly b3Vec3[];
  readonly steps: number;
  readonly endpointMotion: number;
  readonly maxAxialCoordinateDrift: number;
  readonly maxRadialDistanceDrift: number;
  readonly maxAngularVelocityOffAxis: number;
  readonly nativeAxisAAlignmentError: number;
  readonly nativeAxisBAlignmentError: number;
  readonly nativePivotAError: number;
  readonly nativePivotBError: number;
  readonly nativePivotSeparation: number;
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

function normalize(value: Readonly<b3Vec3>): b3Vec3 {
  const length = magnitude(value);
  return scale(value, 1 / length);
}

function distance(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): number {
  return magnitude(subtract(a, b));
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

export function deriveRep3HingeRelation(
  authority: Rep3GeometryDerivedHingeAuthority,
): Rep3DerivedHingeRelation {
  if (!finiteVec3(authority.mountAWorld) || !finiteVec3(authority.mountBWorld)) {
    throw new RangeError("Rep3 Stage A mount positions must be finite.");
  }

  const delta = subtract(authority.mountBWorld, authority.mountAWorld);
  const mountSpan = magnitude(delta);
  if (!Number.isFinite(mountSpan) || mountSpan <= MIN_MOUNT_SPAN) {
    throw new RangeError(
      `Rep3 Stage A mount pair must span more than ${MIN_MOUNT_SPAN} m.`,
    );
  }

  return Object.freeze({
    pivotWorld: scale(add(authority.mountAWorld, authority.mountBWorld), 0.5),
    axisWorld: scale(delta, 1 / mountSpan),
    mountSpan,
  });
}

class Rep3GeometryDerivedHingeWorld {
  readonly #b3: Box3DModule;
  readonly #worldId: b3WorldId;
  readonly #supportId: b3BodyId;
  readonly #armId: b3BodyId;
  readonly #hingeId: ReturnType<Box3DModule["b3CreateRevoluteJoint"]>;
  readonly #authority: {
    readonly mountAWorld: b3Vec3;
    readonly mountBWorld: b3Vec3;
  };
  readonly #derived: Rep3DerivedHingeRelation;
  readonly #initialAxialCoordinate: number;
  readonly #initialRadialDistance: number;
  #disposed = false;

  static async create(
    authority: Rep3GeometryDerivedHingeAuthority,
  ): Promise<Rep3GeometryDerivedHingeWorld> {
    const derived = deriveRep3HingeRelation(authority);
    const ownedAuthority = Object.freeze({
      mountAWorld: cloneVec3(authority.mountAWorld),
      mountBWorld: cloneVec3(authority.mountBWorld),
    });
    return new Rep3GeometryDerivedHingeWorld(
      await Box3DFactory(),
      ownedAuthority,
      derived,
    );
  }

  private constructor(
    b3: Box3DModule,
    authority: {
      readonly mountAWorld: b3Vec3;
      readonly mountBWorld: b3Vec3;
    },
    derived: Rep3DerivedHingeRelation,
  ) {
    this.#b3 = b3;
    this.#authority = authority;
    this.#derived = Object.freeze({
      pivotWorld: cloneVec3(derived.pivotWorld),
      axisWorld: cloneVec3(derived.axisWorld),
      mountSpan: derived.mountSpan,
    });

    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3();
    this.#worldId = b3.b3CreateWorld(worldDef);

    const supportDef = b3.b3DefaultBodyDef();
    supportDef.position = cloneVec3(this.#derived.pivotWorld);
    this.#supportId = b3.b3CreateBody(this.#worldId, supportDef);

    const armDef = b3.b3DefaultBodyDef();
    armDef.type = b3.b3BodyType.b3_dynamicBody;
    armDef.position = cloneVec3(this.#derived.pivotWorld);
    armDef.enableSleep = false;
    this.#armId = b3.b3CreateBody(this.#worldId, armDef);

    const shapeDef = b3.b3DefaultShapeDef();
    shapeDef.density = 1;
    b3.b3CreateBoxShape(
      this.#armId,
      shapeDef,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
      SOLVER_EXTENT_HALF,
    );
    b3.b3Body_SetMassData(
      this.#armId,
      diagonalMassData(ARM_MASS, vec3(0.5 * ARM_LENGTH, 0, 0), ARM_INERTIA),
    );
    b3.b3Body_SetTransform(
      this.#armId,
      b3.b3Body_GetPosition(this.#armId),
      b3.b3Body_GetRotation(this.#armId),
    );

    // The solver frame orientation is a deterministic projection of the
    // mount-derived line. Its roll/gauge is internal representation only.
    const hingeFrameQ = quaternionFromLocalZToAxis(this.#derived.axisWorld);
    const hingeDef = b3.b3DefaultRevoluteJointDef();
    hingeDef.base.bodyIdA = this.#supportId;
    hingeDef.base.bodyIdB = this.#armId;
    hingeDef.base.localFrameA = { p: vec3(), q: hingeFrameQ };
    hingeDef.base.localFrameB = { p: vec3(), q: hingeFrameQ };
    hingeDef.base.collideConnected = false;
    this.#hingeId = b3.b3CreateRevoluteJoint(this.#worldId, hingeDef);

    const initial = this.snapshot();
    this.#initialAxialCoordinate = initial.axialCoordinate;
    this.#initialRadialDistance = initial.radialDistance;
  }

  snapshot(): Rep3GeometryDerivedHingeSnapshot {
    this.#assertActive();
    const nativeFrameA = this.#b3.b3Joint_GetLocalFrameA(this.#hingeId);
    const nativeFrameB = this.#b3.b3Joint_GetLocalFrameB(this.#hingeId);
    const nativePivotAWorld = this.#b3.b3Body_GetWorldPoint(this.#supportId, nativeFrameA.p);
    const nativePivotBWorld = this.#b3.b3Body_GetWorldPoint(this.#armId, nativeFrameB.p);
    const endpointWorld = this.#b3.b3Body_GetWorldPoint(this.#armId, vec3(ARM_LENGTH, 0, 0));
    const relative = subtract(endpointWorld, this.#derived.pivotWorld);
    const axialCoordinate = dot(relative, this.#derived.axisWorld);
    const radial = subtract(relative, scale(this.#derived.axisWorld, axialCoordinate));

    return Object.freeze({
      derivedPivotWorld: cloneVec3(this.#derived.pivotWorld),
      derivedAxisWorld: cloneVec3(this.#derived.axisWorld),
      nativeBodyA: this.#b3.b3Joint_GetBodyA(this.#hingeId),
      nativeBodyB: this.#b3.b3Joint_GetBodyB(this.#hingeId),
      expectedSupportBody: this.#supportId,
      expectedArmBody: this.#armId,
      nativeAxisAWorld: frameWorldAxis(this.#b3, this.#supportId, nativeFrameA.q),
      nativeAxisBWorld: frameWorldAxis(this.#b3, this.#armId, nativeFrameB.q),
      nativePivotAWorld: cloneVec3(nativePivotAWorld),
      nativePivotBWorld: cloneVec3(nativePivotBWorld),
      endpointWorld: cloneVec3(endpointWorld),
      angularVelocityWorld: cloneVec3(this.#b3.b3Body_GetAngularVelocity(this.#armId)),
      axialCoordinate,
      radialDistance: magnitude(radial),
    });
  }

  run(steps = DEFAULT_STEPS): Rep3GeometryDerivedHingeResult {
    this.#assertActive();
    if (!Number.isInteger(steps) || steps <= 0) {
      throw new RangeError("Rep3 Stage A step count must be a positive integer.");
    }

    const initial = this.snapshot();
    const endpointPath: b3Vec3[] = [cloneVec3(initial.endpointWorld)];
    let maxAxialCoordinateDrift = 0;
    let maxRadialDistanceDrift = 0;
    let maxAngularVelocityOffAxis = 0;

    for (let step = 0; step < steps; step += 1) {
      const endpoint = this.#b3.b3Body_GetWorldPoint(this.#armId, vec3(ARM_LENGTH, 0, 0));
      this.#b3.b3Body_ApplyForce(this.#armId, vec3(0, -DRIVE_FORCE, 0), endpoint, true);
      this.#b3.b3World_Step(this.#worldId, STEP_DT, SUBSTEPS);

      const snapshot = this.snapshot();
      endpointPath.push(cloneVec3(snapshot.endpointWorld));
      maxAxialCoordinateDrift = Math.max(
        maxAxialCoordinateDrift,
        Math.abs(snapshot.axialCoordinate - this.#initialAxialCoordinate),
      );
      maxRadialDistanceDrift = Math.max(
        maxRadialDistanceDrift,
        Math.abs(snapshot.radialDistance - this.#initialRadialDistance),
      );
      const angularAlongAxis = dot(snapshot.angularVelocityWorld, this.#derived.axisWorld);
      const angularOffAxis = subtract(
        snapshot.angularVelocityWorld,
        scale(this.#derived.axisWorld, angularAlongAxis),
      );
      maxAngularVelocityOffAxis = Math.max(
        maxAngularVelocityOffAxis,
        magnitude(angularOffAxis),
      );
    }

    const final = this.snapshot();
    return Object.freeze({
      apparatus: REP3_STAGE_A_APPARATUS,
      authority: this.#authority,
      derived: this.#derived,
      initial,
      final,
      endpointPath: Object.freeze(endpointPath),
      steps,
      endpointMotion: distance(initial.endpointWorld, final.endpointWorld),
      maxAxialCoordinateDrift,
      maxRadialDistanceDrift,
      maxAngularVelocityOffAxis,
      nativeAxisAAlignmentError: axisAlignmentError(
        final.nativeAxisAWorld,
        this.#derived.axisWorld,
      ),
      nativeAxisBAlignmentError: axisAlignmentError(
        final.nativeAxisBWorld,
        this.#derived.axisWorld,
      ),
      nativePivotAError: distance(final.nativePivotAWorld, this.#derived.pivotWorld),
      nativePivotBError: distance(final.nativePivotBWorld, this.#derived.pivotWorld),
      nativePivotSeparation: distance(final.nativePivotAWorld, final.nativePivotBWorld),
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#b3.b3DestroyWorld(this.#worldId);
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw new Error("Rep3 geometry-derived hinge world is disposed.");
    }
  }
}

export async function runRep3GeometryDerivedHinge(
  authority: Rep3GeometryDerivedHingeAuthority,
  steps = DEFAULT_STEPS,
): Promise<Rep3GeometryDerivedHingeResult> {
  const world = await Rep3GeometryDerivedHingeWorld.create(authority);
  try {
    return world.run(steps);
  } finally {
    world.dispose();
  }
}
