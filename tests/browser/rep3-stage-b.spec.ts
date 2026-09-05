import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

mkdirSync("artifacts", { recursive: true });

function numberDataset(value: string | undefined, label: string): number {
  const parsed = Number(value);
  expect(Number.isFinite(parsed), `${label} should be finite, got ${String(value)}`).toBe(true);
  return parsed;
}

async function rootData(page: Page) {
  return page.locator("#app > .rep3-shell").evaluate((element) => ({ ...element.dataset }));
}

function pointDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function worldDistance(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

test("Rep3 Stage B exposes visible physical bearings, direct 3D translation, causal PLAY and exact BUILD recovery", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/?rep3");
  const root = page.locator("#app > .rep3-shell");
  const canvas = page.getByTestId("rep3-viewport");
  await expect(root).toHaveAttribute("data-mode", "BUILD");
  await expect(page.getByTestId("runtime-status")).toContainText("READY");
  await expect.poll(async () => Number((await rootData(page)).renderFrames ?? 0)).toBeGreaterThan(3);

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(900);
  expect(box!.height).toBeGreaterThan(500);

  const initial = await rootData(page);
  const mountAScreen = {
    x: numberDataset(initial.mountAScreenX, "mount A screen X"),
    y: numberDataset(initial.mountAScreenY, "mount A screen Y"),
  };
  const mountBScreen = {
    x: numberDataset(initial.mountBScreenX, "mount B screen X"),
    y: numberDataset(initial.mountBScreenY, "mount B screen Y"),
  };
  for (const [label, point] of [["A", mountAScreen], ["B", mountBScreen]] as const) {
    expect(point.x, `bearing ${label} should be visibly inside the viewport`).toBeGreaterThan(box!.x + 20);
    expect(point.x, `bearing ${label} should be visibly inside the viewport`).toBeLessThan(box!.x + box!.width - 20);
    expect(point.y, `bearing ${label} should be visibly inside the viewport`).toBeGreaterThan(box!.y + 20);
    expect(point.y, `bearing ${label} should be visibly inside the viewport`).toBeLessThan(box!.y + box!.height - 20);
  }
  expect(pointDistance(mountAScreen, mountBScreen)).toBeGreaterThan(100);

  // There must be no hidden conventional authored-axis control in this bounded UI.
  await expect(page.locator("input, select, textarea")).toHaveCount(0);
  await expect(page.getByText("DERIVED · not authored")).toBeVisible();
  await expect(page.getByText("steel line · inferred hinge relation")).toBeVisible();

  await page.screenshot({ path: "artifacts/rep3-stage-b-01-build.png", fullPage: true });

  // Select the actual visible bearing A through the canvas, not a privileged DOM control.
  await page.mouse.click(mountAScreen.x, mountAScreen.y);
  await expect(root).toHaveAttribute("data-selected-mount", "A");

  const selected = await rootData(page);
  const selectedScreen = {
    x: numberDataset(selected.selectedScreenX, "selected mount screen X"),
    y: numberDataset(selected.selectedScreenY, "selected mount screen Y"),
  };
  const gizmoX = {
    x: numberDataset(selected.gizmoXScreenX, "gizmo X screen X"),
    y: numberDataset(selected.gizmoXScreenY, "gizmo X screen Y"),
  };
  expect(pointDistance(selectedScreen, gizmoX)).toBeGreaterThan(15);

  const beforeDrag = {
    x: numberDataset(selected.mountAX, "mount A X before drag"),
    y: numberDataset(selected.mountAY, "mount A Y before drag"),
    z: numberDataset(selected.mountAZ, "mount A Z before drag"),
  };
  const screenDirectionLength = pointDistance(selectedScreen, gizmoX);
  const dragDirection = {
    x: (gizmoX.x - selectedScreen.x) / screenDirectionLength,
    y: (gizmoX.y - selectedScreen.y) / screenDirectionLength,
  };

  // Actual pointer drag on the visible world-X gizmo handle.
  await page.mouse.move(gizmoX.x, gizmoX.y);
  await page.mouse.down();
  await page.mouse.move(
    gizmoX.x + dragDirection.x * 85,
    gizmoX.y + dragDirection.y * 85,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect(root).toHaveAttribute("data-drag-axis", "none");

  const afterDragData = await rootData(page);
  const afterDrag = {
    x: numberDataset(afterDragData.mountAX, "mount A X after drag"),
    y: numberDataset(afterDragData.mountAY, "mount A Y after drag"),
    z: numberDataset(afterDragData.mountAZ, "mount A Z after drag"),
  };
  expect(Math.abs(afterDrag.x - beforeDrag.x)).toBeGreaterThan(0.05);
  expect(Math.abs(afterDrag.y - beforeDrag.y)).toBeLessThan(1e-8);
  expect(Math.abs(afterDrag.z - beforeDrag.z)).toBeLessThan(1e-8);
  await expect(page.getByTestId("runtime-status")).not.toContainText("DIAGNOSIS");

  await page.screenshot({ path: "artifacts/rep3-stage-b-02-edited.png", fullPage: true });

  // Camera control is a real rendered interaction, independent of bearing authority.
  const cameraBefore = {
    x: numberDataset(afterDragData.cameraX, "camera X before orbit"),
    y: numberDataset(afterDragData.cameraY, "camera Y before orbit"),
    z: numberDataset(afterDragData.cameraZ, "camera Z before orbit"),
  };
  const orbitStart = { x: box!.x + box!.width * 0.16, y: box!.y + box!.height * 0.72 };
  await page.mouse.move(orbitStart.x, orbitStart.y);
  await page.mouse.down();
  await page.mouse.move(orbitStart.x + 95, orbitStart.y - 45, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => {
    const data = await rootData(page);
    return worldDistance(cameraBefore, {
      x: numberDataset(data.cameraX, "camera X after orbit"),
      y: numberDataset(data.cameraY, "camera Y after orbit"),
      z: numberDataset(data.cameraZ, "camera Z after orbit"),
    });
  }).toBeGreaterThan(0.05);

  // Enter PLAY through the visible button. The app must solve a real Box3D endpoint path.
  await page.getByTestId("play").click();
  await expect.poll(async () => (await rootData(page)).playPathPoints).toBe("121");
  await expect.poll(async () => {
    const mode = (await rootData(page)).mode;
    return mode === "PLAYING" || mode === "PAUSED";
  }).toBe(true);
  await expect.poll(async () => (await rootData(page)).endpointX).not.toBeUndefined();

  const playStartData = await rootData(page);
  const endpointStart = {
    x: numberDataset(playStartData.endpointX, "endpoint X at play start"),
    y: numberDataset(playStartData.endpointY, "endpoint Y at play start"),
    z: numberDataset(playStartData.endpointZ, "endpoint Z at play start"),
  };
  await page.waitForTimeout(650);
  const playLaterData = await rootData(page);
  const endpointLater = {
    x: numberDataset(playLaterData.endpointX, "endpoint X during play"),
    y: numberDataset(playLaterData.endpointY, "endpoint Y during play"),
    z: numberDataset(playLaterData.endpointZ, "endpoint Z during play"),
  };
  expect(worldDistance(endpointStart, endpointLater)).toBeGreaterThan(0.015);
  await expect(page.getByTestId("runtime-status")).not.toContainText("DIAGNOSIS");

  await page.screenshot({ path: "artifacts/rep3-stage-b-03-play.png", fullPage: true });

  // BUILD must recover the exact authored bearing edit rather than accepting the PLAY pose as authority.
  await page.getByTestId("build").click();
  await expect(root).toHaveAttribute("data-mode", "BUILD");
  const recovered = await rootData(page);
  expect(numberDataset(recovered.mountAX, "recovered mount A X")).toBeCloseTo(afterDrag.x, 10);
  expect(numberDataset(recovered.mountAY, "recovered mount A Y")).toBeCloseTo(afterDrag.y, 10);
  expect(numberDataset(recovered.mountAZ, "recovered mount A Z")).toBeCloseTo(afterDrag.z, 10);

  // The other visible physical bearing is independently acquirable after the round trip.
  const recoveredB = {
    x: numberDataset(recovered.mountBScreenX, "recovered mount B screen X"),
    y: numberDataset(recovered.mountBScreenY, "recovered mount B screen Y"),
  };
  await page.mouse.click(recoveredB.x, recoveredB.y);
  await expect(root).toHaveAttribute("data-selected-mount", "B");
  await expect(page.getByTestId("selection")).toContainText("Bearing B selected");

  await page.screenshot({ path: "artifacts/rep3-stage-b-04-build-return.png", fullPage: true });

  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
