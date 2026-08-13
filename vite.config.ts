import vue from '@vitejs/plugin-vue';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const projectDirectory = fileURLToPath(new URL('.', import.meta.url));
const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

function readGitValue(args: string[]): string | null {
  try {
    return execFileSync('git', args, {
      cwd: projectDirectory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function resolveBuildId(): string {
  const environmentRevision =
    process.env.VITE_BUILD_ID ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA;
  if (environmentRevision) {
    return environmentRevision.slice(0, 12);
  }

  const revision = readGitValue(['rev-parse', '--short=8', 'HEAD']);
  if (!revision) {
    return 'local';
  }

  return readGitValue(['status', '--porcelain'])
    ? `${revision}-dirty`
    : revision;
}

const buildId = resolveBuildId();

export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_ID__: JSON.stringify(buildId),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
