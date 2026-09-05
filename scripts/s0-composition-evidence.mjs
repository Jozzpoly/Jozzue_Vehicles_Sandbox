import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runS0TwoArmProbe,
  S0_TWO_ARM_APPARATUS,
} from "../.e1-test-build/src/s0/two-arm-upright-probe.js";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const outputPath = resolve(
  repositoryRoot,
  process.argv[2] ?? "artifacts/s0-two-arm-upright-composition.json",
);

const vec3 = (x = 0, y = 0, z = 0) => ({ x, y, z });

function baselineAuthority() {
  return {
    upper: {
      inboardAWorld: vec3(0, 0.42, -0.3),
      inboardBWorld: vec3(0, 0.42, 0.3),
      outboardWorld: vec3(0.72, 0.2, 0),
    },
    lower: {
      inboardAWorld: vec3(0, -0.42, -0.3),
      inboardBWorld: vec3(0, -0.42, 0.3),
      outboardWorld: vec3(0.76, -0.22, 0),
    },
  };
}

function mutatedAuthority() {
  const baseline = baselineAuthority();
  return {
    upper: {
      inboardAWorld: vec3(0.08, 0.52, -0.3),
      inboardBWorld: vec3(0.08, 0.52, 0.3),
      outboardWorld: baseline.upper.outboardWorld,
    },
    lower: baseline.lower,
  };
}

function tiltedUpperAxisAuthority() {
  const baseline = baselineAuthority();
  return {
    upper: {
      inboardAWorld: vec3(-0.06, 0.42, -0.3),
      inboardBWorld: vec3(0.06, 0.42, 0.3),
      outboardWorld: baseline.upper.outboardWorld,
    },
    lower: baseline.lower,
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function maxPathSeparation(a, b) {
  if (a.length !== b.length) throw new Error(`S0 path length mismatch ${a.length} vs ${b.length}`);
  let maximum = 0;
  for (let index = 0; index < a.length; index += 1) {
    maximum = Math.max(maximum, distance(a[index], b[index]));
  }
  return maximum;
}

function sameId(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function summarize(result) {
  return {
    derived: result.derived,
    nativeBodiesMatchExpected: {
      upperHinge:
        sameId(result.nativeJointBodies.upperHingeA, result.expectedBodies.support) &&
        sameId(result.nativeJointBodies.upperHingeB, result.expectedBodies.upperArm),
      lowerHinge:
        sameId(result.nativeJointBodies.lowerHingeA, result.expectedBodies.support) &&
        sameId(result.nativeJointBodies.lowerHingeB, result.expectedBodies.lowerArm),
      upperBall:
        sameId(result.nativeJointBodies.upperBallA, result.expectedBodies.upperArm) &&
        sameId(result.nativeJointBodies.upperBallB, result.expectedBodies.upright),
      lowerBall:
        sameId(result.nativeJointBodies.lowerBallA, result.expectedBodies.lowerArm) &&
        sameId(result.nativeJointBodies.lowerBallB, result.expectedBodies.upright),
    },
    maxUpperBallSeparation: result.maxUpperBallSeparation,
    maxLowerBallSeparation: result.maxLowerBallSeparation,
    maxUpperHingePivotSeparation: result.maxUpperHingePivotSeparation,
    maxLowerHingePivotSeparation: result.maxLowerHingePivotSeparation,
    maxPlanarDrift: result.maxPlanarDrift,
    maxUprightLinearSpeed: result.maxUprightLinearSpeed,
    maxUprightAngularSpeed: result.maxUprightAngularSpeed,
    maxUprightDisplacement: result.maxUprightDisplacement,
    upperHingeAxisAAlignmentError: result.upperHingeAxisAAlignmentError,
    upperHingeAxisBAlignmentError: result.upperHingeAxisBAlignmentError,
    lowerHingeAxisAAlignmentError: result.lowerHingeAxisAAlignmentError,
    lowerHingeAxisBAlignmentError: result.lowerHingeAxisBAlignmentError,
    initialUprightOriginWorld: result.initial.uprightOriginWorld,
    finalUprightOriginWorld: result.final.uprightOriginWorld,
  };
}

const [baseline, mutated, tilted] = await Promise.all([
  runS0TwoArmProbe(baselineAuthority()),
  runS0TwoArmProbe(mutatedAuthority()),
  runS0TwoArmProbe(tiltedUpperAxisAuthority()),
]);

const evidence = Object.freeze({
  schema: "jv-s0-two-arm-upright-composition-v2",
  generatedAt: new Date().toISOString(),
  claimBoundary:
    "Machine-only S0 selection evidence for two-arm/upright closed-chain feasibility on pinned box3d.js. No Owner, product, complete-suspension, steering or architecture PASS.",
  apparatus: S0_TWO_ARM_APPARATUS,
  baseline: summarize(baseline),
  mutatedUpperInboard: summarize(mutated),
  tiltedUpperBearingLine: summarize(tilted),
  comparisons: {
    translatedUpperInboard: {
      initialUprightSeparation: distance(
        baseline.initial.uprightOriginWorld,
        mutated.initial.uprightOriginWorld,
      ),
      finalUprightSeparation: distance(
        baseline.final.uprightOriginWorld,
        mutated.final.uprightOriginWorld,
      ),
      maxUprightPathSeparation: maxPathSeparation(
        baseline.uprightPath,
        mutated.uprightPath,
      ),
    },
    tiltedUpperBearingLine: {
      initialUprightSeparation: distance(
        baseline.initial.uprightOriginWorld,
        tilted.initial.uprightOriginWorld,
      ),
      finalUprightSeparation: distance(
        baseline.final.uprightOriginWorld,
        tilted.final.uprightOriginWorld,
      ),
      maxUprightPathSeparation: maxPathSeparation(
        baseline.uprightPath,
        tilted.uprightPath,
      ),
      maxOutOfPlaneResponse: tilted.maxPlanarDrift,
    },
  },
  knownBoundary:
    "Two revolute inboard arms plus two spherical outboard joints leave a second upright rotational/steering DOF unless a later representative mechanism adds a real tie/steering relation. S0 does not hide or solve that DOF.",
});

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify(evidence, null, 2));
