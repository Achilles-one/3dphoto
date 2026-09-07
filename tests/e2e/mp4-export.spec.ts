import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { ALL_FORMATS, BlobSource, EncodedPacketSink, Input } from 'mediabunny';

const SYNTHETIC_WIDTH = 2880;
const SYNTHETIC_HEIGHT = 1600;

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes: Uint8Array) {
  let value = 0xffffffff;
  for (const byte of bytes) value = (value >>> 8) ^ (crcTable[(value ^ byte) & 0xff] ?? 0);
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.byteLength);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function createSyntheticSbsPng() {
  const stride = SYNTHETIC_WIDTH * 4 + 1;
  const pixels = Buffer.alloc(stride * SYNTHETIC_HEIGHT);
  for (let y = 0; y < SYNTHETIC_HEIGHT; y += 1) {
    const row = y * stride;
    for (let x = 0; x < SYNTHETIC_WIDTH; x += 1) {
      const offset = row + 1 + x * 4;
      const isRight = x >= SYNTHETIC_WIDTH / 2;
      const stripe = ((x + y) >> 6) % 2 === 0 ? 20 : 0;
      pixels[offset] = isRight ? 45 + stripe : 215 + stripe;
      pixels[offset + 1] = isRight ? 115 + stripe : 70 + stripe;
      pixels[offset + 2] = isRight ? 205 + stripe : 55 + stripe;
      pixels[offset + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(SYNTHETIC_WIDTH, 0);
  header.writeUInt32BE(SYNTHETIC_HEIGHT, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixels, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function uploadSyntheticSbs(page: Page) {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'synthetic-sbs.png',
    mimeType: 'image/png',
    buffer: createSyntheticSbsPng(),
  });
  await expect(page.getByRole('button', { name: '创建 Wiggle' })).toBeEnabled();
}

async function openMp4Dialog(page: Page, options: { speed: number; intermediate: boolean }) {
  await uploadSyntheticSbs(page);
  await page.getByRole('button', { name: '创建 Wiggle' }).click();
  await expect(page.getByRole('button', { name: '下载' })).toBeEnabled();

  const speed = page.getByLabel('每帧间隔，100 到 2000 毫秒');
  await speed.fill(String(options.speed));
  await speed.press('Tab');
  const intermediate = page.getByRole('button', { name: '中间帧' });
  if (options.intermediate && await intermediate.getAttribute('aria-pressed') === 'false') {
    await intermediate.click();
  }

  await page.getByRole('button', { name: '下载' }).click();
  const mp4 = page.locator('input[name="export-format"][value="mp4"]');
  await expect(mp4).toBeEnabled();
  await mp4.check();
}

async function inspectMp4(path: string) {
  const bytes = await readFile(path);
  const input = new Input({ source: new BlobSource(new Blob([bytes])), formats: ALL_FORMATS });
  try {
    const videoTracks = await input.getVideoTracks();
    const audioTracks = await input.getAudioTracks();
    const video = videoTracks[0];
    expect(video).toBeDefined();
    if (!video) throw new Error('Generated MP4 has no video track.');

    const sink = new EncodedPacketSink(video);
    const durations: number[] = [];
    let packet = await sink.getFirstPacket();
    while (packet) {
      durations.push(packet.duration);
      packet = await sink.getNextPacket(packet);
    }

    return {
      audioTrackCount: audioTracks.length,
      codec: await video.getCodec(),
      codecString: await video.getCodecParameterString(),
      duration: await input.computeDuration(),
      frameDurations: durations,
      height: await video.getDisplayHeight(),
      videoTrackCount: videoTracks.length,
      width: await video.getDisplayWidth(),
    };
  } finally {
    input.dispose();
  }
}

function verifyWithFfprobe(path: string) {
  const result = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', path], {
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    if (process.env.REQUIRE_FFPROBE === '1') {
      throw result.error ?? new Error(result.stderr || 'ffprobe failed.');
    }
    return;
  }

  const streams = (JSON.parse(result.stdout) as {
    streams: Array<{ codec_type?: string; codec_name?: string; pix_fmt?: string; avg_frame_rate?: string }>;
  }).streams;
  const videos = streams.filter((stream) => stream.codec_type === 'video');
  expect(videos).toHaveLength(1);
  expect(streams.filter((stream) => stream.codec_type === 'audio')).toHaveLength(0);
  expect(videos[0]?.codec_name).toBe('h264');
  expect(videos[0]?.pix_fmt).toBe('yuv420p');
  expect(videos[0]?.avg_frame_rate).toBe('25/1');
}

async function exportAndVerify(
  page: Page,
  size: '1080' | '1440',
  expected: { width: number; height: number; frames: number; duration: number },
) {
  const sizeOption = page.locator(`input[name="mp4-size"][value="${size}"]`);
  await expect(sizeOption).toBeEnabled();
  await sizeOption.check();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '确认下载' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-wiggle\.mp4$/);
  const path = await download.path();
  expect(path).not.toBeNull();
  if (!path) throw new Error('The MP4 download path is unavailable.');

  const metadata = await inspectMp4(path);
  expect(metadata.videoTrackCount).toBe(1);
  expect(metadata.audioTrackCount).toBe(0);
  expect(metadata.codec).toBe('avc');
  expect(metadata.codecString).toMatch(/^avc[13]\./);
  expect(metadata.width).toBe(expected.width);
  expect(metadata.height).toBe(expected.height);
  expect(metadata.width % 2).toBe(0);
  expect(metadata.height % 2).toBe(0);
  expect(Math.max(metadata.width, metadata.height)).toBeLessThanOrEqual(Number(size));
  expect(metadata.frameDurations).toHaveLength(expected.frames);
  for (const duration of metadata.frameDurations) expect(duration).toBeCloseTo(0.04, 6);
  expect(metadata.duration).toBeCloseTo(expected.duration, 6);
  verifyWithFfprobe(path);
}

async function newConfiguredPage(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto('/');
  return page;
}

test('exports a 1080 two-frame H.264 MP4 at 25fps @production', async ({ page }) => {
  await page.goto('/');
  await openMp4Dialog(page, { speed: 200, intermediate: false });
  await exportAndVerify(page, '1080', { width: 972, height: 1080, frames: 50, duration: 2 });
});

test('exports a real 1440 four-frame MP4 with cumulative timing', async ({ page }) => {
  await page.goto('/');
  await openMp4Dialog(page, { speed: 333, intermediate: true });
  await exportAndVerify(page, '1440', { width: 1296, height: 1440, frames: 67, duration: 2.68 });
});

test('disables MP4 while preserving GIF when WebCodecs H.264 is unavailable', async ({ context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(globalThis, 'VideoEncoder', { configurable: true, value: undefined });
  });
  const page = await newConfiguredPage(context);
  await uploadSyntheticSbs(page);
  await page.getByRole('button', { name: '创建 Wiggle' }).click();
  await page.getByRole('button', { name: '下载' }).click();
  await expect(page.locator('input[name="export-format"][value="mp4"]')).toBeDisabled();
  await expect(page.locator('input[name="export-format"][value="gif"]')).toBeEnabled();
});

test('disables only 1440 when the encoder supports only the 1080 configuration', async ({ context }) => {
  await context.addInitScript(() => {
    const original = VideoEncoder.isConfigSupported.bind(VideoEncoder);
    Object.defineProperty(VideoEncoder, 'isConfigSupported', {
      configurable: true,
      value: (config: VideoEncoderConfig) => Math.max(config.width, config.height) > 1080
        ? Promise.resolve({ supported: false, config })
        : original(config),
    });
  });
  const page = await newConfiguredPage(context);
  await openMp4Dialog(page, { speed: 200, intermediate: false });
  await expect(page.locator('input[name="mp4-size"][value="1080"]')).toBeEnabled();
  await expect(page.locator('input[name="mp4-size"][value="1440"]')).toBeDisabled();
});

test('cancels a pending MP4 worker without downloading and keeps the dialog open', async ({ page }) => {
  await page.goto('/');
  await openMp4Dialog(page, { speed: 200, intermediate: false });
  await page.route(/\/assets\/mp4Worker-[^/]+\.js$/, async (route) => {
    await route.fulfill({
      contentType: 'text/javascript',
      body: 'self.onmessage = () => {};',
    });
  });
  let downloaded = false;
  page.on('download', () => { downloaded = true; });
  await page.getByRole('button', { name: '确认下载' }).click();
  await page.getByRole('button', { name: '取消导出' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: '确认下载' })).toBeEnabled();
  await page.waitForTimeout(500);
  expect(downloaded).toBe(false);
});

test('invalidates a pending MP4 export when the source is deleted', async ({ page }) => {
  await page.goto('/');
  await openMp4Dialog(page, { speed: 200, intermediate: false });
  await page.route(/\/assets\/mp4Worker-[^/]+\.js$/, async (route) => {
    await route.fulfill({ contentType: 'text/javascript', body: 'self.onmessage = () => {};' });
  });
  let downloaded = false;
  page.on('download', () => { downloaded = true; });
  await page.getByRole('button', { name: '确认下载' }).click();
  await expect(page.getByRole('button', { name: '取消导出' })).toBeVisible();
  await page.evaluate(() => {
    const deleteButton = [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === '删除') as HTMLButtonElement | undefined;
    if (!deleteButton) throw new Error('Delete button is unavailable.');
    deleteButton.disabled = false;
    deleteButton.click();
  });
  await page.waitForTimeout(500);
  expect(downloaded).toBe(false);
  await expect(page.getByText('上传 3D 照片', { exact: true }).first()).toBeVisible();
});
