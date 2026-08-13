import assert from 'node:assert/strict';
import test from 'node:test';

import * as gifencModule from 'gifenc';

import {
  createSharedGifPalette,
  encodeGifFramesWithSharedPalette,
  sampleGifFrames,
} from '../src/core/gifEncoding.ts';
import type { GifFramePayload } from '../src/types/export.ts';
import { decodeGif } from './helpers/gifDecoder.ts';

const WIDTH = 64;
const HEIGHT = 48;
const DELAY = 240;
const gifencWithDefault = gifencModule as typeof gifencModule & {
  default?: typeof gifencModule;
};
const gifenc = Object.prototype.hasOwnProperty.call(gifencModule, 'GIFEncoder')
  ? gifencModule
  : gifencWithDefault.default;
if (!gifenc) {
  throw new Error('GIF encoder module is unavailable.');
}
const { GIFEncoder, applyPalette, quantize } = gifenc;

function createFrame(
  pixel: (x: number, y: number) => [number, number, number],
): GifFramePayload {
  const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const offset = (y * WIDTH + x) * 4;
      const color = pixel(x, y);
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width: WIDTH, height: HEIGHT, delay: DELAY };
}

function createQualitySequence(): GifFramePayload[] {
  const sharedRegion = (x: number, y: number): [number, number, number] => [
    (x * 9 + y * 3) % 256,
    (x * 2 + y * 7) % 256,
    (x * 5 + y * 11) % 256,
  ];
  const first = createFrame((x, y) => {
    if (x < WIDTH / 2) {
      return sharedRegion(x, y);
    }

    return [
      180 + ((x + y) % 55),
      95 + ((x * 3 + y) % 70),
      70 + ((x + y * 2) % 60),
    ];
  });
  const second = createFrame((x, y) => {
    if (x < WIDTH / 2) {
      return sharedRegion(x, y);
    }

    return [
      (x * 17 + y * 5) % 256,
      (255 - x * 3 + y * 9) % 256,
      (x * 7 + 255 - y * 4) % 256,
    ];
  });
  const middle = createFrame((x, y) => {
    const offset = (y * WIDTH + x) * 4;
    return [
      Math.round(((first.data[offset] ?? 0) + (second.data[offset] ?? 0)) / 2),
      Math.round(((first.data[offset + 1] ?? 0) + (second.data[offset + 1] ?? 0)) / 2),
      Math.round(((first.data[offset + 2] ?? 0) + (second.data[offset + 2] ?? 0)) / 2),
    ];
  });

  return [first, middle, second, { ...middle, data: middle.data.slice() }];
}

function encodeWithIndependentPalettes(frames: GifFramePayload[]): Uint8Array {
  const gif = GIFEncoder();
  frames.forEach((frame, index) => {
    const palette = quantize(frame.data, 256);
    gif.writeFrame(
      applyPalette(frame.data, palette),
      frame.width,
      frame.height,
      {
        palette,
        delay: frame.delay,
        repeat: index === 0 ? 0 : undefined,
      },
    );
  });
  gif.finish();
  return gif.bytes();
}

function meanAbsoluteRgbError(
  actual: Uint8ClampedArray,
  expected: Uint8ClampedArray,
  xStart = 0,
  xEnd = WIDTH,
): number {
  let error = 0;
  let samples = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const offset = (y * WIDTH + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        error += Math.abs(
          (actual[offset + channel] ?? 0) - (expected[offset + channel] ?? 0),
        );
        samples += 1;
      }
    }
  }
  return error / samples;
}

function meanLuminance(frame: Uint8ClampedArray): number {
  let total = 0;
  const pixelCount = frame.length / 4;
  for (let offset = 0; offset < frame.length; offset += 4) {
    total +=
      (frame[offset] ?? 0) * 0.2126 +
      (frame[offset + 1] ?? 0) * 0.7152 +
      (frame[offset + 2] ?? 0) * 0.0722;
  }
  return total / pixelCount;
}

test('shared palette sampling is deterministic and gives every frame a quota', () => {
  const frames = createQualitySequence();
  const firstSample = sampleGifFrames(frames, 400);
  const secondSample = sampleGifFrames(frames, 400);

  assert.equal(firstSample.length, 400 * 4);
  assert.deepEqual(firstSample, secondSample);
  assert.ok(createSharedGifPalette(frames).length <= 256);
});

test('decoded GIF keeps A, M, B, M order, delays and infinite looping', () => {
  const source = createQualitySequence();
  const decoded = decodeGif(encodeGifFramesWithSharedPalette(source));

  assert.equal(decoded.width, WIDTH);
  assert.equal(decoded.height, HEIGHT);
  assert.equal(decoded.repeat, 0);
  assert.equal(decoded.frames.length, 4);
  assert.deepEqual(decoded.frames.map((frame) => frame.delay), [DELAY, DELAY, DELAY, DELAY]);
  assert.deepEqual(decoded.frames.map((frame) => frame.hasLocalPalette), [false, false, false, false]);
  assert.ok(
    meanAbsoluteRgbError(decoded.frames[0]!.rgba, source[0]!.data) <
      meanAbsoluteRgbError(decoded.frames[0]!.rgba, source[2]!.data),
  );
  assert.ok(
    meanAbsoluteRgbError(decoded.frames[2]!.rgba, source[2]!.data) <
      meanAbsoluteRgbError(decoded.frames[2]!.rgba, source[0]!.data),
  );
  assert.deepEqual(decoded.frames[1]!.rgba, decoded.frames[3]!.rgba);
});

test('identical A and B produce a middle frame without a gray brightness veil', () => {
  const identical = createFrame((x, y) => [
    (x * 4) % 256,
    80 + ((x + y) % 120),
    45 + ((y * 3) % 150),
  ]);
  const source = [0, 1, 2, 3].map(() => ({
    ...identical,
    data: identical.data.slice(),
  }));
  const decoded = decodeGif(encodeGifFramesWithSharedPalette(source));
  const endpointLuminance = meanLuminance(decoded.frames[0]!.rgba);
  const middleLuminance = meanLuminance(decoded.frames[1]!.rgba);

  assert.deepEqual(decoded.frames[0]!.rgba, decoded.frames[1]!.rgba);
  assert.ok(Math.abs(endpointLuminance - middleLuminance) <= 1);
});

test('shared palette removes unchanged-region drift without obvious endpoint loss', () => {
  const source = createQualitySequence();
  const sharedBytes = encodeGifFramesWithSharedPalette(source);
  const independentBytes = encodeWithIndependentPalettes(source);
  const shared = decodeGif(sharedBytes);
  const independent = decodeGif(independentBytes);
  const sharedDrift = meanAbsoluteRgbError(
    shared.frames[0]!.rgba,
    shared.frames[2]!.rgba,
    0,
    WIDTH / 2,
  );
  const independentDrift = meanAbsoluteRgbError(
    independent.frames[0]!.rgba,
    independent.frames[2]!.rgba,
    0,
    WIDTH / 2,
  );
  const sharedEndpointError = (
    meanAbsoluteRgbError(shared.frames[0]!.rgba, source[0]!.data) +
    meanAbsoluteRgbError(shared.frames[2]!.rgba, source[2]!.data)
  ) / 2;
  const independentEndpointError = (
    meanAbsoluteRgbError(independent.frames[0]!.rgba, source[0]!.data) +
    meanAbsoluteRgbError(independent.frames[2]!.rgba, source[2]!.data)
  ) / 2;

  assert.ok(sharedDrift <= 0.1);
  assert.ok(independentDrift >= sharedDrift);
  assert.ok(sharedEndpointError <= independentEndpointError + 4);
  assert.ok(sharedBytes.length < independentBytes.length);
});

test('GIF encoding rejects mismatched frame dimensions', () => {
  const frames = createQualitySequence();
  frames[3] = { ...frames[3]!, width: WIDTH - 1 };

  assert.throws(
    () => encodeGifFramesWithSharedPalette(frames),
    /matching dimensions/,
  );
});
