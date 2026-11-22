// Publish validated, completed runs; never reads private credentials or configuration.
// node scripts/publish-benchmark-refresh.mjs <completed-output-directory>
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const input = path.resolve(process.argv[2]);
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const hash = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const panels = read(path.join(input, "panels.json")),
  builds = read(path.join(input, "builds.json")),
  daemon = read(path.join(input, "daemons.json"));
assert(
  panels.completedAt && builds.completedAt && daemon.completedAt,
  "Incomplete benchmarks must not be published.",
);
assert(
  builds.completedAt < panels.startedAt &&
    panels.completedAt < daemon.startedAt,
  "Measured workloads overlap.",
);
const date = panels.measuredOn;
assert.equal(builds.measuredOn, date);
assert.equal(daemon.measuredOn, date);
const families = ["aquadactyl", "pterodactyl_v1", "pterodactyl_v2"];
const releases = {
  aquadactyl: builds.panels.aquadactyl.release,
  pterodactyl_v1: "v1.15.2",
  pterodactyl_v2: "v2.0.0-beta.3",
};
const median = (values) => {
  const v = [...values].sort((a, b) => a - b);
  assert(v.length && v.every(Number.isFinite));
  return v.length % 2
    ? v[(v.length - 1) / 2]
    : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};
for (const k of families) {
  const p = panels.panels[k],
    b = builds.panels[k];
  assert.equal(p.release, releases[k]);
  assert.equal(b.release, releases[k]);
  assert.equal(p.revision, b.revision);
  assert.equal(p.patchFiles.length, 0);
  assert.match(p.php, /^8\.4\./);
  assert.equal(p.resources.panel.nanoCpus, 2e9);
  assert.equal(p.resources.panel.memoryBytes, 2 ** 30);
  const runs = builds.runs.filter((r) => r.family === k && !r.warmup);
  assert.equal(runs.length, 5);
  assert.deepEqual(
    b.buildMs.samples,
    runs.map((r) => r.elapsedMs),
  );
  assert.equal(b.buildMs.median, median(b.buildMs.samples));
  assert.equal(
    b.totalBytes,
    b.assets.reduce((n, x) => n + x.bytes, 0),
  );
  assert.equal(
    b.totalGzipBytes,
    b.assets.reduce((n, x) => n + x.gzipBytes, 0),
  );
  for (const a of b.assets)
    assert.equal(
      p.frontendFiles.find((f) => f.file === a.file)?.sha256,
      a.sha256,
      "Served production artifacts differ from the timed build.",
    );
  for (const cache of ["cold", "warm"])
    assert.equal(
      panels.browserRuns.filter((r) => r.family === k && r.cache === cache)
        .length,
      10,
    );
  for (const endpoint of ["account", "servers"])
    for (const concurrency of [1, 8, 16]) {
      const rows = panels.apiRuns.filter(
        (r) =>
          r.family === k &&
          r.endpoint === endpoint &&
          r.concurrency === concurrency,
      );
      assert.equal(rows.length, 3);
      for (const r of rows) {
        assert.equal(Object.keys(r.errors).length, 0);
        assert.equal(Object.keys(r.statuses).join(","), "200");
        assert(r.successes > 0);
      }
    }
  for (const state of ["idle", "loaded"])
    assert.equal(
      panels.memoryRuns
        .filter((r) => r.family === k && r.state === state)
        .flatMap((r) => r.samples).length,
      30,
    );
}
for (const phase of Object.values(daemon.phases))
  assert(!phase.some((r) => r.type === "fatal"));
assert.equal(
  daemon.phases.lifecycle.filter((r) => r.test === "lifecycle").length,
  16,
);
assert.equal(
  daemon.phases.events.filter(
    (r) =>
      r.test === "automatic_stats_16_viewers" &&
      r.pass === true &&
      r.last_uptime > r.first_uptime,
  ).length,
  64,
);
for (const v of ["manta", "wings"])
  for (const test of ["api_status", "directory_1000"])
    for (const c of [1, 16, 32]) {
      const rows = daemon.phases.performance.filter(
        (r) => r.variant === v && r.test === test && r.concurrency === c,
      );
      assert.equal(rows.length, 3);
      for (const r of rows) {
        assert.equal(r.errors, 0);
        assert(r.elapsed_seconds >= 5);
        assert.equal(r.successes, r.n);
        assert(r.requests_per_second > 0);
      }
    }
for (const r of daemon.phases.performance) {
  if ("verified" in r) assert.equal(r.verified, true);
  if ("expected_messages" in r)
    assert.equal(r.received_messages, r.expected_messages);
}
assert.match(
  releases.aquadactyl,
  /^v[0-9]+\.[0-9]+(?:\.[0-9]+)?(?:-[0-9A-Za-z.-]+)?$/,
);
assert.equal(daemon.source.manta.release, releases.aquadactyl);
assert.equal(daemon.source.wings.release, "v1.13.5");
assert(
  !/"(?:password|token|authorization)"\s*:/i.test(
    JSON.stringify({ panels, builds, daemon }),
  ),
  "Secret-bearing result rejected.",
);
const prefix = `${date}-`,
  dest = "public/benchmarks";
const artifacts = {
  panel: prefix + "panels.json",
  "panel-v2": prefix + "panels.json",
  daemon: prefix + "daemons.json",
  build: prefix + "builds.json",
  setup: prefix + "setup.json",
};
for (const [from, to] of [
  ["panels.json", artifacts.panel],
  ["builds.json", artifacts.build],
  ["daemons.json", artifacts.daemon],
  ["setup.json", artifacts.setup],
  ["panels-runner.txt", prefix + "panels-runner.txt"],
  ["builds-runner.txt", prefix + "builds-runner.txt"],
  ["build-logs.txt", prefix + "build-logs.txt"],
])
  fs.copyFileSync(path.join(input, from), path.join(dest, to));
const record = (file) => ({ file, sha256: hash(path.join(dest, file)) });
const summary = {
  schemaVersion: 2,
  measuredOn: date,
  sources: Object.fromEntries(
    Object.entries(artifacts).map(([k, v]) => [k, record(v)]),
  ),
  comparisons: {},
};
for (const [id, key, label] of [
  ["panel", "pterodactyl_v1", "Panel v1"],
  ["panel-v2", "pterodactyl_v2", "Panel v2 (beta)"],
]) {
  const a = panels.panels.aquadactyl,
    p = panels.panels[key];
  summary.comparisons[id] = {
    label,
    measuredOn: date,
    baseline: key === "pterodactyl_v1" ? "Panel v1.15.2" : "Panel v2 beta 3",
    candidate: `Aquadactyl ${releases.aquadactyl.slice(1).replaceAll("-", " ")}`,
    href:
      "/docs/panel/" +
      (id === "panel" ? "panel-comparison" : "panel-v2-comparison"),
    description: "50 server records · PHP 8.4 · 2 CPU cores per panel.",
    metrics: [
      {
        id: "browser",
        label: "Browser load",
        context: "First server row in viewport · cold browser cache · median",
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
  };
}
const daemonMetric = (v, test, field) =>
  median(
    daemon.phases.performance
      .filter((r) => r.variant === v && r.test === test && r.concurrency === 16)
      .map((r) => r[field]),
  );
const daemonMemory = (v) =>
  daemon.phases.resources.find(
    (r) =>
      r.variant === v &&
      r.test === "resources_command_load" &&
      r.role === "daemon",
  ).mean_working_mib;
summary.comparisons.daemon = {
  label: "Wings vs Manta",
  measuredOn: date,
  baseline: "Wings 1.13.5",
  candidate: `Manta ${daemon.source.manta.release.slice(1).replaceAll("-", " ")}`,
  href: "/docs/manta/benchmarks",
  description: "Paper + Bedrock · 2 CPU cores per daemon.",
  metrics: [
    {
      id: "api",
      label: "API throughput",
      context: "Server status · 16 concurrent requests · 5 s windows",
      unit: "req/s",
      better: "higher",
      changeLabel: "throughput",
      baseline: daemonMetric("wings", "api_status", "requests_per_second"),
      candidate: daemonMetric("manta", "api_status", "requests_per_second"),
    },
    {
      id: "files",
      label: "File listing",
      context: "1,000 files · 16 concurrent requests · p50",
      unit: "ms",
      better: "lower",
      changeLabel: "time",
      baseline: daemonMetric("wings", "directory_1000", "p50_ms"),
      candidate: daemonMetric("manta", "directory_1000", "p50_ms"),
    },
    {
      id: "memory",
      label: "Memory use",
      context: "Daemon during game command load · mean",
      unit: "MiB",
      better: "lower",
      changeLabel: "memory",
      baseline: daemonMemory("wings"),
      candidate: daemonMemory("manta"),
    },
  ],
};
fs.writeFileSync(
  path.join(dest, "comparison-summary.json"),
  JSON.stringify(summary, null, 2) + "\n",
);
const num = (n, d = 1) => n.toFixed(d),
  mib = (n) => num(n / 2 ** 20),
  table = (heads, rows) =>
    `| ${heads.join(" | ")} |\n| ${heads.map(() => "---").join(" | ")} |\n${rows.map((r) => "| " + r.join(" | ") + " |").join("\n")}\n`;
const names = {
  aquadactyl: `Aquadactyl ${releases.aquadactyl}`,
  pterodactyl_v1: "Pterodactyl v1.15.2",
  pterodactyl_v2: "Pterodactyl v2.0.0-beta.3",
};
const sourceTable = table(
  ["Panel", "Release source", "PHP"],
  families.map((k) => {
    const p = panels.panels[k];
    return [
      names[k],
      `[${p.revision.slice(0, 12)}](${p.repository}/tree/${p.revision})`,
      p.php,
    ];
  }),
);
const rawLinks = `[Raw samples](/benchmarks/${artifacts.panel}) · [Measured runner](/benchmarks/${prefix}panels-runner.txt) · [Final setup provenance](/benchmarks/${artifacts.setup})`;
for (const [id, key] of [
  ["panel", "pterodactyl_v1"],
  ["panel-v2", "pterodactyl_v2"],
]) {
  const pair = ["aquadactyl", key],
    a = panels.panels.aquadactyl,
    p = panels.panels[key];
  let doc = `---\ntitle: Aquadactyl vs ${key === "pterodactyl_v1" ? "Pterodactyl Panel v1" : "Pterodactyl Panel v2"} benchmarks\ndescription: Current tagged releases compared using matched browser, API, memory and frontend build workloads.\n---\n\nMeasured **${date}**. These tables select two products from one matched **three-panel run**; Aquadactyl's samples are shared by both comparison pages. They are fresh measurements of unmodified release tags, with each product's own locked dependencies and bundled features. No external addons were installed.\n\n${rawLinks}\n\n## Compared releases\n\n${sourceTable}\n${panels.methodology.fixture}\n\n${panels.methodology.sharedConfiguration}\n\nThe production assets served here are byte-for-byte the assets from the [new frontend build comparison](/docs/panel/benchmarks). Artifact hashes are checked before publication. Panel v2 keeps its bundled extension system enabled. This measures whole distributions under matched settings, not one isolated optimization or their default deployment presets.\n\n## Browser load time\n\n${panels.methodology.browser}\n\nThe milestone is the **first server-row link with a nonzero layout rectangle intersecting the viewport**. It does not wait for opacity animations, Time to Interactive or completion of all server status calls. All three releases rendered 50 fixture rows in these runs; the raw samples retain rendered and viewport-visible row counts. Cold browser cache does not mean cold PHP, database or operating-system caches.\n\n`;
  doc += table(
    ["Measurement", names[key], names.aquadactyl],
    ["cold", "warm"].flatMap((cache) =>
      [
        ["dashboardReadyMs", "First visible server row"],
        ["fcpMs", "First contentful paint"],
        ["lcpMs", "Largest contentful paint"],
        ["ttfbMs", "Time to first byte"],
        ["loadMs", "Window load"],
      ].map(([metric, label]) => [
        `${cache}: ${label} (ms, median)`,
        num(p.browser[cache][metric].median),
        num(a.browser[cache][metric].median),
      ]),
    ),
  );
  doc +=
    "\n" +
    table(
      ["Browser memory", names[key], names.aquadactyl],
      ["cold", "warm"].map((c) => [
        `${c}: JS heap after explicit GC (MiB, median)`,
        mib(p.browser[c].heapUsedBytes.median),
        mib(a.browser[c].heapUsedBytes.median),
      ]),
    );
  doc += `\n## Authenticated API\n\n${panels.methodology.api}\n\nEach row reports the median of three window rates and the median of three per-window p95 latencies. These are not pooled percentiles. Every measured request returned a valid successful response. The server-list fixture has 50 owned records without additional members and requests the default response; it does not measure explicit subuser includes or high-membership scenarios.\n\n`;
  doc += table(
    [
      "Endpoint / concurrency",
      `${names[key]} req/s`,
      `${names.aquadactyl} req/s`,
      `${names[key]} p95 ms`,
      `${names.aquadactyl} p95 ms`,
    ],
    ["account", "servers"].flatMap((endpoint) =>
      [1, 8, 16].map((c) => [
        `${endpoint} / ${c}`,
        num(p.api[endpoint][c].requestsPerSecond.median),
        num(a.api[endpoint][c].requestsPerSecond.median),
        num(p.api[endpoint][c].p95LatencyMs.median),
        num(a.api[endpoint][c].p95LatencyMs.median),
      ]),
    ),
  );
  doc +=
    `\n## Server memory\n\n${panels.methodology.memory}\n\n` +
    table(
      ["Working set (MiB, median)", names[key], names.aquadactyl],
      ["idle", "loaded"].flatMap((state) =>
        [
          ["panelWorkingSetBytes", "Panel only"],
          ["stackWorkingSetBytes", "Panel + database + Redis"],
        ].map(([metric, label]) => [
          `${state}: ${label}`,
          mib(p.memory[state][metric].median),
          mib(a.memory[state][metric].median),
        ]),
      ),
    );
  doc +=
    `\n## Production frontend builds\n\nBuild times and all-route asset sizes are measured separately with four CPU cores and 8 GiB. They are not browser download sizes. See the [three-panel build table and all five samples](/docs/panel/benchmarks).\n\n` +
    table(
      ["Product", "Median full production build (s)"],
      pair.map((k) => [
        names[k],
        num(builds.panels[k].buildMs.median / 1000, 3),
      ]),
    );
  doc += `\n## Limits and history\n\n${panels.methodology.limitations}\n\nThe host was ${panels.environment.hostCpu}, ${panels.environment.hostLogicalCpus} logical CPUs and ${panels.environment.hostMemoryGiB} GiB RAM, running Docker ${panels.environment.docker} on WSL2. Chromium ${panels.environment.browser}; Playwright ${panels.environment.playwright}. Source, runtime image, lockfile, configuration and asset hashes accompany the samples. No general production capacity claim is made.\n\nOctober's [Panel v1 data](/benchmarks/panel-comparison.json), [Panel v2 beta 2 data](/benchmarks/panel-v2-comparison.json) and [older runtime comparison](/docs/panel/runtime-benchmarks) remain available as historical evidence. Their versions, environments and readiness rules differ; do not treat changes between dates as a controlled optimization experiment.\n`;
  fs.writeFileSync(
    "docs/panel/" +
      (id === "panel" ? "panel-comparison" : "panel-v2-comparison") +
      ".mdx",
    doc,
  );
}
let buildDoc = `---\ntitle: Production frontend build benchmarks\ndescription: Five production builds of Aquadactyl, Pterodactyl Panel v1 and Panel v2, with all-route asset hashes and raw logs.\n---\n\nMeasured **${date}**, before the [live browser/API/memory comparison](/docs/panel/panel-comparison). The tested releases are Aquadactyl ${releases.aquadactyl}, Pterodactyl v1.15.2 and Pterodactyl v2.0.0-beta.3.\n\n[Raw samples and asset hashes](/benchmarks/${artifacts.build}) · [Full build logs](/benchmarks/${prefix}build-logs.txt) · [Exact measured runner](/benchmarks/${prefix}builds-runner.txt)\n\n## Source and commands\n\n`;
buildDoc += table(
  ["Product", "Exact source", "Production command", "Package manager"],
  families.map((k) => {
    const b = builds.panels[k];
    return [
      names[k],
      `[${b.revision.slice(0, 12)}](${b.repository}/tree/${b.revision})`,
      "`" + b.command + "`",
      b.packageManager,
    ];
  }),
);
buildDoc +=
  `\n## Build duration\n\n${builds.methodology}\n\n` +
  table(
    [
      "Product",
      "Median (s)",
      "Minimum (s)",
      "Maximum (s)",
      "Five measured samples (s)",
    ],
    families.map((k) => {
      const b = builds.panels[k].buildMs;
      return [
        names[k],
        num(b.median / 1000, 3),
        num(b.min / 1000, 3),
        num(b.max / 1000, 3),
        b.samples.map((x) => num(x / 1000, 3)).join(", "),
      ];
    }),
  );
buildDoc +=
  `\n## All-route JavaScript and CSS\n\nTotals include **all manifest-emitted JavaScript and CSS**, with per-file gzip level 6. They exclude fonts, images, maps and other public assets. Code splitting means a browser does not fetch every listed file for a dashboard visit; these totals are not an initial-page payload comparison.\n\n` +
  table(
    ["Product", "Files", "Uncompressed (KiB)", "Gzip (KiB)"],
    families.map((k) => {
      const b = builds.panels[k];
      return [
        names[k],
        b.assets.length,
        num(b.totalBytes / 1024),
        num(b.totalGzipBytes / 1024),
      ];
    }),
  );
buildDoc += `\n## Environment and reproduction\n\n${builds.environment.cpu}, ${builds.environment.logicalCpus} logical host CPUs, Linux/WSL2 Docker. The builder was restricted to four CPU cores and 8 GiB; Node ${builds.environment.node}. All three checkouts and dependency trees lived on the same Linux volume. Existing unrelated host services remained running; no CPU pinning or repeated clean-machine trials were performed. This is a warm repeated local build comparison, not dependency-install time or CI wall time.\n\nUse the [repository harness](https://github.com/Aquadactyl/website/tree/main/scripts/benchmark-builds.mjs) with a JSON configuration containing the three clean source roots, exact SHAs, release names, package-manager executable/arguments, lockfile names, asset directories and output directory. Install the locked dependencies before timing and run inside a four-CPU, 8 GiB Linux container. The measured runner download above preserves the exact code used for this run.\n\n[Historical October v1 results](/benchmarks/panels.json) and [October v2 build results](/benchmarks/panel-v2-builds.json) remain available. Their old bundler-only/dashboard-closure measurements use different scopes and must not be mixed with these full-command, all-route figures.\n`;
fs.writeFileSync("docs/panel/benchmarks.mdx", buildDoc);
const daemons = ["wings", "manta"];
const perfRows = (v, test, c) =>
  daemon.phases.performance.filter(
    (r) =>
      r.variant === v &&
      r.test === test &&
      (c === undefined || r.concurrency === c),
  );
const perfValue = (v, test, field, c) =>
  median(perfRows(v, test, c).map((r) => r[field]));
let daemonDoc = `---\ntitle: Wings vs Manta benchmarks\ndescription: Fresh current-release measurements of daemon APIs, file operations, game lifecycle and resource use.\n---\n\nMeasured **${date}**: **Manta ${daemon.source.manta.release}** versus **Wings v1.13.5**, compiled from unmodified release tags with Go 1.27.4 and matching build flags. Both use the same runtime image and resource limits. The homepage shows three fixed metrics; all measured workloads, including regressions, appear here.\n\n[Raw results](/benchmarks/${artifacts.daemon}) · [Exact setup and runner files](/benchmarks/${artifacts.setup}) · [Repository harness](https://github.com/Aquadactyl/website/tree/main/scripts/daemon-suite)\n\n## Sources and environment\n\n`;
daemonDoc += table(
  ["Setting", "Wings", "Manta"],
  [
    [
      "Release",
      ...daemons.map(
        (v) =>
          `[${daemon.source[v].release}](https://github.com/${v === "manta" ? "Aquadactyl/manta" : "pterodactyl/wings"}/releases/tag/${daemon.source[v].release})`,
      ),
    ],
    [
      "Exact source",
      ...daemons.map((v) => "`" + daemon.source[v].revision + "`"),
    ],
    [
      "Go compiler",
      ...daemons.map(
        (v) =>
          daemon.phases.performance.find(
            (r) => r.type === "metadata" && r.variant === v,
          ).go_version,
      ),
    ],
    ["Daemon CPU quota", "2 cores", "2 cores"],
    ["Daemon RAM limit", "1024 MiB", "1024 MiB"],
    ["GOMAXPROCS", "2", "2"],
    [
      "Native Panel backend",
      ...daemons.map(
        (v) =>
          daemon.source[v].panelBackend.family +
          " " +
          daemon.source[v].panelBackend.release,
      ),
    ],
  ],
);
daemonDoc += `\n${daemon.methodology.isolation}\n\nBoth executables are rebuilt from released source, rather than comparing a custom Manta binary to an upstream prebuilt Wings image. Binary and Go dependency hashes, runtime image IDs and effective game-container limits are recorded. The native backend pairing avoids changing stock Wings' zero-based bootstrap pagination. HTTP/file timings call the daemon directly; SFTP authentication and bootstrap are not part of transfer timers.\n\nThe host is ${daemon.environment.hostCpu}, ${daemon.environment.hostLogicalCpus} logical CPUs and ${daemon.environment.hostMemoryGiB} GiB RAM. The private engine is Docker ${daemon.engine.version}; the load generator has four CPU cores and 1 GiB RAM. Existing unrelated workstation containers remain running.\n\n## Matching game fixtures\n\nEach daemon manages one **Paper 26.3 build ${daemon.gameAssets.paper.id}** server and one **Bedrock 1.26.66.1** server. The same downloaded bytes and image digests are used on both sides. Paper has 1536 MiB configured memory and Bedrock 512 MiB; both have a 200% CPU limit. Effective cgroup memory includes the daemons' normal overhead allowance and is checked for parity. Both use the same seed and properties apart from assigned ports. No authenticated players or bots participated.\n\n${daemon.methodology.lifecycle}\n\n## API throughput and latency\n\n${daemon.methodology.api}\n\nThroughput is the median of three per-window rates. The p50/p95 columns are medians of the per-window percentiles, not pooled percentiles. The measured runner uses the lower middle order statistic for p50 and floor((n−1)×0.95) for p95. All ${daemon.phases.performance
  .filter((r) => ["api_status", "directory_1000"].includes(r.test))
  .reduce((n, r) => n + r.n, 0)
  .toLocaleString(
    "en-GB",
  )} measured API requests completed with **zero errors**. The directory size and running server state are checked outside each timed window.\n\n`;
daemonDoc += table(
  [
    "Endpoint / concurrency",
    "Wings req/s",
    "Manta req/s",
    "Wings p50 ms",
    "Manta p50 ms",
    "Wings p95 ms",
    "Manta p95 ms",
  ],
  ["api_status", "directory_1000"].flatMap((test) =>
    [1, 16, 32].map((c) => [
      `${test === "api_status" ? "Server status" : "List 1000 files"} / ${c}`,
      ...daemons.map((v) =>
        num(perfValue(v, test, "requests_per_second", c), 3),
      ),
      ...daemons.map((v) => num(perfValue(v, test, "p50_ms", c), 3)),
      ...daemons.map((v) => num(perfValue(v, test, "p95_ms", c), 3)),
    ]),
  ),
);
daemonDoc += `\n## Startup and shutdown\n\nThree measured warm repetitions after excluding the first start. Values are medians in milliseconds; 100 ms polling limits precision.\n\n`;
daemonDoc += table(
  ["Measurement", "Wings ms", "Manta ms"],
  ["paper", "bedrock"].flatMap((game) =>
    [
      ["start_ms", "warm startup"],
      ["stop_ms", "reported offline"],
    ].map(([field, label]) => [
      game + ": " + label,
      ...daemons.map((v) =>
        num(
          median(
            daemon.phases.lifecycle
              .filter(
                (r) =>
                  r.test === "lifecycle" &&
                  r.variant === v &&
                  r.game === game &&
                  !r.cold,
              )
              .map((r) => r[field]),
          ),
          3,
        ),
      ),
    ]),
  ),
);
daemonDoc += `\n## File and event operations\n\n${daemon.methodology.transfers}\n\nValues are medians of per-run measurements (milliseconds). Integrity checks occur outside transfer timers.\n\n`;
daemonDoc += table(
  ["Measurement", "Wings ms", "Manta ms"],
  [
    ...[
      "http_write_16m",
      "http_read_16m",
      "sftp_write_16m",
      "sftp_read_16m",
    ].map((test) => [
      test.replaceAll("_", " "),
      ...daemons.map((v) => num(perfValue(v, test, "p50_ms"), 3)),
    ]),
    ...["chmod_1000", "rename_1000"].map((test) => [
      test.replaceAll("_", " "),
      ...daemons.map((v) => num(perfValue(v, test, "duration_ms"), 3)),
    ]),
    ...[
      ["compress_ms", "Compress 16 MiB + 1000 files"],
      ["extract_ms", "Extract archive"],
    ].map(([field, label]) => [
      label,
      ...daemons.map((v) =>
        num(perfValue(v, "archive_16m_1000_files", field), 3),
      ),
    ]),
    [
      "Deliver 100 log lines to 16 subscribers",
      ...daemons.map((v) =>
        num(perfValue(v, "websocket_16_subscribers_100_lines", "p50_ms"), 3),
      ),
    ],
  ],
);
daemonDoc += `\nAll 64 automatic-stat viewer checks passed: 16 viewers for each of four game servers, with three unsolicited samples each and advancing uptime. This checks the observed stream, not unlimited concurrency or production reliability.\n\n## Memory and command load\n\n${daemon.methodology.resources}\n\nDaemon memory excludes game containers, Panel, database, Redis and host overhead. No forced daemon GC occurs between workloads. The command workload is synthetic and deliberately small; these figures are not a player-capacity benchmark.\n\n`;
daemonDoc += table(
  ["Mean working set (MiB)", "Wings", "Manta"],
  ["idle", "command_load"].flatMap((state) =>
    ["daemon", "paper", "bedrock"].map((role) => [
      state.replaceAll("_", " ") + ": " + role,
      ...daemons.map((v) =>
        num(
          daemon.phases.resources.find(
            (r) =>
              r.variant === v &&
              r.test === "resources_" + state &&
              r.role === role,
          ).mean_working_mib,
          3,
        ),
      ),
    ]),
  ),
);
daemonDoc +=
  "\n" +
  table(
    ["Local game query p50 (ms)", "Wings", "Manta"],
    ["idle", "command_load"].flatMap((state) =>
      ["paper", "bedrock"].map((game) => [
        state.replaceAll("_", " ") + ": " + game,
        ...daemons.map((v) =>
          num(
            daemon.phases.resources.find(
              (r) =>
                r.variant === v &&
                r.game === game &&
                r.test === "game_query_during_" + state,
            ).p50_ms,
            3,
          ),
        ),
      ]),
    ),
  );
daemonDoc += `\nEach game-query row contains 50 sequential local Java status or Bedrock UDP queries. These are server-query round trips, not gameplay latency. CPU core-seconds, sample arrays, observed peaks and Paper tick output are retained in the raw report.\n\n## Reproduction and limitations\n\nThe website repository contains the exact guarded [setup, provisioning and workload sources](https://github.com/Aquadactyl/website/tree/main/scripts/daemon-suite). Follow its README with clean tagged checkouts and fresh disposable databases. Game binaries are downloaded from their publishers and are not redistributed with the report. Private account passwords, node tokens and configuration files are excluded from public artifacts.\n\n${daemon.methodology.limitations}\n\n[November 2 results](/benchmarks/daemon-comparison.json), [its historical Manta source patch](/benchmarks/daemon-comparison-manta.patch), [coverage report](/benchmarks/daemon-coverage.json) and [microbenchmarks](/benchmarks/daemon-microbenchmarks.txt) remain available. Those security/coverage/microbenchmark runs were **not repeated** as part of this current-release performance comparison. Older 400-request API batches and existing worlds differ from this rerun; do not present differences across dates as a controlled optimization experiment.\n`;
const previousGuide = fs.readFileSync("docs/manta/benchmarks.mdx", "utf8");
const followup = previousGuide.indexOf(
  "## v1.3-beta directory-listing follow-up",
);
if (followup !== -1) daemonDoc += "\n" + previousGuide.slice(followup);
fs.writeFileSync("docs/manta/benchmarks.mdx", daemonDoc);
console.log(
  "Published validated measurements and guides for all five releases; homepage values are derived from the raw reports.",
);
