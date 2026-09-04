import Box3DFactory from "box3d.js/inline";
import {
  Rep2CoiloverForceBench,
  makeRep2VerticalCoiloverGeometry,
} from "../.e1-test-build/src/rep2/coilover-force-bench.js";

const OBSERVATION_HZ = 60;
const OBSERVATION_DT = 1 / OBSERVATION_HZ;
const OBSERVATION_COUNT = 30;
const REFERENCE_REFRESH_COUNT = 64; // 3840 Hz / 60 Hz
const REST_LENGTH = 0.5;
const ARM_LENGTH = 0.7;
const INITIAL_ANGLE = 0.08;
const BASELINE_MASS = 8;
const BASELINE_RADIUS = 0.35;
const LEVERAGE_RADIUS = 0.175;
const K = 900;
const C = 18;

const CASES = [
  { name: "baseline", mass: BASELINE_MASS, radius: BASELINE_RADIUS },
  { name: "mass-x2", mass: 16, radius: BASELINE_RADIUS },
  { name: "leverage-half-radius", mass: BASELINE_MASS, radius: LEVERAGE_RADIUS },
];

const LAWS = [
  { name: "spring-only", damping: 0 },
  { name: "combined", damping: C },
];

const PATHS = [
  "axial-once",
  "axial-outer",
  "generalized-once",
  "generalized-outer",
  "fixed-hertz",
];

function vec3(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

function identityQuat() {
  return { v: vec3(), s: 1 };
}

function quatAboutZ(angle) {
  const half = 0.5 * angle;
  return { v: vec3(0, 0, Math.sin(half)), s: Math.cos(half) };
}

function add(a, b) {
  return vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function subtract(a, b) {
  return vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

function scale(v, s) {
  return vec3(v.x * s, v.y * s, v.z * s);
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

function length(v) {
  return Math.hypot(v.x, v.y, v.z);
}

function normalize(v) {
  const n = length(v);
  if (!(n > 1e-9)) throw new Error("C0c singular axis");
  return scale(v, 1 / n);
}

function rotateZ(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z);
}

function diagonalMassData(mass, center, ix, iy, iz) {
  return {
    mass,
    center,
    inertia: {
      cx: vec3(ix, 0, 0),
      cy: vec3(0, iy, 0),
      cz: vec3(0, 0, iz),
    },
  };
}

function geometry(radius) {
  return {
    chassisEyeLocal: vec3(-radius, REST_LENGTH, 0),
    armEyeLocal: vec3(-radius, 0, 0),
  };
}

function massTerms(mass) {
  const inertiaComZ = (mass * ARM_LENGTH * ARM_LENGTH) / 12;
  const comLocal = vec3(-0.5 * ARM_LENGTH, 0, 0);
  const inertiaHinge = inertiaComZ + mass * comLocal.x * comLocal.x;
  return { inertiaComZ, comLocal, inertiaHinge };
}

function planarState(caseDef, angle) {
  const g = geometry(caseDef.radius);
  const { inertiaComZ, comLocal, inertiaHinge } = massTerms(caseDef.mass);
  const pA = g.chassisEyeLocal;
  const pB = rotateZ(g.armEyeLocal, angle);
  const span = subtract(pB, pA);
  const axis = normalize(span);

  // Exact distance-joint Jacobian lever relative to COM, matching pinned source.
  const rB = rotateZ(subtract(g.armEyeLocal, comLocal), angle);
  const crB = cross(rB, axis);
  const Kaxial = 1 / caseDef.mass + (crB.z * crB.z) / inertiaComZ;
  const axialMass = 1 / Kaxial;

  // One-DOF mechanism Jacobian after the separate revolute constraint is imposed.
  const pBPrime = cross(vec3(0, 0, 1), pB);
  const lengthJacobian = dot(axis, pBPrime);
  const generalizedMass = inertiaHinge / (lengthJacobian * lengthJacobian);

  return {
    axis,
    axialMass,
    generalizedMass,
    lengthJacobian,
    currentLength: length(span),
    inertiaHinge,
  };
}

function harmonicMap(k, damping, effectiveMass) {
  if (!(k > 0) || !(effectiveMass > 0) || !Number.isFinite(effectiveMass)) {
    throw new Error(`invalid C0c mapping k=${k} mass=${effectiveMass}`);
  }
  const omega = Math.sqrt(k / effectiveMass);
  return {
    hertz: omega / (2 * Math.PI),
    dampingRatio: damping / (2 * Math.sqrt(k * effectiveMass)),
    effectiveMass,
  };
}

function mappingFor(kind, caseDef, damping, angle) {
  const state = planarState(caseDef, angle);
  if (kind === "axial") return { ...harmonicMap(K, damping, state.axialMass), ...state };
  if (kind === "generalized") {
    return { ...harmonicMap(K, damping, state.generalizedMass), ...state };
  }
  throw new Error(`unknown mapping ${kind}`);
}

function baselineFixedMapping(damping) {
  return mappingFor(
    "axial",
    { name: "baseline", mass: BASELINE_MASS, radius: BASELINE_RADIUS },
    damping,
    INITIAL_ANGLE,
  );
}

function sampleDifference(a, b) {
  if (a.length !== b.length) throw new Error("C0c trajectory length mismatch");
  const fields = ["angle", "omega", "length", "energy"];
  const out = {};
  for (const field of fields) {
    const deltas = a.map((value, index) => value[field] - b[index][field]);
    out[field] = {
      rms: Math.sqrt(deltas.reduce((sum, value) => sum + value * value, 0) / deltas.length),
      max: Math.max(...deltas.map(Math.abs)),
    };
  }
  return out;
}

function trajectoryShape(samples) {
  return {
    final: samples.at(-1),
    extrema: {
      angleMin: Math.min(...samples.map((s) => s.angle)),
      angleMax: Math.max(...samples.map((s) => s.angle)),
      omegaMin: Math.min(...samples.map((s) => s.omega)),
      omegaMax: Math.max(...samples.map((s) => s.omega)),
      energyMin: Math.min(...samples.map((s) => s.energy)),
      energyMax: Math.max(...samples.map((s) => s.energy)),
    },
    checkpoints: [0, 6, 12, 18, 24, 30].map((index) => ({
      t: index / OBSERVATION_HZ,
      ...samples[index],
    })),
  };
}

function forceSummary(samples) {
  const usable = samples.slice(1).filter((s) => Number.isFinite(s.nativeAxialForce));
  if (usable.length === 0) return { available: false };
  const errors = usable.map((s) => s.nativeAxialForce - s.physicalAxialForceOnArm);
  const physical = usable.map((s) => s.physicalAxialForceOnArm);
  const rmsError = Math.sqrt(errors.reduce((sum, v) => sum + v * v, 0) / errors.length);
  const physicalRms = Math.sqrt(physical.reduce((sum, v) => sum + v * v, 0) / physical.length);
  return {
    available: true,
    rmsError,
    normalizedRmsError: rmsError / Math.max(physicalRms, 1e-12),
    maxAbsError: Math.max(...errors.map(Math.abs)),
    physicalRms,
  };
}

async function runReference(caseDef, damping) {
  const bench = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(caseDef.radius, REST_LENGTH),
    component: {
      springStiffness: K,
      dampingCoefficient: damping,
      restLength: REST_LENGTH,
    },
    initialArmAngleRadians: INITIAL_ANGLE,
    armMass: caseDef.mass,
    armLength: ARM_LENGTH,
  });
  try {
    const convert = (trace) => ({
      angle: trace.hingeAngle,
      omega: trace.armAngularVelocity.z,
      length: trace.currentLength,
      energy: trace.passiveMechanicalEnergy,
      physicalAxialForceOnArm: trace.axialForceOnArm,
      nativeAxialForce: Number.NaN,
    });
    const samples = [convert(bench.trace())];
    for (let i = 0; i < OBSERVATION_COUNT; i += 1) {
      samples.push(convert(bench.advanceFresh(OBSERVATION_DT, REFERENCE_REFRESH_COUNT)));
    }
    return samples;
  } finally {
    bench.dispose();
  }
}

class NativeBench {
  constructor(b3, caseDef, damping, path) {
    this.b3 = b3;
    this.caseDef = caseDef;
    this.damping = damping;
    this.path = path;
    this.g = geometry(caseDef.radius);
    this.mass = massTerms(caseDef.mass);

    const worldDef = b3.b3DefaultWorldDef();
    worldDef.gravity = vec3();
    this.worldId = b3.b3CreateWorld(worldDef);

    const baseDef = b3.b3DefaultBodyDef();
    this.baseId = b3.b3CreateBody(this.worldId, baseDef);

    const armDef = b3.b3DefaultBodyDef();
    armDef.type = b3.b3BodyType.b3_dynamicBody;
    armDef.rotation = quatAboutZ(INITIAL_ANGLE);
    armDef.enableSleep = false;
    this.armId = b3.b3CreateBody(this.worldId, armDef);

    const shapeDef = b3.b3DefaultShapeDef();
    shapeDef.density = 1;
    b3.b3CreateBoxShape(this.armId, shapeDef, 0.02, 0.02, 0.02);
    b3.b3Body_SetMassData(
      this.armId,
      diagonalMassData(
        caseDef.mass,
        this.mass.comLocal,
        Math.max(0.002, 0.05 * this.mass.inertiaComZ),
        this.mass.inertiaComZ,
        this.mass.inertiaComZ,
      ),
    );
    b3.b3Body_SetTransform(
      this.armId,
      b3.b3Body_GetPosition(this.armId),
      b3.b3Body_GetRotation(this.armId),
    );

    const hingeDef = b3.b3DefaultRevoluteJointDef();
    hingeDef.base.bodyIdA = this.baseId;
    hingeDef.base.bodyIdB = this.armId;
    hingeDef.base.localFrameA = { p: vec3(), q: identityQuat() };
    hingeDef.base.localFrameB = { p: vec3(), q: identityQuat() };
    hingeDef.base.collideConnected = false;
    this.hingeId = b3.b3CreateRevoluteJoint(this.worldId, hingeDef);

    const initialMapping = this.mapping();
    const distanceDef = b3.b3DefaultDistanceJointDef();
    distanceDef.base.bodyIdA = this.baseId;
    distanceDef.base.bodyIdB = this.armId;
    distanceDef.base.localFrameA = { p: this.g.chassisEyeLocal, q: identityQuat() };
    distanceDef.base.localFrameB = { p: this.g.armEyeLocal, q: identityQuat() };
    distanceDef.base.collideConnected = false;
    distanceDef.length = REST_LENGTH;
    distanceDef.enableSpring = true;
    distanceDef.hertz = initialMapping.hertz;
    distanceDef.dampingRatio = initialMapping.dampingRatio;
    this.distanceId = b3.b3CreateDistanceJoint(this.worldId, distanceDef);
    b3.b3DistanceJoint_EnableSpring(this.distanceId, true);
    b3.b3DistanceJoint_SetLength(this.distanceId, REST_LENGTH);
    b3.b3DistanceJoint_SetSpringHertz(this.distanceId, initialMapping.hertz);
    b3.b3DistanceJoint_SetSpringDampingRatio(this.distanceId, initialMapping.dampingRatio);

    this.mappingHistory = [initialMapping];
  }

  angle() {
    return this.b3.b3RevoluteJoint_GetAngle(this.hingeId);
  }

  mapping() {
    if (this.path === "fixed-hertz") return baselineFixedMapping(this.damping);
    const kind = this.path.startsWith("axial") ? "axial" : "generalized";
    return mappingFor(kind, this.caseDef, this.damping, this.angle?.() ?? INITIAL_ANGLE);
  }

  trace() {
    const b3 = this.b3;
    const angle = this.angle();
    const omega = b3.b3Body_GetAngularVelocity(this.armId).z;
    const pA = b3.b3Body_GetWorldPoint(this.baseId, this.g.chassisEyeLocal);
    const pB = b3.b3Body_GetWorldPoint(this.armId, this.g.armEyeLocal);
    const axis = normalize(subtract(pB, pA));
    const currentLength = length(subtract(pB, pA));
    const com = b3.b3Body_GetWorldCenterOfMass(this.armId);
    const linear = b3.b3Body_GetLinearVelocity(this.armId);
    const angular = b3.b3Body_GetAngularVelocity(this.armId);
    const eyeVelocity = add(linear, cross(angular, subtract(pB, com)));
    const relativeAxialSpeed = dot(eyeVelocity, axis);
    const extension = currentLength - REST_LENGTH;
    const physicalAxialForceOnArm = -(K * extension + this.damping * relativeAxialSpeed);

    let nativeAxialForce = Number.NaN;
    if (typeof b3.b3Joint_GetConstraintForce === "function") {
      nativeAxialForce = dot(b3.b3Joint_GetConstraintForce(this.distanceId), axis);
    }

    const springPotential = 0.5 * K * extension * extension;
    const kinetic = 0.5 * this.mass.inertiaHinge * omega * omega;
    const map = this.mapping();
    return {
      angle,
      omega,
      length: currentLength,
      energy: springPotential + kinetic,
      physicalAxialForceOnArm,
      nativeAxialForce,
      mappedHertz: map.hertz,
      mappedDampingRatio: map.dampingRatio,
      axialMass: map.axialMass,
      generalizedMass: map.generalizedMass,
      lengthJacobian: map.lengthJacobian,
    };
  }

  step() {
    if (this.path.endsWith("-outer")) {
      const map = this.mapping();
      this.b3.b3DistanceJoint_SetSpringHertz(this.distanceId, map.hertz);
      this.b3.b3DistanceJoint_SetSpringDampingRatio(this.distanceId, map.dampingRatio);
      this.mappingHistory.push(map);
    }
    this.b3.b3World_Step(this.worldId, OBSERVATION_DT, 4);
    return this.trace();
  }

  dispose() {
    this.b3.b3DestroyWorld(this.worldId);
  }
}

async function runNative(caseDef, damping, path) {
  const b3 = await Box3DFactory();
  const bench = new NativeBench(b3, caseDef, damping, path);
  try {
    const samples = [bench.trace()];
    for (let i = 0; i < OBSERVATION_COUNT; i += 1) samples.push(bench.step());
    return {
      samples,
      mappingRange: {
        hertz: [
          Math.min(...samples.map((s) => s.mappedHertz)),
          Math.max(...samples.map((s) => s.mappedHertz)),
        ],
        dampingRatio: [
          Math.min(...samples.map((s) => s.mappedDampingRatio)),
          Math.max(...samples.map((s) => s.mappedDampingRatio)),
        ],
        axialMass: [
          Math.min(...samples.map((s) => s.axialMass)),
          Math.max(...samples.map((s) => s.axialMass)),
        ],
        generalizedMass: [
          Math.min(...samples.map((s) => s.generalizedMass)),
          Math.max(...samples.map((s) => s.generalizedMass)),
        ],
      },
    };
  } finally {
    bench.dispose();
  }
}

const output = {
  metadata: {
    observationHz: OBSERVATION_HZ,
    durationSeconds: OBSERVATION_COUNT / OBSERVATION_HZ,
    referenceHz: OBSERVATION_HZ * REFERENCE_REFRESH_COUNT,
    worldStep: "World_Step(1/60, 4)",
    authored: { k: K, cCombined: C, restLength: REST_LENGTH },
    paths: PATHS,
    reactionForceAvailable: null,
  },
  cases: {},
};

for (const caseDef of CASES) {
  const caseOut = {};
  output.cases[caseDef.name] = caseOut;
  for (const law of LAWS) {
    const reference = await runReference(caseDef, law.damping);
    const lawOut = {
      reference: trajectoryShape(reference),
      paths: {},
    };
    caseOut[law.name] = lawOut;

    for (const path of PATHS) {
      const native = await runNative(caseDef, law.damping, path);
      const summary = {
        differenceToReference: sampleDifference(native.samples, reference),
        forceLaw: forceSummary(native.samples),
        trajectory: trajectoryShape(native.samples),
        mappingRange: native.mappingRange,
      };
      lawOut.paths[path] = summary;
      if (output.metadata.reactionForceAvailable === null) {
        output.metadata.reactionForceAvailable = summary.forceLaw.available;
      }
    }
  }
}

console.log(`REP2_C0C_METRICS ${JSON.stringify(output)}`);
