import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runRep3HingeAxisProbe } from "../.e1-test-build/src/rep3/hinge-axis-probe.js";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const outputPath = resolve(
  repositoryRoot,
  process.argv[2] ?? "artifacts/rep3-stage-p-hinge-axis.json",
);

function normalize(value) {
  const length = Math.hypot(value.x, value.y, value.z);
  return { x: value.x / length, y: value.y / length, z: value.z / length };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

const baseline = await runRep3HingeAxisProbe({ x: 0, y: 0, z: 1 });
const tilted = await runRep3HingeAxisProbe(normalize({ x: 0, y: 1, z: 1 }));

const evidence = Object.freeze({
  schema: "rep3-stage-p-hinge-axis-v1",
  generatedAt: new Date().toISOString(),
  claimBoundary:
    "Pinned box3d.js substrate feasibility only; no Rep3 Stage A, Owner, product, vehicle or architecture PASS.",
  baseline,
  tilted,
  finalEndpointSeparation: distance(
    baseline.final.endpointWorld,
    tilted.final.endpointWorld,
  ),
});

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify(evidence, null, 2));
