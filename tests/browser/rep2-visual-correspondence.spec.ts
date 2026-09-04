import { expect, test, type Page } from "@playwright/test";

const problems = new WeakMap<Page, string[]>();

const correspondence = async (page: Page) =>
  page.locator("#app").evaluate((element) => {
    const data = (element as HTMLElement).dataset;
    return {
      state: data.state ?? "",
      variant: data.variant ?? "",
      step: Number(data.step),
      hingeAngle: Number(data.hingeAngle),
      pivotError: Number(data.pivotError),
      armStartError: Number(data.armStartError),
      armEndError: Number(data.armEndError),
      wheelCenterError: Number(data.wheelCenterError),
      physicalPivot: {
        x: Number(data.physicalPivotX),
        y: Number(data.physicalPivotY),
        z: Number(data.physicalPivotZ),
      },
      visualPivot: {
        x: Number(data.visualPivotX),
        y: Number(data.visualPivotY),
        z: Number(data.visualPivotZ),
      },
      physicalArmEnd: {
        x: Number(data.physicalArmEndX),
        y: Number(data.physicalArmEndY),
        z: Number(data.physicalArmEndZ),
      },
      visualArmEnd: {
        x: Number(data.visualArmEndX),
        y: Number(data.visualArmEndY),
        z: Number(data.visualArmEndZ),
      },
      physicalWheel: {
        x: Number(data.physicalWheelX),
        y: Number(data.physicalWheelY),
        z: Number(data.physicalWheelZ),
      },
      visualWheel: {
        x: Number(data.visualWheelX),
        y: Number(data.visualWheelY),
        z: Number(data.visualWheelZ),
      },
    };
  });

function distance(
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function expectCorrespondence(value: Awaited<ReturnType<typeof correspondence>>): void {
  expect(value.pivotError).toBeLessThan(1e-7);
  expect(value.armStartError).toBeLessThan(1e-7);
  expect(value.armEndError).toBeLessThan(1e-7);
  expect(value.wheelCenterError).toBeLessThan(1e-7);
  expect(distance(value.visualPivot, value.physicalPivot)).toBeLessThan(1e-7);
  expect(distance(value.visualArmEnd, value.physicalArmEnd)).toBeLessThan(1e-7);
  expect(distance(value.visualWheel, value.physicalWheel)).toBeLessThan(1e-7);
}

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

test("B3 browser render coincides with the settled live physical seam", async ({ page }) => {
  await page.goto("/?rep2");
  await expect(page).toHaveTitle("JV Rep2 Visual Correspondence");
  await expect(page.getByTestId("rep2-viewport")).toBeVisible();
  await expect(page.getByTestId("runtime-status")).toHaveText(
    "READY · visible mechanism owned by live physical trace",
  );
  const canvas = page.getByTestId("rep2-viewport");
  const drawable = await canvas.evaluate((element) => {
    const value = element as HTMLCanvasElement;
    return value.width > 0 && value.height > 0 && value.getContext("webgl2") !== null;
  });
  expect(drawable).toBe(true);

  const value = await correspondence(page);
  expect(value.state).toBe("ready");
  expect(value.step).toBe(180);
  expectCorrespondence(value);
});

test("B4 rendered correspondence survives real physical drive and articulation", async ({ page }) => {
  await page.goto("/?rep2");
  const before = await correspondence(page);
  await page.getByTestId("advance-drive").click();
  await expect(page.getByTestId("runtime-status")).toHaveText(
    "DRIVEN · correspondence rechecked after physical motion",
  );
  const after = await correspondence(page);
  expect(after.state).toBe("driven");
  expect(after.step).toBe(420);
  expectCorrespondence(after);
  expect(distance(after.physicalPivot, before.physicalPivot)).toBeGreaterThan(0.1);
  expect(distance(after.physicalWheel, before.physicalWheel)).toBeGreaterThan(0.1);
});

test("B5 a second authored physical specimen needs no projection-side variant geometry", async ({ page }) => {
  await page.goto("/?rep2");
  const baseline = await correspondence(page);
  expect(baseline.variant).toBe("baseline");

  await page.goto("/?rep2&variant=raised");
  await expect(page.getByTestId("runtime-status")).toHaveText(
    "READY · visible mechanism owned by live physical trace",
  );
  const raised = await correspondence(page);
  expect(raised.variant).toBe("raised");
  expectCorrespondence(raised);
  expect(distance(raised.physicalPivot, baseline.physicalPivot)).toBeGreaterThan(0.05);
  expect(distance(raised.visualPivot, baseline.visualPivot)).toBeGreaterThan(0.05);
});
