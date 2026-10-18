// Production CLI builds, with locked dependencies already installed in both checkouts.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

const [aquadactyl, pterodactyl] = process.argv.slice(2);
assert.ok(
  aquadactyl && pterodactyl,
  "Provide Aquadactyl and v2 checkout paths.",
);
const roots = { aquadactyl, pterodactyl };
const report = {
  measuredOn: new Date().toISOString().slice(0, 10),
  startedAt: new Date().toISOString(),
  environment: {
    node: process.version,
    os: `${os.platform()} ${os.release()}`,
    cpu: os.cpus()[0].model,
    logicalCpus: os.cpus().length,
  },
  methodology:
    "One discarded warm-up per panel, five measured builds each, alternating order. Full production package-manager build command including v2 SDK generation and postbuild checks. Fresh CLI process each time, dependencies installed before timing, filesystem/dependency caches warm. Sequential native-host builds with no CPU quota; no concurrent benchmark builds or load tests. Unrelated game containers remain running. Excludes installation, PHP image builds and artifact analysis. Total assets include every manifest-emitted JS/CSS asset across all routes, individually gzipped at level 6; this is not dashboard transfer size.",
  runs: [],
};
const logs = [];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function build(family) {
  const command = family === "aquadactyl" ? "pnpm run build" : "npm run build";
  const started = performance.now();
  await new Promise((resolve, reject) => {
    const child =
      os.platform() === "win32"
        ? spawn("cmd.exe", ["/d", "/s", "/c", command], {
            cwd: roots[family],
            windowsHide: true,
            env: {
              ...process.env,
              NODE_ENV: "production",
              PTERODACTYL_BUILD_HASH: "benchmark",
            },
          })
        : spawn(family === "aquadactyl" ? "pnpm" : "npm", ["run", "build"], {
            cwd: roots[family],
            env: {
              ...process.env,
              NODE_ENV: "production",
              PTERODACTYL_BUILD_HASH: "benchmark",
            },
          });
    let output = "";
    child.stdout.on("data", (data) => {
      output += data;
    });
    child.stderr.on("data", (data) => {
      output += data;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      logs.push(`${family}: ${command}\n${output}`);
      if (code === 0) resolve();
      else
        reject(new Error(`${family} exited ${code}: ${output.slice(-4000)}`));
    });
  });
  return performance.now() - started;
}
for (let round = -1; round < 5; round++) {
  for (const family of round % 2 === 0
    ? ["aquadactyl", "pterodactyl"]
    : ["pterodactyl", "aquadactyl"]) {
    const elapsedMs = await build(family);
    console.log(
      `${family} build ${round < 0 ? "warm-up" : round + 1}: ${(elapsedMs / 1000).toFixed(2)} s`,
    );
    if (round >= 0) report.runs.push({ family, round: round + 1, elapsedMs });
  }
}
report.panels = {};
for (const family of Object.keys(roots)) {
  const root = roots[family];
  const dir = path.join(
    root,
    family === "aquadactyl" ? "public/build" : "public/assets",
  );
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json")));
  const files = [
    ...new Set(
      Object.values(manifest).flatMap((entry) => [
        entry.file,
        ...(entry.css ?? []),
      ]),
    ),
  ]
    .filter((file) => /\.(js|css)$/.test(file))
    .sort();
  const assets = files.map((file) => {
    const bytes = fs.readFileSync(path.join(dir, file));
    return {
      file,
      bytes: bytes.length,
      gzipBytes: gzipSync(bytes, { level: 6 }).length,
      sha256: hash(bytes),
    };
  });
  const samples = report.runs
    .filter((run) => run.family === family)
    .map((run) => run.elapsedMs);
  report.panels[family] = {
    revision: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    }).trim(),
    packageManager:
      family === "aquadactyl" ? "pnpm 12.10.1" : "npm (see build logs)",
    lockSha256: hash(
      fs.readFileSync(
        path.join(
          root,
          family === "aquadactyl" ? "pnpm-lock.yaml" : "package-lock.json",
        ),
      ),
    ),
    buildMs: {
      samples,
      median: [...samples].sort((a, b) => a - b)[2],
      min: Math.min(...samples),
      max: Math.max(...samples),
    },
    assets,
    totalBytes: assets.reduce((n, file) => n + file.bytes, 0),
    totalGzipBytes: assets.reduce((n, file) => n + file.gzipBytes, 0),
  };
}
report.completedAt = new Date().toISOString();
report.harnessSha256 = hash(fs.readFileSync(new URL(import.meta.url)));
fs.writeFileSync(
  "public/benchmarks/panel-v2-builds.json",
  JSON.stringify(report, null, 2) + "\n",
);
fs.writeFileSync(
  "public/benchmarks/panel-v2-build-logs.txt",
  logs.join("\n\n"),
);
fs.copyFileSync(
  new URL(import.meta.url),
  "public/benchmarks/panel-v2-build-runner.txt",
);
