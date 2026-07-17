import { build, context } from 'esbuild';
import { cpSync, rmSync, watch as fsWatch } from 'node:fs';

const watchMode = process.argv.includes('--watch');
const dev = watchMode || process.argv.includes('--dev');

/**
 * target は tsconfig と揃えて chrome120 (ES2022) 固定。
 * これ未満に下げると private field (#) が WeakMap に downlevel され
 * 挙動・可読性が変わるため下げないこと。
 * minify しないのは Chrome Web Store 審査で可読性を保つため。
 */
const common = {
  bundle: true,
  target: 'chrome120',
  minify: false,
  sourcemap: dev ? 'inline' : false,
  outdir: 'dist/js',
  logLevel: 'info',
};

const configs = [
  {
    ...common,
    format: 'esm',
    entryPoints: ['src/background.js', 'src/popup.js', 'src/options.js'],
  },
  {
    // content script は classic script として実行されるため ESM 不可
    ...common,
    format: 'iife',
    entryPoints: ['src/content.js'],
  },
];

function copyAssets() {
  cpSync('public', 'dist', { recursive: true });
}

rmSync('dist', { recursive: true, force: true });
copyAssets();

if (watchMode) {
  for (const cfg of configs) {
    (await context(cfg)).watch();
  }
  fsWatch('public', { recursive: true }, () => copyAssets());
  console.log('watching src/ and public/ ...');
} else {
  await Promise.all(configs.map(build));
}
