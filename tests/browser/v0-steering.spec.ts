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
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(360);
  await page.keyboard.up("ArrowLeft");
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

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(220);
  await page.keyboard.up("ArrowRight");
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

test("V0 Owner input maps left/right to the matching world-space trajectory", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("runtime-status")).toHaveText(
    "READY · physical linkage owns steering",
  );

  async function driveDirection(code: "ArrowLeft" | "ArrowRight") {
    await page.keyboard.down("ArrowUp");
    await page.keyboard.down(code);
    await page.waitForTimeout(1_300);
    await page.keyboard.up(code);
    await page.keyboard.up("ArrowUp");
    await page.waitForTimeout(120);
    return page.locator("#app").evaluate((element) => ({
      z: Number((element as HTMLElement).dataset.chassisZ),
      heading: Number((element as HTMLElement).dataset.heading),
      distance: Number((element as HTMLElement).dataset.distance),
      trailPoints: Number((element as HTMLElement).dataset.currentTrailPoints),
      contacts: element.querySelector("[data-testid='contacts']")?.textContent,
    }));
  }

  const left = await driveDirection("ArrowLeft");
  expect(left.distance).toBeGreaterThan(0.35);
  expect(left.z).toBeLessThan(-0.04);
  expect(left.heading).toBeLessThan(-0.02);
  expect(left.trailPoints).toBeGreaterThan(2);
  expect(left.contacts).toBe("1 / 1 / world 4");

  await page.getByTestId("reset").click();
  await expect(page.locator("#app")).toHaveAttribute("data-steering-target", "0");
  await page.waitForTimeout(350);

  const right = await driveDirection("ArrowRight");
  expect(right.distance).toBeGreaterThan(0.35);
  expect(right.z).toBeGreaterThan(0.04);
  expect(right.heading).toBeGreaterThan(0.02);
  expect(right.contacts).toBe("1 / 1 / world 4");
});

test("V0 keeps one prior world-space trail as a dimmed A/B ghost", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("runtime-status")).toHaveText(
    "READY · physical linkage owns steering",
  );
  await page.keyboard.down("ArrowUp");
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(1_050);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("ArrowUp");

  const beforeSwitch = await page.locator("#app").evaluate((element) => ({
    current: Number((element as HTMLElement).dataset.currentTrailPoints),
    ghost: Number((element as HTMLElement).dataset.ghostTrailPoints),
  }));
  expect(beforeSwitch.current).toBeGreaterThan(2);
  expect(beforeSwitch.ghost).toBe(0);

  await page.getByTestId("variant-b").click();
  await expect(page.getByTestId("active-variant")).toHaveText("Variant B");
  await expect(page.getByTestId("trail-status")).toHaveText(
    "Current B trail · A ghost",
  );
  await expect.poll(async () =>
    Number(await page.locator("#app").getAttribute("data-ghost-trail-points")),
  ).toBeGreaterThan(2);
  await page.keyboard.down("ArrowUp");
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(1_050);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("ArrowUp");
  await expect.poll(async () =>
    Number(await page.locator("#app").getAttribute("data-current-trail-points")),
  ).toBeGreaterThan(2);
  await page.screenshot({ path: join(tmpdir(), "jv-v0-deconfound-ab-ghost.png") });
});
