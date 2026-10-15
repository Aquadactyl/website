import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3012";
const report = JSON.parse(
  fs.readFileSync("public/benchmarks/runtime-summary.json", "utf8"),
);
const { aquadactyl: aqua, pterodactyl: ptero } = report.panels;
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const ms = (value) => `${value.toFixed(1)} ms`;
const mib = (value) => `${(value / 2 ** 20).toFixed(1)} MiB`;
const rps = (value) => `${value.toFixed(1)} req/s`;
try {
  await page.goto(base);
  const section = page.locator("#runtime-benchmarks");
  await section
    .getByRole("heading", { name: "Beyond the build." })
    .scrollIntoViewIfNeeded();
  const expectValues = async (values) => {
    for (const value of values)
      assert.ok(
        await section.getByText(value, { exact: true }).count(),
        `Missing measured value: ${value}`,
      );
  };
  await expectValues(
    [ptero, aqua].map((panel) =>
      ms(panel.browser.cold.dashboardReadyMs.median),
    ),
  );
  await section
    .getByLabel("Browser cache", { exact: true })
    .selectOption("warm");
  await section
    .getByLabel("Browser timing", { exact: true })
    .selectOption("lcpMs");
  await expectValues(
    [ptero, aqua].map((panel) => ms(panel.browser.warm.lcpMs.median)),
  );
  await section
    .getByRole("button", { name: "API throughput", exact: true })
    .click();
  await expectValues(
    [ptero, aqua].map((panel) =>
      rps(panel.api.servers["16"].requestsPerSecond.median),
    ),
  );
  await section
    .getByLabel("API concurrency", { exact: true })
    .selectOption("1");
  await section
    .getByLabel("API endpoint", { exact: true })
    .selectOption("account");
  await expectValues(
    [ptero, aqua].map((panel) =>
      rps(panel.api.account["1"].requestsPerSecond.median),
    ),
  );
  await section
    .getByRole("button", { name: "Memory use", exact: true })
    .click();
  await expectValues(
    [ptero, aqua].map((panel) =>
      mib(panel.memory.loaded.panelWorkingSetBytes.median),
    ),
  );
  await section
    .getByLabel("Memory workload", { exact: true })
    .selectOption("idle");
  await section
    .getByLabel("Memory scope", { exact: true })
    .selectOption("stackWorkingSetBytes");
  await expectValues(
    [ptero, aqua].map((panel) =>
      mib(panel.memory.idle.stackWorkingSetBytes.median),
    ),
  );
  assert.equal(
    await section
      .getByRole("button", { name: "Memory use", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  fs.mkdirSync("artifacts/runtime-benchmark", { recursive: true });
  await section.screenshot({
    path: "artifacts/runtime-benchmark/showcase-desktop.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await section
    .getByRole("button", { name: "Browser load", exact: true })
    .click();
  await section.screenshot({
    path: "artifacts/runtime-benchmark/showcase-mobile.png",
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "Horizontal page overflow at mobile width",
  );
  await section
    .getByRole("link", { name: "Runtime methodology & samples" })
    .click();
  await page.waitForURL("**/docs/panel/runtime-benchmarks");
  assert.ok(
    await page
      .getByRole("heading", {
        name: "Browser, API and memory benchmarks",
        exact: true,
      })
      .count(),
  );
  for (const path of [
    "/benchmarks/runtime.json",
    "/benchmarks/runtime-summary.json",
    "/docs/panel/benchmarks",
  ]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, path);
  }
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: cache/timing, API/concurrency, memory/state/scope controls, mobile overflow, methodology link and downloads.",
  );
} finally {
  await browser.close();
}
