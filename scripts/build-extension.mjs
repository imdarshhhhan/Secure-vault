
import { build } from 'esbuild';
import { cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'out');
const dist = path.join(root, 'extension-dist');
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.css', '.json', '.txt']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const exists = (p) => stat(p).then(() => true, () => false);

if (!(await exists(out))) throw new Error('Run "next build" first (npm run build does both steps).');

await rm(dist, { recursive: true, force: true });
await cp(out, dist, { recursive: true });

await rename(path.join(dist, '_next'), path.join(dist, 'next'));

let inlineCount = 0;
for await (const file of walk(dist)) {
  if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
  const original = await readFile(file, 'utf8');
  let text = original.replaceAll('/_next/', '/next/');

  if (file.endsWith('.html')) {
    const extracted = [];
    text = text.replace(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g, (match, attrs, body) => {
      if (/type=["']application\/(ld\+)?json["']/.test(attrs)) return match; // data, not code
      if (!body.trim()) return match;
      const name = `inline-${++inlineCount}.js`;
      extracted.push(writeFile(path.join(dist, name), body));
      return `<script src="/${name}"></script>`;
    });
    await Promise.all(extracted);
  }
  if (text !== original) await writeFile(file, text);
}

await cp(path.join(root, 'extension', 'manifest.json'), path.join(dist, 'manifest.json'));
await cp(path.join(root, 'extension', 'offscreen.html'), path.join(dist, 'offscreen.html'));
await cp(path.join(root, 'extension', 'icons'), path.join(dist, 'icons'), { recursive: true });

await build({
  entryPoints: {
    background: path.join(root, 'extension', 'background.ts'),
    offscreen: path.join(root, 'extension', 'offscreen.ts'),
  },
  outdir: dist,
  bundle: true,
  format: 'iife',
  target: 'chrome116',
  logLevel: 'warning',
});

const problems = [];
const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.json'), 'utf8'));
const referenced = [
  manifest.action.default_popup,
  manifest.background.service_worker,
  ...Object.values(manifest.icons),
  'index.html',
  'offscreen.html',
  'offscreen.js',
];
for (const file of referenced) if (!(await exists(path.join(dist, file)))) problems.push(`Missing file: ${file}`);
for (const name of await readdir(dist)) if (name.startsWith('_')) problems.push(`Chrome rejects root name: ${name}`);

for await (const file of walk(dist)) {
  const ext = path.extname(file);
  if (!TEXT_EXTENSIONS.has(ext)) continue;
  const text = await readFile(file, 'utf8');
  if (text.includes('/_next/')) problems.push(`Leftover "/_next/" in ${path.relative(dist, file)}`);
  if (ext === '.html') {
    if (/<script(?![^>]*\bsrc=)(?![^>]*application\/json)[^>]*>[^<]/i.test(text)) {
      problems.push(`Inline script in ${path.relative(dist, file)}`);
    }
    if (/<(script|link)[^>]+(src|href)=["']https?:\/\//i.test(text)) {
      problems.push(`Remote resource in ${path.relative(dist, file)}`);
    }
  }
}

if (problems.length) {
  console.error('\nExtension build problems:\n - ' + problems.join('\n - '));
  process.exit(1);
}
console.log(`\n✔ Extension ready: ${path.relative(root, dist)}/  (moved ${inlineCount} inline script(s) out of HTML)`);
console.log('  Load it in Chrome: chrome://extensions → Developer mode → Load unpacked → pick that folder.');
