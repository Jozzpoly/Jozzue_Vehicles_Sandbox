import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runRep4DamperedCornerProbe } from "../.e1-test-build/src/rep4/dampered-corner-world.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(root, process.argv[2] ?? "artifacts/rep4-stage-a-robustness.json");
const v = (x = 0, y = 0, z = 0) => ({ x, y, z });

const innerDamperEye = v(0.228, -0.36, 0);
const outerDamperEye = v(0.418, -0.31, 0);

function lerp(a, b, t) {
  return v(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (b.z - a.z) * t,
  );
}

function authority(tieHeight = 0, damperT = 0) {
  return {
    twoArm: {
      upper: {
        inboardAWorld: v(0, 0.42, -0.3),
        inboardBWorld: v(0, 0.42, 0.3),
        outboardWorld: v(0.72, 0.2, 0),
      },
      lower: {
        inboardAWorld: v(0, -0.42, -0.3),
        inboardBWorld: v(0, -0.42, 0.3),
        outboardWorld: v(0.76, -0.22, 0),
      },
    },
    chassisTiePointWorld: v(0.28, tieHeight, 0.32),
    uprightTiePickupWorld: v(0.74, 0, 0.18),
    damperChassisEyeWorld: v(0.18, 0.13, 0),
    damperLowerEyeWorld: lerp(innerDamperEye, outerDamperEye, damperT),
  };
}

function wrapRadians(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function signedTwist(q, authorityValue) {
  const axis = v(
    authorityValue.twoArm.upper.outboardWorld.x - authorityValue.twoArm.lower.outboardWorld.x,
    authorityValue.twoArm.upper.outboardWorld.y - authorityValue.twoArm.lower.outboardWorld.y,
    authorityValue.twoArm.upper.outboardWorld.z - authorityValue.twoArm.lower.outboardWorld.z,
  );
  const magnitude = Math.hypot(axis.x, axis.y, axis.z);
  const projected = (
    q.v.x * axis.x + q.v.y * axis.y + q.v.z * axis.z
  ) / magnitude;
  return wrapRadians(2 * Math.atan2(projected, q.s));
}

function displacement(result) {
  const a = result.initial.uprightPositionWorld;
  const b = result.final.uprightPositionWorld;
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

const tieHeights = [0.05, 0, -0.025, -0.05, -0.075, -0.1, -0.125, -0.15];
const observationSteps = [12, 18, 24, 30, 36, 42, 48, 60];
const damperTs = [0, 0.25, 0.5, 0.75, 1];

const baselineAtStep = new Map();
for (const step of observationSteps) {
  const baseAuthority = authority(0, 0);
  const base = await runRep4DamperedCornerProbe(baseAuthority, "DAMPER", step);
  baselineAtStep.set(step, {
    twist: signedTwist(base.final.uprightRotation, baseAuthority),
    displacement: displacement(base),
  });
}

const tieSweep = [];
for (const tieHeight of tieHeights) {
  const authorityValue = authority(tieHeight, 0);
  const samples = [];
  for (const step of observationSteps) {
    const result = await runRep4DamperedCornerProbe(authorityValue, "DAMPER", step);
    const base = baselineAtStep.get(step);
    const twist = signedTwist(result.final.uprightRotation, authorityValue);
    const travel = displacement(result);
    samples.push({
      step,
      timeSeconds: step / 60,
      signedTwist: twist,
      signedTwistSeparationFromBaseline: Math.abs(wrapRadians(twist - base.twist)),
      displacement: travel,
      displacementDifferenceFromBaseline: Math.abs(travel - base.displacement),
      maxUpperBallSeparation: result.maxUpperBallSeparation,
      maxLowerBallSeparation: result.maxLowerBallSeparation,
      maxTieLengthError: result.maxTieLengthError,
    });
  }
  tieSweep.push({ tieHeight, samples });
}

const damperSweep = [];
for (const damperT of damperTs) {
  const authorityValue = authority(0, damperT);
  const result = await runRep4DamperedCornerProbe(authorityValue, "DAMPER", 120);
  damperSweep.push({
    damperT,
    damperLowerEyeWorld: authorityValue.damperLowerEyeWorld,
    initialDamperLength: result.derived.initialDamperLength,
    rotationalJacobian: result.derived.rotationalJacobian,
    axialMass: result.derived.axialMass,
    hertz: result.derived.hertz,
    dampingRatio: result.derived.dampingRatio,
    maxUprightDisplacement: result.maxUprightDisplacement,
    maxAbsDamperExtension: result.maxAbsDamperExtension,
    maxAbsDamperAxialForce: result.maxAbsDamperAxialForce,
    maxUpperBallSeparation: result.maxUpperBallSeparation,
    maxLowerBallSeparation: result.maxLowerBallSeparation,
    maxTieLengthError: result.maxTieLengthError,
  });
}

const evidence = {
  schema: "rep4-stage-a-robustness-neighborhood-v1",
  purpose: "Post-PASS falsification of single-sample overfitting; diagnostic only, no new product claim.",
  tieSweep: {
    tieHeights,
    observationSteps,
    baselineTieHeight: 0,
    samples: tieSweep,
  },
  damperSweep: {
    damperTs,
    samples: damperSweep,
  },
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(evidence, null, 2) + "\n", "utf8");
console.log(JSON.stringify(evidence, null, 2));
