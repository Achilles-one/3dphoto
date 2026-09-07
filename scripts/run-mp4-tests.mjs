import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const previewUrl = 'http://127.0.0.1:4173';
const externalBaseUrl = process.env.MP4_TEST_BASE_URL;
const forwardedArgs = process.argv.slice(2);

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.once('error', rejectRun);
    child.once('exit', (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`Command exited with code ${code ?? 'unknown'}.`));
    });
  });
}

async function waitForPreview(child) {
  const timeoutAt = Date.now() + 30_000;
  while (Date.now() < timeoutAt) {
    if (child.exitCode !== null) {
      throw new Error(`Vite preview exited before becoming ready (code ${child.exitCode}).`);
    }
    try {
      const response = await fetch(previewUrl);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error('Vite preview did not become ready within 30 seconds.');
}

async function stopPreview(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((resolveExit) => child.once('exit', resolveExit)),
    new Promise((resolveWait) => setTimeout(resolveWait, 5_000)),
  ]);
}

let preview = null;
try {
  if (!externalBaseUrl) {
    preview = spawn(process.execPath, [
      resolve('node_modules/vite/bin/vite.js'),
      'preview',
      '--host', '127.0.0.1',
      '--port', '4173',
    ], { stdio: 'inherit' });
    await waitForPreview(preview);
  }

  await run(process.execPath, [
    resolve('node_modules/@playwright/test/cli.js'),
    'test',
    ...forwardedArgs,
  ]);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (preview) await stopPreview(preview);
}
