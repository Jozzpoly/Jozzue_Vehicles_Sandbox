import assert from "node:assert/strict";
import test from "node:test";
import { runV0SteeringEvidence } from "../../src/v0/driving-evidence.js";

test("C3 A/B geometry changes measured curvature after explicit rack settle", async () => {
  for (const steeringInput of [-0.65, 0.65] as const) {
    const a = await runV0SteeringEvidence("A", steeringInput);
    const b = await runV0SteeringEvidence("B", steeringInput);
    for (const result of [a, b]) {
      assert.ok(Math.abs(result.rackBaseline - result.rackTarget) < 0.0001);
      assert.ok(result.segmentDistance > 4);
      assert.ok(Math.abs(result.finalSpeed) > 1.5);
      assert.equal(result.minimumLeftContactCount, 1);
      assert.equal(result.minimumRightContactCount, 1);
      assert.equal(result.minimumWorldContactCount, 4);
      assert.ok(result.maxRackTrackingError < 0.0001);
      assert.ok(result.maxOracleResidual < 0.003);
      assert.ok(result.maxTieRodError < 0.0001);
    }
    assert.equal(Math.sign(a.segmentCurvature), -Math.sign(steeringInput));
    assert.equal(Math.sign(b.segmentCurvature), -Math.sign(steeringInput));
    assert.ok(
      Math.abs(a.segmentCurvature) > Math.abs(b.segmentCurvature) * 1.5,
      `expected A to turn materially tighter at ${steeringInput}: ${a.segmentCurvature} vs ${b.segmentCurvature}`,
    );
  }
});

test("C3 mirrored steering separates steering response from fixture bias", async () => {
  for (const variant of ["A", "B"] as const) {
    const left = await runV0SteeringEvidence(variant, -0.65);
    const right = await runV0SteeringEvidence(variant, 0.65);
    assert.ok(
      Math.abs(left.segmentCurvature + right.segmentCurvature) < 0.01,
      `${variant} mirror bias: ${left.segmentCurvature} vs ${right.segmentCurvature}`,
    );
  }
});

test("C3 straight A/B controls remain practically equivalent", async () => {
  const a = await runV0SteeringEvidence("A", 0);
  const b = await runV0SteeringEvidence("B", 0);
  assert.ok(Math.abs(a.segmentCurvature) < 0.003);
  assert.ok(Math.abs(b.segmentCurvature) < 0.003);
  assert.ok(Math.abs(a.segmentCurvature - b.segmentCurvature) < 0.001);
  assert.ok(Math.abs(a.segmentDistance - b.segmentDistance) < 0.1);
});

test("C3 segment evidence is deterministic", async () => {
  const first = await runV0SteeringEvidence("A", 0.65);
  const second = await runV0SteeringEvidence("A", 0.65);
  assert.deepEqual(first, second);
});
