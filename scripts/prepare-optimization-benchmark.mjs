// Two built Aquadactyl checkouts at the same commit; only the second may have edits.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";

const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
const hash = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "aquadactyl-optimization-"));
const runtimeImage = process.env.BENCHMARK_RUNTIME_IMAGE || "aquadactyl:test";
const project = "aquadactyl-optimization";
const services = {},
  volumes = {};
const manifest = {
  comparison: "Aquadactyl before and after runtime optimizations",
  families: ["before", "after"],
  runtimeImage,
  runtimeImageId: run("docker", [
    "image",
    "inspect",
    runtimeImage,
    "--format",
    "{{.Id}}",
  ]),
  panels: {},
};
for (const [index, family] of manifest.families.entries()) {
  if (!process.argv[index + 2])
    throw new Error("Provide baseline and candidate checkout paths.");
  const checkout = path.resolve(process.argv[index + 2]);
  const revision = run("git", ["rev-parse", "HEAD"], checkout);
  const changed = run("git", ["diff", "--name-only", "HEAD"], checkout)
    .split(/\r?\n/)
    .filter(Boolean);
  const added = run(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    checkout,
  )
    .split(/\r?\n/)
    .filter(Boolean);
  const patchFiles = [...new Set([...changed, ...added])]
    .sort()
    .map((file) => ({ file, sha256: hash(path.join(checkout, file)) }));
  if (family === "before" && patchFiles.length)
    throw new Error("The baseline must be clean.");
  if (family === "after" && revision !== manifest.panels.before.revision)
    throw new Error("Both checkouts must start at the same commit.");
  const context = path.join(work, family),
    panel = path.join(context, "panel");
  fs.mkdirSync(panel, { recursive: true });
  const archive = path.join(work, `${family}.tar`);
  run("git", ["archive", "--format=tar", "-o", archive, "HEAD"], checkout);
  run("tar", ["-xf", archive, "-C", panel]);
  for (const { file } of patchFiles) {
    fs.mkdirSync(path.dirname(path.join(panel, file)), { recursive: true });
    fs.copyFileSync(path.join(checkout, file), path.join(panel, file));
  }
  fs.cpSync(
    path.join(checkout, "public/build"),
    path.join(panel, "public/build"),
    { recursive: true },
  );
  fs.cpSync("scripts/runtime-benchmark", path.join(context, "harness"), {
    recursive: true,
  });
  fs.copyFileSync(
    "scripts/runtime-benchmark/Dockerfile",
    path.join(context, "Dockerfile"),
  );
  const database = `${family}-database`,
    cache = `${family}-cache`,
    container = `${project}-${family}`,
    port = 8093 + index;
  services[database] = {
    image: "mariadb:11",
    cpus: 1,
    mem_limit: "512m",
    environment: {
      MARIADB_DATABASE: "panel",
      MARIADB_USER: "benchmark",
      MARIADB_PASSWORD: "disposable-benchmark",
      MARIADB_ROOT_PASSWORD: randomBytes(24).toString("hex"),
    },
    volumes: [`${family}-database:/var/lib/mysql`],
    healthcheck: {
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"],
      interval: "2s",
      timeout: "3s",
      retries: 60,
    },
  };
  services[cache] = {
    image: "redis:7-alpine",
    cpus: 0.5,
    mem_limit: "128m",
    healthcheck: {
      test: ["CMD", "redis-cli", "ping"],
      interval: "2s",
      timeout: "3s",
      retries: 30,
    },
  };
  volumes[`${family}-database`] = {};
  services[family] = {
    build: {
      context: context.replaceAll("\\", "/"),
      args: { RUNTIME_IMAGE: runtimeImage },
    },
    image: `${project}:${family}`,
    container_name: container,
    cpus: 2,
    mem_limit: "1g",
    ports: [`127.0.0.1:${port}:80`],
    depends_on: {
      [database]: { condition: "service_healthy" },
      [cache]: { condition: "service_healthy" },
    },
    environment: {
      PANEL_RUNTIME_BENCHMARK: "disposable-fixture",
      BENCHMARK_PASSWORD: randomBytes(24).toString("hex"),
      APP_NAME: "Aquadactyl",
      APP_URL: `http://127.0.0.1:${port}`,
      APP_KEY: `base64:${randomBytes(32).toString("base64")}`,
      HASHIDS_SALT: randomBytes(24).toString("hex"),
      APP_ENV: "production",
      APP_DEBUG: "false",
      APP_TIMEZONE: "UTC",
      APP_ENVIRONMENT_ONLY: "false",
      DB_HOST: database,
      DB_PORT: "3306",
      DB_DATABASE: "panel",
      DB_USERNAME: "benchmark",
      DB_PASSWORD: "disposable-benchmark",
      CACHE_STORE: "redis",
      CACHE_DRIVER: "redis",
      SESSION_DRIVER: "redis",
      SESSION_SECURE_COOKIE: "false",
      SESSION_COOKIE: `optimization_${family}`,
      QUEUE_CONNECTION: "redis",
      QUEUE_DRIVER: "redis",
      REDIS_HOST: cache,
      REDIS_PORT: "6379",
      REDIS_PASSWORD: "null",
      REDIS_CLIENT: "phpredis",
      MAIL_MAILER: "log",
      RECAPTCHA_ENABLED: "false",
      PTERODACTYL_TELEMETRY_ENABLED: "false",
      AQUADACTYL_TELEMETRY_ENABLED: "false",
      APP_API_CLIENT_RATELIMIT: "1000000",
      APP_API_APPLICATION_RATELIMIT: "1000000",
      ADDONS_HOOKS_ENABLED: "false",
    },
    healthcheck: {
      test: [
        "CMD",
        "curl",
        "--fail",
        "--silent",
        "--output",
        "/dev/null",
        "http://127.0.0.1/auth/login",
      ],
      interval: "3s",
      timeout: "5s",
      start_period: "90s",
      retries: 30,
    },
  };
  manifest.panels[family] = {
    revision,
    repository: "Aquadactyl/aquadactyl",
    ref: `main (${family})`,
    port,
    container,
    databaseContainer: `${project}-${family}-database-1`,
    cacheContainer: `${project}-${family}-cache-1`,
    composerLockSha256: hash(path.join(panel, "composer.lock")),
    frontendManifestSha256: hash(
      path.join(panel, "public/build/manifest.json"),
    ),
    patchFiles,
    patchSha256: createHash("sha256")
      .update(JSON.stringify(patchFiles))
      .digest("hex"),
  };
}
fs.writeFileSync(
  path.join(work, "compose.json"),
  JSON.stringify({ name: project, services, volumes }, null, 2),
);
fs.writeFileSync(
  path.join(work, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);
console.log(work);
