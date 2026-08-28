import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

test("authored edit remains causal and reversible across BUILD → PLAY → BUILD", async ({ page }) => {
  const consoleProblems: string[] = [];
  page.on("console", (entry) => {
    if (entry.type() === "error" || entry.type() === "warning") {
      consoleProblems.push(`${entry.type()}: ${entry.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleProblems.push(`pageerror: ${error.message}`));

  await page.goto("/");
  await expect(page).toHaveTitle("JV E1 Causal Spine");
  await expect(page.getByTestId("viewport").locator("canvas")).toBeVisible();
  await expect(page.getByTestId("state-label")).toHaveText("BUILD · Ready");
  await expect(page.getByTestId("inspector")).toHaveAttribute("data-open", "true");
  await page.screenshot({ path: join(tmpdir(), "jv-e1-build.png"), fullPage: false });

  const yInput = page.locator("[data-axis='y']");
  await yInput.fill("3.80");
  await yInput.press("Enter");
  await expect(page.getByTestId("metric")).toContainText("Revision 1 · 1 edit");

  await page.getByTestId("play").click();
  await expect(page.getByTestId("state-label")).toHaveText("PLAY · Deterministic cycle");
  const firstMetric = await page.getByTestId("metric").textContent();
  await page.waitForTimeout(650);
  const laterMetric = await page.getByTestId("metric").textContent();
  expect(laterMetric).not.toEqual(firstMetric);
  await page.screenshot({ path: join(tmpdir(), "jv-e1-play.png"), fullPage: false });

  await page.getByTestId("build").click();
  await expect(page.getByTestId("state-label")).toHaveText("BUILD · Ready");
  await expect(page.getByTestId("metric")).toContainText("Revision 1 · 1 edit");
  await expect(yInput).toHaveValue("3.80");

  await page.getByTestId("undo").click();
  await expect(page.getByTestId("metric")).toContainText("Revision 0 · 0 edits");
  await expect(yInput).toHaveValue("3.20");
  await page.screenshot({ path: join(tmpdir(), "jv-e1-build-recovered.png"), fullPage: false });

  expect(consoleProblems).toEqual([]);
});

test("the visible 3D transform gizmo commits one authored hardpoint edit", async ({ page }) => {
  await page.goto("/");
  const xInput = page.locator("[data-axis='x']");
  await expect(xInput).toHaveValue("-0.65");

  // The selected mount projects to (619, 245) in the fixed desktop viewport;
  // the red X handle extends to the right from that authored point.
  await page.mouse.move(686, 250);
  await page.mouse.down();
  await page.mouse.move(790, 250, { steps: 12 });
  await page.mouse.up();

  await expect(page.getByTestId("metric")).toContainText("Revision 1 · 1 edit");
  await expect(xInput).not.toHaveValue("-0.65");
});
