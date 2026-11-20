// Collect public source/provenance only; never includes private state or Compose secrets.
// node scripts/collect-benchmark-setup.mjs <panel-work> <daemon-work> <completed-output>
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const [runtime, daemon, output] = process.argv
  .slice(2)
  .map((p) => path.resolve(p));
const here = path.dirname(fileURLToPath(import.meta.url));
const hash = (b) => createHash("sha256").update(b).digest("hex");
const record = (file, target) => {
  const bytes = fs.readFileSync(target);
  return { file, sha256: hash(bytes), content: bytes.toString("utf8") };
};
const reportFile = path.join(output, "panels.json"),
  report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
assert(report.completedAt);
const files = [
  "Dockerfile",
  "Dockerfile.runtime",
  "entrypoint.sh",
  "nginx.conf",
  "php-fpm.conf",
  "seed.php",
  "supervisord.conf",
];
const panels = Object.fromEntries(
  Object.keys(report.panels).map((family) => [
    family,
    files.map((file) =>
      record(
        file,
        path.join(
          runtime,
          family,
          file === "Dockerfile" ? "Dockerfile" : "harness/" + file,
        ),
      ),
    ),
  ]),
);
const mismatch = panels.aquadactyl.some(
  (f) =>
    report.setupFiles.find((old) => old.file === f.file)?.sha256 !== f.sha256,
);
const setup = {
  schemaVersion: 1,
  measuredOn: report.measuredOn,
  panelReportSha256: hash(fs.readFileSync(reportFile)),
  panels,
  notes: mismatch
    ? [
        "The panel report setupFiles array is the preparation-time snapshot. These final built-context hashes supersede changed entries after harness-only setup corrections. No application source or timed samples were changed.",
        "The Dockerfile normalizes the entrypoint shell script to LF inside each runtime image; the source context bytes remain recorded here.",
      ]
    : [],
  daemonRunnerFiles: fs
    .readdirSync(path.join(daemon, "runner"))
    .sort()
    .map((file) => record(file, path.join(daemon, "runner", file))),
  daemonSetupFiles: [
    "setup.mjs",
    "run.mjs",
    "safe-properties.mjs",
    "provision.php",
    "Dockerfile",
  ].map((file) => record(file, path.join(here, "daemon-suite", file))),
};
for (const item of ["builds", "panels"]) {
  const r = JSON.parse(
    fs.readFileSync(path.join(output, item + ".json"), "utf8"),
  );
  assert.equal(
    hash(fs.readFileSync(path.join(output, item + "-runner.txt"))),
    r.harnessSha256,
    "Exact measured runner missing.",
  );
}
fs.writeFileSync(
  path.join(output, "setup.json"),
  JSON.stringify(setup, null, 2) + "\n",
);
console.log(
  "Collected final credential-free setup and exact runner provenance.",
);
