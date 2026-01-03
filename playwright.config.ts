import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 3000",
        port: 3000,
        reuseExistingServer: false,
        env: {
          ...process.env,
          E2E_AUTH_BYPASS: "1",
          NEXTAUTH_URL: "http://localhost:3000",
        },
      },
});
