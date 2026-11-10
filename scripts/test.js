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

const SELF_DIST_ID = "dark-mode-anywhere-self@bigbluealien.com";
const variants = [
  { file: `dark-mode-anywhere-${manifest.version}.zip`, id: manifest.browser_specific_settings.gecko.id },
  { file: `dark-mode-anywhere-${manifest.version}-self-distributed.zip`, id: SELF_DIST_ID },
];

for (const { file, id } of variants) {
  const zipPath = path.join(root, "dist", file);
  assert.ok(fs.existsSync(zipPath), `${file} missing; run npm run build first`);
  verifyZip(zipPath, id);
}

// Verify every entry inflates to the source file (manifest compared by content
// apart from the add-on ID), and that the add-on ID is the expected one.
function verifyZip(zipPath, expectedId) {
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
    if (name === "manifest.json") {
      const m = JSON.parse(data.toString("utf8"));
      assert.strictEqual(m.browser_specific_settings.gecko.id, expectedId, "unexpected add-on id");
      m.browser_specific_settings.gecko.id = manifest.browser_specific_settings.gecko.id;
      assert.deepStrictEqual(m, manifest, "manifest differs beyond add-on id");
    } else {
      assert.ok(data.equals(fs.readFileSync(path.join(src, name))), `content mismatch: ${name}`);
    }
    names.push(name);
    p += 46 + nlen;
  }
  assert.ok(names.includes("manifest.json"), "manifest.json must be at zip root");
  console.log(`OK: ${names.length} files verified in ${path.basename(zipPath)} (id ${expectedId})`);
}
