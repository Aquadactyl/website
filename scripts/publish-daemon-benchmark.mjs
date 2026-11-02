// Package only credential-free outputs from the guarded Manta benchmark harness.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

const [checkout, results] = process.argv
  .slice(2)
  .map((value) => path.resolve(value));
assert.ok(
  checkout && results,
  "Provide the Manta checkout and completed result directory.",
);
const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
    ...options,
  }).trim();
const hash = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const phases = Object.fromEntries(
  ["lifecycle", "performance", "resources", "security", "events"].map(
    (phase) => [
      phase,
      JSON.parse(fs.readFileSync(path.join(results, `${phase}.json`), "utf8")),
    ],
  ),
);
for (const rows of Object.values(phases))
  assert.ok(!rows.some((row) => row.type === "fatal"));
assert.equal(
  phases.lifecycle.filter((row) => row.test === "lifecycle").length,
  16,
);
assert.equal(
  phases.performance.filter((row) =>
    ["api_status", "directory_1000"].includes(row.test),
  ).length,
  36,
);
assert.equal(
  phases.resources.filter((row) => row.test?.startsWith("resources_")).length,
  12,
);
assert.equal(phases.security.filter((row) => row.type === "check").length, 32);
const streamedStats = phases.events.filter(
  (row) => row.test === "automatic_stats_16_viewers",
);
assert.equal(streamedStats.length, 64);
for (const row of streamedStats) {
  assert.equal(row.pass, true);
  assert.equal(row.samples, 3);
  assert.ok(row.last_uptime > row.first_uptime);
}
for (const row of phases.performance) {
  if (row.errors !== undefined) assert.equal(row.errors, 0);
  if (row.verified !== undefined) assert.equal(row.verified, true);
}
const validation = JSON.parse(
  fs.readFileSync(path.join(results, "validation.json"), "utf8"),
);
const coverage = JSON.parse(
  fs.readFileSync(path.join(results, "coverage.json"), "utf8"),
);
assert.equal(validation.race, "passed");
assert.equal(validation.vet, "passed");
assert.equal(validation.failed, 0);
assert.equal(validation.skipped, 0);
assert.equal(coverage.targetMet, coverage.covered === coverage.statements);
assert.equal(coverage.minimumPercent, 100);
assert.equal(coverage.uncovered, coverage.statements - coverage.covered);
assert.ok(
  Math.abs(coverage.percent - (coverage.covered * 100) / coverage.statements) <
    0.000001,
);
assert.equal(
  coverage.files.reduce((n, file) => n + file.statements, 0),
  coverage.statements,
);
assert.equal(
  coverage.files.reduce((n, file) => n + file.covered, 0),
  coverage.covered,
);
const coveragePath = "public/benchmarks/daemon-coverage.json";
const profilePath = "public/benchmarks/daemon-coverage.out.gz";
const profile = fs.readFileSync(path.join(results, "coverage.out"));
assert.equal(
  createHash("sha256").update(profile).digest("hex"),
  validation.coverageProfileSha256,
);
fs.writeFileSync(
  coveragePath,
  fs
    .readFileSync(path.join(results, "coverage.json"), "utf8")
    .replace(/\r\n/g, "\n"),
);
fs.writeFileSync(profilePath, gzipSync(profile));
const microbenchmarkPath = "public/benchmarks/daemon-microbenchmarks.txt";
const microbenchmarks = fs.readFileSync(
  path.join(results, "microbenchmarks.txt"),
  "utf8",
);
assert.ok(!microbenchmarks.includes("FAIL"));
const microCases = new Map();
for (const line of microbenchmarks.split(/\r?\n/)) {
  const match = line.match(
    /^(Benchmark\S+)-4\s+\d+\s+[\d.]+ ns\/op\s+\d+ B\/op\s+\d+ allocs\/op/,
  );
  if (match) microCases.set(match[1], (microCases.get(match[1]) ?? 0) + 1);
}
assert.ok(microCases.size > 0);
assert.ok([...microCases.values()].every((count) => count === 5));
fs.writeFileSync(microbenchmarkPath, microbenchmarks);
const work = fs.mkdtempSync(path.join(os.tmpdir(), "daemon-publication-"));
const source = {
  manta: {},
  wings: {
    release: "v1.13.4",
    url: "https://github.com/pterodactyl/wings/releases/tag/v1.13.4",
    officialImage: "ghcr.io/pterodactyl/wings:v1.13.4",
  },
};
source.manta.revision = run("git", ["rev-parse", "HEAD"], { cwd: checkout });
const runtimeFiles = [
  ...new Set(
    run("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
      cwd: checkout,
    }).split(/\r?\n/),
  ),
]
  .filter(
    (file) =>
      !file.startsWith("benchmarks/") &&
      !file.endsWith("_test.go") &&
      (file.endsWith(".go") ||
        ["go.mod", "go.sum", "Dockerfile", "docker/local.Dockerfile"].includes(
          file,
        )),
  )
  .sort();
source.manta.files = runtimeFiles
  .filter((file) => fs.existsSync(path.join(checkout, file)))
  .map((file) => ({ file, sha256: hash(path.join(checkout, file)) }));
const index = path.join(work, "source.index");
const options = {
  cwd: checkout,
  env: { ...process.env, GIT_INDEX_FILE: index },
};
run("git", ["read-tree", "HEAD"], options);
run(
  "git",
  ["-c", "core.safecrlf=false", "add", "--", ...runtimeFiles],
  options,
);
const patch =
  run("git", ["diff", "--cached", "--binary", "HEAD"], options) + "\n";
const patchPath = "public/benchmarks/daemon-comparison-manta.patch";
fs.writeFileSync(patchPath, patch);
source.manta.patchSha256 = hash(patchPath);
fs.unlinkSync(index);
for (const variant of ["manta", "wings"]) {
  const container = variant === "manta" ? "manta-test" : "wings-benchmark";
  const metadata = phases.performance.find(
    (row) => row.type === "metadata" && row.variant === variant,
  );
  const info = JSON.parse(run("docker", ["inspect", container]))[0];
  assert.equal(
    info.Image,
    metadata.image_id,
    "The measured daemon image changed before publication.",
  );
  const image = JSON.parse(run("docker", ["image", "inspect", info.Image]))[0];
  const binary = path.join(work, `${variant}-wings`);
  run("docker", ["cp", `${container}:/usr/bin/wings`, binary]);
  source[variant].imageId = info.Image;
  source[variant].imageCreatedAt = image.Created;
  source[variant].binarySha256 = hash(binary);
  if (variant === "manta")
    for (const file of source.manta.files) {
      assert.ok(
        fs.statSync(path.join(checkout, file.file)).mtimeMs <
          Date.parse(image.Created),
        `Source changed after the image was built: ${file.file}`,
      );
    }
  fs.unlinkSync(binary);
}
// Verify that adding the probe left the stock executable byte-for-byte unchanged.
const officialContainer = run("docker", ["create", source.wings.officialImage]);
try {
  const binary = path.join(work, "official-wings");
  run("docker", ["cp", `${officialContainer}:/usr/bin/wings`, binary]);
  assert.equal(hash(binary), source.wings.binarySha256);
  fs.unlinkSync(binary);
} finally {
  run("docker", ["rm", officialContainer]);
}
const runnerFiles = [
  ...fs
    .readdirSync(path.join(checkout, "benchmarks/runner"))
    .filter((file) => file.endsWith(".go"))
    .map((file) => `benchmarks/runner/${file}`),
  "benchmarks/Run-Benchmark.ps1",
  "benchmarks/provision.php",
  "benchmarks/compose.yaml",
  "benchmarks/compose.manta.yaml",
];
const runner = runnerFiles
  .map(
    (file) =>
      `\n===== ${file} =====\n${fs.readFileSync(path.join(checkout, file), "utf8").replace(/\r\n/g, "\n")}`,
  )
  .join("\n");
const runnerPath = "public/benchmarks/daemon-comparison-runner.txt";
fs.writeFileSync(runnerPath, runner);
const files = Object.keys(phases).map((phase) =>
  fs.statSync(path.join(results, `${phase}.json`)),
);
const games = [];
for (const variant of ["wings", "manta"]) {
  const metadata = phases.performance.find(
    (row) => row.type === "metadata" && row.variant === variant,
  );
  for (const server of metadata.servers) {
    assert.ok(server.name.startsWith("Benchmark "));
    const info = JSON.parse(run("docker", ["inspect", server.uuid]))[0];
    const file =
      server.kind === "paper"
        ? "/home/container/server.jar"
        : "/home/container/bedrock_server";
    const sha256 = run("docker", [
      "exec",
      server.uuid,
      "sha256sum",
      file,
    ]).split(/\s+/)[0];
    assert.match(sha256, /^[a-f0-9]{64}$/);
    const properties = run("docker", [
      "exec",
      server.uuid,
      "sh",
      "-c",
      "grep -E '^(level-seed|level-name|level-type|generate-structures|view-distance|simulation-distance|tick-distance|max-threads|max-players|gamemode|difficulty|pause-when-empty-seconds)=' /home/container/server.properties",
    ]);
    const configuredSettings = Object.fromEntries(
      properties
        .split(/\r?\n/)
        .filter(Boolean)
        .sort()
        .map((line) => {
          const split = line.indexOf("=");
          return [line.slice(0, split), line.slice(split + 1)];
        }),
    );
    const startupKeys = new Set([
      "STARTUP",
      "SERVER_MEMORY",
      "SERVER_JARFILE",
      "MINECRAFT_VERSION",
      "BEDROCK_VERSION",
    ]);
    const startupSha256 = createHash("sha256")
      .update(
        JSON.stringify({
          entrypoint: info.Config.Entrypoint,
          command: info.Config.Cmd,
          environment: info.Config.Env.filter((entry) =>
            startupKeys.has(entry.split("=", 1)[0]),
          ).sort(),
        }),
      )
      .digest("hex");
    games.push({
      variant,
      game: server.kind,
      imageId: info.Image,
      cpuQuota: info.HostConfig.CpuQuota,
      cpuPeriod: info.HostConfig.CpuPeriod,
      memoryLimit: info.HostConfig.Memory,
      binarySha256: sha256,
      startupSha256,
      configuredSettings,
    });
  }
}
for (const game of ["paper", "bedrock"]) {
  const pair = games.filter((row) => row.game === game);
  for (const key of [
    "imageId",
    "cpuQuota",
    "cpuPeriod",
    "memoryLimit",
    "binarySha256",
    "startupSha256",
  ])
    assert.equal(
      pair[0][key],
      pair[1][key],
      `Game configurations differ: ${game} ${key}`,
    );
  assert.deepEqual(
    pair[0].configuredSettings,
    pair[1].configuredSettings,
    `Game settings differ: ${game}`,
  );
}
const startedAt = new Date(
  Math.min(...files.map((file) => file.birthtimeMs)),
).toISOString();
const report = {
  schemaVersion: 1,
  measuredOn: startedAt.slice(0, 10),
  startedAt,
  completedAt: new Date(
    Math.max(...files.map((file) => file.mtimeMs)),
  ).toISOString(),
  timestampBasis: "First result-file creation and last result-file update",
  environment: {
    cpu: os.cpus()[0].model,
    memoryGiB: Math.round(os.totalmem() / 2 ** 30),
    os: `${os.platform()} ${os.release()} ${os.arch()}`,
    docker: run("docker", ["version", "--format", "{{.Server.Version}}"]),
    runnerCompiler: "Go 1.26.9",
  },
  source,
  games,
  harnessSha256: hash(runnerPath),
  verification: {
    ...validation,
    coverage: {
      file: "daemon-coverage.json",
      sha256: hash(coveragePath),
      percent: coverage.percent,
      targetMet: coverage.targetMet,
    },
    profile: {
      file: "daemon-coverage.out.gz",
      sha256: hash(profilePath),
      uncompressedSha256: validation.coverageProfileSha256,
    },
    microbenchmarks: {
      file: "daemon-microbenchmarks.txt",
      sha256: hash(microbenchmarkPath),
      cases: microCases.size,
      repetitions: 5,
      benchtime: "500ms",
      cpuQuota: 4,
      memoryLimit: 2 * 2 ** 30,
      gomaxprocs: 4,
      compiler: "Go 1.26.9 Linux amd64",
    },
  },
  phases,
};
// The runner omits runtime credentials; guard against accidentally packaging a manifest.
assert.ok(
  !/"(?:password|authorization|token)"\s*:/i.test(JSON.stringify(report)),
);
fs.writeFileSync(
  "public/benchmarks/daemon-comparison.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  "Published fresh daemon results, binary/source hashes and credential-free runner snapshot.",
);
