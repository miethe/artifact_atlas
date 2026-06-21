// Copies the pdfjs-dist worker into public/ so react-pdf's GlobalWorkerOptions
// .workerSrc ("/pdf-worker/pdf.worker.min.mjs") always serves a worker that
// matches the INSTALLED pdfjs-dist version. Runs as `prebuild` so a future
// `npm update` that bumps pdfjs-dist can never leave a stale hand-copied worker
// behind (the P4A-003 durability gap). pdfjs-dist v5 ships ESM-only (.mjs).
import { existsSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(webRoot, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = join(webRoot, "public/pdf-worker");
const dest = join(destDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.error(`[copy-pdf-worker] FAIL: worker not found at ${src} — is pdfjs-dist installed?`);
  process.exit(1);
}

const version = JSON.parse(
  readFileSync(join(webRoot, "node_modules/pdfjs-dist/package.json"), "utf8"),
).version;

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-pdf-worker] pdfjs-dist@${version} worker → public/pdf-worker/pdf.worker.min.mjs`);
