// Final E1 technical rehearsal, not an Owner acceptance recipe. Canvas positions
// come from observed viewport screenshots; no application state or model oracle.
import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

test.use({ viewport: { width: 1280, height: 720 } });
const problems = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  problems.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) => { if (["error", "warning"].includes(entry.type())) errors.push(entry.text()); });
});
test.afterEach(async ({ page }, info) => {
  await page.screenshot({ path: join(tmpdir(), `jv-f1-${info.title.replace(/[^a-z0-9]/gi, "-")}.png`) });
  expect(problems.get(page)).toEqual([]);
});

async function select(page: Page, x: number, y: number, title: string) {
  for (let i = 0; i < 8; i++) {
    await page.mouse.click(x, y);
    if (await page.getByTestId("selection-title").textContent() === title) return;
  }
  await expect(page.getByTestId("selection-title")).toHaveText(title);
}

async function target(page: Page, x: number, y: number, title: string) {
  await page.mouse.move(x, y);
  const hoveredIdentity = await page.getByTestId("target-identity").textContent();
  await page.mouse.click(x, y);
  if (await page.getByTestId("confirm-connect").isVisible()) {
    for (let i = 0; i < 8 && await page.getByTestId("target-identity").textContent() !== `TARGET: ${title}`; i++) {
      await page.mouse.click(x, y);
    }
    await expect(page.getByTestId("target-identity")).toHaveText(`TARGET: ${title}`);
    await page.getByTestId("confirm-connect").click();
  } else {
    expect(hoveredIdentity).toBe(`TARGET: ${title}`);
  }
  await expect(page.getByTestId("cancel-connect")).toBeHidden();
}

test("C1 and T1 share target identity and FIT access; C1 retains its registration debt", async ({ page }) => {
  const identityByCondition: string[][] = [];
  for (const condition of ["C1", "T1"]) {
    const identities: string[] = [];
    await page.goto(`/?f1=${condition}`);
    await expect(page.getByTestId("f1-condition")).toHaveText(condition);
    await page.waitForTimeout(300);
    await select(page, 711, 432, "Damper · Endpoint B");
    await page.getByTestId("disconnect").click();
    await page.getByTestId("add-rocker").click();
    await page.getByTestId("add-pushrod").click();
    await select(page, 837, 353, "Rocker · Pivot axis");
    await page.getByTestId("connect-axis").click();
    await page.mouse.move(727, 389);
    identities.push((await page.getByTestId("target-identity").textContent())!);
    await target(page, 727, 389, "Chassis fixture · Mount axis");
    await select(page, 833, 519, "Rigid link · Endpoint A");
    await page.getByTestId("connect-point").click();
    await page.mouse.click(711, 432);
    await expect(page.getByTestId("confirm-connect")).toBeVisible();
    const overlapNames = new Set<string>();
    for (let i = 0; i < 4; i++) {
      overlapNames.add((await page.getByTestId("target-identity").textContent())!);
      await page.mouse.click(711, 432);
    }
    expect([...overlapNames].sort()).toEqual(["TARGET: Damper · Endpoint B", "TARGET: Driven arm · Attachment point"]);
    identities.push(...[...overlapNames].sort());
    // A prior overlap choice must not mask the identity of a different target.
    await page.mouse.move(550, 207);
    await expect(page.getByTestId("target-identity")).toHaveText("TARGET: Chassis fixture · Mount point");
    await expect(page.getByTestId("confirm-connect")).toBeHidden();
    await target(page, 711, 432, "Driven arm · Attachment point");
    await select(page, 789, 452, "Rigid link · Endpoint B");
    await page.getByTestId("connect-point").click();
    await page.mouse.move(681, 370);
    identities.push((await page.getByTestId("target-identity").textContent())!);
    await target(page, 681, 370, "Rocker · Attachment A");
    await expect(page.getByTestId("selection-title")).toHaveText("Rigid link · Endpoint A");
    await expect(page.getByTestId("length-input")).toHaveValue("1.050");
    await expect(page.getByTestId("fit-length")).toBeEnabled();
    await expect(page.getByTestId("metric")).toContainText(`4 relations · ${condition === "C1" ? 1 : 0} violated`);
    await page.getByTestId("fit-length").click();
    await expect(page.getByTestId("metric")).toContainText(`4 relations · ${condition === "C1" ? 1 : 0} violated`);
    await expect(page.getByTestId("length-input")).toHaveValue("0.975");
    await page.screenshot({ path: join(tmpdir(), `jv-f1-matched-${condition}.png`) });
    identityByCondition.push(identities);
  }
  expect(identityByCondition[0]).toEqual(identityByCondition[1]);
});

test("T1 full rocker UI A-first", async ({ page }) => {
  await page.goto("/?f1=T1");
  await expect(page.getByTestId("metric")).toContainText("Rev 0 · 2 relations · 0 violated");
  await page.waitForTimeout(300);
  await select(page, 711, 432, "Damper · Endpoint B");
  await page.getByTestId("disconnect").click();
  await page.getByTestId("add-rocker").click();
  await page.getByTestId("add-pushrod").click();
  await select(page, 837, 353, "Rocker · Pivot axis");
  await page.getByTestId("connect-axis").click();
  await page.mouse.move(727, 389);
  await expect(page.getByTestId("target-identity")).toHaveText("TARGET: Chassis fixture · Mount axis");
  await target(page, 727, 389, "Chassis fixture · Mount axis");
  await select(page, 833, 519, "Rigid link · Endpoint A");
  await page.getByTestId("connect-point").click();
  await target(page, 711, 432, "Driven arm · Attachment point");
  await select(page, 789, 452, "Rigid link · Endpoint B");
  await page.getByTestId("connect-point").click();
  await target(page, 681, 370, "Rocker · Attachment A");
  await expect(page.getByTestId("selection-title")).toHaveText("Rigid link · Endpoint A");
  await expect(page.getByTestId("length-input")).toHaveValue("1.050");
  await page.getByTestId("fit-length").click();
  await expect(page.getByTestId("metric")).toContainText("4 relations · 0 violated");
  await page.screenshot({ path: join(tmpdir(), "jv-f1-ui-link-fitted.png") });
  await select(page, 711, 432, "Damper · Endpoint B");
  await page.getByTestId("connect-point").click();
  await target(page, 749, 298, "Rocker · Attachment B");
  await expect(page.getByTestId("selection-title")).toHaveText("Damper · Endpoint A");
  await page.getByTestId("fit-length").click();
  await expect(page.getByTestId("metric")).toContainText("5 relations · 0 violated");
  const before = await page.getByTestId("metric").textContent();
  await page.getByTestId("play").click();
  await expect(page.getByTestId("state-label")).toHaveText("PLAY · Rocker path");
  await page.waitForTimeout(4300);
  await expect(page.getByTestId("state-label")).toHaveText("PLAY · Rocker path");
  await page.screenshot({ path: join(tmpdir(), "jv-f1-ui-rocker-play.png") });
  await page.getByTestId("build").click();
  await expect(page.getByTestId("metric")).toHaveText(before!);
  await page.getByTestId("undo").click();
  await expect(page.getByTestId("metric")).toContainText("5 relations · 1 violated");
  await page.getByTestId("fit-length").click();
  await expect(page.getByTestId("metric")).toContainText("5 relations · 0 violated");
});

test("T1 full rocker UI B-first", async ({ page }) => {
  await page.goto("/?f1=T1");
  await expect(page.getByTestId("metric")).toContainText("Rev 0 · 2 relations · 0 violated");
  await page.waitForTimeout(300);
  await select(page, 711, 432, "Damper · Endpoint B");
  await page.getByTestId("disconnect").click();
  await select(page, 550, 215, "Damper · Endpoint A");
  await page.getByTestId("disconnect").click();
  await page.getByTestId("add-rocker").click();
  await page.getByTestId("add-pushrod").click();
  await select(page, 837, 353, "Rocker · Pivot axis");
  await page.getByTestId("connect-axis").click();
  await target(page, 727, 389, "Chassis fixture · Mount axis");
  await select(page, 931, 550, "Rigid link · Endpoint B");
  await page.getByTestId("connect-point").click();
  await target(page, 681, 370, "Rocker · Attachment A");
  await page.screenshot({ path: join(tmpdir(), "jv-f1-b-first-link-first-anchor.png") });
  await select(page, 609, 350, "Rigid link · Endpoint A");
  await page.getByTestId("connect-point").click();
  await target(page, 711, 432, "Driven arm · Attachment point");
  await expect(page.getByTestId("selection-title")).toHaveText("Rigid link · Endpoint B");
  await expect(page.getByTestId("length-input")).toHaveValue("1.050");
  await page.getByTestId("fit-length").click();
  await expect(page.getByTestId("metric")).toContainText("3 relations · 0 violated");
  await select(page, 711, 432, "Damper · Endpoint B");
  await page.getByTestId("connect-point").click();
  await target(page, 749, 298, "Rocker · Attachment B");
  await page.screenshot({ path: join(tmpdir(), "jv-f1-b-first-damper-first-anchor.png") });
  await select(page, 570, 70, "Damper · Endpoint A");
  await page.getByTestId("connect-point").click();
  await target(page, 550, 207, "Chassis fixture · Mount point");
  await expect(page.getByTestId("selection-title")).toHaveText("Damper · Endpoint B");
  await expect(page.getByTestId("length-input")).toHaveValue("3.202");
  await page.getByTestId("fit-length").click();
  await expect(page.getByTestId("metric")).toContainText("5 relations · 0 violated");
  const before = await page.getByTestId("metric").textContent();
  await page.getByTestId("play").click();
  await expect(page.getByTestId("state-label")).toHaveText("PLAY · Rocker path");
  await page.waitForTimeout(4300);
  await expect(page.getByTestId("state-label")).toHaveText("PLAY · Rocker path");
  await page.getByTestId("build").click();
  await expect(page.getByTestId("metric")).toHaveText(before!);
  await page.getByTestId("undo").click();
  await expect(page.getByTestId("metric")).toContainText("5 relations · 1 violated");
  await page.getByTestId("fit-length").click();
  await expect(page.getByTestId("metric")).toContainText("5 relations · 0 violated");
});
