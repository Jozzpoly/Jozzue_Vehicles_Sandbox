import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "rep4-b2-direct-construction.spec.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: "test-results/rep4-b2",
  webServer: {
    command: `${JSON.stringify(process.execPath)} node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort`,
    url: "http://127.0.0.1:4173/?rep4b2",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
});
