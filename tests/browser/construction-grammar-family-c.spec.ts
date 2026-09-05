import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

mkdirSync("artifacts", { recursive: true });

async function dataset(page: Page): Promise<DOMStringMap> {
  return page.evaluate(() => ({ ...(document.querySelector<HTMLElement>("#app")?.dataset ?? {}) }));
}
const n = (data: DOMStringMap, key: string): number => Number(data[key]);
async function point(page: Page, prefix: string): Promise<{ x: number; y: number }> {
  const data = await dataset(page);
  return { x: n(data, `${prefix}ScreenX`), y: n(data, `${prefix}ScreenY`) };
}
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 5 });
  await page.mouse.up();
}
async function firstPart(page: Page): Promise<{ aSocket: string | null; bSocket: string | null }> {
  const data = await dataset(page);
  return JSON.parse(data.parts ?? "[]")[0] as { aSocket: string | null; bSocket: string | null };
}

test("Family C V2 takes a real damper as an object and supports attach, detach, reconnect, undo and delete", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/?grammarC");
  const root = page.locator("#app");
  await expect(root).toHaveAttribute("data-donor-ready", "true");
  await expect(page.getByText(/NO PHYSICS CLAIM/i)).toBeVisible();
  await page.screenshot({ path: "artifacts/grammar-family-c-00-rack-visible.png", fullPage: true });

  const rackDamper = await point(page, "rackDamper");
  await page.mouse.move(rackDamper.x, rackDamper.y);
  await page.mouse.down();
  await page.mouse.move(rackDamper.x - 150, rackDamper.y - 170, { steps: 5 });
  await page.mouse.up();
  await expect(root).toHaveAttribute("data-part-count", "1");
  await expect(root).not.toHaveAttribute("data-selected-part", "none");

  let a = await point(page, "selectedA");
  const chassisUpper = await point(page, "cUpper");
  await drag(page, a, chassisUpper);
  await expect.poll(async () => (await firstPart(page)).aSocket).toBe("c-upper");

  let b = await point(page, "selectedB");
  const hubLower = await point(page, "hLower");
  await drag(page, b, hubLower);
  await expect.poll(async () => (await firstPart(page)).bSocket).toBe("h-lower");
  await page.screenshot({ path: "artifacts/grammar-family-c-01-both-eyes-attached.png", fullPage: true });

  b = await point(page, "selectedB");
  const hubUpper = await point(page, "hUpper");
  await drag(page, b, hubUpper);
  await expect.poll(async () => (await firstPart(page)).bSocket).toBe("h-upper");

  a = await point(page, "selectedA");
  await drag(page, a, { x: a.x + 220, y: a.y + 135 });
  await expect.poll(async () => (await firstPart(page)).aSocket).toBeNull();
  await page.screenshot({ path: "artifacts/grammar-family-c-02-detached-eye.png", fullPage: true });

  await page.getByTestId("undo").click();
  await expect.poll(async () => (await firstPart(page)).aSocket).toBe("c-upper");
  await expect(root).not.toHaveAttribute("data-selected-part", "none");
  await expect(page.getByTestId("delete")).toBeEnabled();

  await page.getByTestId("delete").click();
  await expect(root).toHaveAttribute("data-part-count", "0");
  await page.getByTestId("undo").click();
  await expect(root).toHaveAttribute("data-part-count", "1");
  await expect(root).not.toHaveAttribute("data-selected-part", "none");

  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
