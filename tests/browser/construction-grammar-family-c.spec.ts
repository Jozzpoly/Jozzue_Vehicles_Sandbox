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

test("Family C handles a real component as an object, then attaches, detaches and reconnects its eyes", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/?grammarC");
  const root = page.locator("#app");
  await expect(root).toHaveAttribute("data-donor-ready", "true");
  await expect(page.getByText(/NO PHYSICS CLAIM/i)).toBeVisible();

  const rackDamper = await point(page, "rackDamper");
  await page.mouse.move(rackDamper.x, rackDamper.y);
  await page.mouse.down();
  await page.mouse.move(rackDamper.x - 180, rackDamper.y - 160, { steps: 6 });
  await page.mouse.up();
  await expect(root).toHaveAttribute("data-component-count", "1");
  await expect(root).not.toHaveAttribute("data-selected-component", "none");

  let a = await point(page, "selectedA");
  const chassisUpper = await point(page, "cUpper");
  await drag(page, a, chassisUpper);
  await expect.poll(async () => JSON.parse((await dataset(page)).components ?? "[]")[0]?.aSocket).toBe("c-upper");

  let b = await point(page, "selectedB");
  const hubLower = await point(page, "hLower");
  await drag(page, b, hubLower);
  await expect.poll(async () => JSON.parse((await dataset(page)).components ?? "[]")[0]?.bSocket).toBe("h-lower");

  b = await point(page, "selectedB");
  const hubUpper = await point(page, "hUpper");
  await drag(page, b, hubUpper);
  await expect.poll(async () => JSON.parse((await dataset(page)).components ?? "[]")[0]?.bSocket).toBe("h-upper");

  a = await point(page, "selectedA");
  await drag(page, a, { x: a.x + 220, y: a.y + 130 });
  await expect.poll(async () => JSON.parse((await dataset(page)).components ?? "[]")[0]?.aSocket).toBeNull();

  await page.screenshot({ path: "artifacts/grammar-family-c-01-damper-in-hand.png", fullPage: true });

  await page.getByTestId("undo").click();
  await expect.poll(async () => JSON.parse((await dataset(page)).components ?? "[]")[0]?.aSocket).toBe("c-upper");

  await page.getByTestId("delete").click();
  await expect(root).toHaveAttribute("data-component-count", "0");

  const rackLink = await point(page, "rackLink");
  await page.mouse.move(rackLink.x, rackLink.y);
  await page.mouse.down();
  await page.mouse.move(rackLink.x - 120, rackLink.y - 120, { steps: 4 });
  await page.mouse.up();
  await expect(root).toHaveAttribute("data-component-count", "1");
  await page.screenshot({ path: "artifacts/grammar-family-c-02-link-in-hand.png", fullPage: true });

  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
