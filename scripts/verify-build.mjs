import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distDirectory = resolve('dist');
const assetsDirectory = resolve(distDirectory, 'assets');
const serverEntry = resolve(distDirectory, 'server/index.js');

function fail(message) {
  console.error(`[verify-build] ${message}`);
  process.exitCode = 1;
}

if (!existsSync(distDirectory)) {
  fail('dist directory is missing. Run npm run build first.');
} else if (!existsSync(resolve(distDirectory, 'index.html'))) {
  fail('dist/index.html is missing.');
} else if (!existsSync(assetsDirectory)) {
  fail('dist/assets directory is missing.');
} else if (!existsSync(serverEntry)) {
  fail('dist/server/index.js is missing.');
} else {
  const html = readFileSync(resolve(distDirectory, 'index.html'), 'utf8');
  const assets = readdirSync(assetsDirectory);

  if (!html.includes('/assets/')) {
    fail('index.html does not reference bundled assets.');
  }

  if (!assets.some((asset) => /^gifWorker-.+\.js$/.test(asset))) {
    fail('The GIF worker bundle is missing from dist/assets.');
  }

  if (process.exitCode !== 1) {
    console.log(`[verify-build] OK: ${assets.length} assets in dist/assets.`);
  }
}
