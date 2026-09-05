import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

mkdirSync("artifacts", { recursive: true });

interface Point3 { x: number; y: number; z: number }
interface BuildState {
  selected: string;
  derivedValid: boolean;
  donorReady: boolean;
  tie: Point3;
  damper: Point3;
  bearing: Point3;
  tieLength: number;
  damperLength: number;
  renderFrames: number;
}
interface Evidence {
  phase: "BUILD" | "PREPARING" | "PLAY";
  derivedValid: boolean;
  donorReady: boolean;
  currentAuthoritySignature: string;
  playStartAuthoritySignature: string;
  playWasEdited: boolean;
  playbackCompleted: boolean;
  returnExact: boolean;
  traceLength: number;
  frameIndex: number;
  playBuildTieLength: number;
  playBuildDamperLength: number;
  nativeDerivedTieLength: number;
  nativeDerivedDamperLength: number;
  maxRenderedWheelDisplacement: number;
  maxRenderedDamperLengthDelta: number;
  maxRenderedTieLengthDelta: number;
  error?: string;
}

async function data(page: Page): Promise<DOMStringMap> {
  return page.evaluate(() => ({ ...(document.querySelector<HTMLElement>("#app")?.dataset ?? {}) }));
}
const n = (dataset: DOMStringMap, key: string): number => Number(dataset[key]);
async function buildState(page: Page): Promise<BuildState> {
  const d = await data(page);
  return {
    selected: d.selectedHardpoint ?? "none",
    derivedValid: d.derivedValid === "true",
    donorReady: d.donorReady === "true",
    bearing: { x: n(d, "upperBearingAX"), y: n(d, "upperBearingAY"), z: n(d, "upperBearingAZ") },
    tie: { x: n(d, "chassisTieX"), y: n(d, "chassisTieY"), z: n(d, "chassisTieZ") },
    damper: { x: n(d, "damperLowerEyeX"), y: n(d, "damperLowerEyeY"), z: n(d, "damperLowerEyeZ") },
    tieLength: n(d, "tieLength"),
    damperLength: n(d, "damperLength"),
    renderFrames: n(d, "renderFrames"),
  };
}
async function evidence(page: Page): Promise<Evidence> {
  return page.evaluate(() => {
    const value = (window as Window & { __REP4_B3__?: Evidence }).__REP4_B3__;
    if (!value) throw new Error("missing __REP4_B3__ evidence");
    return { ...value };
  });
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
  const selected = d.selectedHardpoint ?? "none";
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
const expectPointClose = (actual: Point3, expected: Point3, tolerance = 1e-9): void => {
  expect(Math.abs(actual.x - expected.x)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.y - expected.y)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.z - expected.z)).toBeLessThanOrEqual(tolerance);
};

test("Rep4 B3 runs materially edited multi-class BUILD authority through native PLAY and returns to the exact authored build", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/?rep4b3");
  const root = page.locator("#app");
  await expect(root).toHaveAttribute("data-donor-ready", "true");
  await expect(root).toHaveAttribute("data-derived-valid", "true");
  await expect(root).toHaveAttribute("data-phase", "BUILD");
  await expect.poll(async () => (await buildState(page)).renderFrames).toBeGreaterThan(5);
  await expect(page.locator("input[type='range'], select")).toHaveCount(0);

  const canvas = page.getByTestId("rep4-b3-canvas");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(1000);
  expect(box!.height).toBeGreaterThan(650);

  const baseline = await buildState(page);
  const baselineEvidence = await evidence(page);
  expect(baselineEvidence.phase).toBe("BUILD");
  expect(baselineEvidence.playbackCompleted).toBe(false);
  await page.screenshot({ path: "artifacts/rep4-b3-01-baseline.png", fullPage: true });

  // Class 1: direct spatial gizmo edit of the physical chassis tie point.
  await clickHardpoint(page, "chassisTie");
  await expect(root).toHaveAttribute("data-selected-hardpoint", "chassis-tie");
  const beforeTie = await buildState(page);
  await dragSelectedAxis(page, "X", 42);
  await expect.poll(async () => Math.abs((await buildState(page)).tie.x - beforeTie.tie.x)).toBeGreaterThan(0.03);
  const afterTie = await buildState(page);
  expectPointClose(afterTie.damper, baseline.damper);
  expectPointClose(afterTie.bearing, baseline.bearing);
  expect(Math.abs(afterTie.tieLength - baseline.tieLength)).toBeGreaterThan(1e-3);

  // Class 2: exact numeric edit of the physical damper lower eye.
  await clickHardpoint(page, "damperLowerEye");
  await expect(root).toHaveAttribute("data-selected-hardpoint", "damper-lower-eye");
  await page.getByTestId("b3-y").fill("-0.270");
  await page.getByTestId("b3-y").press("Tab");
  await expect.poll(async () => (await buildState(page)).damper.y).toBeCloseTo(-0.27, 10);
  const edited = await buildState(page);
  const editedEvidence = await evidence(page);
  expect(edited.derivedValid).toBe(true);
  expectPointClose(edited.tie, afterTie.tie);
  expectPointClose(edited.bearing, baseline.bearing);
  expect(Math.abs(edited.damperLength - afterTie.damperLength)).toBeGreaterThan(1e-3);
  expect(editedEvidence.currentAuthoritySignature).not.toBe(baselineEvidence.currentAuthoritySignature);
  await page.screenshot({ path: "artifacts/rep4-b3-02-edited-build.png", fullPage: true });

  const editedSignature = editedEvidence.currentAuthoritySignature;
  await page.getByTestId("b3-play").click();
  await expect.poll(async () => (await evidence(page)).phase, { timeout: 15_000 }).toBe("PLAY");
  const started = await evidence(page);
  expect(started.playWasEdited).toBe(true);
  expect(started.playStartAuthoritySignature).toBe(editedSignature);
  expect(started.currentAuthoritySignature).toBe(editedSignature);
  expect(started.traceLength).toBe(121);
  expect(started.nativeDerivedTieLength).toBeCloseTo(started.playBuildTieLength, 10);
  expect(started.nativeDerivedDamperLength).toBeCloseTo(started.playBuildDamperLength, 10);

  await expect.poll(async () => (await evidence(page)).frameIndex).toBeGreaterThan(12);
  await page.screenshot({ path: "artifacts/rep4-b3-03-native-play.png", fullPage: true });

  await expect(root).toHaveAttribute("data-playback-completed", "true", { timeout: 7000 });
  await expect(root).toHaveAttribute("data-phase", "BUILD");
  await expect(root).toHaveAttribute("data-return-exact", "true");

  const completed = await evidence(page);
  const recovered = await buildState(page);
  expect(completed.error).toBeUndefined();
  expect(completed.playbackCompleted).toBe(true);
  expect(completed.returnExact).toBe(true);
  expect(completed.currentAuthoritySignature).toBe(editedSignature);
  expect(completed.playStartAuthoritySignature).toBe(editedSignature);
  expect(completed.maxRenderedWheelDisplacement).toBeGreaterThan(1e-3);
  expect(completed.maxRenderedDamperLengthDelta).toBeGreaterThan(1e-4);
  expect(completed.maxRenderedTieLengthDelta).toBeLessThan(5e-4);
  expectPointClose(recovered.tie, edited.tie);
  expectPointClose(recovered.damper, edited.damper);
  expectPointClose(recovered.bearing, edited.bearing);
  expect(recovered.tieLength).toBeCloseTo(edited.tieLength, 10);
  expect(recovered.damperLength).toBeCloseTo(edited.damperLength, 10);
  await expect(page.getByTestId("b3-y")).toBeEnabled();
  await page.screenshot({ path: "artifacts/rep4-b3-04-exact-build-return.png", fullPage: true });

  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
