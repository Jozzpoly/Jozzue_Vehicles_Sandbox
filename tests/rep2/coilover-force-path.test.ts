import assert from "node:assert/strict";
import test from "node:test";
import {
  Rep2CoiloverForceBench,
  makeRep2VerticalCoiloverGeometry,
  type Rep2CoiloverBenchGeometry,
  type Rep2CoiloverComponent,
  type Rep2CoiloverForceTrace,
} from "../../src/rep2/coilover-force-bench.js";

const EPS = 1e-6;
const COMPONENT: Rep2CoiloverComponent = Object.freeze({
  springStiffness: 900,
  dampingCoefficient: 18,
  restLength: 0.5,
});
const SPRING_ONLY: Rep2CoiloverComponent = Object.freeze({
  springStiffness: 900,
  dampingCoefficient: 0,
  restLength: 0.5,
});

function magnitude(value: Readonly<{ x: number; y: number; z: number }>): number {
  return Math.hypot(value.x, value.y, value.z);
}

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function finiteTrace(trace: Rep2CoiloverForceTrace): boolean {
  return [
    trace.hingeAngle,
    trace.chassisEyeWorld.x,
    trace.chassisEyeWorld.y,
    trace.chassisEyeWorld.z,
    trace.armEyeWorld.x,
    trace.armEyeWorld.y,
    trace.armEyeWorld.z,
    trace.currentLength,
    trace.extension,
    trace.relativeAxialSpeed,
    trace.springContribution,
    trace.dampingContribution,
    trace.axialForceOnArm,
    trace.forceOnChassis.x,
    trace.forceOnChassis.y,
    trace.forceOnChassis.z,
    trace.forceOnArm.x,
    trace.forceOnArm.y,
    trace.forceOnArm.z,
    trace.momentOnArmAboutHinge.x,
    trace.momentOnArmAboutHinge.y,
    trace.momentOnArmAboutHinge.z,
    trace.armAngularVelocity.x,
    trace.armAngularVelocity.y,
    trace.armAngularVelocity.z,
  ].every(Number.isFinite);
}

function verticalFixtureLength(radius: number, verticalSeparation: number, angle: number): number {
  const upperX = -radius;
  const upperY = verticalSeparation;
  const lowerX = -radius * Math.cos(angle);
  const lowerY = -radius * Math.sin(angle);
  return Math.hypot(lowerX - upperX, lowerY - upperY);
}

function matchingAngle(
  radius: number,
  verticalSeparation: number,
  targetLength: number,
  upperAngle: number,
): number {
  let low = 0;
  let high = upperAngle;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = 0.5 * (low + high);
    if (verticalFixtureLength(radius, verticalSeparation, mid) < targetLength) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return 0.5 * (low + high);
}

test("C0.1 near and far fixtures share the same neutral component state", async () => {
  const near = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(0.25, 0.5),
    component: COMPONENT,
  });
  const far = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(0.5, 0.5),
    component: COMPONENT,
  });
  try {
    for (const trace of [near.trace(), far.trace()]) {
      assert.ok(Math.abs(trace.currentLength - COMPONENT.restLength) < EPS);
      assert.ok(Math.abs(trace.extension) < EPS);
      assert.ok(Math.abs(trace.relativeAxialSpeed) < EPS);
      assert.ok(Math.abs(trace.axialForceOnArm) < EPS);
    }
  } finally {
    near.dispose();
    far.dispose();
  }
});

test("C0.2 force path is equal-and-opposite at the exact live eyes", async () => {
  const bench = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(0.35, 0.5),
    component: SPRING_ONLY,
    initialArmAngleRadians: 0.05,
  });
  try {
    const trace = bench.applyForce();
    assert.ok(finiteTrace(trace));
    assert.ok(distance(trace.forceOnChassis, {
      x: -trace.forceOnArm.x,
      y: -trace.forceOnArm.y,
      z: -trace.forceOnArm.z,
    }) < EPS);
    assert.ok(Math.abs(magnitude(trace.forceOnArm) - Math.abs(trace.axialForceOnArm)) < EPS);
    assert.ok(Math.abs(trace.springContribution - SPRING_ONLY.springStiffness * trace.extension) < EPS);
  } finally {
    bench.dispose();
  }
});

test("C0.3 physical k/c/rest-length remain component properties across geometry", async () => {
  const near = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(0.25, 0.5),
    component: COMPONENT,
    initialArmAngleRadians: 0.04,
  });
  const far = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(0.5, 0.5),
    component: COMPONENT,
    initialArmAngleRadians: 0.04,
  });
  try {
    assert.deepEqual(near.component, COMPONENT);
    assert.deepEqual(far.component, COMPONENT);

    const nearInitial = near.trace();
    const farInitial = far.trace();
    assert.ok(Math.abs(nearInitial.springContribution / nearInitial.extension - COMPONENT.springStiffness) < 1e-6);
    assert.ok(Math.abs(farInitial.springContribution / farInitial.extension - COMPONENT.springStiffness) < 1e-6);

    near.step(2);
    far.step(2);
    const nearMoving = near.trace();
    const farMoving = far.trace();
    assert.ok(Math.abs(nearMoving.dampingContribution - COMPONENT.dampingCoefficient * nearMoving.relativeAxialSpeed) < 1e-6);
    assert.ok(Math.abs(farMoving.dampingContribution - COMPONENT.dampingCoefficient * farMoving.relativeAxialSpeed) < 1e-6);
  } finally {
    near.dispose();
    far.dispose();
  }
});

test("C0.4 doubling attachment radius changes real restoring moment and Box3D response", async () => {
  const angle = 0.04;
  const near = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(0.25, 0.5),
    component: SPRING_ONLY,
    initialArmAngleRadians: angle,
  });
  const far = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(0.5, 0.5),
    component: SPRING_ONLY,
    initialArmAngleRadians: angle,
  });
  try {
    const nearForce = near.trace();
    const farForce = far.trace();
    const nearMoment = Math.abs(nearForce.momentOnArmAboutHinge.z);
    const farMoment = Math.abs(farForce.momentOnArmAboutHinge.z);
    const momentRatio = farMoment / nearMoment;
    assert.ok(momentRatio > 3.8 && momentRatio < 4.2, `expected near-quadratic leverage separation, ratio=${momentRatio}`);

    const nearAfter = near.step(1);
    const farAfter = far.step(1);
    const nearOmega = Math.abs(nearAfter.armAngularVelocity.z);
    const farOmega = Math.abs(farAfter.armAngularVelocity.z);
    assert.ok(nearOmega > 0);
    assert.ok(farOmega > nearOmega * 3.2, `expected live Box3D response separation; near=${nearOmega}, far=${farOmega}`);
  } finally {
    near.dispose();
    far.dispose();
  }
});

test("C0.5 equal damper length does not erase spatial leverage", async () => {
  const nearRadius = 0.25;
  const farRadius = 0.5;
  const vertical = 0.5;
  const nearAngle = 0.06;
  const targetLength = verticalFixtureLength(nearRadius, vertical, nearAngle);
  const farAngle = matchingAngle(farRadius, vertical, targetLength, nearAngle);

  const near = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(nearRadius, vertical),
    component: SPRING_ONLY,
    initialArmAngleRadians: nearAngle,
  });
  const far = await Rep2CoiloverForceBench.create({
    geometry: makeRep2VerticalCoiloverGeometry(farRadius, vertical),
    component: SPRING_ONLY,
    initialArmAngleRadians: farAngle,
  });
  try {
    const a = near.trace();
    const b = far.trace();
    assert.ok(Math.abs(a.currentLength - b.currentLength) < 1e-6);
    assert.ok(Math.abs(a.axialForceOnArm - b.axialForceOnArm) < 1e-4);

    const momentA = Math.abs(a.momentOnArmAboutHinge.z);
    const momentB = Math.abs(b.momentOnArmAboutHinge.z);
    assert.ok(momentB > momentA * 1.8, `same-length layouts should retain different leverage; A=${momentA}, B=${momentB}`);

    const afterA = near.step(1);
    const afterB = far.step(1);
    assert.ok(Math.abs(afterB.armAngularVelocity.z) > Math.abs(afterA.armAngularVelocity.z) * 1.6);
  } finally {
    near.dispose();
    far.dispose();
  }
});

test("C0.6 finite odd geometry remains permitted while true singularities fail explicitly", async () => {
  const oddGeometry: Rep2CoiloverBenchGeometry = {
    chassisEyeLocal: { x: 0.17, y: 0.41, z: 0.12 },
    armEyeLocal: { x: -0.31, y: -0.07, z: 0.06 },
  };
  const odd = await Rep2CoiloverForceBench.create({
    geometry: oddGeometry,
    component: { springStiffness: 700, dampingCoefficient: 9, restLength: 0.63 },
    initialArmAngleRadians: -0.03,
  });
  try {
    assert.ok(finiteTrace(odd.trace()));
    assert.ok(finiteTrace(odd.step(12)));
  } finally {
    odd.dispose();
  }

  await assert.rejects(
    Rep2CoiloverForceBench.create({
      geometry: {
        chassisEyeLocal: { x: Number.NaN, y: 0.5, z: 0 },
        armEyeLocal: { x: -0.25, y: 0, z: 0 },
      },
      component: COMPONENT,
    }),
    /attachment points must be finite/,
  );

  const singular = await Rep2CoiloverForceBench.create({
    geometry: {
      chassisEyeLocal: { x: 0, y: 0, z: 0 },
      armEyeLocal: { x: 0, y: 0, z: 0 },
    },
    component: COMPONENT,
  });
  try {
    assert.throws(() => singular.trace(), /eye separation is singular/);
  } finally {
    singular.dispose();
  }
});
