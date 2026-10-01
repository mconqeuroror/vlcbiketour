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
    command: "npm run build && npx next start -H localhost -p 3100",
    port: 3100,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { SPAM_TIMETRAP_MIN_MS: "0", RESEND_API_KEY: "re_mock", RESEND_FROM_EMAIL: "test@example.invalid", OPERATOR_NOTIFY_EMAIL: "operator@example.invalid", STRIPE_SECRET_KEY: "sk_test_mock_local_only", STRIPE_WEBHOOK_SECRET: "whsec_mock_local_only" },
  },
});
