import * as gifencModule from 'gifenc';

import type { GifFramePayload } from '@/types/export';

export const GIF_COLOR_COUNT = 256;
export const GIF_PALETTE_SAMPLE_PIXELS = 65_536;

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
type GifPalette = ReturnType<typeof quantize>;

export interface SharedGifEncodingSession {
  palette: GifPalette;
  writeFrame(frame: GifFramePayload, index: number): void;
  finish(): Uint8Array;
}

function validateFrames(frames: GifFramePayload[]) {
  if (!frames.length) {
    throw new Error('GIF has no frames to encode.');
  }

  const firstFrame = frames[0];
  if (!firstFrame) {
    throw new Error('GIF has no frames to encode.');
  }

  const { width, height } = firstFrame;
  for (const frame of frames) {
    if (frame.width !== width || frame.height !== height) {
      throw new Error('GIF frames must have matching dimensions.');
    }

    if (frame.data.length !== frame.width * frame.height * 4) {
      throw new Error('GIF frame RGBA data has an invalid length.');
    }
  }
}

/**
 * Samples every frame with an equal quota so endpoint and transition colors
 * have the same influence on the global GIF palette. Sampling is deterministic
 * to keep encoded output and pixel regressions reproducible.
 */
export function sampleGifFrames(
  frames: GifFramePayload[],
  maxSamplePixels = GIF_PALETTE_SAMPLE_PIXELS,
): Uint8Array {
  validateFrames(frames);

  const totalPixels = frames.reduce(
    (total, frame) => total + frame.width * frame.height,
    0,
  );
  const samplePixelCount = Math.min(
    totalPixels,
    Math.max(frames.length, Math.floor(maxSamplePixels)),
  );
  const sample = new Uint8Array(samplePixelCount * 4);
  const baseQuota = Math.floor(samplePixelCount / frames.length);
  let remaining = samplePixelCount % frames.length;
  let outputPixel = 0;

  for (const frame of frames) {
    const framePixels = frame.width * frame.height;
    const quota = Math.min(
      framePixels,
      baseQuota + (remaining > 0 ? 1 : 0),
    );
    remaining = Math.max(0, remaining - 1);

    for (let index = 0; index < quota; index += 1) {
      const sourcePixel = Math.min(
        framePixels - 1,
        Math.floor((index * framePixels) / quota),
      );
      const sourceOffset = sourcePixel * 4;
      const outputOffset = outputPixel * 4;
      sample[outputOffset] = frame.data[sourceOffset] ?? 0;
      sample[outputOffset + 1] = frame.data[sourceOffset + 1] ?? 0;
      sample[outputOffset + 2] = frame.data[sourceOffset + 2] ?? 0;
      sample[outputOffset + 3] = frame.data[sourceOffset + 3] ?? 255;
      outputPixel += 1;
    }
  }

  return outputPixel === samplePixelCount
    ? sample
    : sample.slice(0, outputPixel * 4);
}

export function createSharedGifPalette(
  frames: GifFramePayload[],
): GifPalette {
  return quantize(sampleGifFrames(frames), GIF_COLOR_COUNT);
}

export function createSharedGifEncodingSession(
  frames: GifFramePayload[],
): SharedGifEncodingSession {
  validateFrames(frames);
  const palette = createSharedGifPalette(frames);
  const gif = GIFEncoder();
  let finished = false;

  return {
    palette,
    writeFrame(frame, index) {
      if (finished) {
        throw new Error('GIF encoding has already finished.');
      }

      const indexedFrame = applyPalette(frame.data, palette);
      gif.writeFrame(indexedFrame, frame.width, frame.height, {
        // Only the first frame writes a color table. Every later image uses
        // the same global table, eliminating frame-local palette drift.
        palette: index === 0 ? palette : undefined,
        delay: frame.delay,
        repeat: index === 0 ? 0 : undefined,
      });
    },
    finish() {
      if (finished) {
        throw new Error('GIF encoding has already finished.');
      }

      finished = true;
      gif.finish();
      return gif.bytes();
    },
  };
}

export function encodeGifFramesWithSharedPalette(
  frames: GifFramePayload[],
): Uint8Array {
  const session = createSharedGifEncodingSession(frames);
  frames.forEach((frame, index) => session.writeFrame(frame, index));
  return session.finish();
}
