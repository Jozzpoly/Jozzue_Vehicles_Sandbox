import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

const consoleProblemsByPage = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const consoleProblems: string[] = [];
  consoleProblemsByPage.set(page, consoleProblems);
  page.on("console", (entry) => {
    if (entry.type() === "error" || entry.type() === "warning") {
      consoleProblems.push(`${entry.type()}: ${entry.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleProblems.push(`pageerror: ${error.message}`));
});

test.afterEach(async ({ page }) => {
  expect(consoleProblemsByPage.get(page) ?? []).toEqual([]);
});

test("baseline remains causal across BUILD → PLAY → BUILD", async ({ page }) => {
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

test("Connect exposes only legal targets and requires explicit choice for overlaps", async ({ page }) => {
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

  // A source/same-participant handle is visible as context but is not a legal
  // target and cannot silently produce a relation.
  await page.mouse.click(952, 658);
  await expect(page.getByTestId("selection-title")).toHaveText("Rigid link · Endpoint A");
  await page.getByTestId("connect-point").click();
  await page.mouse.click(952, 658);
  await expect(page.getByTestId("message")).toContainText("No legal target");
  await expect(page.getByTestId("metric")).toContainText("1 relations");

  // The detached damper endpoint and arm endpoint overlap. E1 must expose the
  // ambiguity rather than silently committing the raycaster's first hit.
  await page.mouse.click(820, 536);
  await expect(page.getByTestId("confirm-connect")).toBeVisible();
  await expect(page.getByTestId("message")).toContainText("legal targets overlap");
  await expect(page.getByTestId("metric")).toContainText("1 relations");
  await page.screenshot({ path: join(tmpdir(), "jv-e1-foundation-connect-ambiguity.png"), fullPage: false });
  await page.getByTestId("confirm-connect").click();
  await expect(page.getByTestId("metric")).toContainText("2 relations");
});

test("multi-relation disconnect requires an explicit Owner-visible relation choice", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);

  await page.mouse.click(810, 536);
  await page.mouse.click(810, 536);
  await expect(page.getByTestId("selection-title")).toHaveText("Damper · Endpoint B");
  await page.getByTestId("connect-point").click();
  await page.mouse.click(608, 260);

  await expect(page.getByTestId("selection-meta")).toHaveText("2 authored relations");
  await expect(page.getByTestId("disconnect-relation-select")).toBeVisible();
  await expect(page.getByTestId("disconnect")).toBeDisabled();
  await expect(page.getByTestId("disconnect-relation-select").locator("option")).toHaveCount(3);
  await page.getByTestId("disconnect-relation-select").selectOption("relation-3");
  await expect(page.getByTestId("disconnect")).toBeEnabled();
  await page.getByTestId("disconnect").click();
  await expect(page.getByTestId("selection-meta")).toHaveText("1 authored relation");
  await expect(page.getByTestId("metric")).toContainText("2 relations");
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
