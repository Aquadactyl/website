// Package only credential-free outputs from the guarded Manta benchmark harness.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

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
  ["lifecycle", "performance", "resources", "security"].map((phase) => [
    phase,
    JSON.parse(fs.readFileSync(path.join(results, `${phase}.json`), "utf8")),
  ]),
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
for (const row of phases.performance) {
  if (row.errors !== undefined) assert.equal(row.errors, 0);
  if (row.verified !== undefined) assert.equal(row.verified, true);
}
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
run("git", ["add", "--", ...runtimeFiles], options);
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
      `\n===== ${file} =====\n${fs.readFileSync(path.join(checkout, file), "utf8")}`,
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
    games.push({
      variant,
      game: server.kind,
      imageId: info.Image,
      cpuQuota: info.HostConfig.CpuQuota,
      cpuPeriod: info.HostConfig.CpuPeriod,
      memoryLimit: info.HostConfig.Memory,
      binarySha256: sha256,
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
  ])
    assert.equal(
      pair[0][key],
      pair[1][key],
      `Game configurations differ: ${game} ${key}`,
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
