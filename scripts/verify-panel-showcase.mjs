import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import {
  panelFeatures,
  featureCategories,
  panelReview,
} from "../src/lib/panel-features.ts";

const report = JSON.parse(
  fs.readFileSync("public/benchmarks/panels.json", "utf8"),
);
const guide = fs.readFileSync("docs/panel/benchmarks.mdx", "utf8");
assert.equal(
  new Set(panelFeatures.map((feature) => feature.id)).size,
  panelFeatures.length,
);
assert.equal(panelFeatures.length, 28);
for (const feature of panelFeatures) {
  assert.ok(featureCategories.includes(feature.category));
  assert.ok(feature.upstream.length > 20 && feature.text.length > 20);
  const [href, anchor] = feature.href.split("#");
  const file = `docs/${href.slice("/docs/".length)}.mdx`;
  const content = fs.readFileSync(file, "utf8");
  if (anchor)
    assert.ok(
      content.includes(`[#${anchor}]`),
      `Missing feature anchor ${feature.href}`,
    );
  if (process.argv[2])
    assert.ok(
      fs.existsSync(
        feature.source.startsWith("/")
          ? path.join("public", feature.source)
          : path.join(process.argv[2], feature.source),
      ),
      `Missing feature source: ${feature.source}`,
    );
}
assert.match(report.measuredOn, /^\d{4}-\d{2}-\d{2}$/);
assert.equal(report.methodology.repetitions, 5);
assert.equal(report.methodology.order.length, 12);
assert.equal(report.methodology.order.filter((run) => run.warmup).length, 2);
for (const [family, panel] of Object.entries(report.panels)) {
  // Build records are historical; feature reviews can follow a newer revision.
  if (family === "pterodactyl")
    assert.equal(panel.revision, panelReview[family]);
  assert.equal(panel.buildMs.samples.length, 5);
  const sorted = [...panel.buildMs.samples].sort((a, b) => a - b);
  assert.equal(panel.buildMs.median, sorted[2]);
  assert.equal(panel.buildMs.min, sorted[0]);
  assert.equal(panel.buildMs.max, sorted[4]);
  assert.deepEqual(
    report.methodology.order
      .filter((run) => run.family === family && !run.warmup)
      .map((run) => run.buildMs),
    panel.buildMs.samples,
  );
  const root = process.argv[family === "aquadactyl" ? 2 : 3];
  const directory = family === "aquadactyl" ? "public/build" : "public/assets";
  for (const measurement of [panel.entry, panel.dashboard]) {
    assert.equal(
      new Set(measurement.files.map((file) => file.file)).size,
      measurement.files.length,
    );
    const sum = (extension, key) =>
      measurement.files
        .filter((file) => file.file.endsWith(extension))
        .reduce((total, file) => total + file[key], 0);
    assert.equal(measurement.jsBytes, sum(".js", "bytes"));
    assert.equal(measurement.jsGzipBytes, sum(".js", "gzipBytes"));
    assert.equal(measurement.cssBytes, sum(".css", "bytes"));
    assert.equal(measurement.cssGzipBytes, sum(".css", "gzipBytes"));
    assert.equal(
      measurement.totalBytes,
      measurement.jsBytes + measurement.cssBytes,
    );
    assert.equal(
      measurement.totalGzipBytes,
      measurement.jsGzipBytes + measurement.cssGzipBytes,
    );
    for (const file of measurement.files) {
      assert.match(file.sha256, /^[0-9a-f]{64}$/);
      if (root) {
        const bytes = fs.readFileSync(path.join(root, directory, file.file));
        assert.equal(
          createHash("sha256").update(bytes).digest("hex"),
          file.sha256,
        );
        assert.equal(bytes.length, file.bytes);
        assert.equal(
          gzipSync(bytes, { level: report.environment.gzipLevel }).length,
          file.gzipBytes,
        );
      }
    }
  }
  assert.ok(
    guide.includes((panel.buildMs.median / 1000).toFixed(3)),
    "Guide contains stale build timing",
  );
  assert.ok(
    guide.includes(panel.revision.slice(0, 12)),
    "Guide contains stale source revision",
  );
}
const reduction = (
  (1 -
    report.panels.aquadactyl.dashboard.totalGzipBytes /
      report.panels.pterodactyl.dashboard.totalGzipBytes) *
  100
).toFixed(1);
assert.ok(guide.includes(`**${reduction}% less`));
assert.equal(report.panels.pterodactyl.ref, panelReview.pterodactylRelease);
const logs = fs.readFileSync("public/benchmarks/build-logs.txt", "utf8");
assert.equal((logs.match(/^=== /gm) || []).length, 12);
console.log(
  `Verified ${panelFeatures.length} feature areas and links, both benchmark revisions, 10 measured builds, asset accounting${process.argv[2] ? ", emitted-file hashes and gzip sizes" : ""}.`,
);
