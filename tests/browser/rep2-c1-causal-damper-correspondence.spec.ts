import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";

const DONOR_URL =
  "https://raw.githubusercontent.com/Jozzpoly/Box3d_FunProject/241fe10a9056836332c21d9614471d32d749ce3d/assets/source/Asset_Dumper.gltf";

test("C1.0 loads the exact real donor and exposes authored bind references", async ({ page }, testInfo) => {
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

  expect(origins.Part_Upper.y).toBeGreaterThan(origins.Part_Stretch.y);
  expect(origins.Part_Stretch.y).toBeGreaterThan(origins.Part_Lower.y);
  expect(origins.Part_Upper.y).toBeCloseTo(1.5, 6);
  expect(origins.Part_Stretch.y).toBeCloseTo(0.4921875, 6);
  expect(origins.Part_Lower.y).toBeCloseTo(-0.46875, 6);
  expect(origins.Part_Upper.y - origins.Part_Lower.y).toBeCloseTo(1.96875, 6);

  const bounds = evidence?.sceneBounds;
  expect(bounds).toBeTruthy();
  if (!bounds) throw new Error("C1 browser evidence omitted scene bounds");
  expect(bounds.size.x).toBeGreaterThan(0);
  expect(bounds.size.y).toBeGreaterThan(0);
  expect(bounds.size.z).toBeGreaterThan(0);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  writeFileSync(
    testInfo.outputPath("rep2-c1-browser-evidence.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  await page.screenshot({
    path: testInfo.outputPath("rep2-c1-donor-import.png"),
    fullPage: true,
  });
});
