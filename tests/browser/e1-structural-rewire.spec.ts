import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

test("baseline remains causal across BUILD → PLAY → BUILD", async ({ page }) => {
  const consoleProblems: string[] = [];
  page.on("console", (entry) => {
    if (entry.type() === "error" || entry.type() === "warning") {
      consoleProblems.push(`${entry.type()}: ${entry.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleProblems.push(`pageerror: ${error.message}`));

  await page.goto("/");
  await expect(page).toHaveTitle("JV E1 Structural Rewire");
  await expect(page.getByTestId("viewport").locator("canvas")).toBeVisible();
  await expect(page.getByTestId("state-label")).toHaveText("BUILD · Ready");
  await expect(page.getByTestId("task-card")).toContainText("MOVING ARM → RIGID LINK → ROCKER → DAMPER");
  await expect(page.getByTestId("metric")).toContainText("2 relations · 0 violated");

  await page.getByTestId("play").click();
  await expect(page.getByTestId("state-label")).toHaveText("PLAY · Direct path");
  const firstMetric = await page.getByTestId("metric").textContent();
  await page.waitForTimeout(650);
  const laterMetric = await page.getByTestId("metric").textContent();
  expect(laterMetric).not.toEqual(firstMetric);

  await page.getByTestId("build").click();
  await expect(page.getByTestId("state-label")).toHaveText("BUILD · Ready");
  await expect(page.getByTestId("metric")).toContainText("Rev 0 · 2 relations · 0 violated");
  await page.screenshot({ path: join(tmpdir(), "jv-e1-structural-baseline.png"), fullPage: false });
  expect(consoleProblems).toEqual([]);
});

test("detached parts and explicit own-length editing remain reversible", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("add-pushrod").click();
  await expect(page.getByTestId("selection-title")).toHaveText("Rigid link");
  await expect(page.getByTestId("length-input")).toHaveValue("1.050");
  await expect(page.getByTestId("metric")).toContainText("Rev 1 · 2 relations · 0 violated");

  await page.getByTestId("length-input").fill("2.400");
  await page.getByTestId("length-input").press("Enter");
  await expect(page.getByTestId("length-input")).toHaveValue("2.400");
  await expect(page.getByTestId("metric")).toContainText("Rev 2");

  await page.getByTestId("undo").click();
  await expect(page.getByTestId("length-input")).toHaveValue("1.050");
  await page.getByTestId("undo").click();
  await expect(page.getByTestId("add-pushrod")).toBeEnabled();
  await expect(page.getByTestId("metric")).toContainText("Rev 0 · 2 relations · 0 violated");
});

test("explicit viewport relations remain permissive through a partial structural rewire", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);

  // The direct lower joint contains two coincident references. Repeated click
  // cycles them explicitly rather than silently choosing one semantic target.
  await page.mouse.click(810, 536);
  await page.mouse.click(810, 536);
  await expect(page.getByTestId("selection-title")).toHaveText("Damper · Endpoint B");
  await page.getByTestId("disconnect").click();
  await expect(page.getByTestId("metric")).toContainText("1 relations · 0 violated");

  await page.getByTestId("add-rocker").click();
  await page.getByTestId("add-pushrod").click();

  // Real axis reference → explicit relation type → real target axis.
  await page.mouse.click(972, 443);
  await expect(page.getByTestId("selection-title")).toHaveText("Rocker · Pivot axis");
  await page.getByTestId("connect-axis").click();
  await page.mouse.click(832, 487);
  await expect(page.getByTestId("metric")).toContainText("2 relations · 0 violated");

  // One pushrod endpoint connects cleanly. Connecting the second endpoint does
  // not stretch it: the first relation persists and becomes visibly violated.
  await page.mouse.click(952, 658);
  await expect(page.getByTestId("selection-title")).toHaveText("Rigid link · Endpoint A");
  await page.getByTestId("connect-point").click();
  await page.mouse.click(820, 536);
  await expect(page.getByTestId("metric")).toContainText("3 relations · 0 violated");

  await page.mouse.click(906, 566);
  await expect(page.getByTestId("selection-title")).toHaveText("Rigid link · Endpoint B");
  await page.getByTestId("connect-point").click();
  await page.mouse.click(765, 461);
  await expect(page.getByTestId("state-label")).toHaveText("BUILD · Permissive warning");
  await expect(page.getByTestId("metric")).toContainText("4 relations · 1 violated");

  await page.getByTestId("play").click();
  await expect(page.getByTestId("state-label")).toHaveText("PLAY · diagnosed-static");
  await page.getByTestId("build").click();
  await page.getByTestId("undo").click();
  await expect(page.getByTestId("metric")).toContainText("3 relations · 0 violated");
});

test("visible gizmos commit pose-only translation and local rotation", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(250);
  await page.getByTestId("add-pushrod").click();
  await page.mouse.move(1048, 675);
  await page.mouse.down();
  await page.mouse.move(1120, 690, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByTestId("metric")).toContainText("Rev 2");
  await expect(page.getByTestId("length-input")).toHaveValue("1.050");
  await expect(page.getByTestId("message")).toContainText("Own geometry and reference layout were unchanged");

  await page.getByTestId("reset-task").click();
  await page.getByTestId("add-rocker").click();
  await page.getByTestId("rotate").click();
  await page.mouse.move(1065, 414);
  await page.mouse.down();
  await page.mouse.move(1030, 360, { steps: 14 });
  await page.mouse.up();
  await expect(page.getByTestId("metric")).toContainText("Rev 2");
  await expect(page.getByTestId("message")).toContainText("Own geometry and reference layout were unchanged");
});
