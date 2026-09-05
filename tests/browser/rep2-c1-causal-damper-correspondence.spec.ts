import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";

const DONOR_URL = "/assets/rep2/Asset_Dumper.gltf";

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

test("C1 keeps the real donor on one live native-spring authority and detects a stale visual eye", async ({ page, context }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/?c1=1");
  await page.waitForFunction(() => {
    const evidence = window.__REP2_C1__;
    return Boolean(evidence && (evidence.status === "ready" || evidence.status === "error"));
  }, undefined, {
    timeout: 30_000,
  });

  const evidence = await page.evaluate(() => window.__REP2_C1__);
  expect(evidence).toBeTruthy();
  expect(evidence?.schema).toBe("rep2-c1-browser-authority-v3");
  expect(evidence?.status).toBe("ready");
  expect(evidence?.mode).toBe("authority");
  expect(evidence?.donorUrl).toBe(DONOR_URL);
  expect(evidence?.partNames).toEqual(["Part_Upper", "Part_Stretch", "Part_Lower"]);
  expect(evidence?.meshCount).toBeGreaterThanOrEqual(1);
  expect(evidence?.skinnedMeshCount).toBeGreaterThanOrEqual(1);
  expect(evidence?.adapterReady).toBe(true);
  expect(evidence?.restGap).toBeCloseTo(1.96875, 7);
  expect(evidence?.interpretationBoundary).toEqual({
    nodeOriginsAreMeasuredBindReferences: true,
    nodeOriginsAreAcceptedMechanicalEyes: false,
    arbitraryEndpointApiIsValidationOnly: true,
    arbitraryEndpointApiAvailableOnlyInAdapterFixture: true,
    dynamicVisualEyesComeOnlyFromPhysicalSnapshots: true,
  });
  expect(await page.evaluate(() => typeof window.__REP2_C1_APPLY__)).toBe("undefined");

  const authorityGate = evidence?.authorityGate;
  expect(authorityGate).toBeTruthy();
  if (!authorityGate) throw new Error("C1 browser evidence omitted the dynamic authority gate");
  expect(authorityGate.schema).toBe("rep2-c1-authority-gate-v1");
  expect(authorityGate.verdict).toBe("pass");

  const normalObservations = [
    authorityGate.baseline.rest,
    authorityGate.baseline.moving,
    authorityGate.baseline.recovered,
    authorityGate.geometryMutant.rest,
    authorityGate.geometryMutant.moving,
  ];
  for (const observation of normalObservations) {
    expect(observation.expected).toBe("correspondence");
    expect(observation.detectorVerdict).toBe("pass");
    expect(observation.maxError).toBeLessThanOrEqual(
      authorityGate.acceptance.correspondenceTolerance,
    );
    expect(observation.deformedSkinnedMeshCount).toBeGreaterThanOrEqual(1);
    expect(observation.renderedBounds.size.x).toBeGreaterThan(0);
    expect(observation.renderedBounds.size.y).toBeGreaterThan(0);
    expect(observation.renderedBounds.size.z).toBeGreaterThan(0);
    expect(Math.abs(
      observation.physical.currentLength - observation.physical.nativeCurrentLength,
    )).toBeLessThan(1e-5);
    expect(observation.physical.nativeSpringEnabled).toBe(true);
    expect(observation.physical.nativeRestLength).toBeCloseTo(
      observation.physical.restLength,
      6,
    );
    expect(observation.physical.nativeSpringHertz).toBeCloseTo(
      observation.physical.appliedInitialHertz,
      6,
    );
    expect(observation.physical.nativeSpringDampingRatio).toBeCloseTo(
      observation.physical.appliedInitialDampingRatio,
      6,
    );
    expect(observation.physical.nativeBodyASolverId).toEqual(
      observation.physical.bodyASolverId,
    );
    expect(observation.physical.nativeBodyBSolverId).toEqual(
      observation.physical.bodyBSolverId,
    );
    expect(distance(
      observation.physical.nativeEyeALocal,
      observation.physical.eyeALocal,
    )).toBeLessThan(1e-6);
    expect(distance(
      observation.physical.nativeEyeBLocal,
      observation.physical.eyeBLocal,
    )).toBeLessThan(1e-6);
    expect(observation.physical.mappingPolicy).toBe("axial-once-at-initial-state");
    expect(observation.physical.substrate).toEqual({
      timeStep: 1 / 60,
      substeps: 4,
      armMass: 8,
      armLength: 0.7,
      initialArmAngle: 0.08,
      mappingPolicy: "axial-once-at-initial-state",
    });
    expect(Number.isFinite(observation.physical.nativeAxialForce)).toBe(true);
  }

  const baselineRest = authorityGate.baseline.rest.physical;
  const baselineMoving = authorityGate.baseline.moving.physical;
  const mutantRest = authorityGate.geometryMutant.rest.physical;
  const mutantMoving = authorityGate.geometryMutant.moving.physical;
  expect(baselineMoving.step).toBe(authorityGate.acceptance.dynamicStepCount);
  expect(mutantMoving.step).toBe(authorityGate.acceptance.dynamicStepCount);
  expect(baselineMoving.relationId).toBe(baselineRest.relationId);
  expect(baselineMoving.bodyASolverId).toEqual(baselineRest.bodyASolverId);
  expect(baselineMoving.bodyBSolverId).toEqual(baselineRest.bodyBSolverId);
  expect(authorityGate.invariants.physicalEyeMotionBaseline).toBeGreaterThanOrEqual(
    authorityGate.acceptance.minimumPhysicalEyeMotion,
  );
  expect(authorityGate.invariants.physicalEyeMotionMutant).toBeGreaterThanOrEqual(
    authorityGate.acceptance.minimumPhysicalEyeMotion,
  );
  expect(authorityGate.invariants.componentPropertiesPreserved).toBe(true);
  expect(authorityGate.invariants.authoredGeometryChanged).toBe(true);
  expect(authorityGate.invariants.nativeLengthMaxError).toBeLessThanOrEqual(
    authorityGate.acceptance.correspondenceTolerance,
  );
  expect(authorityGate.invariants.nativeConstraintForcePeak).toBeGreaterThan(0.1);
  expect(authorityGate.invariants.nativeConfigurationReadbackMatches).toBe(true);
  expect(authorityGate.invariants.nativeSpringStateLive).toBe(true);
  expect(authorityGate.invariants.geometryConsequencePreserved).toBe(true);
  expect(authorityGate.invariants.hingeResponseSeparation).toBeGreaterThanOrEqual(
    authorityGate.acceptance.minimumResponseSeparation,
  );
  expect({
    k: baselineMoving.springStiffness,
    c: baselineMoving.dampingCoefficient,
    L0: baselineMoving.restLength,
  }).toEqual({
    k: mutantMoving.springStiffness,
    c: mutantMoving.dampingCoefficient,
    L0: mutantMoving.restLength,
  });
  expect(distance(baselineRest.eyeALocal, mutantRest.eyeALocal)).toBeGreaterThan(0.1);
  expect(distance(baselineRest.eyeBLocal, mutantRest.eyeBLocal)).toBeGreaterThan(0.1);

  const negative = authorityGate.baseline.negativeStaleEyeB;
  expect(negative.phase).toBe("negative-stale-eye-b");
  expect(negative.expected).toBe("mismatch-detected");
  expect(negative.detectorVerdict).toBe("mismatch-detected");
  expect(negative.visualInputEyeA).toEqual(baselineMoving.eyeAWorld);
  expect(negative.visualInputEyeB).toEqual(baselineRest.eyeBWorld);
  expect(negative.physical).toEqual(baselineMoving);
  expect(negative.eyeBError).toBeGreaterThanOrEqual(
    authorityGate.acceptance.minimumNegativeControlError,
  );
  expect(authorityGate.invariants.negativeControlDetected).toBe(true);
  expect(authorityGate.invariants.negativeControlError).toBe(negative.maxError);
  expect(authorityGate.invariants.recoveryPassed).toBe(true);
  expect(authorityGate.baseline.recovered.physical).toEqual(baselineMoving);

  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  await page.screenshot({
    path: testInfo.outputPath("rep2-c1-authority-recovered.png"),
    fullPage: true,
  });

  const origins = evidence?.partNodeOrigins;
  expect(origins).toBeTruthy();
  if (!origins) throw new Error("C1 browser evidence omitted donor part origins");

  for (const name of ["Part_Upper", "Part_Stretch", "Part_Lower"] as const) {
    const value = origins[name];
    expect(Number.isFinite(value.x)).toBe(true);
    expect(Number.isFinite(value.y)).toBe(true);
    expect(Number.isFinite(value.z)).toBe(true);
    expect(Math.abs(value.x)).toBeLessThan(1e-6);
    expect(Math.abs(value.z)).toBeLessThan(1e-6);
  }

  expect(origins.Part_Upper.y).toBeCloseTo(1.5, 6);
  expect(origins.Part_Stretch.y).toBeCloseTo(0.4921875, 6);
  expect(origins.Part_Lower.y).toBeCloseTo(-0.46875, 6);

  const initialBounds = evidence?.sceneBounds;
  expect(initialBounds).toBeTruthy();
  if (!initialBounds) throw new Error("C1 browser evidence omitted initial rendered bounds");

  const specimens = [
    {
      id: "diagonal-long",
      upper: { x: 0.8, y: 1.6, z: -0.4 },
      lower: { x: -0.8, y: -0.7, z: 0.6 },
    },
    {
      id: "diagonal-other-octant",
      upper: { x: -1.3, y: 0.4, z: 1.2 },
      lower: { x: 1.1, y: -1.4, z: -0.8 },
    },
    {
      id: "axis-reversed",
      upper: { x: 0, y: -1.2, z: 0 },
      lower: { x: 0, y: 1.3, z: 0 },
    },
  ] as const;

  const snapshots: Array<{
    id: string;
    evidence: NonNullable<Awaited<ReturnType<NonNullable<typeof window.__REP2_C1_APPLY__>>>>;
  }> = [];

  const fixturePage = await context.newPage();
  fixturePage.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`[adapter fixture] ${message.text()}`);
  });
  fixturePage.on("pageerror", (error) => pageErrors.push(`[adapter fixture] ${error.message}`));
  await fixturePage.goto("/?c1=1&c1Fixture=adapter");
  await fixturePage.waitForFunction(() => {
    const fixtureEvidence = window.__REP2_C1__;
    return Boolean(
      fixtureEvidence &&
      (fixtureEvidence.status === "ready" || fixtureEvidence.status === "error"),
    );
  }, undefined, { timeout: 30_000 });
  const adapterFixtureInitial = await fixturePage.evaluate(() => window.__REP2_C1__);
  expect(adapterFixtureInitial?.status).toBe("ready");
  expect(adapterFixtureInitial?.mode).toBe("adapter-validation");
  expect(adapterFixtureInitial?.authorityGate).toBeUndefined();
  expect(adapterFixtureInitial?.interpretationBoundary).toEqual({
    nodeOriginsAreMeasuredBindReferences: true,
    nodeOriginsAreAcceptedMechanicalEyes: false,
    arbitraryEndpointApiIsValidationOnly: true,
    arbitraryEndpointApiAvailableOnlyInAdapterFixture: true,
    dynamicVisualEyesComeOnlyFromPhysicalSnapshots: false,
  });
  expect(await fixturePage.evaluate(() => typeof window.__REP2_C1_APPLY__)).toBe("function");

  for (const specimen of specimens) {
    const adapted = await fixturePage.evaluate(
      ({ upper, lower }) => {
        const apply = window.__REP2_C1_APPLY__;
        if (!apply) throw new Error("C1.1 browser adapter API is unavailable");
        return apply(upper, lower);
      },
      specimen,
    );

    expect(adapted.upperError).toBeLessThan(1e-6);
    expect(adapted.lowerError).toBeLessThan(1e-6);
    expect(adapted.deformedSkinnedMeshCount).toBeGreaterThanOrEqual(1);
    expect(adapted.apparatusRollConvention).toBe("minimal-rotation-from-authored-axis");
    expect(distance(adapted.visualUpperWorld, specimen.upper)).toBeLessThan(1e-6);
    expect(distance(adapted.visualLowerWorld, specimen.lower)).toBeLessThan(1e-6);

    for (const scale of [adapted.visualUpperScale, adapted.visualLowerScale]) {
      expect(scale.x).toBeCloseTo(1, 6);
      expect(scale.y).toBeCloseTo(1, 6);
      expect(scale.z).toBeCloseTo(1, 6);
    }
    expect(adapted.visualStretchScale.x).toBeCloseTo(1, 6);
    expect(adapted.visualStretchScale.z).toBeCloseTo(1, 6);
    expect(adapted.visualStretchScale.y).toBeCloseTo(adapted.stretchScaleRatio, 6);

    expect(adapted.renderedBounds.size.x).toBeGreaterThan(0);
    expect(adapted.renderedBounds.size.y).toBeGreaterThan(0);
    expect(adapted.renderedBounds.size.z).toBeGreaterThan(0);
    snapshots.push({ id: specimen.id, evidence: adapted });
  }

  expect(distance(snapshots[0]!.evidence.renderedBounds.center, initialBounds.center)).toBeGreaterThan(0.1);
  expect(distance(snapshots[1]!.evidence.renderedBounds.center, snapshots[0]!.evidence.renderedBounds.center)).toBeGreaterThan(0.1);
  expect(distance(snapshots[2]!.evidence.renderedBounds.center, snapshots[1]!.evidence.renderedBounds.center)).toBeGreaterThan(0.1);

  const adapterFixtureFinal = await fixturePage.evaluate(() => window.__REP2_C1__);
  expect(adapterFixtureFinal?.authorityGate).toBeUndefined();
  expect(adapterFixtureFinal?.currentAdaptation).toEqual(snapshots.at(-1)?.evidence);
  await fixturePage.close();

  const finalAuthorityEvidence = await page.evaluate(() => window.__REP2_C1__);
  expect(finalAuthorityEvidence).toEqual(evidence);
  expect(finalAuthorityEvidence?.authorityGate?.baseline.recovered.detectorVerdict).toBe("pass");
  expect(await page.evaluate(() => typeof window.__REP2_C1_APPLY__)).toBe("undefined");

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  writeFileSync(
    testInfo.outputPath("rep2-c1-browser-evidence.json"),
    `${JSON.stringify({ authority: evidence, adapterFixture: adapterFixtureFinal, adaptations: snapshots }, null, 2)}\n`,
    "utf8",
  );
});
