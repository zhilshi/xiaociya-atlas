#!/usr/bin/env node
/** Apply a generated PNG into public/wa/gen/<stem>.webp and update generated-art-manifest.json. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parse } from "node:path";

const [,, en, stem, pngPath] = process.argv;
if (!en || !stem || !pngPath) {
  console.error("usage: apply-generated-art.mjs <en> <stem> <pngPath>");
  process.exit(1);
}
if (!existsSync(pngPath)) {
  console.error("missing png", pngPath);
  process.exit(1);
}
mkdirSync("public/wa/gen", { recursive: true });
const out = `public/wa/gen/${stem}.webp`;
// Pillow resize 256 and webp q~80
execFileSync("python3", ["-c", `
from PIL import Image
im=Image.open(${JSON.stringify(pngPath)}).convert("RGB")
im=im.resize((256,256), Image.Resampling.LANCZOS)
im.save(${JSON.stringify(out)}, "WEBP", quality=80, method=6)
print("wrote", ${JSON.stringify(out)}, im.size)
`]);
const manPath = "data/generated-art-manifest.json";
const man = JSON.parse(readFileSync(manPath, "utf8"));
man.words = man.words || {};
man.words[en] = { stem, img: true, source: "wordsprout-gen", updated: new Date().toISOString() };
writeFileSync(manPath, JSON.stringify(man, null, 2) + "\n");
console.log("manifest", en, "→", stem);
