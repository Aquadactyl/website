import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { crc32 } from "node:zlib";

const reference = JSON.parse(
  fs.readFileSync("public/api/reference.json", "utf8"),
);
assert.equal(reference.operations.length, reference.routeCount);
assert.equal(
  new Set(reference.operations.map((o) => `${o.method} ${o.path}`)).size,
  reference.routeCount,
);
assert.match(reference.revision, /^[a-f0-9]{40}$/);
for (const operation of reference.operations) {
  const doc = fs.readFileSync(
    `docs${operation.documentation.slice(5)}.mdx`,
    "utf8",
  );
  assert.ok(
    doc.includes(`id="${operation.id}"`),
    `Missing endpoint anchor: ${operation.id}`,
  );
  assert.ok(
    doc.includes(`## ${operation.method} \`${operation.path}\``),
    `Missing endpoint: ${operation.path}`,
  );
  assert.ok(
    operation.source.includes(reference.revision),
    "Unpinned source reference",
  );
  for (const [field, rule] of operation.fields) {
    assert.equal(typeof field, "string");
    assert.equal(typeof rule, "string");
    assert.ok(
      !/\$(?:rules|data)\[/.test(rule),
      `Unresolved rule for ${operation.path}: ${field}`,
    );
  }
}
const status = (method, suffix) =>
  reference.operations.find(
    (o) => o.method === method && o.path.endsWith(suffix),
  )?.successStatus;
assert.equal(status("POST", "/schedules/{schedule}/execute"), 202);
assert.equal(status("POST", "/settings/reinstall"), 202);
assert.equal(status("DELETE", "/api/application/locations/{location:id}"), 204);
assert.equal(status("POST", "/api/application/servers"), 201);

// Verify every ZIP payload and its central-directory offset against the editable source.
const archive = fs.readFileSync("public/examples/serverpulse.blueprint");
const entries = new Map();
let offset = 0;
while (archive.readUInt32LE(offset) === 0x04034b50) {
  const start = offset;
  const size = archive.readUInt32LE(offset + 18);
  const nameLength = archive.readUInt16LE(offset + 26);
  const extraLength = archive.readUInt16LE(offset + 28);
  const name = archive
    .subarray(offset + 30, offset + 30 + nameLength)
    .toString();
  offset += 30 + nameLength + extraLength;
  const data = archive.subarray(offset, offset + size);
  assert.equal(
    crc32(data),
    archive.readUInt32LE(start + 14),
    `ZIP checksum: ${name}`,
  );
  assert.deepEqual(
    data,
    fs.readFileSync(path.join("examples/serverpulse", name)),
    `Stale ZIP source: ${name}`,
  );
  entries.set(name, start);
  offset += size;
}
assert.ok(entries.has("conf.yml"));
assert.ok(entries.has("components/Components.yml"));
while (archive.readUInt32LE(offset) === 0x02014b50) {
  const nameLength = archive.readUInt16LE(offset + 28);
  const name = archive
    .subarray(offset + 46, offset + 46 + nameLength)
    .toString();
  assert.equal(archive.readUInt32LE(offset + 42), entries.get(name));
  offset +=
    46 +
    nameLength +
    archive.readUInt16LE(offset + 30) +
    archive.readUInt16LE(offset + 32);
}
assert.equal(archive.readUInt32LE(offset), 0x06054b50);
assert.equal(archive.readUInt16LE(offset + 10), entries.size);
const digest = createHash("sha256").update(archive).digest("hex");
assert.ok(
  fs
    .readFileSync("public/examples/serverpulse.blueprint.sha256", "utf8")
    .startsWith(digest),
);
const sourcePage = fs.readFileSync(
  "docs/blueprint/server-pulse-source.mdx",
  "utf8",
);
assert.ok(
  sourcePage.includes(
    fs
      .readFileSync("examples/serverpulse/components/ServerPulse.tsx", "utf8")
      .trim(),
  ),
);

// Check local page/file targets in the new documentation, including static downloads.
const files = [
  ...fs
    .readdirSync("docs/api", { recursive: true })
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join("docs/api", f)),
  "docs/blueprint/development.mdx",
  "docs/blueprint/example-extension.mdx",
  "docs/blueprint/server-pulse-source.mdx",
];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const [, href] of text.matchAll(/\]\((\/[^)]+)\)/g)) {
    const target = href.split("#")[0];
    const candidates = target.startsWith("/docs/")
      ? [`docs/${target.slice(6)}.mdx`, `docs/${target.slice(6)}/index.mdx`]
      : [`public${target}`];
    assert.ok(
      candidates.some((f) => fs.existsSync(f)),
      `${file}: broken link ${href}`,
    );
  }
}
console.log(
  `Verified ${reference.routeCount} endpoint references, source rules, documentation links, ${entries.size} ZIP entries and SHA-256.`,
);
