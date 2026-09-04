import Box3DFactory from "box3d.js/inline";
import {
  Rep2CoiloverForceBench,
  makeRep2VerticalCoiloverGeometry,
} from "../.e1-test-build/src/rep2/coilover-force-bench.js";

const DT = 1 / 60;
const STEPS = 30;
const REFERENCE_REFRESH = 64; // 3840 Hz
const L0 = 0.5;
const ARM_LENGTH = 0.7;
const INITIAL_ANGLE = 0.08;
const K = 900;
const C = 18;

const CASES = [
  { name: "baseline", mass: 8, radius: 0.35 },
  { name: "mass-x2", mass: 16, radius: 0.35 },
  { name: "leverage-half-radius", mass: 8, radius: 0.175 },
];
const LAWS = [
  { name: "spring-only", c: 0 },
  { name: "combined", c: C },
];
const PATHS = ["axial-once", "axial-outer", "generalized-outer", "fixed-hertz"];

const v3 = (x = 0, y = 0, z = 0) => ({ x, y, z });
const qIdentity = () => ({ v: v3(), s: 1 });
const qZ = (a) => ({ v: v3(0, 0, Math.sin(a / 2)), s: Math.cos(a / 2) });
const sub = (a, b) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const len = (a) => Math.hypot(a.x, a.y, a.z);
const norm = (a) => {
  const n = len(a);
  if (!(n > 1e-9)) throw new Error("C0c singular distance axis");
  return v3(a.x / n, a.y / n, a.z / n);
};
const rotateZ = (p, a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return v3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
};

function geometry(radius) {
  return { chassis: v3(-radius, L0, 0), arm: v3(-radius, 0, 0) };
}

function massTerms(mass) {
  const iCom = (mass * ARM_LENGTH * ARM_LENGTH) / 12;
  const com = v3(-ARM_LENGTH / 2, 0, 0);
  return { iCom, com, iHinge: iCom + mass * com.x * com.x };
}

function planarDiagnostics(caseDef, angle) {
  const g = geometry(caseDef.radius);
  const mt = massTerms(caseDef.mass);
  const pA = g.chassis;
  const pB = rotateZ(g.arm, angle);
  const axis = norm(sub(pB, pA));

  // Exact native distance-joint scalar mass from pinned source, specialized
  // to static body A + planar dynamic body B.
  const rB = rotateZ(sub(g.arm, mt.com), angle);
  const cr = cross(rB, axis).z;
  const axialMass = 1 / (1 / caseDef.mass + (cr * cr) / mt.iCom);

  // Whole mechanism mass after the separate revolute constraint is imposed.
  const pBPrime = cross(v3(0, 0, 1), pB);
  const jL = dot(axis, pBPrime);
  const generalizedMass = mt.iHinge / (jL * jL);

  return { axis, currentLength: len(sub(pB, pA)), axialMass, generalizedMass, jL, iHinge: mt.iHinge };
}

function harmonic(k, c, mass) {
  if (!(mass > 0) || !Number.isFinite(mass)) throw new Error(`C0c invalid effective mass ${mass}`);
  const omega = Math.sqrt(k / mass);
  return {
    hertz: omega / (2 * Math.PI),
    dampingRatio: c / (2 * Math.sqrt(k * mass)),
    sourceMass: mass,
  };
}

function candidate(kind, caseDef, c, angle) {
  const d = planarDiagnostics(caseDef, angle);
  const m = kind === "axial" ? d.axialMass : d.generalizedMass;
  return { ...harmonic(K, c, m), kind };
}

function fixedBaseline(c) {
  return candidate("axial", CASES[0], c, INITIAL_ANGLE);
}

function massData(mass, center, ix, iy, iz) {
  return {
    mass,
    center,
    inertia: {
      cx: v3(ix, 0, 0),
      cy: v3(0, iy, 0),
      cz: v3(0, 0, iz),
    },
  };
}

function compactSample(s) {
  return {
    angle: s.angle,
    omega: s.omega,
    length: s.length,
    energy: s.energy,
    nativeForce: s.nativeForce,
    physicalForce: s.physicalForce,
  };
}

function shape(samples) {
  const pick = [0, 6, 12, 18, 24, 30];
  return {
    final: compactSample(samples.at(-1)),
    extrema: {
      angleMin: Math.min(...samples.map((s) => s.angle)),
      angleMax: Math.max(...samples.map((s) => s.angle)),
      omegaMin: Math.min(...samples.map((s) => s.omega)),
      omegaMax: Math.max(...samples.map((s) => s.omega)),
      energyMin: Math.min(...samples.map((s) => s.energy)),
      energyMax: Math.max(...samples.map((s) => s.energy)),
    },
    checkpoints: pick.map((i) => ({ t: i / 60, ...compactSample(samples[i]) })),
  };
}

function difference(a, b) {
  if (a.length !== b.length) throw new Error("C0c sample count mismatch");
  const out = {};
  for (const field of ["angle", "omega", "length", "energy"]) {
    const ds = a.map((s, i) => s[field] - b[i][field]);
    out[field] = {
      rms: Math.sqrt(ds.reduce((sum, x) => sum + x * x, 0) / ds.length),
      max: Math.max(...ds.map(Math.abs)),
    };
  }
  return out;
}

function forceError(samples) {
  const xs = samples.slice(1).filter((s) => Number.isFinite(s.nativeForce));
  if (!xs.length) return { available: false };
  const errors = xs.map((s) => s.nativeForce - s.physicalForce);
  const physical = xs.map((s) => s.physicalForce);
  const rms = (values) => Math.sqrt(values.reduce((sum, x) => sum + x * x, 0) / values.length);
  const pRms = rms(physical);
  return {
    available: true,
    rms: rms(errors),
    normalizedRms: rms(errors) / Math.max(pRms, 1e-12),
    max: Math.max(...errors.map(Math.abs)),
    physicalRms: pRms,
  };
}

async function reference(caseDef, c) {
  const bench = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(caseDef.radius, L0),
    component: { springStiffness: K, dampingCoefficient: c, restLength: L0 },
    initialArmAngleRadians: INITIAL_ANGLE,
    armMass: caseDef.mass,
    armLength: ARM_LENGTH,
  });
  const cvt = (t) => ({
    angle: t.hingeAngle,
    omega: t.armAngularVelocity.z,
    length: t.currentLength,
    energy: t.passiveMechanicalEnergy,
    physicalForce: t.axialForceOnArm,
    nativeForce: Number.NaN,
  });
  try {
    const samples = [cvt(bench.trace())];
    for (let i = 0; i < STEPS; i += 1) samples.push(cvt(bench.advanceFresh(DT, REFERENCE_REFRESH)));
    return samples;
  } finally {
    bench.dispose();
  }
}

class NativeBench {
  constructor(b3, caseDef, c, path) {
    this.b3 = b3;
    this.caseDef = caseDef;
    this.c = c;
    this.path = path;
    this.g = geometry(caseDef.radius);
    this.mt = massTerms(caseDef.mass);

    const wd = b3.b3DefaultWorldDef();
    wd.gravity = v3();
    this.world = b3.b3CreateWorld(wd);

    this.base = b3.b3CreateBody(this.world, b3.b3DefaultBodyDef());
    const bd = b3.b3DefaultBodyDef();
    bd.type = b3.b3BodyType.b3_dynamicBody;
    bd.rotation = qZ(INITIAL_ANGLE);
    bd.enableSleep = false;
    this.arm = b3.b3CreateBody(this.world, bd);

    const sd = b3.b3DefaultShapeDef();
    sd.density = 1;
    b3.b3CreateBoxShape(this.arm, sd, 0.02, 0.02, 0.02);
    b3.b3Body_SetMassData(
      this.arm,
      massData(
        caseDef.mass,
        this.mt.com,
        Math.max(0.002, 0.05 * this.mt.iCom),
        this.mt.iCom,
        this.mt.iCom,
      ),
    );
    b3.b3Body_SetTransform(this.arm, b3.b3Body_GetPosition(this.arm), b3.b3Body_GetRotation(this.arm));

    const hd = b3.b3DefaultRevoluteJointDef();
    hd.base.bodyIdA = this.base;
    hd.base.bodyIdB = this.arm;
    hd.base.localFrameA = { p: v3(), q: qIdentity() };
    hd.base.localFrameB = { p: v3(), q: qIdentity() };
    hd.base.collideConnected = false;
    this.hinge = b3.b3CreateRevoluteJoint(this.world, hd);

    this.applied = this.initialMapping();
    const dd = b3.b3DefaultDistanceJointDef();
    dd.base.bodyIdA = this.base;
    dd.base.bodyIdB = this.arm;
    dd.base.localFrameA = { p: this.g.chassis, q: qIdentity() };
    dd.base.localFrameB = { p: this.g.arm, q: qIdentity() };
    dd.base.collideConnected = false;
    dd.length = L0;
    dd.enableSpring = true;
    dd.hertz = this.applied.hertz;
    dd.dampingRatio = this.applied.dampingRatio;
    this.distance = b3.b3CreateDistanceJoint(this.world, dd);
    b3.b3DistanceJoint_EnableSpring(this.distance, true);
    b3.b3DistanceJoint_SetLength(this.distance, L0);
    b3.b3DistanceJoint_SetSpringHertz(this.distance, this.applied.hertz);
    b3.b3DistanceJoint_SetSpringDampingRatio(this.distance, this.applied.dampingRatio);
  }

  angle() {
    return this.b3.b3RevoluteJoint_GetAngle(this.hinge);
  }

  initialMapping() {
    if (this.path === "fixed-hertz") return fixedBaseline(this.c);
    if (this.path.startsWith("axial")) return candidate("axial", this.caseDef, this.c, INITIAL_ANGLE);
    return candidate("generalized", this.caseDef, this.c, INITIAL_ANGLE);
  }

  remapIfNeeded() {
    let next = null;
    if (this.path === "axial-outer") next = candidate("axial", this.caseDef, this.c, this.angle());
    if (this.path === "generalized-outer") next = candidate("generalized", this.caseDef, this.c, this.angle());
    if (!next) return;
    this.applied = next;
    this.b3.b3DistanceJoint_SetSpringHertz(this.distance, next.hertz);
    this.b3.b3DistanceJoint_SetSpringDampingRatio(this.distance, next.dampingRatio);
  }

  trace() {
    const b3 = this.b3;
    const angle = this.angle();
    const omega = b3.b3Body_GetAngularVelocity(this.arm).z;
    const pA = b3.b3Body_GetWorldPoint(this.base, this.g.chassis);
    const pB = b3.b3Body_GetWorldPoint(this.arm, this.g.arm);
    const axis = norm(sub(pB, pA));
    const currentLength = len(sub(pB, pA));
    const com = b3.b3Body_GetWorldCenterOfMass(this.arm);
    const lv = b3.b3Body_GetLinearVelocity(this.arm);
    const av = b3.b3Body_GetAngularVelocity(this.arm);
    const lever = sub(pB, com);
    const eyeV = v3(
      lv.x + cross(av, lever).x,
      lv.y + cross(av, lever).y,
      lv.z + cross(av, lever).z,
    );
    const vAxis = dot(eyeV, axis);
    const extension = currentLength - L0;
    const physicalForce = -(K * extension + this.c * vAxis);
    let nativeForce = Number.NaN;
    if (typeof b3.b3Joint_GetConstraintForce === "function") {
      nativeForce = dot(b3.b3Joint_GetConstraintForce(this.distance), axis);
    }
    const energy = 0.5 * K * extension * extension + 0.5 * this.mt.iHinge * omega * omega;
    const live = planarDiagnostics(this.caseDef, angle);
    return {
      angle,
      omega,
      length: currentLength,
      energy,
      physicalForce,
      nativeForce,
      appliedHertz: this.applied.hertz,
      appliedDampingRatio: this.applied.dampingRatio,
      liveAxialMass: live.axialMass,
      liveGeneralizedMass: live.generalizedMass,
      liveLengthJacobian: live.jL,
    };
  }

  step() {
    this.remapIfNeeded();
    this.b3.b3World_Step(this.world, DT, 4);
    return this.trace();
  }

  dispose() {
    this.b3.b3DestroyWorld(this.world);
  }
}

async function native(caseDef, c, path) {
  const b3 = await Box3DFactory();
  const bench = new NativeBench(b3, caseDef, c, path);
  try {
    const samples = [bench.trace()];
    for (let i = 0; i < STEPS; i += 1) samples.push(bench.step());
    const range = (field) => [Math.min(...samples.map((s) => s[field])), Math.max(...samples.map((s) => s[field]))];
    return {
      samples,
      mapping: {
        appliedHertz: range("appliedHertz"),
        appliedDampingRatio: range("appliedDampingRatio"),
        liveAxialMass: range("liveAxialMass"),
        liveGeneralizedMass: range("liveGeneralizedMass"),
        liveLengthJacobian: range("liveLengthJacobian"),
      },
    };
  } finally {
    bench.dispose();
  }
}

const out = {
  metadata: {
    referenceHz: 3840,
    observationHz: 60,
    duration: 0.5,
    nativeStep: "World_Step(1/60,4)",
    authored: { k: K, combinedC: C, restLength: L0 },
    paths: PATHS,
  },
  cases: {},
};

for (const caseDef of CASES) {
  out.cases[caseDef.name] = {};
  for (const law of LAWS) {
    const ref = await reference(caseDef, law.c);
    const result = { reference: shape(ref), paths: {} };
    out.cases[caseDef.name][law.name] = result;
    for (const path of PATHS) {
      const n = await native(caseDef, law.c, path);
      result.paths[path] = {
        differenceToReference: difference(n.samples, ref),
        forceLaw: forceError(n.samples),
        mapping: n.mapping,
        trajectory: shape(n.samples),
      };
    }
  }
}

console.log(`REP2_C0C_METRICS ${JSON.stringify(out)}`);
