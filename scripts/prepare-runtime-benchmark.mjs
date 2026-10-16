import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";

const harness = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "runtime-benchmark",
);
const includeWorkingTree = process.argv.includes("--include-working-tree");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "panel-runtime-benchmark-"));
const runtimeImage = process.env.BENCHMARK_RUNTIME_IMAGE || "aquadactyl:test";
const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
    ...options,
  });
const services = {};
const manifest = {
  work,
  runtimeImage,
  runtimeImageId: run("docker", [
    "image",
    "inspect",
    runtimeImage,
    "--format",
    "{{.Id}}",
  ]).trim(),
  panels: {},
};
for (const [index, family] of ["aquadactyl", "pterodactyl"].entries()) {
  const checkout = path.resolve(process.argv[index + 2] || "");
  if (!process.argv[index + 2])
    throw new Error("Provide two clean, previously built source checkouts.");
  const revision = run("git", ["rev-parse", "HEAD"], { cwd: checkout }).trim();
  const changed = run("git", ["diff", "--name-only", "HEAD"], { cwd: checkout })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const added = run("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: checkout,
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const patchFiles = [...new Set([...changed, ...added])]
    .sort()
    .map((file) => ({
      file,
      sha256: fs.existsSync(path.join(checkout, file))
        ? createHash("sha256")
            .update(fs.readFileSync(path.join(checkout, file)))
            .digest("hex")
        : null,
    }));
  if (patchFiles.length && !includeWorkingTree)
    throw new Error(
      `${family}: working tree changes found; explicitly use --include-working-tree to record them.`,
    );
  const context = path.join(work, family);
  const panel = path.join(context, "panel");
  fs.mkdirSync(panel, { recursive: true });
  const archive = path.join(work, `${family}.tar`);
  run("git", ["archive", "--format=tar", "-o", archive, "HEAD"], {
    cwd: checkout,
  });
  run("tar", ["-xf", archive, "-C", panel]);
  for (const { file, sha256 } of patchFiles) {
    const target = path.join(panel, file);
    if (sha256 === null) fs.rmSync(target);
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(checkout, file), target);
    }
  }
  let sourcePatchSha256;
  if (patchFiles.length) {
    const index = path.join(work, `${family}.index`);
    const options = {
      cwd: checkout,
      env: { ...process.env, GIT_INDEX_FILE: index },
    };
    run("git", ["read-tree", "HEAD"], options);
    run("git", ["add", "-A"], options);
    const patch = run("git", ["diff", "--cached", "--binary", "HEAD"], options);
    fs.writeFileSync(path.join(work, `${family}-source.patch`), patch);
    sourcePatchSha256 = createHash("sha256").update(patch).digest("hex");
    fs.unlinkSync(index);
  }
  const assets = family === "aquadactyl" ? "public/build" : "public/assets";
  fs.cpSync(path.join(checkout, assets), path.join(panel, assets), {
    recursive: true,
  });
  fs.cpSync(harness, path.join(context, "harness"), { recursive: true });
  fs.copyFileSync(
    path.join(harness, "Dockerfile"),
    path.join(context, "Dockerfile"),
  );
  fs.writeFileSync(
    path.join(context, ".dockerignore"),
    "panel/.git\npanel/node_modules\npanel/vendor\n",
  );
  const port = 8091 + index;
  const database = `${family}-database`;
  const cache = `${family}-cache`;
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
  services[family] = {
    build: {
      context: context.replaceAll("\\", "/"),
      args: { RUNTIME_IMAGE: runtimeImage },
    },
    image: `panel-runtime-benchmark:${family}`,
    container_name: `panel-runtime-benchmark-${family}`,
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
      APP_NAME: family === "aquadactyl" ? "Aquadactyl" : "Pterodactyl",
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
      SESSION_COOKIE: `${family}_benchmark`,
      QUEUE_CONNECTION: "redis",
      QUEUE_DRIVER: "redis",
      REDIS_HOST: cache,
      REDIS_PASSWORD: "null",
      REDIS_PORT: "6379",
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
    repository: `https://github.com/${family === "aquadactyl" ? "Aquadactyl/aquadactyl" : "pterodactyl/panel"}`,
    ref:
      run("git", ["describe", "--always", "--tags"], { cwd: checkout }).trim() +
      (patchFiles.length ? " + recorded working-tree changes" : ""),
    patchFiles,
    sourcePatchSha256,
    frontendFiles: fs
      .readdirSync(path.join(panel, assets), { recursive: true })
      .filter((file) => fs.statSync(path.join(panel, assets, file)).isFile())
      .sort()
      .map((file) => ({
        file: file.replaceAll("\\", "/"),
        sha256: createHash("sha256")
          .update(fs.readFileSync(path.join(panel, assets, file)))
          .digest("hex"),
      })),
    port,
    container: services[family].container_name,
    composerLockSha256: createHash("sha256")
      .update(fs.readFileSync(path.join(panel, "composer.lock")))
      .digest("hex"),
  };
}
fs.writeFileSync(
  path.join(work, "compose.json"),
  JSON.stringify(
    {
      name: "panel-runtime-benchmark",
      services,
      volumes: { "aquadactyl-database": {}, "pterodactyl-database": {} },
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(work, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);
console.log(work);
