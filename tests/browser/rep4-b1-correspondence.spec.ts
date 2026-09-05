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
  error?: string;
}

async function evidence(page: Page): Promise<Evidence> {
  return page.evaluate(() => {
    const value = (window as Window & { __REP4_B1__?: Evidence }).__REP4_B1__;
    if (!value) throw new Error("missing __REP4_B1__ evidence");
    return { ...value };
  });
}

test("Rep4 B1 renders one authority through BUILD and native PLAY with the qualified donor damper", async ({ page }) => {
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

  await page.screenshot({ path: "artifacts/rep4-b1-01-build.png", fullPage: true });

  await page.getByTestId("b1-play").click();
  await expect(root).toHaveAttribute("data-phase", "PLAY");
  await expect.poll(async () => (await evidence(page)).frameIndex).toBeGreaterThan(12);

  const moving = await evidence(page);
  expect(moving.status).toBe("ready");
  expect(moving.donorReady).toBe(true);
  expect(moving.traceReady).toBe(true);
  expect(moving.upperBallGap).toBeLessThan(1e-3);
  expect(moving.lowerBallGap).toBeLessThan(1e-3);
  expect(Math.abs(moving.damperVisibleLength - build.damperVisibleLength)).toBeGreaterThan(1e-3);
  // The tie is a fixed native relation. Its visible endpoints should not exhibit a material fake stretch.
  expect(Math.abs(moving.tieVisibleLength - build.tieVisibleLength)).toBeLessThan(2e-4);

  await page.screenshot({ path: "artifacts/rep4-b1-02-play.png", fullPage: true });

  await page.getByTestId("b1-build").click();
  await expect(root).toHaveAttribute("data-phase", "BUILD");
  const recovered = await evidence(page);
  expect(recovered.tieVisibleLength).toBeCloseTo(build.tieVisibleLength, 10);
  expect(recovered.damperVisibleLength).toBeCloseTo(build.damperVisibleLength, 10);
  expect(recovered.upperBallGap).toBe(0);
  expect(recovered.lowerBallGap).toBe(0);
  expect(recovered.donorReady).toBe(true);

  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
