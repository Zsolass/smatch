import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against `wrangler dev` (the real Worker + static export)
// with test-only settings: a mock email API, a test recipient and an admin token.
const PORT = 8788;
const MOCK_EMAIL_PORT = 8789;

export const E2E = {
  baseURL: `http://127.0.0.1:${PORT}`,
  mockEmail: `http://127.0.0.1:${MOCK_EMAIL_PORT}`,
  adminToken: "e2e-admin-token",
  notifyTo: "inquiries-test@example.com",
};

const vars = {
  RESEND_API_KEY: "e2e-test-key",
  RESEND_API_URL: E2E.mockEmail,
  INQUIRY_NOTIFY_TO: E2E.notifyTo,
  INQUIRY_NOTIFY_FROM: "labsite-test@example.com",
  ADMIN_TOKEN: E2E.adminToken,
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: E2E.baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      command: `node tests/e2e/mock-email-server.mjs`,
      url: `${E2E.mockEmail}/health`,
      env: { MOCK_EMAIL_PORT: String(MOCK_EMAIL_PORT) },
      reuseExistingServer: false,
    },
    {
      command: `npx wrangler dev --port ${PORT} --ip 127.0.0.1 --persist-to .wrangler/e2e-state ${Object.entries(vars)
        .map(([k, v]) => `--var ${k}:${v}`)
        .join(" ")}`,
      url: `${E2E.baseURL}/api/health`,
      timeout: 240_000,
      env: { WRANGLER_SEND_METRICS: "false" },
      reuseExistingServer: false,
    },
  ],
});
