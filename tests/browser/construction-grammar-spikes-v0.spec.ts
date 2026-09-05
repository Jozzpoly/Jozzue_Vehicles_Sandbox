import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

mkdirSync("artifacts", { recursive: true });

async function dataset(page: Page): Promise<DOMStringMap> {
  return page.evaluate(() => ({ ...(document.querySelector<HTMLElement>("#app")?.dataset ?? {}) }));
}

const n = (value: DOMStringMap, key: string): number => Number(value[key]);

async function socketPoint(page: Page, prefix: string): Promise<{ x: number; y: number }> {
  const data = await dataset(page);
  return { x: n(data, `${prefix}ScreenX`), y: n(data, `${prefix}ScreenY`) };
}

async function dragSocket(page: Page, from: string, to: string): Promise<void> {
  const a = await socketPoint(page, from);
  const b = await socketPoint(page, to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 });
  await page.mouse.up();
}

async function clickSocket(page: Page, prefix: string): Promise<void> {
  const point = await socketPoint(page, prefix);
  await page.mouse.click(point.x, point.y);
}

function relations(data: DOMStringMap): Array<{ id: string; kind: string; a: string; b: string }> {
  return JSON.parse(data.relations ?? "[]") as Array<{ id: string; kind: string; a: string; b: string }>;
}

test("Construction Grammar Spikes V0 supports topology creation, undo, reconnect and deletion in both interaction grammars", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/?grammar");
  const root = page.locator("#app");
  await expect(root).toHaveAttribute("data-donor-ready", "true");
  await expect(page.getByText(/NO PHYSICAL-CAUSALITY CLAIM/i)).toBeVisible();
  await expect.poll(async () => Number((await dataset(page)).renderFrames)).toBeGreaterThan(5);

  const canvas = page.getByTestId("grammar-canvas");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(1000);
  expect(box!.height).toBeGreaterThan(650);

  // Variant A — gesture-first connect-by-drag.
  await page.getByTestId("mode-drag").click();
  await page.getByTestId("clear").click();
  await expect(root).toHaveAttribute("data-relation-count", "0");
  await page.getByTestId("kind-link").click();
  await dragSocket(page, "cUpperFront", "hUpperFront");
  await expect(root).toHaveAttribute("data-relation-count", "1");
  let data = await dataset(page);
  expect(relations(data)[0]?.kind).toBe("link");
  expect(relations(data)[0]?.a).toBe("c-upper-front");
  expect(relations(data)[0]?.b).toBe("h-upper-front");
  expect(data.selectedRelation).not.toBe("none");

  await page.getByTestId("undo").click();
  await expect(root).toHaveAttribute("data-relation-count", "0");

  await page.getByTestId("kind-damper").click();
  await dragSocket(page, "cDamper", "hDamper");
  await expect(root).toHaveAttribute("data-relation-count", "1");
  data = await dataset(page);
  expect(relations(data)[0]?.kind).toBe("damper");

  await page.getByTestId("reconnect-b").click();
  await expect(root).toHaveAttribute("data-reconnect-endpoint", "b");
  await clickSocket(page, "hUpperRear");
  data = await dataset(page);
  expect(relations(data)[0]?.b).toBe("h-upper-rear");
  await page.screenshot({ path: "artifacts/grammar-v0-01-drag-mode.png", fullPage: true });

  await page.getByTestId("delete").click();
  await expect(root).toHaveAttribute("data-relation-count", "0");

  // Variant B — tool/component first, then endpoints.
  await page.getByTestId("mode-tool").click();
  await expect(root).toHaveAttribute("data-mode", "tool");
  await page.getByTestId("clear").click();
  await page.getByTestId("kind-link").click();
  await clickSocket(page, "cLowerRear");
  await expect(root).toHaveAttribute("data-pending-socket", "c-lower-rear");
  await clickSocket(page, "hUpperRear");
  await expect(root).toHaveAttribute("data-relation-count", "1");

  await page.getByTestId("kind-damper").click();
  await clickSocket(page, "cDamper");
  await clickSocket(page, "hDamper");
  await expect(root).toHaveAttribute("data-relation-count", "2");
  data = await dataset(page);
  expect(relations(data).some((relation) => relation.kind === "link")).toBe(true);
  expect(relations(data).some((relation) => relation.kind === "damper")).toBe(true);

  await page.screenshot({ path: "artifacts/grammar-v0-02-tool-mode.png", fullPage: true });

  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
