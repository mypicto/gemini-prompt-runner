import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [resolve(__dirname, 'src/inject-entry.js')],
  outfile: resolve(__dirname, 'dist/inject-bundle.js'),
  bundle: true,
  format: 'iife',
  globalName: '__geminiSelectorTest',
  target: 'chrome120',
  loader: { '.json': 'json' },
  logLevel: 'info'
});
