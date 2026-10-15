import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const raw = JSON.parse(
  fs.readFileSync("public/benchmarks/runtime.json", "utf8"),
);
const chart = JSON.parse(
  fs.readFileSync("public/benchmarks/runtime-summary.json", "utf8"),
);
const build = JSON.parse(
  fs.readFileSync("public/benchmarks/panels.json", "utf8"),
);
const guide = fs.readFileSync("docs/panel/runtime-benchmarks.mdx", "utf8");
const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  assert.ok(n && sorted.every((value) => Number.isFinite(value) && value >= 0));
  return {
    median:
      n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2,
    p95: sorted[Math.ceil(n * 0.95) - 1],
    min: sorted[0],
    max: sorted.at(-1),
  };
};
assert.ok(raw.completedAt && raw.startedAt < raw.completedAt);
assert.equal(
  createHash("sha256")
    .update(fs.readFileSync("public/benchmarks/runtime-runner.txt"))
    .digest("hex"),
  raw.harnessSha256,
);
assert.equal(raw.browserRuns.length, 40);
assert.equal(raw.apiRuns.length, 36);
assert.equal(raw.memoryRuns.length, 12);
assert.equal(chart.measuredOn, raw.measuredOn);
for (const family of ["aquadactyl", "pterodactyl"]) {
  const panel = raw.panels[family];
  assert.equal(panel.revision, build.panels[family].revision);
  assert.equal(chart.panels[family].revision, panel.revision);
  assert.match(panel.composerLockSha256, /^[a-f0-9]{64}$/);
  assert.match(panel.imageId, /^sha256:[a-f0-9]{64}$/);
  for (const cache of ["cold", "warm"]) {
    const runs = raw.browserRuns.filter(
      (run) => run.family === family && run.cache === cache,
    );
    assert.equal(runs.length, 10);
    assert.equal(new Set(runs.map((run) => run.round)).size, 10);
    assert.deepEqual(
      chart.browserTransfers[family][cache],
      stats(runs.map((run) => run.resourceTransferBytes)),
    );
    for (const metric of [
      "ttfbMs",
      "domContentLoadedMs",
      "loadMs",
      "fcpMs",
      "lcpMs",
      "dashboardReadyMs",
      "heapUsedBytes",
    ]) {
      assert.deepEqual(
        panel.browser[cache][metric],
        stats(runs.map((run) => run[metric])),
      );
    }
  }
  for (const endpoint of ["account", "servers"])
    for (const concurrency of [1, 8, 16]) {
      const runs = raw.apiRuns.filter(
        (run) =>
          run.family === family &&
          run.endpoint === endpoint &&
          run.concurrency === concurrency,
      );
      assert.equal(runs.length, 3);
      const summary = panel.api[endpoint][concurrency];
      assert.deepEqual(
        summary.requestsPerSecond,
        stats(runs.map((run) => run.requestsPerSecond)),
      );
      assert.deepEqual(
        summary.medianLatencyMs,
        stats(runs.map((run) => run.latencyMs.median)),
      );
      assert.deepEqual(
        summary.p95LatencyMs,
        stats(runs.map((run) => run.latencyMs.p95)),
      );
      assert.equal(summary.errors, 0);
      assert.equal(
        summary.successes,
        runs.reduce((total, run) => total + run.successes, 0),
      );
      for (const run of runs) {
        assert.equal(run.latencySamplesMs.length, run.successes);
        assert.deepEqual(run.latencyMs, stats(run.latencySamplesMs));
        assert.ok(run.elapsedMs >= 10000 && run.elapsedMs < 25000);
        assert.equal(run.statuses["200"], run.successes);
        assert.equal(
          run.requestsPerSecond,
          run.successes / (run.elapsedMs / 1000),
        );
        assert.equal(Object.keys(run.errors).length, 0);
        assert.ok(run.responseBytes > 0);
      }
    }
  for (const state of ["idle", "loaded"]) {
    const runs = raw.memoryRuns.filter(
      (run) => run.family === family && run.state === state,
    );
    assert.equal(runs.length, 3);
    const samples = runs.flatMap((run) => run.samples);
    assert.equal(samples.length, 30);
    assert.deepEqual(
      panel.memory[state].panelWorkingSetBytes,
      stats(samples.map((sample) => sample.panel.workingSetBytes)),
    );
    assert.deepEqual(
      panel.memory[state].stackWorkingSetBytes,
      stats(samples.map((sample) => sample.stackWorkingSetBytes)),
    );
    for (const sample of samples) {
      for (const name of ["panel", "database", "redis"]) {
        assert.equal(
          sample[name].workingSetBytes,
          Math.max(0, sample[name].usageBytes - sample[name].inactiveFileBytes),
        );
      }
      assert.equal(
        sample.stackWorkingSetBytes,
        sample.panel.workingSetBytes +
          sample.database.workingSetBytes +
          sample.redis.workingSetBytes,
      );
    }
    for (const run of runs)
      assert.equal(state === "loaded", run.loadSuccesses > 0);
  }
  for (const key of ["browser", "api", "memory"])
    assert.deepEqual(chart.panels[family][key], panel[key]);
  assert.ok(guide.includes(panel.revision.slice(0, 12)));
  assert.ok(
    guide.includes(panel.browser.cold.dashboardReadyMs.median.toFixed(1)),
  );
  assert.ok(
    guide.includes(panel.api.servers["16"].requestsPerSecond.median.toFixed(1)),
  );
}
assert.ok(guide.includes(raw.measuredOn));
assert.ok(guide.includes("node scripts/benchmark-runtime.mjs WORKDIR"));
assert.ok(
  guide.includes("docker compose -f WORKDIR/compose.json down --volumes"),
);
for (const href of [
  "/benchmarks/runtime.json",
  "/benchmarks/runtime-summary.json",
])
  assert.ok(guide.includes(href));
console.log(
  "Verified 40 browser samples, 36 API windows and 120 memory samples; all chart summaries match the raw measurements.",
);
