import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const report = JSON.parse(
  fs.readFileSync("public/benchmarks/aquadactyl-optimization.json", "utf8"),
);
const chart = JSON.parse(
  fs.readFileSync("public/benchmarks/optimization-summary.json", "utf8"),
);
const profiles = JSON.parse(
  fs.readFileSync("public/benchmarks/optimization-query-profile.json", "utf8"),
);
const guide = fs.readFileSync("docs/panel/optimization-benchmarks.mdx", "utf8");
const stats = (values) => {
  const a = [...values].sort((a, b) => a - b),
    n = a.length;
  assert.ok(n && a.every((value) => Number.isFinite(value) && value >= 0));
  return {
    median: n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2,
    p95: a[Math.ceil(n * 0.95) - 1],
    min: a[0],
    max: a.at(-1),
  };
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
assert.ok(report.completedAt && report.startedAt < report.completedAt);
assert.equal(report.panels.before.revision, report.panels.after.revision);
assert.equal(
  report.panels.before.composerLockSha256,
  report.panels.after.composerLockSha256,
);
assert.equal(report.panels.before.patchFiles.length, 0);
assert.ok(report.panels.after.patchFiles.length > 0);
assert.equal(
  report.panels.after.patchSha256,
  hash(JSON.stringify(report.panels.after.patchFiles)),
);
assert.equal(
  report.harnessSha256,
  hash(fs.readFileSync("public/benchmarks/aquadactyl-optimization-runner.txt")),
);
assert.equal(report.browserRuns.length, 40);
assert.equal(report.apiRuns.length, 36);
assert.equal(report.memoryRuns.length, 12);
for (const family of ["before", "after"]) {
  const panel = report.panels[family];
  for (const cache of ["cold", "warm"]) {
    const runs = report.browserRuns.filter(
      (run) => run.family === family && run.cache === cache,
    );
    assert.equal(runs.length, 10);
    assert.equal(new Set(runs.map((run) => run.round)).size, 10);
    for (const metric of [
      "ttfbMs",
      "domContentLoadedMs",
      "loadMs",
      "fcpMs",
      "lcpMs",
      "dashboardReadyMs",
      "heapUsedBytes",
    ])
      assert.deepEqual(
        panel.browser[cache][metric],
        stats(runs.map((run) => run[metric])),
      );
  }
  for (const endpoint of ["account", "servers"])
    for (const concurrency of [1, 8, 16]) {
      const runs = report.apiRuns.filter(
        (run) =>
          run.family === family &&
          run.endpoint === endpoint &&
          run.concurrency === concurrency,
      );
      assert.equal(runs.length, 3);
      assert.deepEqual(
        panel.api[endpoint][concurrency].requestsPerSecond,
        stats(runs.map((run) => run.requestsPerSecond)),
      );
      assert.deepEqual(
        panel.api[endpoint][concurrency].p95LatencyMs,
        stats(runs.map((run) => run.latencyMs.p95)),
      );
      for (const run of runs) {
        assert.deepEqual(run.latencyMs, stats(run.latencySamplesMs));
        assert.equal(run.latencySamplesMs.length, run.successes);
        assert.equal(
          run.requestsPerSecond,
          run.successes / (run.elapsedMs / 1000),
        );
        assert.deepEqual(run.errors, {});
        assert.deepEqual(run.statuses, { 200: run.successes });
      }
    }
  for (const state of ["idle", "loaded"]) {
    const samples = report.memoryRuns
      .filter((run) => run.family === family && run.state === state)
      .flatMap((run) => run.samples);
    assert.equal(samples.length, 30);
    assert.deepEqual(
      panel.memory[state].panelWorkingSetBytes,
      stats(samples.map((run) => run.panel.workingSetBytes)),
    );
    assert.deepEqual(
      panel.memory[state].stackWorkingSetBytes,
      stats(samples.map((run) => run.stackWorkingSetBytes)),
    );
    for (const sample of samples)
      for (const part of ["panel", "database", "redis"])
        assert.equal(
          sample[part].workingSetBytes,
          Math.max(0, sample[part].usageBytes - sample[part].inactiveFileBytes),
        );
  }
  assert.equal(profiles[family].status, 200);
  assert.equal(
    profiles[family].count,
    Object.values(profiles[family].queries).reduce((a, b) => a + b, 0),
  );
}
assert.ok(profiles.after.count < profiles.before.count);
assert.equal(chart.baseRevision, report.panels.before.revision);
assert.equal(chart.patchSha256, report.panels.after.patchSha256);
for (const metric of chart.metrics) {
  const read = (panel) =>
    metric.id === "dashboard"
      ? panel.browser.cold.dashboardReadyMs.median
      : metric.id === "servers"
        ? panel.api.servers["16"].requestsPerSecond.median
        : panel.memory.loaded.panelWorkingSetBytes.median / 2 ** 20;
  assert.equal(metric.before, read(report.panels.before));
  assert.equal(metric.after, read(report.panels.after));
  assert.ok(
    guide.includes(metric.before.toFixed(1)) &&
      guide.includes(metric.after.toFixed(1)),
  );
}
if (process.argv[2])
  for (const file of report.panels.after.patchFiles)
    assert.equal(
      hash(fs.readFileSync(path.join(process.argv[2], file.file))),
      file.sha256,
      `Changed measured source: ${file.file}`,
    );
console.log(
  `Verified before/after provenance, 40 browser loads, 36 API windows, 120 memory samples, query profiles and homepage aggregates${process.argv[2] ? ", including measured source files" : ""}.`,
);
