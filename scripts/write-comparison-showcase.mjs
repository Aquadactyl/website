// Derive the small homepage dataset and daemon guide from completed measurements.
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const panel = read("public/benchmarks/panel-comparison.json");
const daemon = read("public/benchmarks/daemon-comparison.json");
assert.ok(
  panel.completedAt && daemon.completedAt,
  "Both comparisons must finish before publication.",
);
const median = (values) => {
  assert.ok(values.length && values.every(Number.isFinite));
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
};
const values = (rows, predicate, key) =>
  Object.fromEntries(
    ["wings", "manta"].map((variant) => [
      variant,
      median(
        rows
          .filter((row) => row.variant === variant && predicate(row))
          .map((row) => row[key]),
      ),
    ]),
  );
const api = (test, concurrency, key) =>
  values(
    daemon.phases.performance,
    (row) => row.test === test && row.concurrency === concurrency,
    key,
  );
const memory = values(
  daemon.phases.resources,
  (row) => row.test === "resources_command_load" && row.role === "daemon",
  "mean_working_mib",
);
const a = panel.panels.aquadactyl;
const p = panel.panels.pterodactyl;
const status = api("api_status", 16, "requests_per_second");
const directory = api("directory_1000", 16, "p50_ms");
const summary = {
  schemaVersion: 1,
  measuredOn:
    panel.measuredOn === daemon.measuredOn
      ? panel.measuredOn
      : `${panel.measuredOn} / ${daemon.measuredOn}`,
  sources: Object.fromEntries(
    ["panel", "daemon", "build"].map((id) => [
      id,
      {
        file: id === "build" ? "panels.json" : `${id}-comparison.json`,
        sha256: createHash("sha256")
          .update(
            fs.readFileSync(
              `public/benchmarks/${id === "build" ? "panels" : id + "-comparison"}.json`,
            ),
          )
          .digest("hex"),
      },
    ]),
  ),
  comparisons: {
    panel: {
      label: "Panel vs Pterodactyl",
      measuredOn: panel.measuredOn,
      baseline: "Pterodactyl",
      candidate: "Aquadactyl",
      href: "/docs/panel/panel-comparison",
      description: "50-server dashboard · 2 CPU cores per panel.",
      metrics: [
        {
          id: "browser",
          label: "Browser load",
          context: "Cold-cache dashboard ready · median",
          unit: "ms",
          better: "lower",
          changeLabel: "time",
          baseline: p.browser.cold.dashboardReadyMs.median,
          candidate: a.browser.cold.dashboardReadyMs.median,
        },
        {
          id: "api",
          label: "API throughput",
          context: "50-server list · 16 concurrent requests",
          unit: "req/s",
          better: "higher",
          changeLabel: "throughput",
          baseline: p.api.servers[16].requestsPerSecond.median,
          candidate: a.api.servers[16].requestsPerSecond.median,
        },
        {
          id: "memory",
          label: "Memory use",
          context: "Panel container under API load · median",
          unit: "MiB",
          better: "lower",
          changeLabel: "memory",
          baseline: p.memory.loaded.panelWorkingSetBytes.median / 2 ** 20,
          candidate: a.memory.loaded.panelWorkingSetBytes.median / 2 ** 20,
        },
      ],
    },
    daemon: {
      label: "Wings vs Manta",
      measuredOn: daemon.measuredOn,
      baseline: "Wings",
      candidate: "Manta",
      href: "/docs/wings/benchmarks",
      description: "Paper + Bedrock · 2 CPU cores per daemon.",
      metrics: [
        {
          id: "api",
          label: "API throughput",
          context: "Server status · 16 concurrent requests",
          unit: "req/s",
          better: "higher",
          changeLabel: "throughput",
          baseline: status.wings,
          candidate: status.manta,
        },
        {
          id: "files",
          label: "File listing",
          context: "1,000 files · 16 concurrent requests · p50",
          unit: "ms",
          better: "lower",
          changeLabel: "time",
          baseline: directory.wings,
          candidate: directory.manta,
        },
        {
          id: "memory",
          label: "Memory use",
          context: "Daemon during game command load · mean",
          unit: "MiB",
          better: "lower",
          changeLabel: "memory",
          baseline: memory.wings,
          candidate: memory.manta,
        },
      ],
    },
  },
};
for (const comparison of Object.values(summary.comparisons))
  for (const metric of comparison.metrics) {
    assert.ok(metric.baseline > 0 && metric.candidate > 0);
  }
fs.writeFileSync(
  "public/benchmarks/comparison-summary.json",
  JSON.stringify(summary, null, 2) + "\n",
);

const format = (value) => value.toFixed(3);
const row = (label, v, unit) =>
  `| ${label} | ${format(v.wings)} ${unit} | ${format(v.manta)} ${unit} |`;
const apiRows = ["api_status", "directory_1000"]
  .flatMap((test) =>
    [1, 16, 32].map((concurrency) => {
      const name = test === "api_status" ? "Server status" : "List 1,000 files";
      return [
        row(
          `${name}, concurrency ${concurrency}: throughput`,
          api(test, concurrency, "requests_per_second"),
          "req/s",
        ),
        row(
          `${name}, concurrency ${concurrency}: p50`,
          api(test, concurrency, "p50_ms"),
          "ms",
        ),
        row(
          `${name}, concurrency ${concurrency}: p95`,
          api(test, concurrency, "p95_ms"),
          "ms",
        ),
      ].join("\n");
    }),
  )
  .join("\n");
const lifecycleRows = ["paper", "bedrock"]
  .flatMap((game) =>
    [
      ["start_ms", "warm startup"],
      ["stop_ms", "reported offline"],
    ].map(([key, label]) =>
      row(
        `${game}: ${label}`,
        values(
          daemon.phases.lifecycle,
          (r) => r.test === "lifecycle" && r.game === game && !r.cold,
          key,
        ),
        "ms",
      ),
    ),
  )
  .join("\n");
const resourceRows = ["idle", "command_load"]
  .flatMap((state) =>
    ["daemon", "paper", "bedrock"].map((role) =>
      row(
        `${role}: ${state} working memory`,
        values(
          daemon.phases.resources,
          (r) => r.test === `resources_${state}` && r.role === role,
          "mean_working_mib",
        ),
        "MiB",
      ),
    ),
  )
  .join("\n");
const fileRows = [
  ["http_write_16m", "HTTP write 16 MiB", "p50_ms"],
  ["http_read_16m", "HTTP read 16 MiB", "p50_ms"],
  ["sftp_write_16m", "SFTP write 16 MiB", "p50_ms"],
  ["sftp_read_16m", "SFTP read 16 MiB", "p50_ms"],
  ["chmod_1000", "Chmod 1,000 files", "duration_ms"],
  ["rename_1000", "Rename 1,000 files", "duration_ms"],
  ["archive_16m_1000_files", "Compress 16 MiB + 1,000 files", "compress_ms"],
  ["archive_16m_1000_files", "Extract archive", "extract_ms"],
  [
    "websocket_16_subscribers_100_lines",
    "Deliver 100 log lines to 16 subscribers",
    "p50_ms",
  ],
]
  .map(([test, label, key]) =>
    row(
      label,
      values(daemon.phases.performance, (r) => r.test === test, key),
      "ms",
    ),
  )
  .join("\n");
const metadata = Object.fromEntries(
  daemon.phases.performance
    .filter((r) => r.type === "metadata")
    .map((r) => [r.variant, r]),
);
const requests = daemon.phases.performance.filter((r) =>
  ["api_status", "directory_1000"].includes(r.test),
);
const checks = daemon.phases.security.filter((r) => r.type === "check");
const securityRows = [...new Set(checks.map((r) => r.test))]
  .map(
    (test) =>
      `| ${test} | ${["wings", "manta"]
        .map((variant) => {
          const check = checks.find(
            (r) => r.test === test && r.variant === variant,
          );
          assert.ok(check);
          return check.pass ? "Pass" : "Different behavior (see raw result)";
        })
        .join(" | ")} |`,
  )
  .join("\n");
const tableHeader = "| Measurement | Wings | Manta |\n| --- | ---: | ---: |";
const doc = `---
title: Wings vs Manta benchmarks
description: Fresh local measurements of stock Wings and the current Manta build, including API, file operations and memory use.
---

Measured **${daemon.measuredOn}**. This is a local comparison of **stock Wings ${daemon.source.wings.release}** and the recorded **Manta working-tree build**, with identical daemon CPU/memory limits. The homepage shows three fixed metrics; the tables here include the other measured workloads, including regressions.

[Homepage comparison](/#benchmarks) · [Full raw results](/benchmarks/daemon-comparison.json) · [Runner source](/benchmarks/daemon-comparison-runner.txt) · [Manta source patch](/benchmarks/daemon-comparison-manta.patch)

## Compared builds

| Setting | Wings | Manta |
| --- | --- | --- |
| Source | [Official ${daemon.source.wings.release} release](${daemon.source.wings.url}) | [Base commit ${daemon.source.manta.revision.slice(0, 12)}](https://github.com/Aquadactyl/manta/tree/${daemon.source.manta.revision}) plus linked local patch |
| Go compiler | ${metadata.wings.go_version} | ${metadata.manta.go_version} |
| CPU quota | ${metadata.wings.cpu_limit} cores | ${metadata.manta.cpu_limit} cores |
| Memory limit | ${metadata.wings.memory_limit / 2 ** 20} MiB | ${metadata.manta.memory_limit / 2 ** 20} MiB |
| GOMAXPROCS | ${metadata.wings.gomaxprocs} | ${metadata.manta.gomaxprocs} |

Both image IDs and daemon binary SHA-256 values are recorded in the raw report. Wings uses the official image with only a BusyBox probe added; its executable is unchanged. Manta was rebuilt from the local checkout before this run. ${metadata.wings.go_version === metadata.manta.go_version ? "Both executables use the same recorded Go compiler version. Source and dependency differences are part of the tested distributions" : "Compiler and dependency differences are part of the tested distributions"}; this does not isolate any one code optimization.

The dedicated benchmark nodes each manage one Paper and one Bedrock server with matching game images, binary hashes, resource limits, seed and startup settings. Existing unrelated user servers are excluded from the requests. These are **existing benchmark worlds**: the first start in this rerun is a cached restart, not first world creation. No player bots or authenticated players participated.

## API throughput and latency

Three repetitions alternate daemon order. Each endpoint/concurrency combination sends 400 authenticated HTTP requests using persistent connections at concurrency 1, 16 or 32. The client runs inside Docker on the shared local network, with a 4-core quota and 1 GiB memory limit. These short closed-loop batches report observed throughput, not sustained production capacity. Panel and daemon benchmark workloads ran separately.

Throughput is the median of three batch rates. The p50/p95 columns are medians of three per-batch percentiles, not pooled percentiles. Lower latency and higher throughput are preferable. ${requests.reduce((n, r) => n + r.n, 0).toLocaleString("en-GB")} timed API requests completed with **${requests.reduce((n, r) => n + r.errors, 0)} errors**.

${tableHeader}
${apiRows}

## Startup and shutdown

Three measured warm start/stop repetitions per game and daemon, after the first start of the run is discarded. Timers run from the power API request until the daemon reports running/offline, polled every 100 ms. Shutdown is the reported state transition, not a separately measured OS process exit.

${tableHeader}
${lifecycleRows}

## File and event operations

Three repetitions; transfers use five samples per repetition and a shared random 16 MiB payload. Read-back integrity checks happen outside transfer timers. SFTP authentication is outside the transfer timer and uses the same local Panel for both daemons. Archive round trips verify restored content. Rows show the median of per-run measurements.

${tableHeader}
${fileRows}

## Memory use

One approximately 30-second idle window and one approximately 30-second command-load window, with 15 Docker working-set samples per container per window. Values are arithmetic means of those samples, **not medians or process RSS**. Working set is container usage minus inactive file cache; the raw result retains sampled peaks and CPU observations. Daemon memory excludes its game containers, Panel, database, Redis and host overhead. No forced garbage collection occurs between workloads.

The command workload alternates a 4,096-block area between stone and air at five commands per second per game, using matching forced/ticking areas. Java/Bedrock status queries occur while the workload remains active; these are not player latency measurements.

${tableHeader}
${resourceRows}

## Compatibility checks

These checks report the harness's expected behavior and are separate from performance. A different result is not an overall security assessment. Exact statuses/events are in the raw report.

| Check | Wings | Manta |
| --- | --- | --- |
${securityRows}

## Reproduce and limits

Host: ${daemon.environment.cpu}; ${daemon.environment.memoryGiB} GiB RAM; ${daemon.environment.os}. Shared Windows/WSL2 Docker workstation, existing unrelated containers running, no CPU pinning, WAN/TLS emulation, real players or endurance load. Results depend on configuration, workload and the short observation windows. They cannot establish a universal speed-up or an overall performance score.

Use the exact source/image/binary hashes in the raw report. The linked Manta patch and measured runner source record the local changes. The existing dedicated stack and cached game installations were provisioned with the Manta repository's benchmarks/provision.php; its README documents the local node setup and manifest guards. It is not a fresh-machine deployment recipe. The full run starts/stops only those four benchmark servers and writes fixtures under their bench directories.

From the Manta checkout, with the dedicated stack prepared and matching CPU/memory overrides applied:

COMMANDS

Keep the private manifest out of published artifacts. The runner creates a temporary credential file and removes it after the run. Publish only the credential-free JSON outputs, source hashes and runner snapshot. From the website checkout, rebuild the homepage data after both comparisons finish with node scripts/write-comparison-showcase.mjs.
`;
const commands =
  "```powershell\n.\\benchmarks\\Run-Benchmark.ps1 -Phases lifecycle,performance,resources,security -OutputDirectory C:\\path\\to\\fresh-results\n```";
fs.writeFileSync(
  "docs/wings/benchmarks.mdx",
  doc.replace("COMMANDS", commands),
);
console.log("Updated the two compact comparisons and full daemon methodology.");
