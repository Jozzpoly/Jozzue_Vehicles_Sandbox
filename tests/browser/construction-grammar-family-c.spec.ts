import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

mkdirSync("artifacts", { recursive: true });

type PartSnapshot = {
  id: string;
  aSocket: string | null;
  bSocket: string | null;
  a: [number, number, number];
  b: [number, number, number];
};

async function dataset(page: Page): Promise<DOMStringMap> {
  return page.evaluate(() => ({ ...(document.querySelector<HTMLElement>("#app")?.dataset ?? {}) }));
}
const n = (data: DOMStringMap, key: string): number => Number(data[key]);
async function point(page: Page, prefix: string): Promise<{ x: number; y: number }> {
  const data = await dataset(page);
  return { x: n(data, `${prefix}ScreenX`), y: n(data, `${prefix}ScreenY`) };
}
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 6 });
  await page.mouse.up();
}
async function firstPart(page: Page): Promise<PartSnapshot> {
  const data = await dataset(page);
  return JSON.parse(data.parts ?? "[]")[0] as PartSnapshot;
}
function distance3(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
function vectorDistance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(...a.map((value, index) => value - b[index]));
}
function watchErrors(page: Page): { pageErrors: string[]; consoleErrors: string[] } {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  return { pageErrors, consoleErrors };
}
async function takeDamper(page: Page): Promise<void> {
  const rackDamper = await point(page, "rackDamper");
  await page.mouse.move(rackDamper.x, rackDamper.y);
  await page.mouse.down();
  await page.mouse.move(rackDamper.x - 150, rackDamper.y - 170, { steps: 6 });
  await page.mouse.up();
}

test("Family C Spatial Compass preserves component-as-object topology operations", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/?grammarC");
  const root = page.locator("#app");
  await expect(root).toHaveAttribute("data-donor-ready", "true");
  await expect(page.getByText(/NO PHYSICS CLAIM/i)).toBeVisible();
  await page.screenshot({ path: "artifacts/grammar-family-c-00-rack-visible.png", fullPage: true });

  await takeDamper(page);
  await expect(root).toHaveAttribute("data-part-count", "1");
  await expect(root).not.toHaveAttribute("data-selected-part", "none");

  let a = await point(page, "selectedA");
  const chassisUpper = await point(page, "cUpper");
  await drag(page, a, chassisUpper);
  await expect.poll(async () => (await firstPart(page)).aSocket).toBe("c-upper");

  let b = await point(page, "selectedB");
  const hubLower = await point(page, "hLower");
  await drag(page, b, hubLower);
  await expect.poll(async () => (await firstPart(page)).bSocket).toBe("h-lower");
  await page.screenshot({ path: "artifacts/grammar-family-c-01-both-eyes-attached.png", fullPage: true });

  b = await point(page, "selectedB");
  const hubUpper = await point(page, "hUpper");
  await drag(page, b, hubUpper);
  await expect.poll(async () => (await firstPart(page)).bSocket).toBe("h-upper");

  a = await point(page, "selectedA");
  await drag(page, a, { x: a.x + 240, y: a.y + 150 });
  await expect.poll(async () => (await firstPart(page)).aSocket).toBeNull();
  await page.screenshot({ path: "artifacts/grammar-family-c-02-detached-eye.png", fullPage: true });

  await page.getByTestId("undo").click();
  await expect.poll(async () => (await firstPart(page)).aSocket).toBe("c-upper");
  await expect(root).not.toHaveAttribute("data-selected-part", "none");
  await expect(page.getByTestId("delete")).toBeEnabled();

  await page.getByTestId("delete").click();
  await expect(root).toHaveAttribute("data-part-count", "0");
  await page.getByTestId("undo").click();
  await expect(root).toHaveAttribute("data-part-count", "1");
  await expect(root).not.toHaveAttribute("data-selected-part", "none");

  expect(errors.pageErrors, `page errors: ${errors.pageErrors.join(" | ")}`).toEqual([]);
  expect(errors.consoleErrors, `console errors: ${errors.consoleErrors.join(" | ")}`).toEqual([]);
});

test("Spatial Compass remains spatial after camera orbit and previews 3D snap before release", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/?grammarC");
  const root = page.locator("#app");
  await expect(root).toHaveAttribute("data-donor-ready", "true");
  await takeDamper(page);
  await expect(root).toHaveAttribute("data-part-count", "1");

  const beforeOrbitData = await dataset(page);
  const beforeForward = JSON.parse(beforeOrbitData.cameraForward ?? "[0,0,-1]") as number[];
  const box = await page.getByTestId("family-c-canvas").boundingBox();
  if (!box) throw new Error("Family C canvas has no bounding box");
  const orbitFrom = { x: box.x + box.width * 0.88, y: box.y + box.height * 0.18 };
  const orbitTo = { x: orbitFrom.x - 220, y: orbitFrom.y + 85 };
  await drag(page, orbitFrom, orbitTo);

  const afterOrbitData = await dataset(page);
  const afterForward = JSON.parse(afterOrbitData.cameraForward ?? "[0,0,-1]") as number[];
  expect(vectorDistance(beforeForward, afterForward)).toBeGreaterThan(0.08);
  await expect(root).not.toHaveAttribute("data-selected-part", "none");

  const beforeDirect = await firstPart(page);
  let a = await point(page, "selectedA");
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 135, a.y - 90, { steps: 6 });
  const duringDirect = await firstPart(page);
  expect(Math.abs(duringDirect.a[2] - beforeDirect.a[2])).toBeGreaterThan(0.02);
  await page.mouse.up();

  const beforeSpan = await firstPart(page);
  const lengthBeforeSpan = distance3(beforeSpan.a, beforeSpan.b);
  const active = await point(page, "activeEye");
  const spanHandle = await point(page, "gizmoSpan");
  const vx = spanHandle.x - active.x;
  const vy = spanHandle.y - active.y;
  const vl = Math.max(1, Math.hypot(vx, vy));
  const spanTarget = { x: spanHandle.x + (vx / vl) * 85, y: spanHandle.y + (vy / vl) * 85 };
  await page.mouse.move(spanHandle.x, spanHandle.y);
  await page.mouse.down();
  await page.mouse.move(spanTarget.x, spanTarget.y, { steps: 6 });
  const duringSpan = await firstPart(page);
  expect(distance3(duringSpan.a, duringSpan.b)).toBeGreaterThan(lengthBeforeSpan + 0.035);
  await page.mouse.up();

  a = await point(page, "selectedA");
  const chassisMid = await point(page, "cMid");
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(chassisMid.x, chassisMid.y, { steps: 6 });
  await expect(root).toHaveAttribute("data-preview-socket", "c-mid");
  await page.screenshot({ path: "artifacts/grammar-family-c-03-orbit-spatial-preview.png", fullPage: true });
  await page.mouse.up();
  await expect.poll(async () => (await firstPart(page)).aSocket).toBe("c-mid");

  expect(errors.pageErrors, `page errors: ${errors.pageErrors.join(" | ")}`).toEqual([]);
  expect(errors.consoleErrors, `console errors: ${errors.consoleErrors.join(" | ")}`).toEqual([]);
});
