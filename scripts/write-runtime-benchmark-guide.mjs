import fs from "node:fs";
import { execFileSync } from "node:child_process";

const stem = process.argv[2] || "runtime";
if (!/^[a-z-]+$/.test(stem)) throw new Error("Invalid benchmark filename.");
const guidePath = `docs/panel/${stem === "runtime" ? "runtime-benchmarks" : stem}.mdx`;
const report = JSON.parse(
  fs.readFileSync(`public/benchmarks/${stem}.json`, "utf8"),
);
if (!report.completedAt)
  throw new Error("Runtime benchmark has not completed.");
const { aquadactyl: aqua, pterodactyl: ptero } = report.panels;
const ms = (value) => `${value.toFixed(1)} ms`;
const mib = (value) => `${(value / 2 ** 20).toFixed(1)} MiB`;
const rps = (value) => `${value.toFixed(1)} req/s`;
const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return {
    median:
      n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2,
    p95: sorted[Math.ceil(n * 0.95) - 1],
    min: sorted[0],
    max: sorted.at(-1),
  };
};
const summary = {
  schemaVersion: report.schemaVersion,
  measuredOn: report.measuredOn,
  environment: {
    cpu: report.environment.hostCpu,
    browser: report.environment.browser,
    php: aqua.php,
  },
  panels: Object.fromEntries(
    Object.entries(report.panels).map(([family, panel]) => [
      family,
      {
        revision: panel.revision,
        ref: panel.ref,
        browser: panel.browser,
        api: panel.api,
        memory: panel.memory,
      },
    ]),
  ),
  browserTransfers: Object.fromEntries(
    ["aquadactyl", "pterodactyl"].map((family) => [
      family,
      Object.fromEntries(
        ["cold", "warm"].map((cache) => [
          cache,
          stats(
            report.browserRuns
              .filter((run) => run.family === family && run.cache === cache)
              .map((run) => run.resourceTransferBytes),
          ),
        ]),
      ),
    ]),
  ),
};
fs.writeFileSync(
  `public/benchmarks/${stem}-summary.json`,
  JSON.stringify(summary, null, 2) + "\n",
);
const browserRows = ["cold", "warm"]
  .flatMap((cache) =>
    [
      ["Dashboard ready", "dashboardReadyMs"],
      ["First contentful paint", "fcpMs"],
      ["Largest contentful paint", "lcpMs"],
      ["Window load event", "loadMs"],
      ["HTML time to first byte", "ttfbMs"],
    ].map(
      ([label, key]) =>
        `| ${cache} | ${label} | ${ms(ptero.browser[cache][key].median)} | ${ms(aqua.browser[cache][key].median)} | ${ms(ptero.browser[cache][key].p95)} | ${ms(aqua.browser[cache][key].p95)} |`,
    ),
  )
  .join("\n");
const apiRows = ["account", "servers"]
  .flatMap((endpoint) =>
    [1, 8, 16].map((concurrency) => {
      const a = aqua.api[endpoint][concurrency],
        p = ptero.api[endpoint][concurrency];
      return `| ${endpoint} | ${concurrency} | ${rps(p.requestsPerSecond.median)} | ${rps(a.requestsPerSecond.median)} | ${ms(p.p95LatencyMs.median)} | ${ms(a.p95LatencyMs.median)} | ${p.errors} / ${a.errors} |`;
    }),
  )
  .join("\n");
const memoryRows = ["idle", "loaded"]
  .map(
    (state) =>
      `| ${state} | ${mib(ptero.memory[state].panelWorkingSetBytes.median)} | ${mib(aqua.memory[state].panelWorkingSetBytes.median)} | ${mib(ptero.memory[state].panelWorkingSetBytes.max)} | ${mib(aqua.memory[state].panelWorkingSetBytes.max)} | ${mib(ptero.memory[state].stackWorkingSetBytes.median)} | ${mib(aqua.memory[state].stackWorkingSetBytes.median)} |`,
  )
  .join("\n");
const heapRows = ["cold", "warm"]
  .map(
    (cache) =>
      `| ${cache} | ${mib(ptero.browser[cache].heapUsedBytes.median)} | ${mib(aqua.browser[cache].heapUsedBytes.median)} |`,
  )
  .join("\n");
const transferRows = ["cold", "warm"]
  .map(
    (cache) =>
      `| ${cache} | ${(summary.browserTransfers.pterodactyl[cache].median / 1024).toFixed(1)} KiB | ${(summary.browserTransfers.aquadactyl[cache].median / 1024).toFixed(1)} KiB |`,
  )
  .join("\n");
const errors = report.apiRuns.reduce(
  (total, run) => total + Object.values(run.errors).reduce((a, b) => a + b, 0),
  0,
);
const successes = report.apiRuns.reduce(
  (total, run) => total + run.successes,
  0,
);
const blocked = [
  ...new Set(report.browserRuns.flatMap((run) => run.blockedExternal)),
];
const doc = `---
title: ${stem === "runtime" ? "Browser, API and memory benchmarks" : "Panel vs Pterodactyl benchmarks"}
description: Measured browser timing, authenticated API throughput and memory use from matching local Aquadactyl and Pterodactyl stacks.
---

Measured **${report.measuredOn}**. These runtime tests extend the separate [frontend build and asset comparison](/docs/panel/benchmarks). All values below come from running panels and a real headless browser.

[Homepage comparison](/#benchmarks) · [Raw samples](/benchmarks/${stem}.json) · [Summary](/benchmarks/${stem}-summary.json) · [Measured runner source](/benchmarks/${stem}-runner.txt)

## Scope and compared versions

| Panel | Source | PHP |
| --- | --- | --- |
| Pterodactyl ${ptero.ref} | [${ptero.revision.slice(0, 12)}](https://github.com/pterodactyl/panel/tree/${ptero.revision}) | ${ptero.php} |
| Aquadactyl | [${aqua.revision.slice(0, 12)}](https://github.com/Aquadactyl/aquadactyl/tree/${aqua.revision}) | ${aqua.php} |

${report.methodology.fixture}

${report.methodology.sharedConfiguration}

Both applications use their own locked production Composer dependencies and freshly built production frontend artifacts. ${aqua.sourcePatchSha256 ? `Aquadactyl includes the recorded local performance and SFTP compatibility changes on top of the linked base commit. [Download the exact source patch](/benchmarks/${stem}-aquadactyl.patch) (SHA-256: ${aqua.sourcePatchSha256}). The raw report records changed-file and frontend artifact hashes. These changes were included in both its frontend and backend; this is a comparison of the complete tested distributions.` : "No application source was patched."} Configuration, caches and fixture data were created only in disposable containers. The common runtime base was built from Aquadactyl's Dockerfile; both panels run from a separate /bench directory with their own vendor trees and the identical benchmark web-server configuration. The inherited /app tree is not served or loaded.

These controlled settings differ from default deployments: PHP-FPM is fixed at four workers, both panels use the native Redis driver, and API throttles are raised equally. Results compare these tested distributions and settings; they do not isolate a single code change or framework version.

## Browser load time

${report.methodology.browser}

**Cold** means cold browser HTTP cache, with a pre-existing authenticated session. It does not mean a cold PHP process, database or OS cache. **Warm** is the next full-page reload in that context, with HTTP caching available. This measures the dashboard, not login or a client-side route transition. Login is outside all timings.

The dashboard-ready milestone uses animation-frame polling until all 50 fixture server names exist in the DOM, so it includes data fetching and rendering but has roughly one-frame observation granularity. It is not a standardized Time to Interactive or a field Core Web Vitals result. LCP is the latest candidate observed during the two-second settling window, not an unlimited observation of later page activity.

Each distribution renders its own dashboard layout and normal response fields. LCP candidates can therefore be different elements, and these tests compare the whole shipped page rather than an identical UI rewritten with two libraries.

| Browser cache | Measurement | Pterodactyl median | Aquadactyl median | Pterodactyl p95 | Aquadactyl p95 |
| --- | --- | --- | --- | --- | --- |
${browserRows}

There are ten measured samples per panel/cache profile; with this small sample, p95 is the maximum sample. Each panel had one discarded cold/warm pair. No real users or physical mobile devices were measured.

External resource URLs blocked during the measured loads: ${blocked.length ? blocked.map((url) => "`" + url + "`").join(", ") : "**none were requested**"}.

### Resources transferred by the browser

| Browser cache | Pterodactyl median | Aquadactyl median |
| --- | --- | --- |
${transferRows}

This sums Resource Timing transferSize values observed by the end of each settling window, including fonts, styles, scripts and API responses, and excluding the main HTML navigation. Warm cache hits can report zero transfer bytes. These browser observations have a wider scope than the build benchmark's JavaScript/CSS-only gzip estimate. Aquadactyl's smaller script/style bundle does not imply less total page transfer or faster dashboard readiness.

The timing APIs follow [Navigation Timing](https://www.w3.org/TR/navigation-timing-2/), [Paint Timing](https://www.w3.org/TR/paint-timing/) and [Largest Contentful Paint](https://www.w3.org/TR/largest-contentful-paint/). Browser collection uses [Playwright CDP sessions](https://playwright.dev/docs/api/class-cdpsession).

## Authenticated API throughput

${report.methodology.api}

The **account** endpoint returns the fixture user's account; **servers** returns all 50 owned server records, including the panel's own server transformers and relationships. The server-list responses contain each distribution's normal fields, so response sizes differ. Neither endpoint contacts Wings. Results are endpoint-specific and do not describe file transfers, server power operations or every panel API.

Throughput is the median of three measured windows. Each p95 below is the median of the three per-window p95 values, not a percentile pooled across all requests. The raw report includes every successful request latency and all run durations, status counts and load-generator event-loop delays.

| Endpoint | Concurrent requests | Pterodactyl throughput | Aquadactyl throughput | Pterodactyl p95 | Aquadactyl p95 | Errors P / A |
| --- | --- | --- | --- | --- | --- | --- |
${apiRows}

Across the 36 measured API windows: **${successes.toLocaleString("en-GB")} successful responses**, **${errors} errors**. Warm-up and memory-load requests are additional and excluded from these totals. The default 256 requests/minute limiter was not being measured; raising its configured cap leaves the normal authentication, authorization and rate-limit middleware active.

## Memory use

${report.methodology.memory}

The panel container includes nginx, supervisor, the FPM master and its four PHP workers, plus one queue worker. The **stack** column additionally includes that panel's separate MariaDB and Redis containers. It excludes Docker Desktop/WSL overhead, the load generator, browser and unrelated game containers. Library and OPcache pages shared among workers are accounted at container level, rather than adding process RSS values and double-counting shared pages.

| State | Pterodactyl panel median | Aquadactyl panel median | Pterodactyl sampled panel peak | Aquadactyl sampled panel peak | Pterodactyl stack median | Aquadactyl stack median |
| --- | --- | --- | --- | --- | --- | --- |
${memoryRows}

Each state has 30 samples per panel across three windows. Loaded samples use the authenticated 50-server-list endpoint at concurrency 16. The Docker working-set calculation follows [Docker's documented cache subtraction](https://docs.docker.com/reference/cli/docker/container/stats/). These are short steady-state observations, not a leak or long-running capacity test.

Sampling pauses one second between collections; container-exec overhead adds to that interval. The raw report retains each sample timestamp. The helper shell and Docker sampling overhead are present for both panels.

### Browser JavaScript heap

| Browser cache | Pterodactyl retained JS heap | Aquadactyl retained JS heap |
| --- | --- | --- |
${heapRows}

This is the median CDP **JSHeapUsedSize after explicit garbage collection** from the same ten dashboard samples. It excludes DOM/native allocations, images, GPU memory and browser processes; it must not be described as total browser memory.

## Environment and limits

| Setting | Value |
| --- | --- |
| CPU | ${report.environment.hostCpu} (${report.environment.hostLogicalCpus} logical processors) |
| Host memory | ${report.environment.hostMemoryGiB} GiB, rounded |
| Host OS | ${report.environment.hostOs} |
| Docker engine | ${report.environment.docker} |
| Docker kernel | ${report.environment.dockerKernel} |
| Chromium | ${report.environment.browser} |
| Playwright | ${report.environment.playwright} |
| Load generator Node.js | ${report.environment.node} |
| Common runtime image | ${report.environment.runtimeImageId} |

${report.methodology.limitations}

Browser observations, API windows and memory windows ran in separate phases. Panels were tested sequentially within each phase, alternating which panel ran first by repetition. The measured panel stacks do not run game servers; existing unrelated containers were left untouched. Changing CPU quotas, PHP worker counts, dataset, caching, browser, network or optional features can change the outcome. Differences should be read per metric, without combining them into an overall performance score.

## Reproduce

Check out the exact source commits above. ${aqua.sourcePatchSha256 ? `Apply the linked patch to Aquadactyl with git apply, then include --include-working-tree when preparing the stacks.` : "Use clean source checkouts."} Install each panel's locked dependencies and run its production frontend build (Aquadactyl: pnpm build; Pterodactyl: yarn build:production) before preparing the stacks. The [historical build comparison](/docs/panel/benchmarks#reproduce) describes asset collection separately. Build Aquadactyl's runtime image first (the test reuses its PHP extensions and OS packages for **both** panels), then run these commands from the website repository:

FIRST_COMMANDS

The preparation script prints a temporary directory. Replace WORKDIR below with that path:

RUN_COMMANDS

The generated Compose file binds only to 127.0.0.1:8091 and :8092 and has its own network, volumes and random disposable credentials. Never point this harness at a production database. The raw public report omits credentials and sessions. Keep its Composer lock hashes, image IDs and individual samples with any published comparison. The headline chart imports only the smaller summary, not the per-request latency arrays.
`;
const firstCommands = [
  "docker build -t aquadactyl:test /path/to/aquadactyl-bench",
  "pnpm exec playwright install chromium",
  `node scripts/prepare-runtime-benchmark.mjs /path/to/aquadactyl-bench /path/to/pterodactyl-bench${aqua.sourcePatchSha256 ? " --include-working-tree" : ""}`,
].join("\n");
const runCommands = [
  "docker compose -f WORKDIR/compose.json up -d --build --wait --wait-timeout 240",
  `node scripts/benchmark-runtime.mjs WORKDIR public/benchmarks/${stem}.json`,
  ...(aqua.sourcePatchSha256
    ? [
        `node -e "require('fs').copyFileSync('WORKDIR/aquadactyl-source.patch', 'public/benchmarks/${stem}-aquadactyl.patch')"`,
      ]
    : []),
  `node scripts/write-runtime-benchmark-guide.mjs ${stem}`,
  `node scripts/verify-runtime-benchmark.mjs ${stem}`,
  "docker compose -f WORKDIR/compose.json down --volumes",
].join("\n");
// Place code fences after interpolation to keep the generated MDX readable.
const fence = (content) => "\n```bash\n" + content + "\n```\n";
const rendered = doc
  .replace("FIRST_COMMANDS", () => fence(firstCommands))
  .replace("RUN_COMMANDS", () => fence(runCommands));
fs.writeFileSync(guidePath, rendered);
execFileSync(
  process.execPath,
  [
    "node_modules/oxfmt/bin/oxfmt",
    "--write",
    guidePath,
    `public/benchmarks/${stem}-summary.json`,
  ],
  { stdio: "inherit", windowsHide: true },
);
console.log("Updated runtime guide and compact chart data.");
