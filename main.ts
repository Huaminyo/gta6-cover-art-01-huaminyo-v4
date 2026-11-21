// Golden Hour — Cover Studio (gta6-cover-art-01, take 5).
// Entrypoint: hands the app in. The app itself is this directory's
// app/ folder — plain static files a desktop browser loads offline
// (app/index.html and its ES modules, no library, no network request).
// This program copies app/ and screenshots/ beside this file into the
// output directory and writes /output/dossier.json, the summary the
// judge reads, using the vendored make.fun library.
//
// Run locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast: the entry is useless without its app shell or its
// screenshots, so refuse to hand in a half-built output.
const appIndex = join(here, 'app', 'index.html');
if (!existsSync(appIndex) || !statSync(appIndex).isFile()) {
  throw new Error(`missing app shell: ${appIndex}`);
}
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).length === 0) {
  throw new Error(`no screenshots in ${shotsDir}: run tools/shots.py first`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// Verify the copy landed: count what the grader will actually see.
// A silent short copy (a failed cpSync halfway through) must fail here,
// not surface as a broken entry downstream.
function countFiles(dir) {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += countFiles(join(dir, entry.name));
    else if (entry.isFile()) n += 1;
  }
  return n;
}
const appFiles = countFiles(join(out, 'app'));
const shotFiles = readdirSync(join(out, 'screenshots')).filter((f) => /\.(png|jpe?g)$/i.test(f)).length;
if (appFiles === 0) throw new Error(`nothing copied to ${join(out, 'app')}`);
if (shotFiles === 0) throw new Error(`no screenshots copied to ${join(out, 'screenshots')}`);

// The scorer's own caps (reference/gate.json): only text_max_bytes
// shapes the bytes; the others refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; more than 993 files in
// app/ or 48 MiB of app files, in all, or a path under app/ over 1000
// bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`handed in ${out} (${appFiles} app files, ${shotFiles} screenshots)`);
