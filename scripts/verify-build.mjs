import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import {
  ALIGNMENT_WORKER_CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
} from './security-headers.mjs';
import { runMinimalGifExport } from './smoke-deployment.mjs';

const distDirectory = resolve('dist');
const assetsDirectory = resolve(distDirectory, 'assets');
const vercelConfig = resolve('vercel.json');
const openCvDirectory = resolve('src/vendor/opencv/5.0.0');

function scriptSources(csp) {
  const directive = csp.split('; ').find((value) => value.startsWith('script-src '));
  return new Set(directive?.split(/\s+/).slice(1));
}

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
  const vercelJson = JSON.parse(vercel);
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

  if (!assets.some((asset) => /^mp4Worker-.+\.js$/.test(asset))) {
    fail('The MP4 worker bundle is missing from dist/assets.');
  }

  if (!assets.some((asset) => /^alignmentWorker-.+\.js$/.test(asset))) {
    fail('The automatic alignment worker bundle is missing from dist/assets.');
  }

  const workerHeaders = vercelJson.headers.find(({ source }) => source === '/assets/alignmentWorker-(.*).js');
  const workerHeaderMap = Object.fromEntries(workerHeaders?.headers.map(({ key, value }) => [key, value]) ?? []);
  if (workerHeaderMap['Content-Security-Policy'] !== ALIGNMENT_WORKER_CONTENT_SECURITY_POLICY) {
    fail('The hashed automatic alignment Worker route is missing its dedicated CSP.');
  }

  const csp = SECURITY_HEADERS['Content-Security-Policy'];
  const globalScriptSources = scriptSources(csp);
  const workerScriptSources = scriptSources(ALIGNMENT_WORKER_CONTENT_SECURITY_POLICY);
  if (!globalScriptSources.has("'self'") || globalScriptSources.has("'wasm-unsafe-eval'") || globalScriptSources.has("'unsafe-eval'")) {
    fail('The global Content-Security-Policy must keep script-src restricted to self.');
  }
  if (!workerScriptSources.has("'self'") || !workerScriptSources.has("'wasm-unsafe-eval'") || workerScriptSources.has("'unsafe-eval'")) {
    fail('The automatic alignment Worker CSP does not enforce its Wasm-only execution boundary.');
  }
  for (const route of vercelJson.headers.filter(({ source }) => source !== '/assets/alignmentWorker-(.*).js')) {
    const routeCsp = route.headers.find(({ key }) => key === 'Content-Security-Policy')?.value;
    if (routeCsp && scriptSources(routeCsp).has("'wasm-unsafe-eval'")) {
      fail(`The non-Worker route ${route.source} exposes wasm-unsafe-eval.`);
    }
  }
  if (!csp.includes("worker-src 'self' blob:")) {
    fail('The global Content-Security-Policy is missing the existing Worker boundary.');
  }

  const alignmentWorkerAsset = assets.find((asset) => /^alignmentWorker-.+\.js$/.test(asset));
  const alignmentWorkerJavaScript = alignmentWorkerAsset
    ? readFileSync(resolve(assetsDirectory, alignmentWorkerAsset), 'utf8')
    : '';
  if (!alignmentWorkerJavaScript.includes('opencv-5.0.0-csp-v2')) {
    fail('The automatic alignment Worker bundle is missing its Wasm CSP runtime version.');
  }

  const openCvWasmAsset = assets.find((asset) => /^opencv-.+\.wasm$/.test(asset));
  if (!openCvWasmAsset) {
    fail('The hashed OpenCV Wasm asset is missing from dist/assets.');
  }
  const wasmHeaders = vercelJson.headers.find(({ source }) => source === '/assets/opencv-(.*).wasm');
  if (!wasmHeaders?.headers.some(({ key, value }) => key === 'Content-Type' && value === 'application/wasm')) {
    fail('The OpenCV Wasm route is missing Content-Type: application/wasm.');
  }

  const manifestPath = resolve(openCvDirectory, 'build-manifest.json');
  const sumsPath = resolve(openCvDirectory, 'SHA256SUMS');
  if (!existsSync(manifestPath) || !existsSync(sumsPath)) {
    fail('The OpenCV build manifest or SHA256SUMS is missing.');
  } else {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.opencv?.tag !== '5.0.0' || manifest.emsdk !== '4.0.20') {
      fail('The OpenCV build manifest does not pin the approved toolchain.');
    }
    const sums = new Map(readFileSync(sumsPath, 'utf8').trim().split(/\r?\n/).map((line) => {
      const [hash, file] = line.split(/\s+/);
      return [file, hash];
    }));
    for (const file of ['opencv.mjs', 'opencv.wasm', 'LICENSE.txt', 'THIRD_PARTY_NOTICES.txt']) {
      const actual = createHash('sha256').update(readFileSync(resolve(openCvDirectory, file))).digest('hex');
      if (manifest.sha256?.[file] !== actual || sums.get(file) !== actual) {
        fail(`The committed OpenCV checksum does not match ${file}.`);
      }
    }
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
