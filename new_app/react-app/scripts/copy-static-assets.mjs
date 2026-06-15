// Vercel serves the build output (dist) from its CDN. The data / images / media
// live in sibling folders of react-app, so we copy them into public/ before the
// Vite build — Vite then emits them into dist as-is, served at /data, /images,
// /media and /backend/captions.md (matching the paths the app fetches).
import { cpSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";

const copies = [
  ["../data", "public/data"],
  ["../images", "public/images"],
  ["../frontend/media", "public/media"],
];

for (const [src, dst] of copies) {
  if (!existsSync(src)) {
    console.warn(`[copy-static-assets] missing source: ${src} (skipped)`);
    continue;
  }
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
  console.log(`[copy-static-assets] ${src} -> ${dst}`);
}

mkdirSync("public/backend", { recursive: true });
if (existsSync("../backend/captions.md")) {
  copyFileSync("../backend/captions.md", "public/backend/captions.md");
  console.log("[copy-static-assets] ../backend/captions.md -> public/backend/captions.md");
}

console.log("[copy-static-assets] done");
