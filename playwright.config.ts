import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npx next start -p 3100",
    port: 3100,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { SPAM_TIMETRAP_MIN_MS: "0" },
  },
});
