import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const hash = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const summary = read("public/benchmarks/comparison-summary.json");
assert.equal(summary.schemaVersion, 2);
for (const source of Object.values(summary.sources))
  assert.equal(hash("public/benchmarks/" + source.file), source.sha256);
const p = read("public/benchmarks/" + summary.sources.panel.file),
  b = read("public/benchmarks/" + summary.sources.build.file),
  d = read("public/benchmarks/" + summary.sources.daemon.file);
const setup = read("public/benchmarks/" + summary.sources.setup.file);
assert.equal(setup.panelReportSha256, summary.sources.panel.sha256);
for (const files of [
  ...Object.values(setup.panels),
  setup.daemonRunnerFiles,
  setup.daemonSetupFiles,
])
  for (const file of files)
    assert.equal(
      createHash("sha256").update(file.content).digest("hex"),
      file.sha256,
    );
assert.equal(b.environment.cpuMax, "400000 100000");
assert.equal(b.environment.memoryMax, String(8 * 2 ** 30));
assert.equal(b.runs.filter((r) => r.warmup).length, 3);
const median = (values) => {
  const v = [...values].sort((a, b) => a - b);
  assert(v.length && v.every(Number.isFinite));
  return v.length % 2
    ? v[(v.length - 1) / 2]
    : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};
assert(b.completedAt < p.startedAt && p.completedAt < d.startedAt);
assert.equal(
  hash("public/benchmarks/" + p.measuredOn + "-panels-runner.txt"),
  p.harnessSha256,
);
assert.equal(
  hash("public/benchmarks/" + b.measuredOn + "-builds-runner.txt"),
  b.harnessSha256,
);
assert.equal(p.browserRuns.length, 60);
assert.equal(p.apiRuns.length, 54);
assert.equal(p.memoryRuns.length, 18);
for (const family of ["aquadactyl", "pterodactyl_v1", "pterodactyl_v2"]) {
  const panel = p.panels[family],
    build = b.panels[family];
  assert.equal(panel.revision, build.revision);
  assert.equal(panel.release, build.release);
  assert.equal(panel.patchFiles.length, 0);
  assert.equal(panel.php, p.panels.aquadactyl.php);
  assert.equal(
    panel.phpFpmConfigSha256,
    p.panels.aquadactyl.phpFpmConfigSha256,
  );
  assert.equal(panel.nginxConfigSha256, p.panels.aquadactyl.nginxConfigSha256);
  assert.equal(panel.resources.panel.nanoCpus, 2e9);
  assert.equal(panel.resources.panel.memoryBytes, 2 ** 30);
  assert.equal(build.buildMs.median, median(build.buildMs.samples));
  assert.equal(build.buildMs.samples.length, 5);
  for (const asset of build.assets)
    assert.equal(
      panel.frontendFiles.find((f) => f.file === asset.file)?.sha256,
      asset.sha256,
    );
  for (const cache of ["cold", "warm"]) {
    const rows = p.browserRuns.filter(
      (r) => r.family === family && r.cache === cache,
    );
    assert.equal(rows.length, 10);
    for (const r of rows) {
      assert(r.visibleServerRows > 0);
      assert(r.renderedServerRows === 50);
      assert(r.fcpMs > 0 && r.lcpMs > 0);
    }
    assert.equal(
      panel.browser[cache].dashboardReadyMs.median,
      median(rows.map((r) => r.dashboardReadyMs)),
    );
  }
  for (const endpoint of ["account", "servers"])
    for (const concurrency of [1, 8, 16]) {
      const rows = p.apiRuns.filter(
        (r) =>
          r.family === family &&
          r.endpoint === endpoint &&
          r.concurrency === concurrency,
      );
      assert.equal(rows.length, 3);
      for (const r of rows) {
        assert.equal(Object.keys(r.errors).length, 0);
        assert.equal(Object.keys(r.statuses).join(","), "200");
        assert.equal(r.successes, r.latencySamplesMs.length);
        assert.equal(r.requestsPerSecond, r.successes / (r.elapsedMs / 1000));
      }
      assert.equal(
        panel.api[endpoint][concurrency].requestsPerSecond.median,
        median(rows.map((r) => r.requestsPerSecond)),
      );
    }
  for (const state of ["idle", "loaded"]) {
    const samples = p.memoryRuns
      .filter((r) => r.family === family && r.state === state)
      .flatMap((r) => r.samples);
    assert.equal(samples.length, 30);
    assert.equal(
      panel.memory[state].panelWorkingSetBytes.median,
      median(samples.map((r) => r.panel.workingSetBytes)),
    );
    for (const r of samples)
      assert.equal(
        r.stackWorkingSetBytes,
        r.panel.workingSetBytes +
          r.database.workingSetBytes +
          r.redis.workingSetBytes,
      );
  }
}
for (const [id, family] of [
  ["panel", "pterodactyl_v1"],
  ["panel-v2", "pterodactyl_v2"],
])
  for (const [key, variant] of [
    ["baseline", family],
    ["candidate", "aquadactyl"],
  ]) {
    const panel = p.panels[variant];
    assert.deepEqual(
      summary.comparisons[id].metrics.map((m) => m[key]),
      [
        panel.browser.cold.dashboardReadyMs.median,
        panel.api.servers[16].requestsPerSecond.median,
        panel.memory.loaded.panelWorkingSetBytes.median / 2 ** 20,
      ],
    );
  }
assert.equal(
  d.phases.lifecycle.filter((r) => r.test === "lifecycle").length,
  16,
);
assert.equal(
  d.phases.events.filter(
    (r) =>
      r.test === "automatic_stats_16_viewers" &&
      r.pass &&
      r.last_uptime > r.first_uptime,
  ).length,
  64,
);
for (const phase of Object.values(d.phases)) {
  assert(!phase.some((r) => r.type === "fatal"));
  for (const row of phase) {
    if ("errors" in row) assert.equal(row.errors, 0);
    if ("verified" in row) assert.equal(row.verified, true);
    if ("expected_messages" in row)
      assert.equal(row.received_messages, row.expected_messages);
  }
}
for (const [key, v] of [
  ["baseline", "wings"],
  ["candidate", "manta"],
]) {
  for (const test of ["api_status", "directory_1000"])
    for (const c of [1, 16, 32]) {
      const rows = d.phases.performance.filter(
        (r) => r.variant === v && r.test === test && r.concurrency === c,
      );
      assert.equal(rows.length, 3);
      for (const r of rows) {
        assert(r.elapsed_seconds >= 5);
        assert.equal(r.n, r.successes);
        assert.equal(r.requests_per_second, r.successes / r.elapsed_seconds);
      }
    }
  const metric = (test, field) =>
    median(
      d.phases.performance
        .filter(
          (r) => r.variant === v && r.test === test && r.concurrency === 16,
        )
        .map((r) => r[field]),
    );
  const memory = d.phases.resources.find(
    (r) =>
      r.variant === v &&
      r.role === "daemon" &&
      r.test === "resources_command_load",
  );
  assert.equal(memory.samples_working_mib.length, 15);
  assert.equal(
    memory.mean_working_mib,
    memory.samples_working_mib.reduce((a, b) => a + b, 0) / 15,
  );
  assert.deepEqual(
    summary.comparisons.daemon.metrics.map((m) => m[key]),
    [
      metric("api_status", "requests_per_second"),
      metric("directory_1000", "p50_ms"),
      memory.mean_working_mib,
    ],
  );
  for (const phase of Object.values(d.phases)) {
    const m = phase.find((r) => r.type === "metadata" && r.variant === v);
    assert.equal(m.cpu_limit, 2);
    assert.equal(m.memory_limit, 2 ** 30);
    assert.equal(m.gomaxprocs, "2");
  }
}
for (const game of ["paper", "bedrock"]) {
  const rows = d.games.filter((r) => r.game === game);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].binarySha256, rows[1].binarySha256);
  assert.equal(rows[0].imageId, rows[1].imageId);
  assert.deepEqual(rows[0].effectiveLimits, rows[1].effectiveLimits);
  const normalize = (r) =>
    r.properties
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .sort()
      .join("\n")
      .replaceAll(String(r.port + 1), "<IPV6_PORT>")
      .replaceAll(String(r.port), "<PORT>");
  assert.equal(normalize(rows[0]), normalize(rows[1]));
  for (const row of rows)
    for (const line of row.properties.split(/\r?\n/)) {
      if (line.startsWith("#") || !line.includes("=")) continue;
      const at = line.indexOf("="),
        key = line.slice(0, at),
        value = line.slice(at + 1);
      if (/secret|password|token/i.test(key))
        assert.ok(
          !value || value === "<redacted>",
          "Generated game secret must be redacted.",
        );
    }
}
assert(
  !/"(?:password|token|authorization)"\s*:/i.test(JSON.stringify({ p, b, d })),
);
for (const comparison of Object.values(summary.comparisons)) {
  assert.equal(comparison.measuredOn, summary.measuredOn);
  assert.equal(comparison.metrics.length, 3);
  const doc = fs.readFileSync(
    "docs/" + comparison.href.slice("/docs/".length) + ".mdx",
    "utf8",
  );
  for (const m of comparison.metrics)
    for (const v of ["baseline", "candidate"]) {
      assert(m[v] > 0);
      assert(
        doc.includes(
          m[v].toFixed(comparison === summary.comparisons.daemon ? 3 : 1),
        ),
        "Stale guide value: " + comparison.label + " " + m.id,
      );
    }
}
console.log(
  "Verified all five releases, non-overlapping workloads, source/build hashes, 60 browser samples, 54 API windows, memory samples, daemon integrity and every homepage value.",
);
