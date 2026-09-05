import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "rep2-c1-causal-damper-correspondence.spec.ts",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: "test-results/rep2-c1",
  webServer: {
    command: `${JSON.stringify(process.execPath)} node_modules/vite/bin/vite.js --host 127.0.0.1 --port 41731 --strictPort`,
    url: "http://127.0.0.1:41731",
    // Fail closed on an occupied port so a stale server from another checkout
    // cannot satisfy this evidence run.
    reuseExistingServer: false,
    timeout: 30_000,
  },
  use: {
    baseURL: "http://127.0.0.1:41731",
    browserName: "chromium",
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
});
