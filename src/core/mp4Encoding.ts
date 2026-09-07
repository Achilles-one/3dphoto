import { Quality, canEncodeVideo } from 'mediabunny';

import type { GifExportProgress, GifExportTask } from './exportEngine.ts';
import {
  createAnimationFrames,
  ExportCanceledError,
} from './exportEngine.ts';
import type { Mp4ExportSize, WiggleSettings } from '@/types/app';
import type {
  AnimationFramePayload,
  Mp4WorkerRequest,
  Mp4WorkerResponse,
} from '@/types/export';
import type { StereoSplitResult } from '@/types/stereo';
import { calculateMp4Bitrate } from './mp4Policy.ts';

export {
  calculateMp4Bitrate,
  createMp4Timeline,
  estimateMp4FileBytes,
  MP4_BITRATE_FACTOR,
  MP4_BITRATE_LIMITS,
  MP4_FRAME_DURATION_MS,
  MP4_FRAME_RATE,
} from './mp4Policy.ts';

export async function canEncodeMp4(
  width: number,
  height: number,
  size: Mp4ExportSize,
): Promise<boolean> {
  if (
    typeof Worker === 'undefined' ||
    typeof OffscreenCanvas === 'undefined' ||
    typeof VideoEncoder === 'undefined'
  ) {
    return false;
  }

  try {
    return await canEncodeVideo('avc', {
      width,
      height,
      quality: new Quality({
        bitrate: calculateMp4Bitrate(width, height, size),
        bitrateMode: 'variable',
      }),
      latencyMode: 'quality',
    });
  } catch {
    return false;
  }
}

function encodeMp4InWorker(
  frames: AnimationFramePayload[],
  bitrate: number,
  onProgress?: (progress: GifExportProgress) => void,
): GifExportTask {
  let worker: Worker | null = new Worker(new URL('../workers/mp4Worker.ts', import.meta.url), {
    type: 'module',
  });
  let settled = false;
  let rejectTask: ((reason?: unknown) => void) | null = null;

  const promise = new Promise<Blob>((resolve, reject) => {
    rejectTask = reject;
    const activeWorker = worker;
    if (!activeWorker) {
      reject(new Error('MP4 worker could not be created.'));
      return;
    }

    const finish = () => {
      activeWorker.terminate();
      worker = null;
      settled = true;
    };

    activeWorker.onmessage = (event: MessageEvent<Mp4WorkerResponse>) => {
      if (event.data.type === 'progress') {
        onProgress?.({
          stage: 'encoding',
          progress: event.data.completed / event.data.total,
        });
        return;
      }

      finish();
      if (event.data.type === 'canceled') {
        reject(new ExportCanceledError());
        return;
      }
      if (event.data.type === 'failure') {
        reject(new Error(event.data.message));
        return;
      }

      onProgress?.({ stage: 'ready', progress: 1 });
      resolve(new Blob([event.data.buffer], { type: 'video/mp4' }));
    };

    activeWorker.onerror = (event) => {
      finish();
      reject(new Error(event.message || 'MP4 worker failed.'));
    };

    const request: Mp4WorkerRequest = { type: 'encode', frames, bitrate };
    activeWorker.postMessage(
      request,
      frames.map((frame) => frame.data.buffer as ArrayBuffer),
    );
  });

  return {
    promise,
    cancel: () => {
      if (!settled && worker) {
        worker.terminate();
        worker = null;
        settled = true;
        rejectTask?.(new ExportCanceledError());
      }
    },
  };
}

export function exportMp4(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  size: Mp4ExportSize,
  onProgress?: (progress: GifExportProgress) => void,
): GifExportTask {
  try {
    const dimensions = {
      width: stereoSplit.leftView.width,
      height: stereoSplit.leftView.height,
    };
    const frames = createAnimationFrames(stereoSplit, settings, dimensions, onProgress);
    const bitrate = calculateMp4Bitrate(dimensions.width, dimensions.height, size);
    return encodeMp4InWorker(frames, bitrate, onProgress);
  } catch (error) {
    return {
      promise: Promise.reject(error),
      cancel: () => undefined,
    };
  }
}
