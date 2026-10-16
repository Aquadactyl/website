import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const hash = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const summary = read("public/benchmarks/comparison-summary.json");
const panel = read("public/benchmarks/panel-comparison.json");
const daemon = read("public/benchmarks/daemon-comparison.json");
assert.ok(panel.completedAt && daemon.completedAt);
assert.ok(
  Date.parse(daemon.completedAt) <= Date.parse(panel.startedAt) ||
    Date.parse(panel.completedAt) <= Date.parse(daemon.startedAt),
  "Measured workloads must not overlap.",
);
for (const id of ["panel", "daemon"])
  assert.equal(
    summary.sources[id].sha256,
    hash(`public/benchmarks/${id}-comparison.json`),
  );
assert.equal(
  hash("public/benchmarks/panel-comparison-runner.txt"),
  panel.harnessSha256,
);
assert.equal(
  hash("public/benchmarks/daemon-comparison-runner.txt"),
  daemon.harnessSha256,
);
assert.equal(
  hash("public/benchmarks/daemon-comparison-manta.patch"),
  daemon.source.manta.patchSha256,
);
assert.equal(
  hash("public/benchmarks/panel-comparison-aquadactyl.patch"),
  panel.panels.aquadactyl.sourcePatchSha256,
);
assert.equal(daemon.source.wings.release, "v1.13.4");
for (const game of ["paper", "bedrock"]) {
  const pair = daemon.games.filter((row) => row.game === game);
  assert.equal(pair.length, 2);
  for (const key of [
    "imageId",
    "cpuQuota",
    "cpuPeriod",
    "memoryLimit",
    "binarySha256",
  ])
    assert.equal(pair[0][key], pair[1][key]);
}
for (const variant of ["wings", "manta"]) {
  assert.match(daemon.source[variant].binarySha256, /^[a-f0-9]{64}$/);
  for (const phase of Object.values(daemon.phases)) {
    const metadata = phase.find(
      (row) => row.type === "metadata" && row.variant === variant,
    );
    assert.equal(metadata.image_id, daemon.source[variant].imageId);
    assert.equal(metadata.cpu_limit, 2);
    assert.equal(metadata.memory_limit, 2 ** 30);
    assert.equal(metadata.gomaxprocs, "2");
    assert.ok(!phase.some((row) => row.type === "fatal"));
  }
}
for (const test of ["api_status", "directory_1000"])
  for (const concurrency of [1, 16, 32])
    for (const variant of ["wings", "manta"]) {
      const rows = daemon.phases.performance.filter(
        (row) =>
          row.test === test &&
          row.concurrency === concurrency &&
          row.variant === variant,
      );
      assert.equal(rows.length, 3);
      assert.equal(new Set(rows.map((row) => row.round)).size, 3);
      for (const row of rows) {
        assert.equal(row.n, 400);
        assert.equal(row.errors, 0);
        assert.ok(row.requests_per_second > 0);
      }
    }
for (const row of daemon.phases.performance) {
  if (row.verified !== undefined) assert.equal(row.verified, true);
  if (row.expected_messages !== undefined)
    assert.equal(row.received_messages, row.expected_messages);
}
assert.equal(
  daemon.phases.security.filter((row) => row.type === "check").length,
  32,
);
assert.ok(
  !/"(?:password|authorization|token)"\s*:/i.test(
    JSON.stringify({ panel, daemon }),
  ),
);
const a = panel.panels.aquadactyl,
  p = panel.panels.pterodactyl;
assert.deepEqual(
  summary.comparisons.panel.metrics.map((m) => [m.baseline, m.candidate]),
  [
    [
      p.browser.cold.dashboardReadyMs.median,
      a.browser.cold.dashboardReadyMs.median,
    ],
    [
      p.api.servers[16].requestsPerSecond.median,
      a.api.servers[16].requestsPerSecond.median,
    ],
    [
      p.memory.loaded.panelWorkingSetBytes.median / 2 ** 20,
      a.memory.loaded.panelWorkingSetBytes.median / 2 ** 20,
    ],
  ],
);
const median = (values) => {
  const v = values.sort((a, b) => a - b);
  return v.length % 2
    ? v[(v.length - 1) / 2]
    : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};
for (const [index, variant] of ["wings", "manta"].entries()) {
  const key = index === 0 ? "baseline" : "candidate";
  const rows = daemon.phases.performance.filter(
    (row) => row.variant === variant && row.concurrency === 16,
  );
  assert.deepEqual(
    summary.comparisons.daemon.metrics.map((m) => m[key]),
    [
      median(
        rows
          .filter((row) => row.test === "api_status")
          .map((row) => row.requests_per_second),
      ),
      median(
        rows
          .filter((row) => row.test === "directory_1000")
          .map((row) => row.p50_ms),
      ),
      daemon.phases.resources.find(
        (row) =>
          row.variant === variant &&
          row.test === "resources_command_load" &&
          row.role === "daemon",
      ).mean_working_mib,
    ],
  );
}
for (const comparison of Object.values(summary.comparisons)) {
  assert.equal(comparison.metrics.length, 3);
  const doc = fs.readFileSync(
    `docs/${comparison.href.slice("/docs/".length)}.mdx`,
    "utf8",
  );
  for (const metric of comparison.metrics) {
    assert.ok(metric.baseline > 0 && metric.candidate > 0);
    const digits = comparison === summary.comparisons.daemon ? 3 : 1;
    for (const variant of ["baseline", "candidate"])
      assert.ok(
        doc.includes(metric[variant].toFixed(digits)),
        "Guide has stale values for " + metric.id,
      );
  }
}
console.log(
  "Verified both fresh comparisons, non-overlapping runs, source/runner hashes, 14,400 daemon API requests, transfer integrity and every homepage value.",
);
