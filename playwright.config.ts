import { defineConfig } from "@playwright/test";
import { resolvePagesBase } from "./scripts/pages-base";
const base = resolvePagesBase(
  process.env.GITHUB_REPOSITORY,
  process.env.PAGES_BASE_PATH,
);
export default defineConfig({
  timeout: 60000,
  testDir: "./e2e",
  fullyParallel: false,
  use: {
    baseURL: `http://127.0.0.1:4180${base}`,
    browserName: "chromium",
    headless: true,
    viewport: { width: 1440, height: 1080 },
  },
  webServer: {
    command: "npm run preview -- --port 4180 --strictPort",
    url: `http://127.0.0.1:4180${base}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  reporter: "list",
});
