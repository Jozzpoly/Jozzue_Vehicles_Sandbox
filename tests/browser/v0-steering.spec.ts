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

test("V0 Owner-visible controls move rack and vehicle", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("runtime-status")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(1800);
  await page.keyboard.up("ArrowUp");
  const heldRack = Number(
    await page.locator("#app").getAttribute("data-rack"),
  );
  await page.keyboard.up("ArrowRight");
  await page.waitForTimeout(350);

  const state = await page.locator("#app").evaluate((element) => ({
    rack: Number((element as HTMLElement).dataset.rack),
    distance: Number((element as HTMLElement).dataset.distance),
    leftAngle: Number((element as HTMLElement).dataset.leftAngle),
  }));
  expect(state.rack).toBeGreaterThan(0.04);
  expect(Math.abs(state.rack - heldRack)).toBeLessThan(0.01);
  expect(state.distance).toBeGreaterThan(0.15);
  expect(state.leftAngle).toBeGreaterThan(0.1);
});
