import type { ExportSize, WiggleSettings } from '@/types/app';
import type {
  GifFramePayload,
  GifWorkerRequest,
  GifWorkerResponse,
} from '@/types/export';
import type { StereoSplitResult } from '@/types/stereo';

import { createWiggleFrameSequence } from './frameSequence.ts';
import {
  drawWiggleFrame,
  getFrameGeometry,
  getOrderedViews,
  MATTE_BACKGROUND,
} from './renderGeometry.ts';
import {
  estimateGifEncodingMemoryBytes,
  MemoryBudgetExceededError,
  STANDARD_MEMORY_BUDGET,
} from './memoryBudget.ts';
import { getExportDimensions } from './sizePolicy.ts';
import { getFrameInterval } from './wiggleParams.ts';

export interface GifExportProgress {
  stage: 'preparing' | 'encoding' | 'ready';
  progress: number;
}

export class ExportCanceledError extends Error {
  constructor() {
    super('GIF export canceled.');
    this.name = 'ExportCanceledError';
  }
}

export interface GifExportTask {
  promise: Promise<Blob>;
  cancel: () => void;
}

function drawFrame(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
  frame: ReturnType<typeof createWiggleFrameSequence>[number],
): ImageData {
  const views = getOrderedViews(stereoSplit, settings);
  const dimensions = getExportDimensions(views[0], exportSize);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const geometry = getFrameGeometry(
    stereoSplit,
    settings,
    dimensions.width,
    dimensions.height,
  );

  context.fillStyle = MATTE_BACKGROUND;
  context.fillRect(0, 0, dimensions.width, dimensions.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  drawWiggleFrame(context, views, geometry, frame);

  const imageData = context.getImageData(0, 0, dimensions.width, dimensions.height);
  canvas.width = 1;
  canvas.height = 1;
  return imageData;
}

export function createGifFrames(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
  onProgress?: (progress: GifExportProgress) => void,
): GifFramePayload[] {
  const sequence = createWiggleFrameSequence(settings.intermediateFrames !== false);
  const delay = getFrameInterval(settings.speed);

  onProgress?.({ stage: 'preparing', progress: 0 });
  return sequence.map((frame, index) => {
    const imageData = drawFrame(
      stereoSplit,
      settings,
      exportSize,
      frame,
    );
    onProgress?.({
      stage: 'preparing',
      progress: (index + 1) / sequence.length,
    });

    return {
      data: imageData.data,
      width: imageData.width,
      height: imageData.height,
      delay: Math.max(20, Math.round(delay * frame.delayMultiplier)),
    };
  });
}

function encodeGifInWorker(
  frames: GifFramePayload[],
  onProgress?: (progress: GifExportProgress) => void,
): GifExportTask {
  let worker: Worker | null = new Worker(new URL('../workers/gifWorker.ts', import.meta.url), {
    type: 'module',
  });
  let settled = false;
  let rejectTask: ((reason?: unknown) => void) | null = null;

  const promise = new Promise<Blob>((resolve, reject) => {
    rejectTask = reject;
    const activeWorker = worker;
    if (!activeWorker) {
      reject(new Error('GIF worker could not be created.'));
      return;
    }

    const finish = () => {
      activeWorker.terminate();
      worker = null;
      settled = true;
    };

    activeWorker.onmessage = (event: MessageEvent<GifWorkerResponse>) => {
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
      resolve(new Blob([event.data.buffer], { type: 'image/gif' }));
    };

    activeWorker.onerror = (event) => {
      finish();
      reject(new Error(event.message || 'GIF worker failed.'));
    };

    const transferables = frames.map((frame) => frame.data.buffer as ArrayBuffer);
    const request: GifWorkerRequest = { type: 'encode', frames };
    try {
      activeWorker.postMessage(request, transferables);
    } catch (error) {
      finish();
      reject(error);
    }
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

export function exportGif(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
  onProgress?: (progress: GifExportProgress) => void,
  maxMemoryBytes = STANDARD_MEMORY_BUDGET.maxWorkingMemoryBytes,
): GifExportTask {
  if (estimateGifEncodingMemoryBytes(stereoSplit, exportSize) > maxMemoryBytes) {
    return {
      promise: Promise.reject(new MemoryBudgetExceededError()),
      cancel: () => undefined,
    };
  }

  try {
    const frames = createGifFrames(stereoSplit, settings, exportSize, onProgress);
    return encodeGifInWorker(frames, onProgress);
  } catch (error) {
    return {
      promise: Promise.reject(error),
      cancel: () => undefined,
    };
  }
}
