import { defineConfig } from "@playwright/test";

const e2ePort = Number(process.env.E2E_PORT ?? "3000");
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${e2ePort}`;
const shouldStartServer = process.env.E2E_SKIP_WEB_SERVER !== "1";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: shouldStartServer
    ? {
        command: `npm run dev -- --port ${e2ePort}`,
        port: e2ePort,
        reuseExistingServer: false,
        env: {
          ...process.env,
          E2E_AUTH_BYPASS: "1",
          NEXTAUTH_URL: baseURL,
        },
      }
    : undefined,
});
