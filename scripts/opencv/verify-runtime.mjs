import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = new URL('../../', import.meta.url);
const moduleBytes = await readFile(new URL('src/vendor/opencv/5.0.0/opencv.mjs', root));
const wasmBytes = await readFile(new URL('src/vendor/opencv/5.0.0/opencv.wasm', root));
const page = `<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="module" src="/page.mjs"></script>`;
const pageModule = `
const output = document.querySelector('#result');
const worker = new Worker('/worker.mjs', { type: 'module' });
worker.onmessage = ({ data }) => { output.textContent = JSON.stringify(data); worker.terminate(); };
worker.onerror = ({ message }) => { output.textContent = JSON.stringify({ ok: false, error: message }); worker.terminate(); };
`;
const workerModule = `
import createOpenCv from '/opencv.mjs';

const resources = [];
try {
  const cv = await createOpenCv({ locateFile: (path) => path.endsWith('.wasm') ? '/opencv.wasm' : path });
  const width = 96;
  const height = 96;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const value = ((x * 29 + y * 47 + (x ^ y) * 13) & 255);
      data[offset] = value;
      data[offset + 1] = 255 - value;
      data[offset + 2] = (value * 3) & 255;
      data[offset + 3] = 255;
    }
  }
  const rgba = cv.matFromImageData({ width, height, data });
  const gray = new cv.Mat();
  const mask = new cv.Mat();
  const keypoints = new cv.KeyPointVector();
  const descriptors = new cv.Mat();
  const orb = new cv.ORB(500, 1.2, 8, 12, 0, 2, cv.ORB_HARRIS_SCORE, 31, 7);
  resources.push(rgba, gray, mask, keypoints, descriptors, orb);
  cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);
  orb.detectAndCompute(gray, mask, keypoints, descriptors);
  const matches = new cv.DMatchVectorVector();
  const matcher = new cv.BFMatcher(cv.NORM_HAMMING, false);
  resources.push(matches, matcher);
  matcher.knnMatch(descriptors, descriptors, matches, 2);
  self.postMessage({ ok: gray.rows === height && keypoints.size() > 0 && matches.size() > 0, keypoints: keypoints.size(), matches: matches.size() });
} catch (error) {
  self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
} finally {
  for (const resource of resources.reverse()) resource.delete();
}
`;

const server = createServer((request, response) => {
  const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
  const commonHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (path === '/') {
    response.writeHead(200, { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; worker-src 'self'; object-src 'none'" });
    response.end(page);
  } else if (path === '/page.mjs') {
    response.writeHead(200, { ...commonHeaders, 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end(pageModule);
  } else if (path === '/worker.mjs') {
    response.writeHead(200, { ...commonHeaders, 'Content-Type': 'text/javascript; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; object-src 'none'" });
    response.end(workerModule);
  } else if (path === '/opencv.mjs') {
    response.writeHead(200, { ...commonHeaders, 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end(moduleBytes);
  } else if (path === '/opencv.wasm') {
    response.writeHead(200, { ...commonHeaders, 'Content-Type': 'application/wasm' });
    response.end(wasmBytes);
  } else if (path === '/favicon.ico') {
    response.writeHead(204, commonHeaders).end();
  } else {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Unable to resolve validation server address.');

const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
try {
  const pageHandle = await browser.newPage();
  const consoleErrors = [];
  pageHandle.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await pageHandle.goto(`http://127.0.0.1:${address.port}/`);
  await pageHandle.waitForFunction(() => document.querySelector('#result')?.textContent !== 'pending');
  const result = JSON.parse(await pageHandle.locator('#result').textContent());
  if (!result.ok) throw new Error(`OpenCV runtime validation failed: ${result.error ?? JSON.stringify(result)}`);
  if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
  server.close();
}
