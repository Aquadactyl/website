// Run only after the web measurements have completed. Config/state contain secrets.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { safeProperties } from "./safe-properties.mjs";
const config = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const state = JSON.parse(
  fs.readFileSync(path.join(config.work, "private-state.json"), "utf8"),
);
const output = path.resolve(process.argv[3]);
fs.mkdirSync(output, { recursive: true });
const docker = (...args) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 64 * 2 ** 20,
  }).trim();
const inner = (...args) => docker("exec", config.name, "docker", ...args);
const hash = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
assert(state.engine && state.images && state.source.manta.binarySha256);
for (const v of ["manta", "wings"]) {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      inner(
        "exec",
        v,
        "/bin/busybox",
        "nc",
        "-z",
        "127.0.0.1",
        v === "manta" ? "18083" : "18084",
      );
      ready = true;
      break;
    } catch {}
    await delay(1000);
  }
  assert(ready, v + " daemon failed to start.");
}
inner(
  "run",
  "-d",
  "--name",
  "benchmark-runner",
  "--cpus",
  "4",
  "--memory",
  "1g",
  "--add-host",
  "host.docker.internal:172.17.0.1",
  "-v",
  "/var/run/docker.sock:/var/run/docker.sock",
  "-v",
  "/private:/private:ro",
  "-v",
  "/results:/results",
  "benchmark-daemons:current",
  "sleep",
  "infinity",
);
for (const network of ["benchmark-manta", "benchmark-wings"])
  inner("network", "connect", network, "benchmark-runner");
const report = {
  schemaVersion: 2,
  measuredOn: new Date().toISOString().slice(0, 10),
  startedAt: new Date().toISOString(),
  source: state.source,
  engine: state.engine,
  images: state.images,
  gameAssets: state.games,
  compilerImage: state.compilerImage,
  environment: {
    hostCpu: os.cpus()[0].model,
    hostLogicalCpus: os.cpus().length,
    hostMemoryGiB: Math.round(os.totalmem() / 2 ** 30),
    hostOs: `${os.platform()} ${os.release()} ${os.arch()}`,
  },
  methodology: {
    api: "Three alternating repetitions per daemon, endpoint and concurrency (1/16/32). Five-second closed-loop authenticated HTTP/1.1 windows with persistent connections; one discarded request before each window. No new requests after the deadline; in-flight requests are drained. Throughput is successful requests per actual elapsed second. Body receipt is included, percentile sorting and publication are excluded. Timed responses must be HTTP 200. This replaces the old 400-request batches; do not claim a controlled before/after comparison across methods.",
    lifecycle:
      "Four start/stop rounds per game and daemon in alternating order. Fresh worlds are initialized by the first start, which is retained as a discarded warm-up; only the next three warm starts contribute to the published lifecycle medians. Timers cover power request through daemon-reported state, with 100 ms polling; shutdown is not a separately timed OS process exit. Identical cached binaries/image layers, seed and properties; normal configuration sync and registry digest checks remain in the timed power path. Bedrock explicitly uses transport=raknet for the UDP query workload.",
    resources:
      "Fifteen Docker working-set samples at two-second intervals for each of six containers, once idle and once under matching game command load. Mean is arithmetic mean; raw sample values and observed peaks are retained. Working set subtracts inactive file cache, not RSS. Commands alternate 4096 blocks between stone and air, five iterations/second per node across both games, with matching forced/ticking areas. This is not real-player load.",
    transfers:
      "16 MiB shared random payload, three repetitions with five samples each for HTTP and SFTP read/write. SFTP authentication is outside transfer timers and uses each daemon's native Panel backend. Hash-verified reads and archives; 1000 x 256-byte directory fixture; 100 console lines delivered to 16 subscribers; automatic stats validated for 16 viewers per game/daemon.",
    isolation:
      "Unmodified tagged source, identical Go 1.27.4 compiler/build flags and common Alpine runtime image. Each daemon has a two-core quota, 1 GiB RAM, GOMAXPROCS=2. Games have matching pinned images and configured limits. Private nested Docker engine is limited to 16 cores/12 GiB and publishes no host ports. Manta uses Aquadactyl; stock Wings uses its native Pterodactyl v1 backend (Wings page=0 bootstrap is incompatible with Aquadactyl validation). No production-code compatibility patch is applied. Panel and daemon workloads do not overlap.",
    limitations:
      "Single shared Windows/WSL2 workstation with unrelated existing containers, no CPU pinning or repeated clean-machine trials. Linux container networking; no TLS/WAN/mobile/endurance test or authenticated players. Daemon and game memory are separate; this is a controlled local distribution comparison, not general hosting capacity. No new security audit, race test or full coverage run is claimed by this performance rerun.",
  },
  runnerFiles: state.runnerFiles,
  phases: {},
  games: [],
};
// Remove the private fixture address from public metadata.
delete report.engine.ip;
const gameManifest = JSON.parse(
  docker("exec", config.name, "cat", "/private/manifest.json"),
);
for (const [variant, node] of Object.entries(gameManifest.nodes))
  for (const server of node.servers) {
    // Product settings and immutable asset hashes, never node tokens or account credentials.
    report.games.push({
      variant,
      game: server.kind,
      uuid: server.uuid,
      port: server.port,
      configuredMemoryMiB: server.kind === "paper" ? 1536 : 512,
      configuredCpuPercent: 200,
      binarySha256: docker(
        "exec",
        config.name,
        "sha256sum",
        "/benchdata/" +
          variant +
          "/volumes/" +
          server.uuid +
          "/" +
          (server.kind === "paper" ? "server.jar" : "bedrock_server"),
      ).split(/\s/)[0],
      properties: safeProperties(
        docker(
          "exec",
          config.name,
          "cat",
          "/benchdata/" +
            variant +
            "/volumes/" +
            server.uuid +
            "/server.properties",
        ),
      ),
    });
  }
for (const phase of ["lifecycle", "performance", "resources", "events"]) {
  console.log("Starting daemon phase: " + phase);
  inner(
    "exec",
    "benchmark-runner",
    "/usr/local/bin/benchmark-runner",
    "-phase",
    phase,
    "-manifest",
    "/private/manifest.json",
    "-output",
    "/results",
  );
  const file = path.join(output, phase + ".json");
  docker("cp", config.name + ":/results/" + phase + ".json", file);
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  assert(!rows.some((r) => r.type === "fatal"));
  report.phases[phase] = rows;
  fs.writeFileSync(
    path.join(output, "daemons-in-progress.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log("Completed daemon phase: " + phase);
}
for (const game of report.games) {
  const ins = JSON.parse(inner("inspect", game.uuid))[0];
  game.imageId = ins.Image;
  game.effectiveLimits = ins.HostConfig;
  delete game.effectiveLimits.Binds;
  delete game.effectiveLimits.ExtraHosts;
}
// Publish only the fields needed to establish resource parity.
for (const game of report.games) {
  const h = game.effectiveLimits;
  game.effectiveLimits = {
    cpuQuota: h.CpuQuota,
    cpuPeriod: h.CpuPeriod,
    nanoCpus: h.NanoCpus,
    memoryBytes: h.Memory,
    memorySwapBytes: h.MemorySwap,
  };
}
report.completedAt = new Date().toISOString();
report.runnerSha256 = hash(path.join(config.work, "build", "runner"));
fs.writeFileSync(
  path.join(output, "daemons.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  "All daemon phases completed. Credential-free report: " +
    path.join(output, "daemons.json"),
);
