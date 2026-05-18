import { createRequire } from 'module';
import { cpSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try to resolve esbuild from local node_modules first, then walk up
function resolveEsbuild() {
  const require = createRequire(import.meta.url);
  try { return require('esbuild'); } catch {}
  // Fallback to any esbuild in the monorepo
  const fallbacks = [
    resolve(__dirname, '../../driftjournal/functions/node_modules/esbuild'),
    resolve(__dirname, '../../dateArchitect/functions/node_modules/esbuild'),
  ];
  for (const p of fallbacks) {
    try { return require(p); } catch {}
  }
  throw new Error('esbuild not found — run: npm install --prefix apps/flowdesk-extension');
}

const { build } = resolveEsbuild();

const shared = {
  bundle: true,
  platform: 'browser',
  target: 'chrome110',
  format: 'iife',
  sourcemap: false,
};

await Promise.all([
  build({ ...shared, entryPoints: ['src/background/service-worker.ts'], outdir: 'dist/background' }),
  build({ ...shared, entryPoints: ['src/content/blocker.ts'], outdir: 'dist/content' }),
  build({ ...shared, entryPoints: ['src/popup/popup.ts'], outdir: 'dist/popup' }),
]);

mkdirSync('dist/popup', { recursive: true });
mkdirSync('dist/content', { recursive: true });
cpSync('src/popup/popup.html', 'dist/popup/popup.html');
cpSync('src/content/blocker.css', 'dist/content/blocker.css');

console.log('Build complete → dist/');
