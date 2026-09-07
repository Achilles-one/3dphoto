import type { Mp4ExportSize } from '@/types/app';
import type { AnimationFramePayload } from '@/types/export';

export const MP4_FRAME_RATE = 25;
export const MP4_FRAME_DURATION_MS = 1000 / MP4_FRAME_RATE;
export const MP4_BITRATE_FACTOR = 0.6;
export const MP4_BITRATE_LIMITS = {
  '1080': { min: 8_000_000, max: 20_000_000 },
  '1440': { min: 16_000_000, max: 50_000_000 },
} as const;

export interface Mp4Timeline {
  sourceFrameIndices: number[];
  loopCount: number;
  logicalDurationMs: number;
  encodedDurationMs: number;
}

export function calculateMp4Bitrate(
  width: number,
  height: number,
  size: Mp4ExportSize,
): number {
  const limits = MP4_BITRATE_LIMITS[size];
  const target = Math.round(width * height * MP4_FRAME_RATE * MP4_BITRATE_FACTOR);
  return Math.min(limits.max, Math.max(limits.min, target));
}

export function createMp4Timeline(
  frames: Pick<AnimationFramePayload, 'delay'>[],
): Mp4Timeline {
  if (!frames.length || frames.some((frame) => !Number.isFinite(frame.delay) || frame.delay <= 0)) {
    throw new Error('MP4 requires frames with positive durations.');
  }

  const loopDurationMs = frames.reduce((total, frame) => total + frame.delay, 0);
  const loopCount = loopDurationMs > 4000
    ? 1
    : Math.max(1, Math.ceil(2000 / loopDurationMs));
  const logicalDurationMs = loopDurationMs * loopCount;
  const encodedFrameCount = Math.max(1, Math.round(logicalDurationMs / MP4_FRAME_DURATION_MS));
  const boundaries: number[] = [];
  let boundary = 0;
  for (const frame of frames) {
    boundary += frame.delay;
    boundaries.push(boundary);
  }

  const sourceFrameIndices = Array.from({ length: encodedFrameCount }, (_, index) => {
    const loopTimestamp = (index * MP4_FRAME_DURATION_MS) % loopDurationMs;
    const sourceIndex = boundaries.findIndex((value) => loopTimestamp < value);
    return sourceIndex === -1 ? frames.length - 1 : sourceIndex;
  });

  return {
    sourceFrameIndices,
    loopCount,
    logicalDurationMs,
    encodedDurationMs: encodedFrameCount * MP4_FRAME_DURATION_MS,
  };
}

export function estimateMp4FileBytes(bitrate: number, durationMs: number): number {
  return Math.max(4096, Math.ceil((bitrate * durationMs) / 8000 * 1.03));
}
