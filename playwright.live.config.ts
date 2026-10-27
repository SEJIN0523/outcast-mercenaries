import { defineConfig } from "@playwright/test";

const gameUrl = process.env.GAME_URL;
if (!gameUrl || new URL(gameUrl).protocol !== "https:") {
  throw new Error("Set GAME_URL to the actual HTTPS URL returned by GitHub Pages.");
}

// Run the same full play / touch / offline checks against the published game.
// No local preview server and no changes to the site's remote data.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: gameUrl,
    browserName: "chromium",
    headless: true,
    viewport: { width: 1440, height: 1080 },
  },
  reporter: "list",
});
