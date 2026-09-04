import Box3DFactory from "box3d.js/inline";
import { readFileSync } from "node:fs";

const b3 = await Box3DFactory();

const packageJson = JSON.parse(
  readFileSync(new URL("../node_modules/box3d.js/package.json", import.meta.url), "utf8"),
);

const relevantKeys = Object.keys(b3)
  .filter((key) => /(DistanceJoint|WheelJoint|PrismaticJoint|Spring|Hertz|Damping)/i.test(key))
  .sort();

function defaultDef(name) {
  const fn = b3[name];
  if (typeof fn !== "function") return null;
  try {
    return fn();
  } catch (error) {
    return { error: String(error) };
  }
}

const output = {
  package: {
    name: packageJson.name,
    version: packageJson.version,
  },
  relevantKeys,
  defaults: {
    distance: defaultDef("b3DefaultDistanceJointDef"),
    wheel: defaultDef("b3DefaultWheelJointDef"),
    prismatic: defaultDef("b3DefaultPrismaticJointDef"),
  },
};

console.log(`REP2_SOLVER_SPRING_SURFACE ${JSON.stringify(output)}`);
