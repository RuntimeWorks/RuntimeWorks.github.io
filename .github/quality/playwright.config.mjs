import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  workers: 2,
  use: { baseURL: "http://127.0.0.1:3120", reducedMotion: "reduce" },
  webServer: { command: "python3 -m http.server 3120 --bind 127.0.0.1 --directory ../..", url: "http://127.0.0.1:3120/", reuseExistingServer: false },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } },
});
