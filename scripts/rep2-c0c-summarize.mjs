import { readFileSync } from "node:fs";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("usage: node scripts/rep2-c0c-summarize.mjs <study-log>");

const raw = readFileSync(inputPath, "utf8");
const marker = "REP2_C0C_METRICS ";
const line = raw.split(/\r?\n/).find((value) => value.startsWith(marker));
if (!line) throw new Error("REP2_C0C_METRICS marker not found");
const study = JSON.parse(line.slice(marker.length));

const expectedCases = ["baseline", "mass-x2", "leverage-half-radius"];
const expectedLaws = ["spring-only", "combined"];
const expectedPaths = [
  "axial-once",
  "axial-outer",
  "generalized-once",
  "generalized-outer",
  "fixed-hertz",
];

function finite(value, label) {
  if (!Number.isFinite(value)) throw new Error(`non-finite ${label}: ${value}`);
  return value;
}

function compactPath(path, result) {
  const difference = result.differenceToReference;
  const checkpoint0 = result.trajectory.checkpoints[0];
  const force = result.forceLaw;
  if (!force.available) throw new Error(`reaction force unavailable for ${path}`);

  const appliedParameterSemantics = path.endsWith("-once") || path === "fixed-hertz"
    ? {
        kind: "constant-from-initial-mapping",
        hertz: finite(checkpoint0.mappedHertz, `${path}.initialHertz`),
        dampingRatio: finite(checkpoint0.mappedDampingRatio, `${path}.initialDampingRatio`),
      }
    : {
        kind: "recomputed-before-each-outer-step",
        exactAppliedRangeRetainedByRawApparatus: false,
        note: "raw mappingRange samples the post-step live candidate; acceptance does not treat it as exact applied-parameter history",
      };

  return {
    trajectoryRms: {
      angle: finite(difference.angle.rms, `${path}.angleRms`),
      omega: finite(difference.omega.rms, `${path}.omegaRms`),
      length: finite(difference.length.rms, `${path}.lengthRms`),
      authoredMechanicalEnergy: finite(difference.energy.rms, `${path}.energyRms`),
    },
    forceLaw: {
      normalizedRmsError: finite(force.normalizedRmsError, `${path}.forceNRMSE`),
      rmsErrorNewtons: finite(force.rmsError, `${path}.forceRms`),
      maxAbsErrorNewtons: finite(force.maxAbsError, `${path}.forceMax`),
    },
    appliedParameterSemantics,
    liveCandidateDiagnostics: {
      rawHertzRange: result.mappingRange.hertz.map((v, i) => finite(v, `${path}.rawHertz[${i}]`)),
      rawAxialMassRange: result.mappingRange.axialMass.map((v, i) => finite(v, `${path}.rawAxialMass[${i}]`)),
      rawGeneralizedMassRange: result.mappingRange.generalizedMass.map((v, i) => finite(v, `${path}.rawGeneralizedMass[${i}]`)),
    },
  };
}

const cases = {};
const rankingRows = [];
for (const caseName of expectedCases) {
  const sourceCase = study.cases[caseName];
  if (!sourceCase) throw new Error(`missing case ${caseName}`);
  cases[caseName] = {};

  for (const lawName of expectedLaws) {
    const sourceLaw = sourceCase[lawName];
    if (!sourceLaw) throw new Error(`missing law ${caseName}/${lawName}`);
    const paths = {};
    for (const path of expectedPaths) {
      const sourcePath = sourceLaw.paths[path];
      if (!sourcePath) throw new Error(`missing path ${caseName}/${lawName}/${path}`);
      paths[path] = compactPath(path, sourcePath);
      rankingRows.push({ caseName, lawName, path, ...paths[path] });
    }
    cases[caseName][lawName] = { paths };
  }
}

const byPath = {};
for (const path of expectedPaths) {
  const rows = rankingRows.filter((row) => row.path === path);
  byPath[path] = {
    meanForceLawNRMSE: rows.reduce((s, row) => s + row.forceLaw.normalizedRmsError, 0) / rows.length,
    worstForceLawNRMSE: Math.max(...rows.map((row) => row.forceLaw.normalizedRmsError)),
    meanAngleRms: rows.reduce((s, row) => s + row.trajectoryRms.angle, 0) / rows.length,
    worstAngleRms: Math.max(...rows.map((row) => row.trajectoryRms.angle)),
  };
}

const mutationComparisons = {};
for (const caseName of ["mass-x2", "leverage-half-radius"]) {
  mutationComparisons[caseName] = {};
  for (const lawName of expectedLaws) {
    const p = cases[caseName][lawName].paths;
    mutationComparisons[caseName][lawName] = {
      axialOuterVsFixedForceErrorRatio:
        p["axial-outer"].forceLaw.normalizedRmsError / p["fixed-hertz"].forceLaw.normalizedRmsError,
      axialOuterVsFixedAngleErrorRatio:
        p["axial-outer"].trajectoryRms.angle / p["fixed-hertz"].trajectoryRms.angle,
      axialOuterVsGeneralizedOuterForceErrorRatio:
        p["axial-outer"].forceLaw.normalizedRmsError / p["generalized-outer"].forceLaw.normalizedRmsError,
    };
  }
}

const output = {
  metadata: {
    sourceMarker: marker.trim(),
    observationHz: study.metadata.observationHz,
    referenceHz: study.metadata.referenceHz,
    worldStep: study.metadata.worldStep,
    authored: study.metadata.authored,
    reactionForceAvailable: study.metadata.reactionForceAvailable,
    telemetryCorrection:
      "raw mappingRange is retained only as live candidate diagnostics; exact applied ranges are asserted only for constant once/fixed paths",
  },
  aggregateByPath: byPath,
  mutationComparisons,
  cases,
};

console.log(`REP2_C0C_ACCEPTANCE_SUMMARY ${JSON.stringify(output)}`);
