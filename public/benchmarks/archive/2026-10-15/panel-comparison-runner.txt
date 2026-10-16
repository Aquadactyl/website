// node scripts/benchmark-runtime.mjs <directory printed by prepare-runtime-benchmark.mjs>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { createHash } from "node:crypto";
import { monitorEventLoopDelay } from "node:perf_hooks";
import { chromium } from "playwright";

const work = path.resolve(process.argv[2] || "");
const manifest = JSON.parse(
  fs.readFileSync(path.join(work, "manifest.json"), "utf8"),
);
const exec = promisify(execFile);
const docker = (...args) =>
  execFileSync("docker", args, { encoding: "utf8", windowsHide: true }).trim();
const families = manifest.families ?? ["aquadactyl", "pterodactyl"];
const reportPath = process.argv[3] || "public/benchmarks/runtime.json";
const runnerPath = reportPath.replace(/\.json$/, "-runner.txt");
const summary = (values) => {
  assert.ok(values.length && values.every(Number.isFinite));
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
const credentials = Object.fromEntries(
  families.map((family) => [
    family,
    JSON.parse(
      docker(
        "exec",
        manifest.panels[family].container,
        "cat",
        "/bench/storage/benchmark-access.json",
      ),
    ),
  ]),
);
const report = {
  schemaVersion: 1,
  comparison: manifest.comparison ?? "Pterodactyl vs Aquadactyl",
  measuredOn: new Date().toISOString().slice(0, 10),
  startedAt: new Date().toISOString(),
  environment: {
    hostCpu: os.cpus()[0].model,
    hostLogicalCpus: os.cpus().length,
    hostMemoryGiB: Math.round(os.totalmem() / 2 ** 30),
    hostOs: `${os.platform()} ${os.release()} ${os.arch()}`,
    node: process.version,
    docker: docker("version", "--format", "{{.Server.Version}}"),
    dockerKernel: docker("info", "--format", "{{.KernelVersion}}"),
    runtimeImageId: manifest.runtimeImageId,
  },
  methodology: {
    fixture:
      "One non-admin user owning 50 suspended server records, one node, one nest, one egg, one allocation per server. No Wings calls or running game containers in the measured stacks.",
    sharedConfiguration:
      "PHP 8.5, four static FPM workers, OPcache 128 MiB, PHP memory_limit 256 MiB; nginx one worker with gzip level 6; config/route/view caches; one queue worker. Each panel 2 CPU quota cores/1 GiB; each MariaDB 1 core/512 MiB; each Redis 0.5 core/128 MiB. REDIS_CLIENT=phpredis on both. Production mode, debug and telemetry off, no extra addons.",
    browser:
      "Headless Chromium, 1440x900, deviceScaleFactor 1, no CPU or network throttling, localhost Docker port forwarding. One warm-up pair discarded; ten measured pairs per panel in alternating order. Cold uses a new context restored from an authenticated session; warm reloads the same page/context. Server/OS caches remain warm. Wait for all 50 server names, then 2 seconds to observe paints. Third-party requests are blocked identically to isolate the local panel; blocked URLs are recorded. FCP/LCP are navigation-to-paint; dashboardReady is measured when all server names exist in DOM, a custom application milestone. Heap is CDP JSHeapUsedSize after an explicit garbage collection; not total browser RAM.",
    api: "GET /api/client/account and GET /api/client?per_page=50, valid user API key, HTTP/1.1 persistent connections, uncompressed response bodies, concurrency 1/8/16; 10-second closed-loop windows, three repetitions with alternating panel order. Two-second warm-up before each run. No new requests after the window, in-flight requests drained and included in elapsed time. Validate every HTTP status and JSON result. Rate limits raised to 1,000,000/min on both disposable panels. Successes per actual elapsed second, not offered requests per second or a maximum capacity claim.",
    memory:
      "cgroup v2 memory.current minus inactive_file, clamped to zero (Docker-style working set). Separately retain raw usage bytes. Ten 1-second-spaced samples per window, three windows each after warm-up, idle and during concurrency-16 server-list load. Each sample records panel, database and Redis, and their sum. Peak is the maximum observed sample, not the kernel high-water mark. No application restarts or forced PHP GC between windows. Browser heap and server working set are different metrics.",
    limitations:
      "Single shared Windows/WSL2 workstation; existing unrelated game containers remain running. No CPU pinning, controlled network emulation, TLS, WAN latency, mobile device, endurance test or real-player load. This is a controlled local configuration comparison of pinned distributions, not their default deployment presets or proof of general production capacity.",
  },
  panels: {},
  apiRuns: [],
  browserRuns: [],
  memoryRuns: [],
};
for (const family of families) {
  const panel = manifest.panels[family];
  report.panels[family] = {
    ...panel,
    container: undefined,
    port: undefined,
    imageId: docker("inspect", panel.container, "--format", "{{.Image}}"),
    php: docker("exec", panel.container, "php", "-r", "echo PHP_VERSION;"),
    nginx: docker("exec", panel.container, "sh", "-c", "nginx -v 2>&1"),
  };
}
const save = () => {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
};
const endpoints = [
  {
    id: "account",
    path: "/api/client/account",
    valid: (body) =>
      body.object === "user" && body.attributes.username === "benchmark",
  },
  {
    id: "servers",
    path: "/api/client?per_page=50",
    valid: (body) =>
      body.object === "list" &&
      body.data.length === 50 &&
      body.meta.pagination.total === 50,
  },
];

async function load(family, endpoint, concurrency, durationMs) {
  const agent = new http.Agent({
    keepAlive: true,
    maxSockets: concurrency,
    maxFreeSockets: concurrency,
  });
  const latencies = [],
    statuses = {},
    errors = {};
  let successes = 0,
    responseBytes = 0;
  const loop = monitorEventLoopDelay({ resolution: 10 });
  loop.enable();
  const started = performance.now();
  const stopAt = started + durationMs;
  const request = () =>
    new Promise((resolve) => {
      const start = performance.now();
      const req = http.get(
        `http://127.0.0.1:${manifest.panels[family].port}${endpoint.path}`,
        {
          agent,
          headers: {
            Authorization: `Bearer ${credentials[family].token}`,
            Accept: "application/json",
            "Accept-Encoding": "identity",
          },
          timeout: 10000,
        },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const elapsed = performance.now() - start;
            statuses[res.statusCode] = (statuses[res.statusCode] || 0) + 1;
            try {
              const bytes = Buffer.concat(chunks);
              assert.equal(res.statusCode, 200);
              assert.ok(endpoint.valid(JSON.parse(bytes.toString("utf8"))));
              successes++;
              responseBytes += bytes.length;
              latencies.push(elapsed);
            } catch {
              errors.invalidResponse = (errors.invalidResponse || 0) + 1;
            }
            resolve();
          });
          res.on("error", (error) => {
            errors[error.code || "responseError"] =
              (errors[error.code || "responseError"] || 0) + 1;
            resolve();
          });
        },
      );
      req.on("timeout", () => req.destroy(new Error("Request timeout")));
      req.on("error", (error) => {
        errors[error.code || error.message] =
          (errors[error.code || error.message] || 0) + 1;
        resolve();
      });
    });
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (performance.now() < stopAt) await request();
    }),
  );
  const elapsedMs = performance.now() - started;
  loop.disable();
  agent.destroy();
  assert.ok(
    successes > 0,
    `${family} ${endpoint.id}: no successful responses; ${JSON.stringify({ statuses, errors })}`,
  );
  assert.equal(
    Object.values(errors).reduce((a, b) => a + b, 0),
    0,
    `${family}: request errors`,
  );
  return {
    elapsedMs,
    successes,
    statuses,
    errors,
    responseBytes,
    requestsPerSecond: successes / (elapsedMs / 1000),
    latencyMs: summary(latencies),
    latencySamplesMs: latencies,
    clientEventLoopDelayMs: { mean: loop.mean / 1e6, max: loop.max / 1e6 },
  };
}

// Browser phase precedes load tests so heap/paint sampling does not contend with them.
const browser = await chromium.launch({ headless: true });
report.environment.browser = browser.version();
report.environment.playwright = JSON.parse(
  fs.readFileSync("node_modules/playwright/package.json"),
).version;
const states = {};
const names = Array.from(
  { length: 50 },
  (_, i) => `Benchmark Server ${String(i + 1).padStart(2, "0")}`,
);
try {
  for (const family of families) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "en-GB",
    });
    const page = await context.newPage();
    await page.goto(
      `http://127.0.0.1:${manifest.panels[family].port}/auth/login`,
    );
    await page
      .locator('input[name="username"]')
      .fill(credentials[family].username);
    await page
      .locator('input[name="password"]')
      .fill(credentials[family].password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname === "/", { timeout: 30000 });
    await page.waitForFunction(
      (names) =>
        names.every((name) => document.body.textContent.includes(name)),
      names,
      { timeout: 30000 },
    );
    states[family] = await context.storageState();
    await context.close();
  }
  for (let round = -1; round < 10; round++) {
    for (const family of round % 2 === 0 ? families : [...families].reverse()) {
      const context = await browser.newContext({
        storageState: states[family],
        viewport: { width: 1440, height: 900 },
        locale: "en-GB",
        deviceScaleFactor: 1,
      });
      const base = `http://127.0.0.1:${manifest.panels[family].port}`;
      const blocked = new Set(),
        failures = [],
        pageErrors = [];
      // Context routing disables HTTP cache; use CDP interception only for external origins.
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Performance.enable");
      await cdp.send("Network.enable");
      await cdp.send("Network.setBlockedURLs", {
        urls: ["https://*", "http://fonts.*", "http://www.*"],
      });
      page.on("requestfailed", (request) => {
        if (new URL(request.url()).origin !== base)
          blocked.add(request.url().split("?")[0]);
        else
          failures.push({
            path: new URL(request.url()).pathname,
            error: request.failure()?.errorText,
          });
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.addInitScript(() => {
        window.__benchmarkLcp = null;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            window.__benchmarkLcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      for (const cache of ["cold", "warm"]) {
        if (cache === "cold")
          await page.goto(base, { waitUntil: "domcontentloaded" });
        else await page.reload({ waitUntil: "domcontentloaded" });
        const ready = await page.waitForFunction(
          (names) => {
            if (names.every((name) => document.body.textContent.includes(name)))
              return performance.now();
            return false;
          },
          names,
          { timeout: 30000, polling: "raf" },
        );
        const dashboardReadyMs = await ready.jsonValue();
        await page.waitForLoadState("load");
        await delay(2000);
        const timing = await page.evaluate(() => {
          const nav = performance.getEntriesByType("navigation")[0];
          return {
            ttfbMs: nav.responseStart - nav.startTime,
            domContentLoadedMs: nav.domContentLoadedEventEnd,
            loadMs: nav.loadEventEnd,
            fcpMs: performance.getEntriesByName("first-contentful-paint")[0]
              ?.startTime,
            lcpMs: window.__benchmarkLcp,
            resourceTransferBytes: performance
              .getEntriesByType("resource")
              .reduce((total, resource) => total + resource.transferSize, 0),
          };
        });
        await cdp.send("HeapProfiler.collectGarbage");
        const { metrics } = await cdp.send("Performance.getMetrics");
        const heapUsedBytes = metrics.find(
          (metric) => metric.name === "JSHeapUsedSize",
        ).value;
        assert.ok(timing.fcpMs > 0 && timing.lcpMs > 0 && timing.loadMs > 0);
        assert.deepEqual(
          failures,
          [],
          `${family}: local resource requests failed`,
        );
        assert.deepEqual(pageErrors, [], `${family}: browser errors`);
        if (round >= 0)
          report.browserRuns.push({
            family,
            round: round + 1,
            cache,
            ...timing,
            dashboardReadyMs,
            heapUsedBytes,
            blockedExternal: [...blocked],
          });
        if (round === 0 && cache === "cold") {
          fs.mkdirSync("artifacts/runtime-benchmark", { recursive: true });
          await page.screenshot({
            path: `artifacts/runtime-benchmark/${family}.png`,
            fullPage: true,
          });
        }
      }
      await context.close();
      console.log(
        `${family} browser ${round < 0 ? "warm-up" : round + 1}/10 complete`,
      );
      save();
    }
  }
} finally {
  await browser.close();
}

for (let round = 0; round < 3; round++) {
  for (const endpoint of endpoints) {
    for (const concurrency of [1, 8, 16]) {
      for (const family of round % 2 === 0
        ? families
        : [...families].reverse()) {
        await load(family, endpoint, concurrency, 2000);
        const result = await load(family, endpoint, concurrency, 10000);
        report.apiRuns.push({
          family,
          round: round + 1,
          endpoint: endpoint.id,
          path: endpoint.path,
          concurrency,
          ...result,
        });
        console.log(
          `${family} API ${endpoint.id} c=${concurrency} run=${round + 1}: ${result.requestsPerSecond.toFixed(1)} successful req/s, p95 ${result.latencyMs.p95.toFixed(1)} ms`,
        );
        save();
      }
    }
  }
}

async function memorySample(family) {
  const containers = [
    manifest.panels[family].container,
    manifest.panels[family].databaseContainer ??
      `panel-runtime-benchmark-${family}-database-1`,
    manifest.panels[family].cacheContainer ??
      `panel-runtime-benchmark-${family}-cache-1`,
  ];
  const names = ["panel", "database", "redis"];
  const values = await Promise.all(
    containers.map(async (container, i) => {
      const { stdout } = await exec(
        "docker",
        [
          "exec",
          container,
          "sh",
          "-c",
          "cat /sys/fs/cgroup/memory.current; cat /sys/fs/cgroup/memory.stat",
        ],
        { windowsHide: true },
      );
      const usageBytes = Number(stdout.split("\n")[0]);
      const inactiveFileBytes = Number(
        stdout.match(/^inactive_file (\d+)$/m)[1],
      );
      return [
        names[i],
        {
          usageBytes,
          inactiveFileBytes,
          workingSetBytes: Math.max(0, usageBytes - inactiveFileBytes),
        },
      ];
    }),
  );
  const parts = Object.fromEntries(values);
  return {
    sampledAt: new Date().toISOString(),
    ...parts,
    stackWorkingSetBytes: values.reduce(
      (sum, [, value]) => sum + value.workingSetBytes,
      0,
    ),
  };
}
for (let round = 0; round < 3; round++) {
  for (const family of round % 2 === 0 ? families : [...families].reverse()) {
    for (const state of ["idle", "loaded"]) {
      await load(family, endpoints[1], 16, 2000);
      if (state === "idle") await delay(3000);
      const samplesPromise = (async () => {
        const samples = [];
        for (let i = 0; i < 10; i++) {
          samples.push(await memorySample(family));
          await delay(1000);
        }
        return samples;
      })();
      const [samples, loadResult] = await Promise.all([
        samplesPromise,
        state === "loaded" ? load(family, endpoints[1], 16, 15000) : null,
      ]);
      report.memoryRuns.push({
        family,
        round: round + 1,
        state,
        samples,
        loadSuccesses: loadResult?.successes ?? 0,
      });
      console.log(
        `${family} memory ${state} run=${round + 1}: panel ${(summary(samples.map((sample) => sample.panel.workingSetBytes)).median / 2 ** 20).toFixed(1)} MiB`,
      );
      save();
    }
  }
}
for (const family of families) {
  report.panels[family].browser = Object.fromEntries(
    ["cold", "warm"].map((cache) => {
      const runs = report.browserRuns.filter(
        (run) => run.family === family && run.cache === cache,
      );
      return [
        cache,
        Object.fromEntries(
          [
            "ttfbMs",
            "domContentLoadedMs",
            "loadMs",
            "fcpMs",
            "lcpMs",
            "dashboardReadyMs",
            "heapUsedBytes",
          ].map((metric) => [metric, summary(runs.map((run) => run[metric]))]),
        ),
      ];
    }),
  );
  report.panels[family].api = Object.fromEntries(
    endpoints.map((endpoint) => [
      endpoint.id,
      Object.fromEntries(
        [1, 8, 16].map((concurrency) => {
          const runs = report.apiRuns.filter(
            (run) =>
              run.family === family &&
              run.endpoint === endpoint.id &&
              run.concurrency === concurrency,
          );
          return [
            concurrency,
            {
              requestsPerSecond: summary(
                runs.map((run) => run.requestsPerSecond),
              ),
              medianLatencyMs: summary(runs.map((run) => run.latencyMs.median)),
              p95LatencyMs: summary(runs.map((run) => run.latencyMs.p95)),
              successes: runs.reduce((sum, run) => sum + run.successes, 0),
              errors: runs.reduce(
                (sum, run) =>
                  sum + Object.values(run.errors).reduce((a, b) => a + b, 0),
                0,
              ),
            },
          ];
        }),
      ),
    ]),
  );
  report.panels[family].memory = Object.fromEntries(
    ["idle", "loaded"].map((state) => {
      const samples = report.memoryRuns
        .filter((run) => run.family === family && run.state === state)
        .flatMap((run) => run.samples);
      return [
        state,
        {
          panelWorkingSetBytes: summary(
            samples.map((sample) => sample.panel.workingSetBytes),
          ),
          stackWorkingSetBytes: summary(
            samples.map((sample) => sample.stackWorkingSetBytes),
          ),
          sampleCount: samples.length,
        },
      ];
    }),
  );
}
report.completedAt = new Date().toISOString();
report.harnessSha256 = createHash("sha256")
  .update(fs.readFileSync(new URL(import.meta.url)))
  .digest("hex");
fs.copyFileSync(new URL(import.meta.url), runnerPath);
save();
console.log(`Completed: ${reportPath}`);
