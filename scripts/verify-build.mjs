import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SECURITY_HEADERS } from './security-headers.mjs';
import { runMinimalGifExport } from './smoke-deployment.mjs';

const distDirectory = resolve('dist');
const assetsDirectory = resolve(distDirectory, 'assets');
const vercelConfig = resolve('vercel.json');

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
} else if (!existsSync(vercelConfig)) {
  fail('vercel.json is missing.');
} else {
  const html = readFileSync(resolve(distDirectory, 'index.html'), 'utf8');
  const assets = readdirSync(assetsDirectory);
  const vercel = readFileSync(vercelConfig, 'utf8');
  const javascript = assets
    .filter((asset) => asset.endsWith('.js'))
    .map((asset) => readFileSync(resolve(assetsDirectory, asset), 'utf8'))
    .join('\n');

  if (!html.includes('/assets/')) {
    fail('index.html does not reference bundled assets.');
  }

  if (!assets.some((asset) => /^gifWorker-.+\.js$/.test(asset))) {
    fail('The GIF worker bundle is missing from dist/assets.');
  }

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!vercel.includes(name) || !vercel.includes(value)) {
      fail(`vercel.json is missing the expected ${name} policy.`);
    }
  }

  const csp = SECURITY_HEADERS['Content-Security-Policy'];
  const scriptPolicy = csp
    .split('; ')
    .find((directive) => directive.startsWith('script-src '));
  if (
    scriptPolicy !== "script-src 'self'"
    || !csp.includes("worker-src 'self' blob:")
  ) {
    fail('The Content-Security-Policy does not enforce the P0-07 boundary.');
  }

  if (
    !javascript.includes('github.com/Achilles-one/3dphoto') ||
    !javascript.includes('/issues/new')
  ) {
    fail('The production feedback destination is missing from the JavaScript bundle.');
  }

  if (!javascript.includes('0.1.0')) {
    fail('The visible application version is missing from the JavaScript bundle.');
  }

  const workerAsset = assets.find((asset) => /^gifWorker-.+\.js$/.test(asset));
  if (workerAsset) {
    try {
      const gifBytes = await runMinimalGifExport(
        readFileSync(resolve(assetsDirectory, workerAsset), 'utf8'),
      );
      console.log(`[verify-build] GIF Worker encoded a ${gifBytes}-byte smoke GIF.`);
    } catch (error) {
      fail(`The built GIF Worker smoke export failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (process.exitCode !== 1) {
    console.log(`[verify-build] OK: ${assets.length} assets and Vercel headers verified.`);
  }
}
