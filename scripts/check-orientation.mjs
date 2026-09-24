#!/usr/bin/env node
// Fail if any bg_* / cg_* still image is taller than wide.
// Skips: avatars/, portraits/, ui/, gu_/xie_ sprites, video.
// Sniffs magic bytes (some .png files are actually JPEG).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const images = path.join(root, "images");
const SKIP_DIRS = new Set(["avatars", "portraits", "ui"]);
const EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

function readSize(file) {
  const buf = fs.readFileSync(file);
  // PNG
  if (buf.length >= 24 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), fmt: "png" };
  }
  // JPEG
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) break;
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0xd9) { i += 2; continue; }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5), fmt: "jpeg" };
      }
      i += 2 + len;
    }
    throw new Error("jpeg no SOF");
  }
  // WEBP
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), fmt: "webp" };
    }
    if (chunk === "VP8 ") {
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, fmt: "webp" };
    }
    throw new Error("webp variant unsupported");
  }
  throw new Error("unrecognized image magic");
}

const offenders = [];
const ok = [];
for (const file of walk(images)) {
  const base = path.basename(file);
  const ext = path.extname(base).toLowerCase();
  if (!EXT.has(ext)) continue;
  if (!(base.startsWith("bg_") || base.startsWith("cg_"))) continue;
  if (base.startsWith("gu_") || base.startsWith("xie_")) continue;
  try {
    const { w, h, fmt } = readSize(file);
    const rel = path.relative(root, file);
    if (h > w) offenders.push({ rel, w, h, fmt });
    else ok.push({ rel, w, h, fmt });
  } catch (e) {
    offenders.push({ rel: path.relative(root, file), error: String(e.message || e) });
  }
}

if (offenders.length) {
  console.error("ORIENTATION FAIL: portrait (or unreadable) bg/cg found:");
  for (const o of offenders) {
    if (o.error) console.error(`  ${o.rel}: ${o.error}`);
    else console.error(`  ${o.rel}: ${o.w}x${o.h} (${o.fmt}, height>width)`);
  }
  process.exit(1);
}
console.log(`ORIENTATION OK: ${ok.length} bg/cg landscape (or square).`);
for (const o of ok) console.log(`  ${o.rel}: ${o.w}x${o.h} (${o.fmt})`);
process.exit(0);
