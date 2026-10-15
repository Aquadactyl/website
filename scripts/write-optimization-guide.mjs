import fs from "node:fs";

const report = JSON.parse(
  fs.readFileSync("public/benchmarks/aquadactyl-optimization.json", "utf8"),
);
if (!report.completedAt)
  throw new Error("Optimization benchmark is still running.");
const { before, after } = report.panels;
const ms = (value) => `${value.toFixed(1)} ms`;
const mib = (value) => `${(value / 2 ** 20).toFixed(1)} MiB`;
const rps = (value) => `${value.toFixed(1)} req/s`;
const summary = {
  measuredOn: report.measuredOn,
  baseRevision: before.revision,
  patchSha256: after.patchSha256,
  metrics: [
    {
      id: "dashboard",
      label: "Cold dashboard ready",
      before: before.browser.cold.dashboardReadyMs.median,
      after: after.browser.cold.dashboardReadyMs.median,
      unit: "ms",
      lowerIsBetter: true,
    },
    {
      id: "servers",
      label: "50-server API · concurrency 16",
      before: before.api.servers["16"].requestsPerSecond.median,
      after: after.api.servers["16"].requestsPerSecond.median,
      unit: "req/s",
      lowerIsBetter: false,
    },
    {
      id: "memory",
      label: "Panel memory under API load",
      before: before.memory.loaded.panelWorkingSetBytes.median / 2 ** 20,
      after: after.memory.loaded.panelWorkingSetBytes.median / 2 ** 20,
      unit: "MiB",
      lowerIsBetter: true,
    },
  ],
};
fs.writeFileSync(
  "public/benchmarks/optimization-summary.json",
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
        `| ${cache} | ${label} | ${ms(before.browser[cache][key].median)} | ${ms(after.browser[cache][key].median)} | ${ms(before.browser[cache][key].p95)} | ${ms(after.browser[cache][key].p95)} |`,
    ),
  )
  .join("\n");
const apiRows = ["account", "servers"]
  .flatMap((endpoint) =>
    [1, 8, 16].map((concurrency) => {
      const b = before.api[endpoint][concurrency],
        a = after.api[endpoint][concurrency];
      return `| ${endpoint} | ${concurrency} | ${rps(b.requestsPerSecond.median)} | ${rps(a.requestsPerSecond.median)} | ${ms(b.p95LatencyMs.median)} | ${ms(a.p95LatencyMs.median)} |`;
    }),
  )
  .join("\n");
const memoryRows = ["idle", "loaded"]
  .map(
    (state) =>
      `| ${state} | ${mib(before.memory[state].panelWorkingSetBytes.median)} | ${mib(after.memory[state].panelWorkingSetBytes.median)} | ${mib(before.memory[state].stackWorkingSetBytes.median)} | ${mib(after.memory[state].stackWorkingSetBytes.median)} |`,
  )
  .join("\n");
const total = report.apiRuns.reduce((sum, run) => sum + run.successes, 0);
const failures = report.apiRuns.reduce(
  (sum, run) => sum + Object.values(run.errors).reduce((a, b) => a + b, 0),
  0,
);
const code = (text) => "\n```bash\n" + text + "\n```\n";
const doc = `---
title: Aquadactyl performance improvements
description: Before-and-after measurements for batched server-list queries, API-key usage updates and initial route loading.
---

Measured **${report.measuredOn}** using two Aquadactyl instances built from the same base commit [${before.revision.slice(0, 12)}](https://github.com/Aquadactyl/aquadactyl/tree/${before.revision}). The candidate contains an uncommitted performance patch, identified by file hashes in the raw report. These results describe that working patch, not a published release.

[Homepage results](/#optimization-benchmarks) · [Full samples](/benchmarks/aquadactyl-optimization.json) · [Performance patch](/benchmarks/aquadactyl-optimization.patch) · [Measured runner](/benchmarks/aquadactyl-optimization-runner.txt)

The earlier [Pterodactyl comparison](/docs/panel/runtime-benchmarks) remains a separate measurement of its pinned revisions. This experiment compares Aquadactyl before and after the changes; it does not combine measurements from different runs into a new Pterodactyl ranking.

## What changed

- The client server list batches eggs, allocations, pending transfers, subusers and variable definitions/overrides for the current page. It reuses the already loaded parent for allocation transformation. Server-specific variable values are matched by server ID and variable ID, with distinct model copies for servers sharing an egg. Hidden variables, allocation-note restrictions and other permission checks remain in place.
- API-key last-used timestamp saves validate the timestamp without rerunning unchanged key identity and foreign-key validation queries. Creation and changes to any other field retain full validation. Token lookup, expiry/revocation checks, authorization, rate limiting and timestamp persistence remain active.
- The entry point loads the requested auth, server or dashboard shell before mounting App, displaying the existing spinner while the chunk loads. The first shell then renders without going through an initial lazy/Suspense reveal. Other route chunks remain lazy, and load failures still reach the existing error boundary.

The changes do not replace real API responses with a frontend cache or omit normal response fields to improve timings. The font files and their language coverage are unchanged.

## Controlled setup

Both stacks use the same production Composer lockfile, PHP ${after.php}, four static FPM workers, OPcache settings, nginx gzip configuration, Redis driver and resource limits. Each panel has two CPU quota cores and 1 GiB memory. Each has a separate MariaDB and Redis instance with matching limits.

The dataset is one non-admin user with 50 owned suspended server records, one node, one egg and one allocation per server. No Wings or game servers are contacted by the measured endpoints. The original panel and Wings/Manta test stacks were not used by the tests.

The [runtime methodology](/docs/panel/runtime-benchmarks) defines the same collection procedure used here: ten cold/warm browser samples per variant, three alternating-order API repetitions per endpoint/concurrency, and 30 idle plus 30 loaded memory samples per variant. Warm-ups are discarded. Browser, API and memory phases run separately. Server caches stay warm, including during cold-browser loads.

## Browser timing

| Browser cache | Measurement | Before median | After median | Before p95 | After p95 |
| --- | --- | --- | --- | --- | --- |
${browserRows}

Dashboard ready is the custom milestone when all 50 server names exist in the DOM, observed by animation-frame polling. It is not a standardized Time to Interactive metric. FCP and LCP use browser performance entries; LCP is observed for two seconds after readiness. With ten samples, p95 is the maximum observed value. The same 1440×900 headless Chromium ${report.environment.browser} ran both variants without CPU or network throttling on localhost.

## Authenticated API throughput

| Endpoint | Concurrency | Before | After | Before p95 latency | After p95 latency |
| --- | --- | --- | --- | --- | --- |
${apiRows}

The account endpoint returns account details; the server-list endpoint returns all 50 server records and their normal relationships. Each 10-second closed-loop window uses persistent HTTP connections, with requests in flight drained before calculating throughput. API limits are set equally to 1,000,000/minute in these disposable stacks. Throughput and p95 columns are medians of three per-window values. All **${total.toLocaleString("en-GB")} measured responses** passed status and JSON checks, with **${failures} errors**.

The page-size/query regression test checks that SQL query count stays bounded as more servers are returned. The [diagnostic query profile](/benchmarks/optimization-query-profile.json) is collected separately from the timed HTTP tests and excludes application bootstrap queries; its CLI elapsed times are not used as browser or API throughput measurements.

## Memory

| State | Before panel | After panel | Before panel + DB + Redis | After panel + DB + Redis |
| --- | --- | --- | --- | --- |
${memoryRows}

Values are medians of 30 samples per state. Container working set is cgroup memory.current minus inactive_file. Loaded samples use the 50-server-list API at concurrency 16. The measured memory differences are modest; idle memory is essentially unchanged. Peak samples and raw usage/cache bytes are retained in the full report. This measures short-window steady-state use, not a memory leak or endurance test. Browser retained JavaScript heap after GC is also present in the report and is distinct from container memory and total browser RAM.

## Validation and provenance

The panel checks passed: **1,508 frontend tests with 100% statement, branch, function and line coverage**, **43 focused backend tests (286 assertions)**, TypeScript, frontend lint, scoped format checks, static analysis of the changed PHP files and the production Vite build. Backend regressions cover per-server variable overrides (including empty values), defaults, hidden values, restricted subusers, primary allocations, bounded query counts, API-key timestamp persistence and validation of key edits. The broader API/controller/startup tests passed alongside them.

The common PHP/OS image is ${report.environment.runtimeImageId}. Both source revisions and Composer lock hashes match. Each variant's image ID and frontend manifest hash, and all candidate file hashes, are in the report. Patch inventory SHA-256: **${after.patchSha256}**. The raw runner download is the exact source used for this measurement, identified by its SHA-256 in the report.

## Reproduce

Create two separate checkouts at the base commit above. Leave the first clean and apply the performance changes to the second. Install locked dependencies and build frontend assets in each checkout. From the website repository:
${code("git -C /path/to/patched-candidate apply /path/to/website/public/benchmarks/aquadactyl-optimization.patch\nnode scripts/prepare-optimization-benchmark.mjs /path/to/clean-baseline /path/to/patched-candidate")}
Use the temporary directory printed by that command as WORKDIR:
${code("docker compose -f WORKDIR/compose.json up -d --build --wait --wait-timeout 240\nnode scripts/benchmark-runtime.mjs WORKDIR public/benchmarks/aquadactyl-optimization.json\nnode scripts/write-optimization-guide.mjs\nnode scripts/verify-optimization-benchmark.mjs\ndocker compose -f WORKDIR/compose.json down --volumes")}

Use a host with Docker and the same common aquadactyl:test runtime image available; install Playwright Chromium as described in the runtime guide. Preparation archives the committed base and overlays only the candidate's changed files; its manifest records their hashes. Tests use separate disposable volumes and random local-only credentials. Run the optional query profiler after the timed benchmark, not during it.

## Limits

${report.methodology.limitations}

These observations establish improvements for the tested configuration and data. They do not establish universal production throughput or game performance. Optional features, larger variable/subuser datasets, addons, deployment settings and WAN/mobile conditions may change the outcome.
`;
fs.writeFileSync("docs/panel/optimization-benchmarks.mdx", doc);
console.log("Wrote the optimization guide and compact homepage summary.");
