import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const distDirectory = resolve('dist');
const serverDirectory = resolve(distDirectory, 'server');
const serverEntry = resolve(serverDirectory, 'index.js');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function collectAssets(directory) {
  const assets = {};

  for (const entry of readdirSync(directory)) {
    if (entry === 'server' || entry === '.openai' || entry === '_headers') {
      continue;
    }

    const filePath = join(directory, entry);
    const fileStats = statSync(filePath);

    if (fileStats.isDirectory()) {
      Object.assign(assets, collectAssets(filePath));
      continue;
    }

    const route = `/${relative(distDirectory, filePath).replaceAll('\\', '/')}`;
    assets[route] = {
      body: readFileSync(filePath).toString('base64'),
      contentType: contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
    };
  }

  return assets;
}

const assets = collectAssets(distDirectory);
const assetManifest = JSON.stringify(assets);

mkdirSync(serverDirectory, { recursive: true });
writeFileSync(
  serverEntry,
  `const assets = ${assetManifest};

function decodeBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const lastSegment = url.pathname.split('/').pop() || '';
    const asset = assets[url.pathname]
      || ((url.pathname === '/' || !lastSegment.includes('.')) ? assets['/index.html'] : null);

    if (!asset) {
      return new Response('Not Found', { status: 404 });
    }

    return new Response(request.method === 'HEAD' ? null : decodeBase64(asset.body), {
      headers: {
        'Cache-Control': url.pathname.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
        'Content-Type': asset.contentType,
      },
    });
  },
};
`,
  'utf8',
);

console.log(`[prepare-sites] Embedded ${Object.keys(assets).length} static assets in the worker entrypoint.`);
