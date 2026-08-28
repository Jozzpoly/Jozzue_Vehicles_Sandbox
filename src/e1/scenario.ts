import type { E1Document } from "./model.js";

export function createE1DirectBaseline(): E1Document {
  return {
    experiment: "e1-causal-spine",
    revision: 0,
    pivot: {
      origin: { x: -1.6, y: 1.15, z: 0.1 },
      axis: { x: 0.2, y: 0.12, z: 1 },
    },
    arm: {
      restDirection: { x: 1, y: -0.08, z: 0.03 },
      length: 3.15,
      angleMinRad: -0.32,
      angleMaxRad: 0.42,
    },
    damper: {
      upperHardpoint: { x: -0.65, y: 3.2, z: 0.55 },
      lowerConnection: "arm-end",
    },
  };
}
