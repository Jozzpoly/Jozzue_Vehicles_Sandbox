import assert from "node:assert/strict";
import test from "node:test";
import {
  Rep2CoiloverForceBench,
  makeRep2VerticalCoiloverGeometry,
  type Rep2CoiloverComponent,
  type Rep2CoiloverForceTrace,
} from "../../src/rep2/coilover-force-bench.js";

const OBSERVATION_HZ = 60;
const OBSERVATION_DT = 1 / OBSERVATION_HZ;
const DURATION_SECONDS = 0.5;
const OBSERVATION_COUNT = Math.round(DURATION_SECONDS * OBSERVATION_HZ);
const GEOMETRY = makeRep2VerticalCoiloverGeometry(0.35, 0.5);
const REST_LENGTH = 0.5;
const FRESH_HZ = [60, 120, 240, 480, 960, 1920] as const;

type FreshHz = (typeof FRESH_HZ)[number];
type LawName = "spring-only" | "damper-only" | "combined";

type Sample = Readonly<{
  angle: number;
  omega: number;
  length: number;
  energy: number;
  passivityResidual: number;
  dampingDissipationPower: number;
}>;

type TrajectoryDifference = Readonly<{
  angleRms: number;
  angleMax: number;
  omegaRms: number;
  omegaMax: number;
  lengthRms: number;
  lengthMax: number;
  energyRms: number;
  energyMax: number;
}>;

type EnergySummary = Readonly<{
  initial: number;
  final: number;
  minimum: number;
  maximum: number;
  maxPositiveOvershoot: number;
  normalizedPositiveOvershoot: number;
  finalRatio: number;
}>;

interface Regime {
  readonly name: "moderate" | "stiffer";
  readonly springStiffness: number;
  readonly dampingCoefficient: number;
}

const REGIMES: readonly Regime[] = [
  { name: "moderate", springStiffness: 900, dampingCoefficient: 18 },
  { name: "stiffer", springStiffness: 3600, dampingCoefficient: 36 },
];

function sample(trace: Rep2CoiloverForceTrace): Sample {
  return {
    angle: trace.hingeAngle,
    omega: trace.armAngularVelocity.z,
    length: trace.currentLength,
    energy: trace.passiveMechanicalEnergy,
    passivityResidual: trace.passivityResidual,
    dampingDissipationPower: trace.dampingDissipationPower,
  };
}

function finiteSample(value: Sample): boolean {
  return Object.values(value).every(Number.isFinite);
}

function rms(values: readonly number[]): number {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

function maxAbs(values: readonly number[]): number {
  return Math.max(...values.map(Math.abs));
}

function difference(a: readonly Sample[], b: readonly Sample[]): TrajectoryDifference {
  assert.equal(a.length, b.length);
  assert.ok(a.length > 0);
  const angle = a.map((value, index) => value.angle - b[index]!.angle);
  const omega = a.map((value, index) => value.omega - b[index]!.omega);
  const length = a.map((value, index) => value.length - b[index]!.length);
  const energy = a.map((value, index) => value.energy - b[index]!.energy);
  return {
    angleRms: rms(angle),
    angleMax: maxAbs(angle),
    omegaRms: rms(omega),
    omegaMax: maxAbs(omega),
    lengthRms: rms(length),
    lengthMax: maxAbs(length),
    energyRms: rms(energy),
    energyMax: maxAbs(energy),
  };
}

function energySummary(samples: readonly Sample[]): EnergySummary {
  assert.ok(samples.length > 0);
  const energies = samples.map((value) => value.energy);
  const initial = energies[0]!;
  const final = energies[energies.length - 1]!;
  const minimum = Math.min(...energies);
  const maximum = Math.max(...energies);
  const maxPositiveOvershoot = Math.max(0, maximum - initial);
  const normalization = Math.max(Math.abs(initial), 1e-12);
  return {
    initial,
    final,
    minimum,
    maximum,
    maxPositiveOvershoot,
    normalizedPositiveOvershoot: maxPositiveOvershoot / normalization,
    finalRatio: final / normalization,
  };
}

function componentFor(regime: Regime, law: LawName): Rep2CoiloverComponent {
  if (law === "spring-only") {
    return {
      springStiffness: regime.springStiffness,
      dampingCoefficient: 0,
      restLength: REST_LENGTH,
    };
  }
  if (law === "damper-only") {
    return {
      springStiffness: 0,
      dampingCoefficient: regime.dampingCoefficient,
      restLength: REST_LENGTH,
    };
  }
  return {
    springStiffness: regime.springStiffness,
    dampingCoefficient: regime.dampingCoefficient,
    restLength: REST_LENGTH,
  };
}

function initialStateFor(law: LawName): { angle: number; omega: number } {
  if (law === "damper-only") return { angle: 0, omega: 2 };
  return { angle: 0.08, omega: 0 };
}

async function createBench(regime: Regime, law: LawName): Promise<Rep2CoiloverForceBench> {
  const initial = initialStateFor(law);
  return Rep2CoiloverForceBench.create({
    geometry: GEOMETRY,
    component: componentFor(regime, law),
    initialArmAngleRadians: initial.angle,
    initialArmAngularVelocityZ: initial.omega,
  });
}

async function runFresh(regime: Regime, law: LawName, hz: FreshHz): Promise<Sample[]> {
  const bench = await createBench(regime, law);
  try {
    const refreshesPerObservation = hz / OBSERVATION_HZ;
    assert.ok(Number.isInteger(refreshesPerObservation));
    const samples: Sample[] = [sample(bench.trace())];
    for (let index = 0; index < OBSERVATION_COUNT; index += 1) {
      samples.push(sample(bench.advanceFresh(OBSERVATION_DT, refreshesPerObservation)));
    }
    assert.ok(samples.every(finiteSample));
    return samples;
  } finally {
    bench.dispose();
  }
}

async function runStale60x4(regime: Regime, law: LawName): Promise<Sample[]> {
  const bench = await createBench(regime, law);
  try {
    const samples: Sample[] = [sample(bench.trace())];
    for (let index = 0; index < OBSERVATION_COUNT; index += 1) {
      samples.push(sample(bench.advanceOuter(OBSERVATION_DT, 4)));
    }
    assert.ok(samples.every(finiteSample));
    return samples;
  } finally {
    bench.dispose();
  }
}

async function runFreeControl(mode: "explicit-240" | "outer-60x4"): Promise<Sample[]> {
  const bench = await Rep2CoiloverForceBench.create({
    geometry: GEOMETRY,
    component: { springStiffness: 0, dampingCoefficient: 0, restLength: REST_LENGTH },
    initialArmAngleRadians: 0.02,
    initialArmAngularVelocityZ: 2,
  });
  try {
    const samples: Sample[] = [sample(bench.trace())];
    for (let index = 0; index < OBSERVATION_COUNT; index += 1) {
      if (mode === "explicit-240") {
        for (let micro = 0; micro < 4; micro += 1) {
          bench.advanceWithoutComponentForce(1 / 240, 1);
        }
      } else {
        bench.advanceWithoutComponentForce(OBSERVATION_DT, 4);
      }
      samples.push(sample(bench.trace()));
    }
    assert.ok(samples.every(finiteSample));
    return samples;
  } finally {
    bench.dispose();
  }
}

function assertInstantaneousPassivity(trace: Rep2CoiloverForceTrace): void {
  const scale = Math.max(
    1,
    Math.abs(trace.componentPowerOnBodies),
    Math.abs(trace.springPotentialPower),
    Math.abs(trace.dampingDissipationPower),
  );
  assert.ok(trace.dampingDissipationPower >= -1e-12);
  assert.ok(
    Math.abs(trace.passivityResidual) <= 1e-10 * scale,
    `passivity residual ${trace.passivityResidual} exceeded scale ${scale}`,
  );
}

function allFiniteObject(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allFiniteObject);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(allFiniteObject);
  }
  return true;
}

test("C0b P0 instantaneous spring/damper law satisfies passive power identity", async () => {
  const bench = await Rep2CoiloverForceBench.create({
    geometry: {
      chassisEyeLocal: { x: -0.27, y: 0.53, z: 0.06 },
      armEyeLocal: { x: -0.34, y: 0.02, z: -0.03 },
    },
    component: { springStiffness: 1375, dampingCoefficient: 31, restLength: 0.49 },
    initialArmAngleRadians: 0.07,
    initialArmAngularVelocityZ: -1.4,
  });
  try {
    assertInstantaneousPassivity(bench.trace());
    for (let index = 0; index < 24; index += 1) {
      assertInstantaneousPassivity(bench.advanceFresh(1 / 480, 1));
    }
  } finally {
    bench.dispose();
  }
});

test("C0b P1-P4 study emits finite common-time convergence, stale-force and energy evidence", async () => {
  const freeExplicit = await runFreeControl("explicit-240");
  const freeOuter = await runFreeControl("outer-60x4");

  const study: Record<string, unknown> = {
    metadata: {
      observationHz: OBSERVATION_HZ,
      durationSeconds: DURATION_SECONDS,
      freshHz: FRESH_HZ,
      stalePath: "World_Step(1/60, 4) with one component-force evaluation",
      explicit240Control: "4 x World_Step(1/240, 1) with no component force",
    },
    freeControl: {
      difference: difference(freeOuter, freeExplicit),
      explicitEnergy: energySummary(freeExplicit),
      outerEnergy: energySummary(freeOuter),
    },
    regimes: {},
  };

  const regimeOutput = study.regimes as Record<string, unknown>;

  for (const regime of REGIMES) {
    const lawOutput: Record<string, unknown> = {};
    regimeOutput[regime.name] = lawOutput;

    for (const law of ["spring-only", "damper-only", "combined"] as const) {
      const fresh = new Map<FreshHz, Sample[]>();
      for (const hz of FRESH_HZ) fresh.set(hz, await runFresh(regime, law, hz));
      const stale = await runStale60x4(regime, law);
      const reference = fresh.get(1920)!;
      const reference960 = fresh.get(960)!;
      const reference480 = fresh.get(480)!;

      const cadenceToReference: Record<string, TrajectoryDifference> = {};
      const cadenceEnergy: Record<string, EnergySummary> = {};
      for (const hz of FRESH_HZ) {
        cadenceToReference[String(hz)] = difference(fresh.get(hz)!, reference);
        cadenceEnergy[String(hz)] = energySummary(fresh.get(hz)!);
      }

      const diff960 = difference(reference960, reference);
      const diff480 = difference(reference480, reference);
      const referenceTightening = {
        angleRmsRatio960Over480: diff960.angleRms / Math.max(diff480.angleRms, 1e-30),
        omegaRmsRatio960Over480: diff960.omegaRms / Math.max(diff480.omegaRms, 1e-30),
        lengthRmsRatio960Over480: diff960.lengthRms / Math.max(diff480.lengthRms, 1e-30),
        energyRmsRatio960Over480: diff960.energyRms / Math.max(diff480.energyRms, 1e-30),
      };

      const referenceEnergy = energySummary(reference);
      if (law !== "spring-only") {
        assert.ok(
          referenceEnergy.final < referenceEnergy.initial,
          `${regime.name}/${law} fine reference should dissipate energy; ${JSON.stringify(referenceEnergy)}`,
        );
      }

      lawOutput[law] = {
        referenceTightening,
        cadenceToReference,
        cadenceEnergy,
        stale60x4ToReference: difference(stale, reference),
        stale60x4Energy: energySummary(stale),
        maxSampledPassivityResidual1920: maxAbs(reference.map((value) => value.passivityResidual)),
        minSampledDampingDissipationPower1920: Math.min(
          ...reference.map((value) => value.dampingDissipationPower),
        ),
      };
    }
  }

  assert.ok(allFiniteObject(study));
  console.log(`C0B_METRICS ${JSON.stringify(study)}`);
});
