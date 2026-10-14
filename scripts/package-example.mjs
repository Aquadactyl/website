// A .blueprint file is a ZIP. Store entries without compression for reproducible,
// dependency-free packaging on Windows, Linux and macOS.
import fs from "node:fs";
import path from "node:path";
import { crc32 } from "node:zlib";
import { createHash } from "node:crypto";

const directory = "examples/serverpulse";
const files = fs
  .readdirSync(directory, { recursive: true })
  .filter((f) => fs.statSync(path.join(directory, f)).isFile())
  .sort();
const entries = [];
const central = [];
let offset = 0;
for (const file of files) {
  const name = Buffer.from(file.replaceAll("\\", "/"));
  const data = fs.readFileSync(path.join(directory, file));
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6); // UTF-8 names
  header.writeUInt16LE(33, 12); // 1980-01-01
  header.writeUInt32LE(crc32(data), 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(name.length, 26);
  const record = Buffer.alloc(46);
  record.writeUInt32LE(0x02014b50, 0);
  record.writeUInt16LE(20, 4);
  header.copy(record, 6, 4, 30);
  record.writeUInt32LE(offset, 42);
  entries.push(header, name, data);
  central.push(record, name);
  offset += header.length + name.length + data.length;
}
const index = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(index.length, 12);
end.writeUInt32LE(offset, 16);
const archive = Buffer.concat([...entries, index, end]);
fs.mkdirSync("public/examples", { recursive: true });
fs.writeFileSync("public/examples/serverpulse.blueprint", archive);
const digest = createHash("sha256").update(archive).digest("hex");
fs.writeFileSync(
  "public/examples/serverpulse.blueprint.sha256",
  `${digest}  serverpulse.blueprint\n`,
);

let doc = `---\ntitle: Server Pulse source\ndescription: Complete source for the downloadable Blueprint extension example.\n---\n\n[Walkthrough](/docs/blueprint/example-extension) · [Download package](/examples/serverpulse.blueprint) · [SHA-256](/examples/serverpulse.blueprint.sha256)\n\nGenerated from the same files as the downloadable package. Edit the source under \`examples/serverpulse\` and run \`node scripts/package-example.mjs\` to update both.\n\n`;
for (const file of files.filter((f) => !["README.md", "LICENSE"].includes(f))) {
  const language = file.endsWith(".tsx")
    ? "tsx"
    : file.endsWith(".yml")
      ? "yaml"
      : file.endsWith(".css")
        ? "css"
        : "html";
  doc += `## ${file.replaceAll("\\", "/")}\n\n\`\`\`${language}\n${fs.readFileSync(path.join(directory, file), "utf8").trim()}\n\`\`\`\n\n`;
}
fs.writeFileSync("docs/blueprint/server-pulse-source.mdx", doc);
console.log(
  `Packaged ${files.length} files (${archive.length} bytes). SHA-256: ${digest}`,
);
