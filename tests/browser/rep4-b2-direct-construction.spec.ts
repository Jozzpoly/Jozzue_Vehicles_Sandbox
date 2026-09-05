import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

mkdirSync("artifacts", { recursive: true });

interface B2State {
  selected: string;
  selectedClass: string;
  derivedValid: boolean;
  donorReady: boolean;
  bearing: { x: number; y: number; z: number };
  tie: { x: number; y: number; z: number };
  damper: { x: number; y: number; z: number };
  upperAxis: { x: number; y: number; z: number };
  tieLength: number;
  damperLength: number;
  camera: { x: number; y: number; z: number };
  renderFrames: number;
}

async function data(page: Page): Promise<DOMStringMap> {
  return page.evaluate(() => ({ ...(document.querySelector<HTMLElement>("#app")?.dataset ?? {}) }));
}

const n = (dataset: DOMStringMap, key: string): number => Number(dataset[key]);

async function state(page: Page): Promise<B2State> {
  const d = await data(page);
  return {
    selected: d.selectedHardpoint ?? "none",
    selectedClass: d.selectedClass ?? "none",
    derivedValid: d.derivedValid === "true",
    donorReady: d.donorReady === "true",
    bearing: { x: n(d, "upperBearingAX"), y: n(d, "upperBearingAY"), z: n(d, "upperBearingAZ") },
    tie: { x: n(d, "chassisTieX"), y: n(d, "chassisTieY"), z: n(d, "chassisTieZ") },
    damper: { x: n(d, "damperLowerEyeX"), y: n(d, "damperLowerEyeY"), z: n(d, "damperLowerEyeZ") },
    upperAxis: { x: n(d, "upperAxisX"), y: n(d, "upperAxisY"), z: n(d, "upperAxisZ") },
    tieLength: n(d, "tieLength"),
    damperLength: n(d, "damperLength"),
    camera: { x: n(d, "cameraX"), y: n(d, "cameraY"), z: n(d, "cameraZ") },
    renderFrames: n(d, "renderFrames"),
  };
}

async function screenPoint(page: Page, prefix: string): Promise<{ x: number; y: number }> {
  const d = await data(page);
  return { x: n(d, `${prefix}ScreenX`), y: n(d, `${prefix}ScreenY`) };
}

async function clickHardpoint(page: Page, prefix: string): Promise<void> {
  const point = await screenPoint(page, prefix);
  await page.mouse.click(point.x, point.y);
}

async function dragSelectedAxis(page: Page, axis: "X" | "Y" | "Z", pixels: number): Promise<void> {
  const d = await data(page);
  const selected = (d.selectedHardpoint ?? "none") as "upper-bearing-a" | "chassis-tie" | "damper-lower-eye" | "none";
  const selectedPrefix = selected === "upper-bearing-a"
    ? "upperBearingA"
    : selected === "chassis-tie"
      ? "chassisTie"
      : "damperLowerEye";
  const origin = await screenPoint(page, selectedPrefix);
  const handle = await screenPoint(page, `gizmo${axis}`);
  const dx = handle.x - origin.x;
  const dy = handle.y - origin.y;
  const length = Math.hypot(dx, dy);
  expect(length).toBeGreaterThan(5);
  const ux = dx / length;
  const uy = dy / length;
  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();
  await page.mouse.move(handle.x + ux * pixels, handle.y + uy * pixels, { steps: 8 });
  await page.mouse.up();
}

const expectPointClose = (
  actual: { x: number; y: number; z: number },
  expected: { x: number; y: number; z: number },
  tolerance = 1e-9,
): void => {
  expect(Math.abs(actual.x - expected.x)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.y - expected.y)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.z - expected.z)).toBeLessThanOrEqual(tolerance);
};

test("Rep4 B2 directly edits three distinct physical hardpoint classes without hidden PLAY or cross-authority rewrites", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/?rep4b2");
  const root = page.locator("#app");
  await expect(root).toHaveAttribute("data-donor-ready", "true");
  await expect(root).toHaveAttribute("data-derived-valid", "true");
  await expect.poll(async () => (await state(page)).renderFrames).toBeGreaterThan(5);
  await expect(page.getByRole("button", { name: /PLAY/i })).toHaveCount(0);
  await expect(page.locator("input[type='range'], select")).toHaveCount(0);

  const canvas = page.getByTestId("rep4-b2-canvas");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(1000);
  expect(box!.height).toBeGreaterThan(650);

  const baseline = await state(page);
  expect(baseline.derivedValid).toBe(true);
  expect(baseline.donorReady).toBe(true);
  await page.screenshot({ path: "artifacts/rep4-b2-01-baseline.png", fullPage: true });

  await clickHardpoint(page, "chassisTie");
  await expect(root).toHaveAttribute("data-selected-hardpoint", "chassis-tie");
  await expect(root).toHaveAttribute("data-selected-class", "tie");
  const beforeTieDrag = await state(page);
  await dragSelectedAxis(page, "X", 55);
  await expect.poll(async () => Math.abs((await state(page)).tie.x - beforeTieDrag.tie.x)).toBeGreaterThan(0.04);
  const afterTieDrag = await state(page);
  expect(afterTieDrag.tie.y).toBeCloseTo(beforeTieDrag.tie.y, 12);
  expect(afterTieDrag.tie.z).toBeCloseTo(beforeTieDrag.tie.z, 12);
  expectPointClose(afterTieDrag.bearing, baseline.bearing);
  expectPointClose(afterTieDrag.damper, baseline.damper);
  expect(Math.abs(afterTieDrag.tieLength - baseline.tieLength)).toBeGreaterThan(1e-3);
  expect(afterTieDrag.derivedValid).toBe(true);

  await page.getByTestId("b2-y").fill("-0.145");
  await page.getByTestId("b2-y").press("Tab");
  await expect.poll(async () => (await state(page)).tie.y).toBeCloseTo(-0.145, 10);
  const tieExact = await state(page);

  await clickHardpoint(page, "damperLowerEye");
  await expect(root).toHaveAttribute("data-selected-hardpoint", "damper-lower-eye");
  await expect(root).toHaveAttribute("data-selected-class", "damper-eye");
  const beforeDamperDrag = await state(page);
  await dragSelectedAxis(page, "Y", 50);
  await expect.poll(async () => Math.abs((await state(page)).damper.y - beforeDamperDrag.damper.y)).toBeGreaterThan(0.04);
  const afterDamperDrag = await state(page);
  expect(afterDamperDrag.damper.x).toBeCloseTo(beforeDamperDrag.damper.x, 12);
  expect(afterDamperDrag.damper.z).toBeCloseTo(beforeDamperDrag.damper.z, 12);
  expectPointClose(afterDamperDrag.bearing, baseline.bearing);
  expectPointClose(afterDamperDrag.tie, tieExact.tie);
  expect(Math.abs(afterDamperDrag.damperLength - tieExact.damperLength)).toBeGreaterThan(1e-3);
  expect(afterDamperDrag.derivedValid).toBe(true);

  await clickHardpoint(page, "upperBearingA");
  await expect(root).toHaveAttribute("data-selected-hardpoint", "upper-bearing-a");
  await expect(root).toHaveAttribute("data-selected-class", "bearing");
  const beforeBearingDrag = await state(page);
  await dragSelectedAxis(page, "Y", 50);
  await expect.poll(async () => Math.abs((await state(page)).bearing.y - beforeBearingDrag.bearing.y)).toBeGreaterThan(0.04);
  const afterBearingDrag = await state(page);
  expect(afterBearingDrag.bearing.x).toBeCloseTo(beforeBearingDrag.bearing.x, 12);
  expect(afterBearingDrag.bearing.z).toBeCloseTo(beforeBearingDrag.bearing.z, 12);
  expectPointClose(afterBearingDrag.tie, tieExact.tie);
  expectPointClose(afterBearingDrag.damper, afterDamperDrag.damper);
  expect(Math.abs(afterBearingDrag.upperAxis.y - baseline.upperAxis.y)).toBeGreaterThan(0.02);
  expect(afterBearingDrag.derivedValid).toBe(true);

  const beforeOrbit = afterBearingDrag.camera;
  await page.mouse.move(box!.x + box!.width - 90, box!.y + 110);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width - 210, box!.y + 165, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => {
    const current = (await state(page)).camera;
    return Math.hypot(current.x - beforeOrbit.x, current.y - beforeOrbit.y, current.z - beforeOrbit.z);
  }).toBeGreaterThan(0.05);

  await page.screenshot({ path: "artifacts/rep4-b2-02-three-class-edits.png", fullPage: true });

  await page.getByTestId("b2-reset").click();
  await expect(root).toHaveAttribute("data-selected-hardpoint", "none");
  const reset = await state(page);
  expectPointClose(reset.bearing, baseline.bearing);
  expectPointClose(reset.tie, baseline.tie);
  expectPointClose(reset.damper, baseline.damper);
  expect(reset.tieLength).toBeCloseTo(baseline.tieLength, 12);
  expect(reset.damperLength).toBeCloseTo(baseline.damperLength, 12);
  expect(reset.derivedValid).toBe(true);

  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
