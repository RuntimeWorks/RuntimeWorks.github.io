import { defineConfig } from "@playwright/test";
// GATES_PORT lets several checkouts run the gates at the same time without fighting over one port.
const PORT = Number(process.env.GATES_PORT || 3120);
export default defineConfig({
  testDir: "tests",
  workers: 2,
  use: { baseURL: `http://127.0.0.1:${PORT}`, reducedMotion: "reduce" },
  webServer: { command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory ../..`, url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: false },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } },
});
