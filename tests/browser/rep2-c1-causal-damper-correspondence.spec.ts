import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";

const DONOR_URL =
  "https://raw.githubusercontent.com/Jozzpoly/Box3d_FunProject/241fe10a9056836332c21d9614471d32d749ce3d/assets/source/Asset_Dumper.gltf";

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

test("C1.0/1.1 loads the exact real donor and adapts its real skinned parts to arbitrary endpoints", async ({ page }, testInfo) => {
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
  expect(evidence?.status).toBe("ready");
  expect(evidence?.donorUrl).toBe(DONOR_URL);
  expect(evidence?.partNames).toEqual(["Part_Upper", "Part_Stretch", "Part_Lower"]);
  expect(evidence?.meshCount).toBeGreaterThanOrEqual(1);
  expect(evidence?.skinnedMeshCount).toBeGreaterThanOrEqual(1);
  expect(evidence?.adapterReady).toBe(true);
  expect(evidence?.restGap).toBeCloseTo(1.96875, 7);
  expect(evidence?.interpretationBoundary).toEqual({
    nodeOriginsAreMeasuredBindReferences: true,
    nodeOriginsAreAcceptedMechanicalEyes: false,
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

  for (const specimen of specimens) {
    const adapted = await page.evaluate(
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

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  writeFileSync(
    testInfo.outputPath("rep2-c1-browser-evidence.json"),
    `${JSON.stringify({ initial: evidence, adaptations: snapshots }, null, 2)}\n`,
    "utf8",
  );
  await page.screenshot({
    path: testInfo.outputPath("rep2-c1-donor-adapted.png"),
    fullPage: true,
  });
});
