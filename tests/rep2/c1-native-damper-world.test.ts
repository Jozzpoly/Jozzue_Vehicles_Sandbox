import assert from "node:assert/strict";
import test from "node:test";
import {
  C1_NATIVE_COMPONENT,
  C1_NATIVE_SUBSTRATE,
  C1NativeDamperWorld,
} from "../../src/rep2/c1-native-damper-world.js";

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function finitePoint(value: Readonly<{ x: number; y: number; z: number }>): boolean {
  return [value.x, value.y, value.z].every(Number.isFinite);
}

function approximatelyEqual(actual: number, expected: number, tolerance = 1e-6): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

function expectedInitialMapping(snapshot: Awaited<ReturnType<C1NativeDamperWorld["snapshot"]>>) {
  const { armMass, armLength, initialArmAngle } = C1_NATIVE_SUBSTRATE;
  const cosine = Math.cos(initialArmAngle);
  const sine = Math.sin(initialArmAngle);
  const rotate = (value: Readonly<{ x: number; y: number; z: number }>) => ({
    x: cosine * value.x - sine * value.y,
    y: sine * value.x + cosine * value.y,
    z: value.z,
  });
  const eyeA = snapshot.eyeALocal;
  const eyeB = rotate(snapshot.eyeBLocal);
  const span = { x: eyeB.x - eyeA.x, y: eyeB.y - eyeA.y, z: eyeB.z - eyeA.z };
  const spanLength = Math.hypot(span.x, span.y, span.z);
  const axis = { x: span.x / spanLength, y: span.y / spanLength };
  const lever = rotate({
    x: snapshot.eyeBLocal.x + 0.5 * armLength,
    y: snapshot.eyeBLocal.y,
    z: snapshot.eyeBLocal.z,
  });
  const rotationalJacobian = lever.x * axis.y - lever.y * axis.x;
  const inertiaComZ = (armMass * armLength * armLength) / 12;
  const axialMass = 1 / (
    1 / armMass + (rotationalJacobian * rotationalJacobian) / inertiaComZ
  );
  const hertz = Math.sqrt(snapshot.springStiffness / axialMass) / (2 * Math.PI);
  const dampingRatio = snapshot.dampingCoefficient /
    (2 * Math.sqrt(snapshot.springStiffness * axialMass));
  return { axialMass, hertz, dampingRatio };
}

test("C1 native relation exposes the exact authority consumed by live Box3D eyes", async () => {
  const world = await C1NativeDamperWorld.create("baseline");
  try {
    const authority = world.authority;
    const initial = world.snapshot();

    assert.equal(initial.relationId, authority.relationId);
    assert.equal(initial.bodyAIdentity, authority.bodyA.identity);
    assert.equal(initial.bodyBIdentity, authority.bodyB.identity);
    assert.deepEqual(initial.bodyASolverId, authority.bodyA.solverId);
    assert.deepEqual(initial.bodyBSolverId, authority.bodyB.solverId);
    assert.deepEqual(initial.eyeALocal, authority.bodyA.eyeLocal);
    assert.deepEqual(initial.eyeBLocal, authority.bodyB.eyeLocal);
    assert.equal(initial.springStiffness, authority.component.springStiffness);
    assert.equal(initial.dampingCoefficient, authority.component.dampingCoefficient);
    assert.equal(initial.restLength, authority.component.restLength);
    assert.ok(Math.abs(initial.currentLength - initial.nativeCurrentLength) < 1e-6);
    assert.equal(initial.mappingPolicy, "axial-once-at-initial-state");
    assert.deepEqual(initial.substrate, C1_NATIVE_SUBSTRATE);
    assert.equal(initial.nativeSpringEnabled, true);
    assert.equal(initial.nativeRestLength, initial.restLength);
    approximatelyEqual(initial.nativeSpringHertz, initial.appliedInitialHertz);
    approximatelyEqual(
      initial.nativeSpringDampingRatio,
      initial.appliedInitialDampingRatio,
    );
    assert.deepEqual(initial.nativeBodyASolverId, initial.bodyASolverId);
    assert.deepEqual(initial.nativeBodyBSolverId, initial.bodyBSolverId);
    assert.ok(distance(initial.nativeEyeALocal, initial.eyeALocal) < 1e-6);
    assert.ok(distance(initial.nativeEyeBLocal, initial.eyeBLocal) < 1e-6);

    const oracle = expectedInitialMapping(initial);
    approximatelyEqual(initial.appliedInitialAxialMass, oracle.axialMass);
    approximatelyEqual(initial.appliedInitialHertz, oracle.hertz);
    approximatelyEqual(initial.appliedInitialDampingRatio, oracle.dampingRatio);
  } finally {
    world.dispose();
  }
});

test("C1 native relation moves real solver eyes and emits finite live spring state", async () => {
  const world = await C1NativeDamperWorld.create("baseline");
  try {
    const initial = world.snapshot();
    const moving = world.step(18);

    assert.equal(moving.step, 18);
    assert.ok(distance(moving.eyeBWorld, initial.eyeBWorld) > 0.005);
    assert.ok(Math.abs(moving.hingeAngle - initial.hingeAngle) > 0.01);
    assert.ok(Math.abs(moving.currentLength - moving.nativeCurrentLength) < 1e-6);
    assert.ok(Number.isFinite(moving.nativeAxialForce));
    assert.ok(Math.abs(moving.nativeAxialForce) > 0.1);
    assert.equal(moving.nativeSpringEnabled, true);
    assert.ok(finitePoint(moving.nativeConstraintForce));
  } finally {
    world.dispose();
  }
});

test("C1 mount geometry changes real response without rewriting k/c/L0", async () => {
  const baseline = await C1NativeDamperWorld.create("baseline");
  const mutant = await C1NativeDamperWorld.create("half-radius");
  try {
    const baselineInitial = baseline.snapshot();
    const mutantInitial = mutant.snapshot();
    const baselineMoving = baseline.step(30);
    const mutantMoving = mutant.step(30);

    for (const snapshot of [baselineInitial, mutantInitial, baselineMoving, mutantMoving]) {
      assert.equal(snapshot.springStiffness, C1_NATIVE_COMPONENT.springStiffness);
      assert.equal(snapshot.dampingCoefficient, C1_NATIVE_COMPONENT.dampingCoefficient);
      assert.equal(snapshot.restLength, C1_NATIVE_COMPONENT.restLength);
    }

    const baselineAngleChange = baselineMoving.hingeAngle - baselineInitial.hingeAngle;
    const mutantAngleChange = mutantMoving.hingeAngle - mutantInitial.hingeAngle;
    assert.ok(Math.abs(baselineAngleChange - mutantAngleChange) > 0.005);
    assert.notEqual(
      baselineMoving.appliedInitialAxialMass,
      mutantMoving.appliedInitialAxialMass,
    );
    assert.notEqual(
      baselineMoving.appliedInitialHertz,
      mutantMoving.appliedInitialHertz,
    );

    for (const snapshot of [baselineInitial, mutantInitial]) {
      const oracle = expectedInitialMapping(snapshot);
      approximatelyEqual(snapshot.appliedInitialAxialMass, oracle.axialMass);
      approximatelyEqual(snapshot.appliedInitialHertz, oracle.hertz);
      approximatelyEqual(snapshot.appliedInitialDampingRatio, oracle.dampingRatio);
      approximatelyEqual(snapshot.nativeSpringHertz, oracle.hertz);
      approximatelyEqual(snapshot.nativeSpringDampingRatio, oracle.dampingRatio);
    }
  } finally {
    baseline.dispose();
    mutant.dispose();
  }
});

test("C1 native world rejects invalid step requests and use after dispose", async () => {
  const world = await C1NativeDamperWorld.create("baseline");
  assert.throws(() => world.step(-1), /non-negative integer/);
  world.dispose();
  assert.throws(() => world.snapshot(), /disposed/);
});
