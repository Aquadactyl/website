// node scripts/benchmark-panels.mjs <clean-aquadactyl-checkout> <clean-pterodactyl-checkout>
// Install each checkout's locked dependencies first. No PHP, DB or running panel is used.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";

const script = fileURLToPath(import.meta.url);
const git = (root, ...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

if (process.argv[2] === "--worker") {
  const [, , , family, checkout, output] = process.argv;
  process.chdir(checkout);
  const require = createRequire(path.join(checkout, "package.json"));
  let assets;
  let assetDirectory;
  // Match upstream's clean script without relying on a POSIX find command on Windows.
  if (family === "pterodactyl") {
    assetDirectory = path.resolve(checkout, "public/assets");
    const expected = path.resolve(checkout, "public") + path.sep;
    if (!assetDirectory.startsWith(expected)) throw new Error("Asset directory escaped checkout");
    fs.mkdirSync(assetDirectory, { recursive: true });
    for (const file of fs.readdirSync(assetDirectory)) {
      if (/\.(js|map)$/.test(file) && fs.statSync(path.join(assetDirectory, file)).isFile()) fs.unlinkSync(path.join(assetDirectory, file));
    }
  }
  const started = performance.now();
  if (family === "aquadactyl") {
    const { build } = await import(pathToFileURL(require.resolve("vite")).href);
    await build();
  } else {
    const webpack = require("webpack");
    const config = require(path.join(checkout, "webpack.config.js"));
    const compiler = webpack(config);
    const stats = await new Promise((resolve, reject) => compiler.run((error, result) => error ? reject(error) : resolve(result)));
    if (stats.hasErrors()) throw new Error(stats.toString({ all: false, errors: true }));
    console.log(stats.toString({ all: false, timings: true, warnings: true }));
    const { compilation } = stats;
    const entry = [...compilation.entrypoints.values()].flatMap((group) => group.getFiles());
    const dashboardGroups = [...compilation.chunkGroups].filter((group) => group.name === "dashboard" || group.origins.some((origin) => origin.request?.includes("routers/DashboardRouter")));
    if (!dashboardGroups.length) throw new Error("Dashboard chunk group not found");
    assets = { entry, dashboard: [...new Set([...entry, ...dashboardGroups.flatMap((group) => group.getFiles())])] };
    await new Promise((resolve, reject) => compiler.close((error) => error ? reject(error) : resolve()));
  }
  const buildMs = performance.now() - started;
  if (family === "aquadactyl") {
    assetDirectory = path.resolve(checkout, "public/build");
    const manifest = JSON.parse(fs.readFileSync(path.join(assetDirectory, "manifest.json"), "utf8"));
    const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry && key.endsWith("index.tsx"));
    const dashboardKey = Object.keys(manifest).find((key) => key.endsWith("/routers/DashboardRouter.tsx"));
    if (!entryKey || !dashboardKey) throw new Error("Entry/dashboard missing in Vite manifest");
    function closure(keys) {
      const visited = new Set();
      const files = new Set();
      function visit(key) {
        if (visited.has(key)) return;
        visited.add(key);
        const chunk = manifest[key];
        if (!chunk) throw new Error(`Unknown manifest import ${key}`);
        files.add(chunk.file);
        for (const css of chunk.css || []) files.add(css);
        for (const dependency of chunk.imports || []) visit(dependency);
      }
      keys.forEach(visit);
      return [...files];
    }
    assets = { entry: closure([entryKey]), dashboard: closure([entryKey, dashboardKey]) };
  }
  function measure(files) {
    const selected = [...new Set(files)].filter((file) => /\.(js|css)$/.test(file));
    const records = selected.map((file) => {
      const data = fs.readFileSync(path.join(assetDirectory, file));
      return { file, bytes: data.length, gzipBytes: gzipSync(data, { level: 6 }).length, sha256: createHash("sha256").update(data).digest("hex") };
    });
    const sum = (key, filter) => records.filter(filter).reduce((total, file) => total + file[key], 0);
    return {
      jsBytes: sum("bytes", (file) => file.file.endsWith(".js")),
      jsGzipBytes: sum("gzipBytes", (file) => file.file.endsWith(".js")),
      cssBytes: sum("bytes", (file) => file.file.endsWith(".css")),
      cssGzipBytes: sum("gzipBytes", (file) => file.file.endsWith(".css")),
      totalBytes: sum("bytes", () => true), totalGzipBytes: sum("gzipBytes", () => true), files: records,
    };
  }
  fs.writeFileSync(output, JSON.stringify({ buildMs, entry: measure(assets.entry), dashboard: measure(assets.dashboard) }));
} else {
  const roots = { aquadactyl: path.resolve(process.argv[2] || "../aquadactyl"), pterodactyl: path.resolve(process.argv[3] || "../panel") };
  for (const checkout of Object.values(roots)) {
    if (git(checkout, "status", "--porcelain", "--untracked-files=no")) throw new Error(`Use a checkout with no tracked changes: ${checkout}`);
  }
  const samples = { aquadactyl: [], pterodactyl: [] };
  const resultsDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "panel-benchmark-results-"));
  const logs = [];
  const order = [];
  let sequence = 0;
  async function run(family, warmup = false) {
    const checkout = roots[family];
    const resultPath = path.join(resultsDirectory, `${sequence++}-${family}.json`);
    const args = [script, "--worker", family, checkout, resultPath];
    const output = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, { cwd: checkout, env: { ...process.env, NODE_ENV: "production", NO_COLOR: "1", FORCE_COLOR: "0" }, windowsHide: true });
      let log = "";
      child.stdout.on("data", (data) => { log += data; });
      child.stderr.on("data", (data) => { log += data; });
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve(log) : reject(new Error(`${family} build failed (${code})\n${log}`)));
    });
    const result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
    logs.push(`=== ${family}; ${warmup ? "warm-up" : "measured"}; ${result.buildMs.toFixed(2)} ms ===\n${output.replaceAll(checkout, "<checkout>").replaceAll(checkout.replaceAll("\\", "/"), "<checkout>")}`);
    order.push({ family, warmup, buildMs: result.buildMs });
    if (!warmup) samples[family].push(result);
    console.log(`${family} ${warmup ? "warm-up" : `sample ${samples[family].length}`}: ${result.buildMs.toFixed(2)} ms; dashboard gzip JS+CSS ${result.dashboard.totalGzipBytes} bytes`);
  }
  await run("aquadactyl", true);
  await run("pterodactyl", true);
  for (let i = 0; i < 5; i++) for (const family of i % 2 ? ["pterodactyl", "aquadactyl"] : ["aquadactyl", "pterodactyl"]) await run(family);
  const panels = Object.fromEntries(Object.entries(roots).map(([family, checkout]) => {
    const runs = samples[family];
    const pkg = JSON.parse(fs.readFileSync(path.join(checkout, "package.json"), "utf8"));
    return [family, {
      revision: git(checkout, "rev-parse", "HEAD"),
      ref: family === "aquadactyl" ? "main" : git(checkout, "describe", "--tags", "--exact-match"),
      repository: family === "aquadactyl" ? "Aquadactyl/aquadactyl" : "pterodactyl/panel",
      lockfileSha256: createHash("sha256").update(fs.readFileSync(path.join(checkout, family === "aquadactyl" ? "pnpm-lock.yaml" : "yarn.lock"))).digest("hex"),
      toolchain: family === "aquadactyl" ? `Vite ${pkg.devDependencies.vite}` : `Webpack ${pkg.devDependencies.webpack}`,
      buildMs: { median: median(runs.map((run) => run.buildMs)), min: Math.min(...runs.map((run) => run.buildMs)), max: Math.max(...runs.map((run) => run.buildMs)), samples: runs.map((run) => run.buildMs) },
      entry: runs.at(-1).entry, dashboard: runs.at(-1).dashboard,
      payloadSamples: runs.map((run) => ({ dashboardJsBytes: run.dashboard.jsBytes, dashboardJsGzipBytes: run.dashboard.jsGzipBytes, dashboardTotalBytes: run.dashboard.totalBytes, dashboardTotalGzipBytes: run.dashboard.totalGzipBytes })),
    }];
  }));
  const report = {
    schemaVersion: 1, measuredOn: "2026-10-14",
    environment: { cpu: os.cpus()[0].model, logicalCpus: os.cpus().length, memoryGiB: Math.round(os.totalmem() / 2 ** 30), platform: os.platform(), osRelease: os.release(), arch: os.arch(), node: process.version, gzipLevel: 6 },
    methodology: { repetitions: 5, warmupsPerPanel: 1, order, production: true, dependenciesInstalledBeforeTiming: true, addons: 0, dashboard: "Entry scripts plus dashboard route and their required static imports; deduplicated. CSS is counted separately when emitted as a separate asset.", compression: "Sum of individually gzipped emitted assets; transfer estimate, not a measured network response.", build: "Fresh Node process per build; time includes bundler/module/config loading, production compilation and compiler shutdown. Excludes dependency installation and asset analysis. Default project build configuration.", scope: "Frontend artifact sizes and production build duration. No browser timings, API throughput, PHP memory, Wings/game performance, database or network benchmark." },
    panels,
  };
  fs.mkdirSync("public/benchmarks", { recursive: true });
  fs.writeFileSync("public/benchmarks/panels.json", JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync("public/benchmarks/build-logs.txt", logs.join("\n\n"));
  console.log("Saved public/benchmarks/panels.json and build-logs.txt");
}
