import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

mkdirSync("artifacts", { recursive: true });

interface Evidence {
  status: "loading" | "ready" | "error";
  phase: "BUILD" | "PLAY";
  donorReady: boolean;
  traceReady: boolean;
  traceLength: number;
  frameIndex: number;
  tieVisibleLength: number;
  damperVisibleLength: number;
  upperBallGap: number;
  lowerBallGap: number;
  donorRestGap: number;
  donorScaleFactor: number;
  playbackCompleted: boolean;
  maxRenderedWheelDisplacement: number;
  maxRenderedDamperLengthDelta: number;
  maxRenderedTieLengthDelta: number;
  error?: string;
}

async function evidence(page: Page): Promise<Evidence> {
  return page.evaluate(() => {
    const value = (window as Window & { __REP4_B1__?: Evidence }).__REP4_B1__;
    if (!value) throw new Error("missing __REP4_B1__ evidence");
    return { ...value };
  });
}

test("Rep4 B1 renders one authority through BUILD and native PLAY with the physically scaled donor damper", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/?rep4b1");
  const root = page.locator("#app");
  const canvas = page.getByTestId("rep4-b1-canvas");

  await expect(root).toHaveAttribute("data-trace-ready", "true");
  await expect(root).toHaveAttribute("data-donor-ready", "true");
  await expect(page.getByTestId("b1-donor")).toContainText("READY");
  await expect(page.getByTestId("b1-trace")).toContainText("native snapshots");

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(1000);
  expect(box!.height).toBeGreaterThan(650);

  const build = await evidence(page);
  expect(build.status).toBe("ready");
  expect(build.phase).toBe("BUILD");
  expect(build.traceLength).toBe(61);
  expect(build.donorReady).toBe(true);
  expect(build.upperBallGap).toBe(0);
  expect(build.lowerBallGap).toBe(0);
  expect(build.tieVisibleLength).toBeGreaterThan(0.2);
  expect(build.damperVisibleLength).toBeGreaterThan(0.2);
  expect(build.donorRestGap).toBeCloseTo(0.5, 9);
  expect(build.donorScaleFactor).toBeGreaterThan(0.2);
  expect(build.donorScaleFactor).toBeLessThan(0.3);

  await page.screenshot({ path: "artifacts/rep4-b1-01-build.png", fullPage: true });

  await page.getByTestId("b1-play").click();
  await expect(root).toHaveAttribute("data-phase", "PLAY");
  await expect(root).toHaveAttribute("data-playback-completed", "true", { timeout: 5000 });

  const completed = await evidence(page);
  expect(completed.status).toBe("ready");
  expect(completed.phase).toBe("BUILD");
  expect(completed.donorReady).toBe(true);
  expect(completed.traceReady).toBe(true);
  expect(completed.playbackCompleted).toBe(true);
  // These are accumulated rendered-observer metrics. They prove the browser
  // consumed materially different native snapshots without racing one chosen frame.
  expect(completed.maxRenderedWheelDisplacement).toBeGreaterThan(1e-3);
  expect(completed.maxRenderedDamperLengthDelta).toBeGreaterThan(1e-4);
  // The tie is a fixed native relation. Rendering should not invent material stretch.
  expect(completed.maxRenderedTieLengthDelta).toBeLessThan(2e-4);

  const recovered = await evidence(page);
  expect(recovered.tieVisibleLength).toBeCloseTo(build.tieVisibleLength, 10);
  expect(recovered.damperVisibleLength).toBeCloseTo(build.damperVisibleLength, 10);
  expect(recovered.upperBallGap).toBe(0);
  expect(recovered.lowerBallGap).toBe(0);
  expect(recovered.donorReady).toBe(true);

  await page.screenshot({ path: "artifacts/rep4-b1-02-build-return.png", fullPage: true });

  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
