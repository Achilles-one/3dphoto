import { Worker } from 'node:worker_threads';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SECURITY_HEADERS } from './security-headers.mjs';

const REQUEST_TIMEOUT_MS = 15_000;
const WORKER_TIMEOUT_MS = 15_000;
const VERCEL_AUTOMATION_BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

function fail(message) {
  throw new Error(`[smoke-deployment] ${message}`);
}

async function fetchChecked(url, label) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: VERCEL_AUTOMATION_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': VERCEL_AUTOMATION_BYPASS_SECRET }
      : undefined,
  });

  if (!response.ok) {
    fail(`${label} returned HTTP ${response.status}: ${url}`);
  }

  return response;
}

function verifySecurityHeaders(response, label) {
  for (const [name, expectedValue] of Object.entries(SECURITY_HEADERS)) {
    const actualValue = response.headers.get(name);

    if (actualValue !== expectedValue) {
      fail(`${label} has an invalid ${name} header.`);
    }
  }
}

function collectStaticAssetUrls(html, pageUrl) {
  const urls = new Set();
  const assetPattern = /(?:src|href)=["']([^"']+\.(?:css|js)(?:\?[^"']*)?)["']/gi;

  for (const match of html.matchAll(assetPattern)) {
    const url = new URL(match[1], pageUrl);
    if (url.pathname.startsWith('/assets/')) {
      urls.add(url.href);
    }
  }

  return [...urls];
}

function findWorkerUrl(javascript, scriptUrl, workerName) {
  const match = javascript.match(
    new RegExp(`(?:/assets/|\\./)?${workerName}-[A-Za-z0-9_-]+\\.js`),
  );

  if (!match) {
    return null;
  }

  const reference = match[0];
  return new URL(
    reference.startsWith('/') || reference.startsWith('./')
      ? reference
      : `/assets/${reference}`,
    scriptUrl,
  ).href;
}

function createMinimalFrames() {
  const colors = [
    [255, 0, 0, 255],
    [128, 0, 128, 255],
    [0, 0, 255, 255],
    [128, 0, 128, 255],
  ];

  return colors.map((color) => ({
    data: new Uint8ClampedArray([...color, ...color, ...color, ...color]),
    width: 2,
    height: 2,
    delay: 40,
  }));
}

export async function runMinimalGifExport(workerSource) {
  const bootstrap = `
const { parentPort, workerData } = require('node:worker_threads');
globalThis.self = globalThis;
globalThis.postMessage = (message, transfer) => parentPort.postMessage(message, transfer);
parentPort.on('message', (data) => {
  if (typeof globalThis.onmessage === 'function') {
    globalThis.onmessage({ data });
  }
});
try {
  (0, eval)(workerData.source);
  parentPort.postMessage({ type: '__smoke_ready__' });
} catch (error) {
  parentPort.postMessage({
    type: '__smoke_boot_failure__',
    message: error instanceof Error ? error.message : String(error),
  });
}
`;

  const worker = new Worker(bootstrap, {
    eval: true,
    execArgv: [],
    workerData: { source: workerSource },
  });

  try {
    const bytes = await new Promise((resolve, reject) => {
      let settled = false;
      const settle = (callback, value) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeout);
        callback(value);
      };
      const timeout = setTimeout(() => {
        settle(reject, new Error('GIF Worker did not finish within the timeout.'));
      }, WORKER_TIMEOUT_MS);

      worker.on('error', (error) => settle(reject, error));
      worker.on('exit', (code) => {
        settle(reject, new Error(`GIF Worker exited before export completed (code ${code}).`));
      });
      worker.on('message', (message) => {
        if (message.type === '__smoke_ready__') {
          worker.postMessage({ type: 'encode', frames: createMinimalFrames() });
          return;
        }

        if (message.type === '__smoke_boot_failure__' || message.type === 'failure') {
          settle(reject, new Error(message.message));
          return;
        }

        if (message.type === 'success') {
          settle(resolve, new Uint8Array(message.buffer));
        }
      });
    });

    const signature = Buffer.from(bytes.subarray(0, 6)).toString('ascii');
    if ((signature !== 'GIF87a' && signature !== 'GIF89a') || bytes.byteLength < 20) {
      fail('GIF Worker returned an invalid GIF payload.');
    }

    return bytes.byteLength;
  } finally {
    await worker.terminate();
  }
}

export async function smokeDeployment(target) {
  const pageUrl = new URL(target);
  if (pageUrl.protocol !== 'https:' && pageUrl.protocol !== 'http:') {
    fail('The deployment URL must use HTTP or HTTPS.');
  }

  const pageResponse = await fetchChecked(pageUrl, 'Homepage');
  verifySecurityHeaders(pageResponse, 'Homepage');
  const html = await pageResponse.text();
  const assetUrls = collectStaticAssetUrls(html, pageResponse.url);

  if (assetUrls.length === 0) {
    fail('Homepage does not reference a JavaScript or CSS asset.');
  }

  let gifWorkerUrl = null;
  let mp4WorkerUrl = null;
  for (const assetUrl of assetUrls) {
    const assetResponse = await fetchChecked(assetUrl, 'Static asset');
    verifySecurityHeaders(assetResponse, `Static asset ${new URL(assetUrl).pathname}`);
    const source = await assetResponse.text();

    if (new URL(assetUrl).pathname.endsWith('.js')) {
      gifWorkerUrl ||= findWorkerUrl(source, assetResponse.url, 'gifWorker');
      mp4WorkerUrl ||= findWorkerUrl(source, assetResponse.url, 'mp4Worker');
    }
  }

  if (!gifWorkerUrl) {
    fail('The GIF Worker URL is missing from the deployed JavaScript.');
  }
  if (!mp4WorkerUrl) {
    fail('The MP4 Worker URL is missing from the deployed JavaScript.');
  }

  const gifWorkerResponse = await fetchChecked(gifWorkerUrl, 'GIF Worker');
  verifySecurityHeaders(gifWorkerResponse, 'GIF Worker');
  const gifBytes = await runMinimalGifExport(await gifWorkerResponse.text());
  const mp4WorkerResponse = await fetchChecked(mp4WorkerUrl, 'MP4 Worker');
  verifySecurityHeaders(mp4WorkerResponse, 'MP4 Worker');

  return {
    assetCount: assetUrls.length,
    gifBytes,
    pageUrl: pageResponse.url,
    gifWorkerUrl,
    mp4WorkerUrl,
  };
}

const isCommandLine = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCommandLine) {
  const target = process.argv[2] || process.env.SMOKE_TEST_URL;

  if (!target) {
    console.error('Usage: npm run smoke:deployment -- https://deployment.example');
    process.exitCode = 1;
  } else {
    try {
      const result = await smokeDeployment(target);
      console.log(
        `[smoke-deployment] OK: homepage, ${result.assetCount} static assets, GIF/MP4 Workers, and ${result.gifBytes}-byte minimal GIF export.`,
      );
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
