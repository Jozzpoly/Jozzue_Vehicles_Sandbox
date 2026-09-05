import Box3DFactory from "box3d.js/inline";
import type {
  Box3DModule,
  b3BodyId,
  b3Quat,
  b3Vec3,
  b3WorldId,
} from "box3d.js";
import { rotateVector, vec3 } from "../v0/math.js";

const STEP_DT = 1 / 60;
const SUBSTEPS = 4;
const ARM_LENGTH = 0.7;
const ARM_MASS = 8;
const ARM_INERTIA = 0.5;
const SOLVER_EXTENT_HALF = 0.02;
const DRIVE_FORCE = 3;
const DEFAULT_STEPS = 45;
const MIN_AXIS_LENGTH = 1e-8;

export const REP3_STAGE_P_SUBSTRATE = Object.freeze({
  box3dPackage: "box3d.js@0.0.2" as const,
  timeStep: STEP_DT,
  substeps: SUBSTEPS,
  armLength: ARM_LENGTH,
  armMass: ARM_MASS,
  isotropicComInertia: ARM_INERTIA,
  driveForce: DRIVE_FORCE,
  defaultSteps: DEFAULT_STEPS,
});

export interface Rep3HingeAxisProbeSnapshot {
  readonly requestedAxis: b3Vec3;
  readonly nativeAxisAWorld: b3Vec3;
  readonly nativeAxisBWorld: b3Vec3;
  readonly pivotAWorld: b3Vec3;
  readonly pivotBWorld: b3Vec3;
  readonly endpointWorld: b3Vec3;
  readonly angularVelocityWorld: b3Vec3;
  readonly axialCoordinate: number;
  readonly radialDistance: number;
}

export interface Rep3HingeAxisProbeResult {
  readonly substrate: typeof REP3_STAGE_P_SUBSTRATE;
  readonly initial: Rep3HingeAxisProbeSnapshot;
  readonly final: Rep3HingeAxisProbeSnapshot;
  readonly steps: number;
  readonly endpointMotion: number;
  readonly maxAxialCoordinateDrift: number;
  readonly maxRadialDistanceDrift: number;
  readonly maxAngularVelocityOffAxis: number;
  readonly nativeAxisAAlignmentError: number;
  readonly nativeAxisBAlignmentError: number;
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

function cross(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): b3Vec3 {
  return vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

function magnitude(value: Readonly<b3Vec3>): number {
  return Math.hypot(value.x, value.y, value.z);
}

function normalize(value: Readonly<b3Vec3>): b3Vec3 {
  if (!finiteVec3(value)) {
    throw new RangeError("Rep3 hinge axis must be finite.");
  }
  const length = magnitude(value);
  if (!Number.isFinite(length) || length <= MIN_AXIS_LENGTH) {
    throw new RangeError("Rep3 hinge axis must have a finite non-zero span.");
  }
  return scale(value, 1 / length);
}

function distance(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): number {
  return magnitude(subtract(a, b));
}

function axisAlignmentError(a: Readonly<b3Vec3>, b: Readonly<b3Vec3>): number {
  return 1 - Math.abs(dot(normalize(a), normalize(b)));
}

/**
 * Deterministically rotate local +Z onto the requested unit axis.
 * The remaining roll around that axis is solver-frame gauge only in Stage P;
 * it is not authored Rep3 product semantics.
 */
export function quaternionFromLocalZToAxis(requestedAxis: Readonly<b3Vec3>): b3Quat {
  const axis = normalize(requestedAxis);
  const source = vec3(0, 0, 1);
  const cosine = dot(source, axis);

  if (cosine <= -1 + 1e-12) {
    return { v: vec3(1, 0, 0), s: 0 };
  }

  const vector = cross(source, axis);
  const scalar = 1 + cosine;
  const norm = Math.sqrt(dot(vector, vector) + scalar * scalar);
  if (!Number.isFinite(norm) || norm <= MIN_AXIS_LENGTH) {
    throw new RangeError("Rep3 hinge frame quaternion is singular.");
  }
  return {
    v: scale(vector, 1 / norm),
    s: scalar / norm,
  };
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

class Rep3HingeAxisProbeWorld {
  readonly #b3: Box3DModule;
  readonly #worldId: b3WorldId;
  readonly #baseId: b3BodyId;
  readonly #armId: b3BodyId;
  readonly #hingeId: ReturnType<Box3DModule["b3CreateRevoluteJoint"]>;
  readonly #axis: b3Vec3;
  readonly #initialAxialCoordinate: number;
  readonly #initialRadialDistance: number;
  #disposed = false;

  static async create(requestedAxis: Readonly<b3Vec3>): Promise<Rep3HingeAxisProbeWorld> {
    return new Rep3HingeAxisProbeWorld(await Box3DFactory(), requestedAxis);
  }

  private constructor(b3: Box3DModule, requestedAxis: Readonly<b3Vec3>) {
    this.#b3 = b3;
    this.#axis = normalize(requestedAxis);

    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3();
    this.#worldId = b3.b3CreateWorld(worldDef);

    const baseDef = b3.b3DefaultBodyDef();
    baseDef.position = vec3();
    this.#baseId = b3.b3CreateBody(this.#worldId, baseDef);

    const armDef = b3.b3DefaultBodyDef();
    armDef.type = b3.b3BodyType.b3_dynamicBody;
    armDef.position = vec3();
    armDef.enableSleep = false;
    this.#armId = b3.b3CreateBody(this.#worldId, armDef);

    // Same pinned-box3d compatibility seam already qualified in C0/C1: a tiny
    // shape establishes finite solver extents, then explicit mass data owns the
    // idealized Stage-P body. Isotropic COM inertia deliberately removes body-
    // inertia anisotropy as a confound while we qualify only the hinge axis.
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

    const hingeFrameQ = quaternionFromLocalZToAxis(this.#axis);
    const hingeDef = b3.b3DefaultRevoluteJointDef();
    hingeDef.base.bodyIdA = this.#baseId;
    hingeDef.base.bodyIdB = this.#armId;
    hingeDef.base.localFrameA = { p: vec3(), q: hingeFrameQ };
    hingeDef.base.localFrameB = { p: vec3(), q: hingeFrameQ };
    hingeDef.base.collideConnected = false;
    this.#hingeId = b3.b3CreateRevoluteJoint(this.#worldId, hingeDef);

    const initial = this.snapshot();
    this.#initialAxialCoordinate = initial.axialCoordinate;
    this.#initialRadialDistance = initial.radialDistance;
  }

  snapshot(): Rep3HingeAxisProbeSnapshot {
    this.#assertActive();
    const nativeFrameA = this.#b3.b3Joint_GetLocalFrameA(this.#hingeId);
    const nativeFrameB = this.#b3.b3Joint_GetLocalFrameB(this.#hingeId);
    const pivotAWorld = this.#b3.b3Body_GetWorldPoint(this.#baseId, nativeFrameA.p);
    const pivotBWorld = this.#b3.b3Body_GetWorldPoint(this.#armId, nativeFrameB.p);
    const endpointWorld = this.#b3.b3Body_GetWorldPoint(this.#armId, vec3(ARM_LENGTH, 0, 0));
    const relative = subtract(endpointWorld, pivotAWorld);
    const axialCoordinate = dot(relative, this.#axis);
    const radial = subtract(relative, scale(this.#axis, axialCoordinate));
    return Object.freeze({
      requestedAxis: cloneVec3(this.#axis),
      nativeAxisAWorld: frameWorldAxis(this.#b3, this.#baseId, nativeFrameA.q),
      nativeAxisBWorld: frameWorldAxis(this.#b3, this.#armId, nativeFrameB.q),
      pivotAWorld: cloneVec3(pivotAWorld),
      pivotBWorld: cloneVec3(pivotBWorld),
      endpointWorld: cloneVec3(endpointWorld),
      angularVelocityWorld: cloneVec3(this.#b3.b3Body_GetAngularVelocity(this.#armId)),
      axialCoordinate,
      radialDistance: magnitude(radial),
    });
  }

  run(steps = DEFAULT_STEPS): Rep3HingeAxisProbeResult {
    this.#assertActive();
    if (!Number.isInteger(steps) || steps <= 0) {
      throw new RangeError("Rep3 Stage P step count must be a positive integer.");
    }

    const initial = this.snapshot();
    let maxAxialCoordinateDrift = 0;
    let maxRadialDistanceDrift = 0;
    let maxAngularVelocityOffAxis = 0;

    for (let step = 0; step < steps; step += 1) {
      const endpoint = this.#b3.b3Body_GetWorldPoint(this.#armId, vec3(ARM_LENGTH, 0, 0));
      this.#b3.b3Body_ApplyForce(this.#armId, vec3(0, -DRIVE_FORCE, 0), endpoint, true);
      this.#b3.b3World_Step(this.#worldId, STEP_DT, SUBSTEPS);

      const snapshot = this.snapshot();
      maxAxialCoordinateDrift = Math.max(
        maxAxialCoordinateDrift,
        Math.abs(snapshot.axialCoordinate - this.#initialAxialCoordinate),
      );
      maxRadialDistanceDrift = Math.max(
        maxRadialDistanceDrift,
        Math.abs(snapshot.radialDistance - this.#initialRadialDistance),
      );
      const angularAlongAxis = dot(snapshot.angularVelocityWorld, this.#axis);
      const angularOffAxis = subtract(
        snapshot.angularVelocityWorld,
        scale(this.#axis, angularAlongAxis),
      );
      maxAngularVelocityOffAxis = Math.max(
        maxAngularVelocityOffAxis,
        magnitude(angularOffAxis),
      );
    }

    const final = this.snapshot();
    return Object.freeze({
      substrate: REP3_STAGE_P_SUBSTRATE,
      initial,
      final,
      steps,
      endpointMotion: distance(initial.endpointWorld, final.endpointWorld),
      maxAxialCoordinateDrift,
      maxRadialDistanceDrift,
      maxAngularVelocityOffAxis,
      nativeAxisAAlignmentError: axisAlignmentError(final.nativeAxisAWorld, this.#axis),
      nativeAxisBAlignmentError: axisAlignmentError(final.nativeAxisBWorld, this.#axis),
      nativePivotSeparation: distance(final.pivotAWorld, final.pivotBWorld),
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#b3.b3DestroyWorld(this.#worldId);
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw new Error("Rep3 hinge-axis probe world is disposed.");
    }
  }
}

export async function runRep3HingeAxisProbe(
  requestedAxis: Readonly<b3Vec3>,
  steps = DEFAULT_STEPS,
): Promise<Rep3HingeAxisProbeResult> {
  const world = await Rep3HingeAxisProbeWorld.create(requestedAxis);
  try {
    return world.run(steps);
  } finally {
    world.dispose();
  }
}
