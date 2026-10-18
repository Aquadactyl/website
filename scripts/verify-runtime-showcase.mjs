import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3012";
const report = JSON.parse(
  fs.readFileSync("public/benchmarks/comparison-summary.json", "utf8"),
);
const number = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
const formatValue = (value, unit) =>
  unit === "req/s" && value >= 1000
    ? `${(value / 1000).toFixed(1)}k`
    : number.format(value);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
fs.mkdirSync("artifacts/benchmark-showcase", { recursive: true });
try {
  await page.goto(base);
  const section = page.locator("#benchmarks");
  assert.equal(
    await section.count(),
    1,
    "There must be exactly one benchmark section.",
  );
  assert.equal(
    await section.locator("section").count(),
    0,
    "No nested benchmark sections.",
  );
  assert.equal(
    await page.locator("#runtime-benchmarks, #optimization-benchmarks").count(),
    0,
  );
  assert.equal(
    await section.getByRole("button").count(),
    Object.keys(report.comparisons).length,
  );
  assert.equal(await section.getByRole("heading").count(), 1);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [id, comparison] of Object.entries(report.comparisons)) {
      const button = section.getByRole("button", {
        name: comparison.label,
        exact: true,
      });
      await button.focus();
      await page.keyboard.press("Space");
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      assert.ok((await section.textContent()).includes(comparison.measuredOn));
      if (id === "panel")
        assert.equal(
          await section
            .getByRole("link", { name: "Build times & asset sizes" })
            .getAttribute("href"),
          "/docs/panel/benchmarks",
        );
      if (id === "panel-v2")
        assert.equal(
          await section
            .getByRole("link", { name: "Build times & asset sizes" })
            .getAttribute("href"),
          "/docs/panel/panel-v2-comparison#production-frontend-builds",
        );
      assert.equal(
        await section.locator('button[aria-pressed="true"]').count(),
        1,
      );
      assert.equal(await section.locator("tbody tr").count(), 3);
      for (const [index, metric] of comparison.metrics.entries()) {
        const row = section.locator("tbody tr").nth(index);
        assert.equal(await row.count(), 1);
        assert.ok(
          (await row.getByRole("rowheader").textContent()).includes(
            metric.label,
          ),
        );
        for (const variant of ["baseline", "candidate"]) {
          assert.ok(
            (await row.textContent()).includes(
              formatValue(metric[variant], metric.unit),
            ),
            "Missing measured value for " + metric.id + " " + variant,
          );
        }
        const change = (metric.candidate / metric.baseline - 1) * 100;
        assert.ok(
          (await row.textContent()).includes(
            Math.abs(change).toFixed(1) + "% " + (change < 0 ? "less" : "more"),
          ),
        );
      }
      const link = section.getByRole("link", {
        name: "Full results & methodology",
      });
      assert.equal(await link.getAttribute("href"), comparison.href);
      const bounds = await section.boundingBox();
      assert.ok(
        await section
          .locator("td")
          .evaluateAll((cells) =>
            cells.every((cell) => cell.scrollWidth <= cell.clientWidth + 1),
          ),
        "Clipped numeric table cell at " + width,
      );
      assert.ok(
        bounds.height <= (width < 640 ? 640 : 520),
        "Benchmark section is too tall at " + width + "px: " + bounds.height,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Horizontal overflow at " + width,
      );
      await section.scrollIntoViewIfNeeded();
      await section.screenshot({
        path: "artifacts/benchmark-showcase/" + id + "-" + width + ".png",
      });
    }
  }
  for (const comparison of Object.values(report.comparisons)) {
    const response = await page.goto(base + comparison.href);
    assert.equal(response.status(), 200);
    assert.ok(await page.getByRole("heading", { level: 1 }).count());
  }
  const buildGuide = await page.goto(base + "/docs/panel/benchmarks");
  assert.equal(buildGuide.status(), 200);
  assert.ok(await page.getByRole("heading", { level: 1 }).count());
  for (const path of [
    "/benchmarks/panel-comparison.json",
    "/benchmarks/panel-v2-comparison.json",
    "/benchmarks/panel-v2-comparison-aquadactyl.patch",
    "/benchmarks/panel-v2-builds.json",
    "/benchmarks/panel-v2-build-runner.txt",
    "/benchmarks/daemon-comparison.json",
    "/benchmarks/comparison-summary.json",
    "/benchmarks/panel-comparison-aquadactyl.patch",
    "/benchmarks/daemon-comparison-manta.patch",
    "/benchmarks/panels.json",
    "/benchmarks/build-logs.txt",
    "/benchmarks/panel-runtime-2026-10-16.json",
    "/benchmarks/panel-runtime-2026-10-16-provenance.json",
    "/benchmarks/panel-comparison-diagnostics.json",
    "/benchmarks/archive/2026-10-14/panels.json",
    "/benchmarks/archive/2026-10-15/panel-comparison.json",
  ]) {
    assert.equal((await fetch(base + path)).status, 200, path);
  }
  assert.deepEqual(errors, []);
  console.log(
    "Verified one compact section, three comparisons and all measured values; keyboard controls, method links and 1440/390/320px layouts pass.",
  );
} finally {
  await browser.close();
}
