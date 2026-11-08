"use strict";
// Sanity checks: manifest references exist, versions match, built zip is valid.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");
const manifest = JSON.parse(fs.readFileSync(path.join(src, "manifest.json"), "utf8"));
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

assert.strictEqual(manifest.version, pkg.version, "manifest and package.json versions differ");

const referenced = [
  ...Object.values(manifest.icons || {}),
  manifest.browser_action.default_popup,
  manifest.browser_action.default_icon,
  ...manifest.content_scripts.flatMap((c) => c.js),
];
for (const f of referenced) {
  assert.ok(fs.existsSync(path.join(src, f)), `manifest references missing file: ${f}`);
}

const zipPath = path.join(root, "dist", `dark-mode-anywhere-${manifest.version}.zip`);
assert.ok(fs.existsSync(zipPath), "zip missing; run npm run build first");

// Read the central directory and verify every entry inflates to the source file.
const zip = fs.readFileSync(zipPath);
const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
const count = zip.readUInt16LE(eocd + 10);
let p = zip.readUInt32LE(eocd + 16);
const names = [];
for (let i = 0; i < count; i++) {
  const method = zip.readUInt16LE(p + 10);
  const csize = zip.readUInt32LE(p + 20);
  const nlen = zip.readUInt16LE(p + 28);
  const loff = zip.readUInt32LE(p + 42);
  const name = zip.toString("utf8", p + 46, p + 46 + nlen);
  const dataStart = loff + 30 + zip.readUInt16LE(loff + 26) + zip.readUInt16LE(loff + 28);
  assert.strictEqual(method, 8);
  const data = zlib.inflateRawSync(zip.subarray(dataStart, dataStart + csize));
  assert.ok(data.equals(fs.readFileSync(path.join(src, name))), `content mismatch: ${name}`);
  names.push(name);
  p += 46 + nlen;
}
assert.ok(names.includes("manifest.json"), "manifest.json must be at zip root");
console.log(`OK: ${names.length} files verified in ${path.basename(zipPath)}`);
