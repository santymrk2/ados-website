import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: process.env.CI ? 60000 : 30000,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: process.env.CI
    ? undefined
      : {
          command: "bun dev",
          env: {
            ...process.env,
            ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
            VIEWER_PASSWORD: process.env.VIEWER_PASSWORD || "viewer123",
            AUTH_SECRET: process.env.AUTH_SECRET || "playwright-auth-secret",
            CRON_SECRET: process.env.CRON_SECRET || "playwright-cron-secret",
          },
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
      },
});
