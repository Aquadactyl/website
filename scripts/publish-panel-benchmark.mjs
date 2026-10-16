// Import a completed three-way run without relabelling it as a new measurement.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const [recordedDirectory, checkout] = process.argv.slice(2);
assert.ok(
  recordedDirectory && checkout,
  "Provide the recorded run directory and panel checkout.",
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => execFileSync("git", args, { cwd: checkout });
const read = (file) => fs.readFileSync(path.join(recordedDirectory, file));
const originalBytes = read("results.json");
const original = JSON.parse(originalBytes);
const provenance = JSON.parse(read("provenance.json"));
assert.ok(original.completedAt);
assert.equal(original.browserRuns.length, 60);
assert.equal(original.apiRuns.length, 54);
assert.equal(original.memoryRuns.length, 18);
assert.equal(hash(originalBytes), provenance.rawReportSha256);
assert.equal(hash(read("results-runner.txt")), original.harnessSha256);
assert.deepEqual(Object.keys(original.panels).sort(), [
  "after",
  "before",
  "pterodactyl",
]);
assert.equal(
  git("status", "--porcelain", "--untracked-files=no").toString().trim(),
  "",
);
const commit = git("rev-parse", "HEAD").toString().trim();

const expected = new Map(
  original.panels.before.patchFiles
    .filter(
      ({ file }) =>
        file.startsWith("app/") ||
        (file.startsWith("resources/scripts/") && !file.includes(".spec.")),
    )
    .map(({ file, sha256 }) => [file, sha256]),
);
for (const { file, sha256 } of provenance.candidateFiles)
  expected.set(file, sha256);
expected.set("public/fonts/inter.css", provenance.fontStylesheetSha256);
for (const { file, sha256 } of provenance.fontSubsets)
  expected.set("public/fonts/inter/" + file, sha256);
const sourceChecks = [...expected].map(([file, servedSha256]) => {
  const local = fs.readFileSync(path.join(checkout, file));
  const committed = git("show", commit + ":" + file);
  assert.equal(hash(local), servedSha256, "Recorded source differs: " + file);
  const text = !file.endsWith(".woff2");
  assert.equal(
    hash(text ? committed.toString().replaceAll("\r\n", "\n") : committed),
    hash(text ? local.toString().replaceAll("\r\n", "\n") : local),
    "Committed source differs: " + file,
  );
  return { file, servedSha256, committedSha256: hash(committed) };
});

const directory = "public/benchmarks";
const previous = JSON.parse(
  fs.readFileSync(directory + "/panel-comparison.json", "utf8"),
);
if (previous.measuredOn !== original.measuredOn) {
  const archive = path.join(directory, "archive", previous.measuredOn);
  fs.mkdirSync(archive, { recursive: true });
  for (const file of [
    "panel-comparison.json",
    "panel-comparison-summary.json",
    "panel-comparison-runner.txt",
    "panel-comparison-aquadactyl.patch",
  ]) {
    const bytes = fs.readFileSync(path.join(directory, file));
    const target = path.join(archive, file);
    if (fs.existsSync(target))
      assert.equal(hash(fs.readFileSync(target)), hash(bytes));
    else fs.writeFileSync(target, bytes);
  }
}
const fullFile = "panel-runtime-" + original.measuredOn + ".json";
const provenanceFile =
  "panel-runtime-" + original.measuredOn + "-provenance.json";
const writeImmutable = (file, bytes) => {
  const target = path.join(directory, file);
  if (fs.existsSync(target))
    assert.equal(
      hash(fs.readFileSync(target)),
      hash(bytes),
      "A different record already exists: " + file,
    );
  else fs.writeFileSync(target, bytes);
};
writeImmutable(fullFile, originalBytes);
writeImmutable(provenanceFile, read("provenance.json"));
fs.writeFileSync(
  path.join(directory, "panel-comparison-diagnostics.json"),
  read("post-run-diagnostics.json"),
);
fs.writeFileSync(
  path.join(directory, "panel-comparison-runner.txt"),
  read("results-runner.txt"),
);
const patch = git(
  "diff",
  "--binary",
  "--full-index",
  original.panels.after.revision,
  commit,
);
fs.writeFileSync(
  path.join(directory, "panel-comparison-aquadactyl.patch"),
  patch,
);
const report = structuredClone(original);
report.comparison =
  "Aquadactyl candidate and pinned Pterodactyl, selected from the recorded three-way run";
report.panels = {
  aquadactyl: report.panels.after,
  pterodactyl: report.panels.pterodactyl,
};
const aqua = report.panels.aquadactyl;
aqua.ref = aqua.revision.slice(0, 12) + " + recorded runtime changes";
aqua.appliedCommit = commit;
aqua.sourcePatchSha256 = hash(patch);
aqua.patchFiles = git("diff", "--name-only", aqua.revision, commit)
  .toString()
  .trim()
  .split(/\r?\n/)
  .map((file) => ({ file, sha256: hash(git("show", commit + ":" + file)) }));
aqua.committedSourceChecks = sourceChecks;
for (const key of ["browserRuns", "apiRuns", "memoryRuns"])
  report[key] = report[key]
    .filter((run) => run.family !== "before")
    .map((run) => ({
      ...run,
      family: run.family === "after" ? "aquadactyl" : run.family,
    }));
report.projection = {
  file: fullFile,
  sha256: hash(originalBytes),
  provenanceFile,
  families: { aquadactyl: "after", pterodactyl: "pterodactyl" },
  originalCounts: { browserRuns: 60, apiRuns: 54, memoryRuns: 18 },
  note: "All values are unchanged. The original run alternated three separately provisioned stacks (previous Aquadactyl, candidate, Pterodactyl). This report selects the candidate and Pterodactyl for the homepage; it is not a separately timed two-panel run.",
};
report.provenance = provenance;
fs.writeFileSync(
  path.join(directory, "panel-comparison.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  "Published the unchanged three-way record and its two-panel view; verified " +
    sourceChecks.length +
    " runtime/font source files against " +
    commit.slice(0, 12) +
    ".",
);
