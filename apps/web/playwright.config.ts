import { defineConfig, devices } from "@playwright/test";

const portValue = process.env.PLAYWRIGHT_PORT ?? "3100";
if (!/^\d{1,5}$/u.test(portValue) || Number(portValue) < 1024 || Number(portValue) > 65535) {
  throw new Error("PLAYWRIGHT_PORT must be a valid TCP port from 1024 through 65535.");
}
const baseURL = `http://127.0.0.1:${portValue}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "bun run build && bun run start",
    url: baseURL,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    env: { PLAYWRIGHT_NEXT_DIST_DIR: ".next-playwright", PORT: portValue },
    timeout: 120_000,
  },
});