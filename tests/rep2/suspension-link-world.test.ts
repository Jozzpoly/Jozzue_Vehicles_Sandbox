import assert from "node:assert/strict";
import test from "node:test";
import {
  REP2_BASELINE_GEOMETRY,
  REP2_CARRIER_CONFIG,
  Rep2SuspensionLinkWorld,
  type Rep2SuspensionGeometry,
  type Rep2SuspensionTrace,
} from "../../src/rep2/suspension-link-world.js";

const EPS = 1e-5;

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function finiteTrace(trace: Rep2SuspensionTrace): boolean {
  const numbers = [
    trace.chassis.position.x,
    trace.chassis.position.y,
    trace.chassis.position.z,
    trace.chassisVelocity.x,
    trace.chassisVelocity.y,
    trace.chassisVelocity.z,
    trace.arm.position.x,
    trace.arm.position.y,
    trace.arm.position.z,
    trace.selectedWheel.position.x,
    trace.selectedWheel.position.y,
    trace.selectedWheel.position.z,
    trace.hingeWorldFromChassis.x,
    trace.hingeWorldFromChassis.y,
    trace.hingeWorldFromChassis.z,
    trace.hingeWorldFromArm.x,
    trace.hingeWorldFromArm.y,
    trace.hingeWorldFromArm.z,
    trace.wheelEndpointWorldFromArm.x,
    trace.wheelEndpointWorldFromArm.y,
    trace.wheelEndpointWorldFromArm.z,
    trace.wheelCenterWorld.x,
    trace.wheelCenterWorld.y,
    trace.wheelCenterWorld.z,
    trace.hingeAngle,
    trace.armLength,
  ];
  return numbers.every(Number.isFinite);
}

function geometry(
  armPivotLocal: Rep2SuspensionGeometry["armPivotLocal"],
  wheelEndpointLocal: Rep2SuspensionGeometry["wheelEndpointLocal"],
): Rep2SuspensionGeometry {
  return { armPivotLocal, wheelEndpointLocal };
}

test("A1 exact authored geometry instantiates the real hinge and wheel endpoint", async () => {
  const world = await Rep2SuspensionLinkWorld.create(REP2_BASELINE_GEOMETRY);
  try {
    const trace = world.trace();
    assert.ok(distance(trace.hingeWorldFromChassis, trace.hingeWorldFromArm) < EPS);
    assert.ok(distance(trace.wheelEndpointWorldFromArm, trace.wheelCenterWorld) < EPS);
    const expectedLength = distance(
      REP2_BASELINE_GEOMETRY.armPivotLocal,
      REP2_BASELINE_GEOMETRY.wheelEndpointLocal,
    );
    assert.ok(Math.abs(trace.armLength - expectedLength) < EPS);
    assert.equal(trace.ownedJointCount, 5);
    assert.equal(trace.ownedBodyCount, 6);
  } finally {
    world.dispose();
  }
});

test("A2 authored spatial mutation changes live Box3D construction", async () => {
  const g1 = REP2_BASELINE_GEOMETRY;
  const g2 = geometry(
    { x: -0.22, y: 0.04, z: -0.62 },
    { x: -0.66, y: -0.21, z: -0.62 },
  );
  const w1 = await Rep2SuspensionLinkWorld.create(g1);
  const w2 = await Rep2SuspensionLinkWorld.create(g2);
  try {
    const t1 = w1.trace();
    const t2 = w2.trace();
    assert.ok(distance(t1.hingeWorldFromChassis, t2.hingeWorldFromChassis) > 0.1);
    assert.ok(Math.abs(t1.armLength - t2.armLength) > 0.05);
    assert.ok(distance(t1.hingeWorldFromArm, t2.hingeWorldFromArm) > 0.1);
  } finally {
    w1.dispose();
    w2.dispose();
  }
});

test("A3 equal-length but differently directed authored geometry yields a different live wheel path", async () => {
  const sharedEndpoint = { x: -0.66, y: -0.03, z: -0.62 };
  const g1 = geometry(
    { x: -0.36, y: 0.16, z: -0.62 },
    sharedEndpoint,
  );
  const g2 = geometry(
    { x: -0.47, y: 0.27, z: -0.62 },
    sharedEndpoint,
  );
  const expected1 = distance(g1.armPivotLocal, g1.wheelEndpointLocal);
  const expected2 = distance(g2.armPivotLocal, g2.wheelEndpointLocal);
  assert.ok(Math.abs(expected1 - expected2) < 1e-12);

  const w1 = await Rep2SuspensionLinkWorld.create(g1);
  const w2 = await Rep2SuspensionLinkWorld.create(g2);
  try {
    const start1 = w1.trace();
    const start2 = w2.trace();
    assert.ok(distance(start1.wheelCenterWorld, start2.wheelCenterWorld) < EPS);

    const end1 = w1.step(120);
    const end2 = w2.step(120);
    const pathSeparation = distance(end1.wheelCenterWorld, end2.wheelCenterWorld);
    const angleSeparation = Math.abs(end1.hingeAngle - end2.hingeAngle);
    assert.ok(
      pathSeparation > 0.01 || angleSeparation > 0.03,
      `expected spatially distinct same-length arms to separate; path=${pathSeparation}, angle=${angleSeparation}`,
    );
  } finally {
    w1.dispose();
    w2.dispose();
  }
});

test("A4 editing the selected left geometry does not rewrite the opposite rear baseline", async () => {
  const edited = geometry(
    { x: -0.18, y: 0.12, z: -0.62 },
    { x: -0.73, y: -0.16, z: -0.62 },
  );
  const baseline = await Rep2SuspensionLinkWorld.create(REP2_BASELINE_GEOMETRY);
  const changed = await Rep2SuspensionLinkWorld.create(edited);
  try {
    const a = baseline.trace();
    const b = changed.trace();
    assert.ok(distance(a.oppositeRearAnchorWorld, b.oppositeRearAnchorWorld) < EPS);
    assert.ok(distance(a.oppositeRearWheel.position, b.oppositeRearWheel.position) < EPS);
    assert.ok(
      Math.abs(a.oppositeRearAnchorWorld.z - REP2_CARRIER_CONFIG.trackHalfWidth) < EPS,
    );
  } finally {
    baseline.dispose();
    changed.dispose();
  }
});

test("A5 physical seam remains finite, contacts the world, and drives the carrier", async () => {
  const world = await Rep2SuspensionLinkWorld.create(REP2_BASELINE_GEOMETRY);
  try {
    const settled = world.step(180);
    assert.ok(finiteTrace(settled));
    assert.ok(settled.selectedWheelContacts >= 1);
    assert.ok(settled.worldContacts >= 4);

    world.setDrive(0.45);
    const driven = world.step(240);
    assert.ok(finiteTrace(driven));
    assert.ok(driven.chassis.position.x > settled.chassis.position.x + 0.4);
    assert.ok(driven.selectedWheelContacts >= 1);
    assert.ok(distance(driven.wheelEndpointWorldFromArm, driven.wheelCenterWorld) < 1e-3);
    assert.equal(driven.ownedJointCount, 5);
  } finally {
    world.dispose();
  }
});

test("A6 strange finite geometry is permissive while invalid geometry fails explicitly", async () => {
  const odd = geometry(
    { x: -1.25, y: 0.45, z: -0.91 },
    { x: -0.12, y: -0.42, z: -0.28 },
  );
  const world = await Rep2SuspensionLinkWorld.create(odd);
  try {
    const trace = world.trace();
    assert.ok(finiteTrace(trace));
    assert.ok(Math.abs(trace.armLength - distance(odd.armPivotLocal, odd.wheelEndpointLocal)) < EPS);
  } finally {
    world.dispose();
  }

  await assert.rejects(
    Rep2SuspensionLinkWorld.create(
      geometry(
        { x: Number.NaN, y: 0, z: 0 },
        { x: -0.66, y: -0.21, z: -0.62 },
      ),
    ),
    /finite coordinates/,
  );
  await assert.rejects(
    Rep2SuspensionLinkWorld.create(
      geometry(
        { x: -0.4, y: -0.1, z: -0.62 },
        { x: -0.4001, y: -0.1001, z: -0.6201 },
      ),
    ),
    /structural minimum/,
  );
});
