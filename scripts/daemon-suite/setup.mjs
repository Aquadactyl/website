// Isolated Docker-in-Docker fixture setup. Never mounts the workstation Docker socket.
// node scripts/daemon-suite/setup.mjs /private/config.json build|engine|assets|provision
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(process.argv[2], "utf8")),
  phase = process.argv[3];
const work = path.resolve(config.work),
  name = config.name;
assert.match(name, /^aqbench-[a-z0-9-]+$/);
fs.mkdirSync(work, { recursive: true });
const stateFile = path.join(work, "private-state.json");
const state = fs.existsSync(stateFile)
  ? JSON.parse(fs.readFileSync(stateFile, "utf8"))
  : { source: {} };
const save = () =>
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), { mode: 0o600 });
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 64 * 2 ** 20,
    ...opts,
  }).trim();
const docker = (...args) => run("docker", args);
const inner = (...args) => docker("exec", name, "docker", ...args);
const hash = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const mount = (dir, target) => [
  "--mount",
  `type=bind,source=${dir.replaceAll("\\", "/")},target=${target}`,
];
if (phase === "build") {
  const build = path.join(work, "build");
  fs.mkdirSync(build, { recursive: true });
  for (const variant of ["manta", "wings"]) {
    const source = config[variant + "Checkout"];
    assert.equal(
      run("git", ["diff", "--name-only", "HEAD"], { cwd: source }),
      "",
    );
    state.source[variant] = {
      revision: run("git", ["rev-parse", "HEAD"], { cwd: source }),
      release: run("git", ["describe", "--tags", "--exact-match"], {
        cwd: source,
      }),
      goSumSha256: hash(path.join(source, "go.sum")),
    };
    assert.match(
      state.source[variant].release,
      /^v\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?$/,
    );
    run(
      "git",
      [
        "archive",
        "--format=tar",
        "-o",
        path.join(work, variant + ".tar"),
        "HEAD",
      ],
      { cwd: source },
    );
  }
  fs.cpSync(path.join(here, "runner"), path.join(work, "runner"), {
    recursive: true,
  });
  fs.copyFileSync(
    path.join(here, "Dockerfile"),
    path.join(build, "Dockerfile"),
  );
  fs.writeFileSync(
    path.join(work, "build.sh"),
    `set -eu
mkdir -p /source/manta /source/wings
tar xf /input/manta.tar -C /source/manta
tar xf /input/wings.tar -C /source/wings
cd /source/manta
CGO_ENABLED=0 go build -buildvcs=false -trimpath -ldflags='-s -w -X github.com/Aquadactyl/manta/system.Version=${state.source.manta.release.slice(1)}' -o /input/build/manta .
cd /source/wings
CGO_ENABLED=0 go build -buildvcs=false -trimpath -ldflags='-s -w -X github.com/pterodactyl/wings/system.Version=${state.source.wings.release.slice(1)}' -o /input/build/wings .
mkdir -p /source/manta/benchmarks/current-runner
cp /input/runner/*.go /source/manta/benchmarks/current-runner/
cd /source/manta
gofmt -w benchmarks/current-runner
CGO_ENABLED=0 go build -buildvcs=false -trimpath -o /input/build/runner ./benchmarks/current-runner
cp benchmarks/current-runner/*.go /input/runner/
go version
`,
  );
  docker(
    "run",
    "--rm",
    "--cpus",
    "4",
    "--memory",
    "6g",
    ...mount(work, "/input"),
    "-v",
    "aquadactyl-daemon-update-go-modules:/go/pkg/mod",
    "-v",
    "aquadactyl-daemon-update-go-build:/root/.cache/go-build",
    "-e",
    "GOTOOLCHAIN=local",
    "golang:1.27.4-alpine",
    "sh",
    "/input/build.sh",
  );
  for (const variant of ["manta", "wings"])
    state.source[variant].binarySha256 = hash(path.join(build, variant));
  state.compilerImage = JSON.parse(
    docker("image", "inspect", "golang:1.27.4-alpine"),
  )[0].Id;
  state.runnerFiles = fs
    .readdirSync(path.join(work, "runner"))
    .sort()
    .map((file) => ({ file, sha256: hash(path.join(work, "runner", file)) }));
  save();
  console.log("Built both unmodified tagged daemons and the benchmark runner.");
} else if (phase === "engine") {
  assert.throws(
    () => docker("inspect", name),
    "Use a fresh benchmark engine name.",
  );
  docker(
    "run",
    "-d",
    "--privileged",
    "--name",
    name,
    "--cpus",
    "16",
    "--memory",
    "12g",
    "--network",
    config.network,
    "-e",
    "DOCKER_TLS_CERTDIR=",
    "-v",
    name + "-engine:/var/lib/docker",
    "-v",
    name + "-data:/benchdata",
    "docker:29.8.1-dind",
    "--storage-driver=overlay2",
  );
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      inner("info");
      ready = true;
      break;
    } catch {
      await delay(1000);
    }
  }
  assert(ready, "Nested Docker did not become ready.");
  const inspect = JSON.parse(docker("inspect", name))[0];
  state.engine = {
    container: name,
    imageId: inspect.Image,
    version: inner("version", "--format", "{{.Server.Version}}"),
    cpuLimit: 16,
    memoryLimit: 12 * 2 ** 30,
    ip: inspect.NetworkSettings.Networks[config.network].IPAddress,
  };
  docker("cp", path.join(work, "build"), name + ":/build");
  inner("build", "-t", "benchmark-daemons:current", "/build");
  save();
  console.log(
    "Prepared private nested Docker engine; no host ports published.",
  );
} else if (phase === "assets") {
  state.images = {};
  for (const [kind, image] of [
    ["paper", "ghcr.io/pterodactyl/yolks:java_25"],
    ["bedrock", "ghcr.io/ptero-eggs/yolks:debian"],
  ]) {
    inner("pull", image);
    const item = JSON.parse(inner("image", "inspect", image))[0];
    state.images[kind] = { reference: item.RepoDigests[0], imageId: item.Id };
  }
  docker(
    "exec",
    name,
    "sh",
    "-c",
    "mkdir -p /setup/paper /setup/bedrock /results /private; apk add --no-cache unzip",
  );
  docker(
    "cp",
    path.join(config.assets, "server.jar"),
    name + ":/setup/paper/server.jar",
  );
  docker(
    "cp",
    path.join(config.assets, "bedrock-current.zip"),
    name + ":/setup/bedrock.zip",
  );
  inner(
    "run",
    "--rm",
    "--cpus",
    "4",
    "--memory",
    "2g",
    "--user",
    "0:0",
    "--entrypoint",
    "java",
    "-w",
    "/home/container",
    "-v",
    "/setup/paper:/home/container",
    state.images.paper.reference,
    "-Dpaperclip.patchonly=true",
    "-jar",
    "server.jar",
  );
  docker(
    "exec",
    name,
    "unzip",
    "-q",
    "/setup/bedrock.zip",
    "-d",
    "/setup/bedrock",
  );
  state.games = {
    paper: JSON.parse(
      fs.readFileSync(path.join(config.assets, "paper-metadata.json"), "utf8"),
    ),
    bedrock: JSON.parse(
      fs.readFileSync(path.join(config.assets, "bedrock-links.json"), "utf8"),
    ).result.links.find((x) => x.downloadType === "serverBedrockLinux"),
    paperJarSha256: hash(path.join(config.assets, "server.jar")),
    bedrockZipSha256: hash(path.join(config.assets, "bedrock-current.zip")),
  };
  assert.equal(
    state.games.paperJarSha256,
    state.games.paper.downloads["server:default"].checksums.sha256,
  );
  save();
  console.log(
    "Cached and pinned identical official game assets and runtime images.",
  );
} else if (phase === "provision") {
  const panels = JSON.parse(
    fs.readFileSync(path.join(config.panelRuntime, "manifest.json"), "utf8"),
  );
  const password = randomBytes(24).toString("hex");
  const manifest = {
    nodes: {},
    panel_origin: "http://benchmark-panel",
    sftp: {
      username: "benchmark-daemon",
      password,
      user_uuid: "00000000-0000-4000-8000-000000000099",
    },
  };
  for (const [variant, family] of [
    ["manta", "aquadactyl"],
    ["wings", "pterodactyl_v1"],
  ]) {
    const container = panels.panels[family].container;
    docker(
      "cp",
      path.join(here, "provision.php"),
      container + ":/tmp/provision-daemon.php",
    );
    docker(
      "exec",
      "-e",
      "DAEMON_BENCHMARK_PASSWORD=" + password,
      "-e",
      "DAEMON_BENCHMARK_HOST=" + state.engine.ip,
      "-e",
      "BENCHMARK_PAPER_IMAGE=" + state.images.paper.reference,
      "-e",
      "BENCHMARK_BEDROCK_IMAGE=" + state.images.bedrock.reference,
      container,
      "php",
      "/tmp/provision-daemon.php",
      variant,
    );
    const data = JSON.parse(
      docker(
        "exec",
        container,
        "cat",
        "/bench/storage/daemon-benchmark-" + variant + ".json",
      ),
    );
    const dir = path.join(work, variant);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "config.yml"), data.yaml, { mode: 0o600 });
    docker("exec", name, "mkdir", "-p", "/benchdata/" + variant + "/config");
    docker(
      "cp",
      path.join(dir, "config.yml"),
      name + ":/benchdata/" + variant + "/config/config.yml",
    );
    for (const server of data.node.servers) {
      const target = "/benchdata/" + variant + "/volumes/" + server.uuid;
      docker("exec", name, "mkdir", "-p", target);
      docker(
        "exec",
        name,
        "cp",
        "-a",
        "/setup/" + server.kind + "/.",
        target + "/",
      );
      let script = fs
        .readFileSync(
          path.join(
            config.mantaCheckout,
            "benchmarks",
            "install-" + server.kind + ".sh",
          ),
          "utf8",
        )
        .replace(/\r\n/g, "\n");
      // Cached files are already placed. Apply the original matching settings only.
      script = script.slice(script.indexOf("cat > server.properties"));
      if (server.kind === "bedrock")
        script +=
          "\nprintf '%s\\n' 'transport=raknet' >> server.properties\nchmod +x bedrock_server\n";
      const settings = path.join(
        work,
        "settings-" + variant + "-" + server.kind + ".sh",
      );
      fs.writeFileSync(settings, script);
      docker("cp", settings, name + ":/setup/settings.sh");
      docker(
        "exec",
        "-e",
        "SERVER_PORT=" + server.port,
        "-w",
        target,
        name,
        "sh",
        "/setup/settings.sh",
      );
      docker("exec", name, "chown", "-R", "988:988", target);
    }
    const backend = JSON.parse(docker("inspect", container))[0].NetworkSettings
      .Networks[config.network].IPAddress;
    inner(
      "run",
      "-d",
      "--name",
      variant,
      "--network",
      "host",
      "--cpus",
      "2",
      "--memory",
      "1g",
      "--memory-swap",
      "1g",
      "-e",
      "GOMAXPROCS=2",
      "--add-host",
      "benchmark-panel:" + backend,
      "-v",
      "/var/run/docker.sock:/var/run/docker.sock",
      "-v",
      "/benchdata/" + variant + ":/benchdata/" + variant,
      "benchmark-daemons:current",
      "/usr/local/bin/" + variant,
      "--config",
      "/benchdata/" + variant + "/config/config.yml",
    );
    manifest.nodes[variant] = data.node;
    state.source[variant].panelBackend = {
      family,
      release: panels.panels[family].release,
      revision: panels.panels[family].revision,
    };
  }
  const privateFile = path.join(work, "manifest.json");
  fs.writeFileSync(privateFile, JSON.stringify(manifest), { mode: 0o600 });
  docker("cp", privateFile, name + ":/private/manifest.json");
  save();
  console.log(
    "Provisioned the four dedicated servers against their native Panel APIs.",
  );
} else throw Error("Choose build, engine, assets or provision.");
