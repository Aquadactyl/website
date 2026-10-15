import fs from "node:fs";

const report = JSON.parse(
  fs.readFileSync("public/benchmarks/panels.json", "utf8"),
);
const { aquadactyl: aqua, pterodactyl: ptero } = report.panels;
const bytes = (value) =>
  `${value.toLocaleString("en-GB")} bytes (${(value / 1024).toFixed(1)} KiB)`;
const seconds = (value) => `${(value / 1000).toFixed(3)} s`;
const saving = (a, p) => `${((1 - a / p) * 100).toFixed(1)}%`;
const source = (panel) =>
  `https://github.com/${panel.repository}/tree/${panel.revision}`;
const code = (value) => "\n```bash\n" + value + "\n```\n";
const cloneCommands = [
  "git clone https://github.com/Aquadactyl/aquadactyl.git aquadactyl-bench",
  `git -C aquadactyl-bench checkout --detach ${aqua.revision}`,
  `git clone --branch ${ptero.ref} https://github.com/pterodactyl/panel.git pterodactyl-bench`,
  "",
  "cd aquadactyl-bench",
  "pnpm install --frozen-lockfile --ignore-scripts",
  "cd ../pterodactyl-bench",
  "yarn install --frozen-lockfile --ignore-scripts",
].join("\n");

const doc = `---
title: Pterodactyl vs Aquadactyl benchmarks
description: Reproducible frontend asset and production-build measurements, with raw samples, source revisions and methodology.
---

On ${report.measuredOn}, the reviewed Aquadactyl frontend emitted **${saving(aqua.dashboard.totalGzipBytes, ptero.dashboard.totalGzipBytes)} less dashboard JavaScript and CSS under gzip** than the reviewed Pterodactyl release. Its median production frontend build was **${seconds(aqua.buildMs.median)}**, compared with **${seconds(ptero.buildMs.median)}** for Pterodactyl, a **${(ptero.buildMs.median / aqua.buildMs.median).toFixed(2)}× build-duration ratio** (Pterodactyl ÷ Aquadactyl).

These are local measurements of built frontend artifacts and build duration.
The separate [runtime benchmark](/docs/panel/runtime-benchmarks) measures browser
load time, authenticated API throughput and memory use. Neither comparison
measures Wings or game-server performance.

[Interactive showcase](/#benchmarks) · [Raw results and file hashes](/benchmarks/panels.json) · [Build output](/benchmarks/build-logs.txt)

## Compared source

| Panel | Ref | Exact commit | Toolchain |
| --- | --- | --- | --- |
| Aquadactyl | ${aqua.ref}, pinned | [${aqua.revision.slice(0, 12)}](${source(aqua)}) | ${aqua.toolchain} |
| Pterodactyl | ${ptero.ref} | [${ptero.revision.slice(0, 12)}](${source(ptero)}) | ${ptero.toolchain} |

Pterodactyl ${ptero.ref} was the latest release returned by the official repository
when the comparison was prepared. These results apply to these exact commits.
Both source checkouts had no tracked changes and no installed third-party addons.
Aquadactyl's bundled Blueprint framework was included as shipped.

The older before/after numbers in Aquadactyl's own performance notes describe a
different comparison. They were not used as a Pterodactyl baseline here.

## Dashboard assets

| Measurement | Pterodactyl | Aquadactyl | Reduction |
| --- | --- | --- | --- |
| JavaScript, uncompressed | ${bytes(ptero.dashboard.jsBytes)} | ${bytes(aqua.dashboard.jsBytes)} | ${saving(aqua.dashboard.jsBytes, ptero.dashboard.jsBytes)} |
| JavaScript, gzip estimate | ${bytes(ptero.dashboard.jsGzipBytes)} | ${bytes(aqua.dashboard.jsGzipBytes)} | ${saving(aqua.dashboard.jsGzipBytes, ptero.dashboard.jsGzipBytes)} |
| Separate CSS, uncompressed | ${bytes(ptero.dashboard.cssBytes)} | ${bytes(aqua.dashboard.cssBytes)} | — |
| Separate CSS, gzip estimate | ${bytes(ptero.dashboard.cssGzipBytes)} | ${bytes(aqua.dashboard.cssGzipBytes)} | — |
| JavaScript + CSS, uncompressed | ${bytes(ptero.dashboard.totalBytes)} | ${bytes(aqua.dashboard.totalBytes)} | ${saving(aqua.dashboard.totalBytes, ptero.dashboard.totalBytes)} |
| JavaScript + CSS, gzip estimate | ${bytes(ptero.dashboard.totalGzipBytes)} | ${bytes(aqua.dashboard.totalGzipBytes)} | ${saving(aqua.dashboard.totalGzipBytes, ptero.dashboard.totalGzipBytes)} |

Pterodactyl's CSS is carried inside its JavaScript through style-loader. Zero
separate CSS bytes does not mean it has no styles. The headline includes
JavaScript **and** separately emitted CSS to account for this difference.

For Aquadactyl, the script follows the Vite manifest's entry and dashboard route,
recursively adding their static imports and CSS. It does not add unrelated
dynamic routes. For Pterodactyl, it reads Webpack's main entry files and dashboard
chunk group from the actual compilation. Shared files are counted once.

Each file is gzipped individually at level ${report.environment.gzipLevel}, then the
sizes are summed. This is a transfer-size estimate, not an HTTP measurement.
Fonts, images, translations, HTML, API payloads and transport headers are outside
this asset count. Payload totals come from the final measured build; per-build
payload samples and every counted filename/SHA-256 are in the raw report.

## Production build time

| Measurement | Pterodactyl | Aquadactyl |
| --- | --- | --- |
| Median of five | ${seconds(ptero.buildMs.median)} | ${seconds(aqua.buildMs.median)} |
| Minimum | ${seconds(ptero.buildMs.min)} | ${seconds(aqua.buildMs.min)} |
| Maximum | ${seconds(ptero.buildMs.max)} | ${seconds(aqua.buildMs.max)} |

| Measured sample | Pterodactyl | Aquadactyl |
| --- | --- | --- |
${aqua.buildMs.samples.map((value, index) => `| ${index + 1} | ${seconds(ptero.buildMs.samples[index])} | ${seconds(value)} |`).join("\n")}

Each panel had one discarded warm-up and five measured builds. After warm-up,
run order alternated by round: Aquadactyl/Pterodactyl, then
Pterodactyl/Aquadactyl. Builds ran sequentially in fresh Node processes with
production mode and each repository's default production bundler configuration.

Timing includes loading the bundler and its configuration, compiling assets and
compiler shutdown. It excludes dependency installation, package-manager startup
and the script's artifact analysis. Upstream's JS/map clean step runs before its
timer; Vite performs its normal output cleanup during the build. The results
compare the shipped toolchains, rather than swapping both to the same bundler.

Locked dependencies were installed first, with lifecycle scripts disabled for
both installs. The build itself ran normally. No package versions or optimization
settings were changed. This shared development machine was not CPU-isolated;
background processes and operating-system caches were not controlled. Repeat
the test on your build host when estimating deployment time.

## Test environment

| Setting | Value |
| --- | --- |
| CPU | ${report.environment.cpu} |
| Logical processors | ${report.environment.logicalCpus} |
| RAM reported by OS, rounded | ${report.environment.memoryGiB} GiB |
| OS | ${report.environment.platform} ${report.environment.osRelease} ${report.environment.arch} |
| Node.js | ${report.environment.node} |
| Dependency installs in this run | pnpm 12.10.1 for Aquadactyl; Yarn Classic 1.22.19 for Pterodactyl |
| Extra installed addons | 0 |

## Reproduce

Use clean, separate source checkouts. The benchmark writes generated build
assets in those checkouts. It does not connect to a running panel or require
PHP, a database, administrator credentials or a game server.
${code(cloneCommands)}

From the website repository, using the absolute paths to those checkouts:
${code("node scripts/benchmark-panels.mjs /path/to/aquadactyl-bench /path/to/pterodactyl-bench\nnode scripts/verify-panel-showcase.mjs")}

The script saves the raw JSON, build output and this guide. The homepage reads
the same JSON so its numbers update together. Preserve the source revisions and
lockfile hashes when publishing a new comparison.
`;
fs.writeFileSync("docs/panel/benchmarks.mdx", doc);
console.log("Updated docs/panel/benchmarks.mdx from the measured report.");
