import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const browserProblems = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const problems: string[] = [];
  browserProblems.set(page, problems);
  page.on("console", (entry) => {
    if (entry.type() === "error" || entry.type() === "warning") {
      problems.push(`${entry.type()}: ${entry.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
});

test.afterEach(async ({ page }) => {
  expect(browserProblems.get(page) ?? []).toEqual([]);
});

test("V0 loads physical steering and switches geometry variants", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("JV Front Steering V0");
  await expect(page.getByTestId("v0-viewport")).toBeVisible();
  await expect(page.getByTestId("runtime-status")).toHaveText(
    "READY · physical linkage owns steering",
  );
  await expect(page.getByTestId("active-variant")).toHaveText("Variant A");

  await page.getByTestId("variant-b").click();
  await expect(page.getByTestId("active-variant")).toHaveText("Variant B");
  await expect(page.locator("#app")).toHaveAttribute("data-variant", "B");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(tmpdir(), "jv-front-steering-v0.png") });
});

test("V0 Owner steering holds partial target, reverses, and centers explicitly", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("runtime-status")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(360);
  await page.keyboard.up("ArrowRight");
  const partialTarget = Number(
    await page.locator("#app").getAttribute("data-steering-target"),
  );
  expect(partialTarget).toBeGreaterThan(0.15);
  expect(partialTarget).toBeLessThan(0.7);

  await page.waitForTimeout(600);
  const settledRack = Number(await page.locator("#app").getAttribute("data-rack"));
  await page.waitForTimeout(300);
  const heldState = await page.locator("#app").evaluate((element) => ({
    target: Number((element as HTMLElement).dataset.steeringTarget),
    rack: Number((element as HTMLElement).dataset.rack),
  }));
  expect(heldState.target).toBeCloseTo(partialTarget, 8);
  expect(Math.abs(heldState.rack - settledRack)).toBeLessThan(0.005);

  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(220);
  await page.keyboard.up("ArrowLeft");
  const reversedTarget = Number(
    await page.locator("#app").getAttribute("data-steering-target"),
  );
  expect(reversedTarget).toBeLessThan(partialTarget - 0.08);

  await page.keyboard.press("KeyC");
  await page.waitForTimeout(650);
  const centered = await page.locator("#app").evaluate((element) => ({
    target: Number((element as HTMLElement).dataset.steeringTarget),
    rack: Number((element as HTMLElement).dataset.rack),
  }));
  expect(centered.target).toBe(0);
  expect(Math.abs(centered.rack)).toBeLessThan(0.005);

  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(900);
  await page.keyboard.up("ArrowUp");

  const state = await page.locator("#app").evaluate((element) => ({
    distance: Number((element as HTMLElement).dataset.distance),
  }));
  expect(state.distance).toBeGreaterThan(0.15);
});
