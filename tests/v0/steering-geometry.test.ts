import assert from "node:assert/strict";
import test from "node:test";
import {
  STEERING_GEOMETRIES,
  solveSteeringOracle,
  straightTieRodLength,
  validateSteeringGeometry,
} from "../../src/v0/steering-geometry.js";

const degrees = (radians: number): number => (radians * 180) / Math.PI;

test("C1 variants start straight with fixed symmetric tie-rod lengths", () => {
  for (const geometry of Object.values(STEERING_GEOMETRIES)) {
    const center = solveSteeringOracle(geometry, 0);
    assert.ok(Math.abs(center.left.angleRadians) < 1e-12);
    assert.ok(Math.abs(center.right.angleRadians) < 1e-12);
    assert.ok(
      Math.abs(
        straightTieRodLength(geometry, "LEFT") -
          straightTieRodLength(geometry, "RIGHT"),
      ) < 1e-12,
    );
  }
  assert.notEqual(
    straightTieRodLength(STEERING_GEOMETRIES.A, "LEFT"),
    straightTieRodLength(STEERING_GEOMETRIES.B, "LEFT"),
  );
});

test("C1 validates both assembly branches through the full rack travel", () => {
  for (const geometry of Object.values(STEERING_GEOMETRIES)) {
    const frames = validateSteeringGeometry(geometry, 81);
    assert.equal(frames.length, 81);
    for (const side of ["left", "right"] as const) {
      const branches = new Set(frames.map((frame) => frame[side].branch));
      assert.equal(branches.size, 1);
      assert.ok(
        Math.min(...frames.map((frame) => frame[side].circleHeight)) > 0.04,
      );
    }
  }
});

test("C1 steering-arm radius produces materially different steering curves", () => {
  const rack = STEERING_GEOMETRIES.A.rackTravel;
  const a = solveSteeringOracle(STEERING_GEOMETRIES.A, rack);
  const b = solveSteeringOracle(STEERING_GEOMETRIES.B, rack);
  const largestDifference = Math.max(
    Math.abs(degrees(a.left.angleRadians - b.left.angleRadians)),
    Math.abs(degrees(a.right.angleRadians - b.right.angleRadians)),
  );
  assert.ok(
    largestDifference >= 5,
    `expected >= 5 degrees at full rack, got ${largestDifference}`,
  );
});

test("C1 mirror input mirrors left/right oracle output", () => {
  for (const geometry of Object.values(STEERING_GEOMETRIES)) {
    const positive = solveSteeringOracle(geometry, geometry.rackTravel * 0.7);
    const negative = solveSteeringOracle(geometry, -geometry.rackTravel * 0.7);
    assert.ok(
      Math.abs(positive.left.angleRadians + negative.right.angleRadians) < 1e-12,
    );
    assert.ok(
      Math.abs(positive.right.angleRadians + negative.left.angleRadians) < 1e-12,
    );
  }
});
