import { expect, test, type Page } from "@playwright/test";

const problems = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const entries: string[] = [];
  problems.set(page, entries);
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      entries.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => entries.push(`pageerror: ${error.message}`));
});

test.afterEach(async ({ page }) => {
  expect(problems.get(page) ?? []).toEqual([]);
});

async function pickup(page: Page, side: "left" | "right") {
  return page.locator("#app").evaluate((element, selectedSide) => {
    const dataset = (element as HTMLElement).dataset;
    return {
      x: Number(dataset[`${selectedSide}PickupX`]),
      z: Number(dataset[`${selectedSide}PickupZ`]),
      screenX: Number(dataset[`${selectedSide}PickupScreenX`]),
      screenY: Number(dataset[`${selectedSide}PickupScreenY`]),
    };
  }, side);
}

test("R1 direct pickup drag survives physical RUN and exact BUILD recovery", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("JV R1 Direct Steering Pickup");
  await expect(page.getByTestId("r1-viewport")).toBeVisible();
  await expect(page.getByTestId("mode-label")).toHaveText("BUILD · Direct pickup authoring");
  await expect(page.getByTestId("runtime-status")).toHaveText("READY · authored geometry editable");

  const before = await pickup(page, "left");
  await page.mouse.move(before.screenX, before.screenY);
  await page.mouse.down();
  await page.mouse.move(before.screenX + 75, before.screenY - 38, { steps: 12 });
  await page.mouse.up();
  const authored = await pickup(page, "left");
  expect(authored.x).not.toBeCloseTo(before.x, 3);
  expect(authored.z).not.toBeCloseTo(before.z, 3);

  await page.getByTestId("run").click();
  await expect(page.getByTestId("mode-label")).toHaveText("DRIVE · Physical linkage");
  await expect(page.getByTestId("runtime-status")).toHaveText("READY · physical linkage owns steering");
  await page.keyboard.down("ArrowUp");
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(900);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("ArrowUp");
  await expect.poll(async () => Number(await page.locator("#app").getAttribute("data-distance"))).toBeGreaterThan(0.15);

  await page.getByTestId("build").click();
  await expect(page.getByTestId("mode-label")).toHaveText("BUILD · Direct pickup authoring");
  const recovered = await pickup(page, "left");
  expect(recovered.x).toBe(authored.x);
  expect(recovered.z).toBe(authored.z);
  await expect(page.getByTestId("runtime-status")).toHaveText("READY · exact authored BUILD recovered");
});

test("R1 presents both pickup points and remains readable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByTestId("left-pickup")).toBeVisible();
  await expect(page.getByTestId("right-pickup")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect(page.getByTestId("runtime-status")).toHaveAttribute("data-state", "ready");
});
