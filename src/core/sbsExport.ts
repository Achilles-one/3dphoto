import type { WiggleSettings } from '@/types/app';
import type { StereoSplitResult } from '@/types/stereo';

import {
  ExportCanceledError,
  type GifExportProgress,
  type GifExportTask,
} from './exportEngine.ts';
import {
  estimateSbsEncodingMemoryBytes,
  MemoryBudgetExceededError,
  STANDARD_MEMORY_BUDGET,
} from './memoryBudget.ts';
import { getOrderedViews } from './renderGeometry.ts';

export class SbsDimensionsMismatchError extends Error {
  constructor() {
    super('SBS export requires matching view dimensions.');
    this.name = 'SbsDimensionsMismatchError';
  }
}

export function getSbsOutputDimensions(stereoSplit: StereoSplitResult) {
  const { leftView, rightView } = stereoSplit;
  if (leftView.width !== rightView.width || leftView.height !== rightView.height) {
    return null;
  }

  return {
    width: leftView.width + rightView.width,
    height: leftView.height,
  };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('SBS PNG encoding failed.'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

export function exportSbs(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  onProgress?: (progress: GifExportProgress) => void,
  maxMemoryBytes = STANDARD_MEMORY_BUDGET.maxWorkingMemoryBytes,
): GifExportTask {
  const [firstView, secondView] = getOrderedViews(stereoSplit, settings);

  if (!getSbsOutputDimensions(stereoSplit)) {
    return {
      promise: Promise.reject(new SbsDimensionsMismatchError()),
      cancel: () => undefined,
    };
  }

  if (estimateSbsEncodingMemoryBytes(stereoSplit) > maxMemoryBytes) {
    return {
      promise: Promise.reject(new MemoryBudgetExceededError()),
      cancel: () => undefined,
    };
  }

  let canceled = false;
  const promise = (async () => {
    const canvas = document.createElement('canvas');

    try {
      onProgress?.({ stage: 'preparing', progress: 0 });
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas 2D context is unavailable.');
      }

      canvas.width = firstView.width + secondView.width;
      canvas.height = firstView.height;
      context.imageSmoothingEnabled = false;
      context.drawImage(firstView.canvas, 0, 0, firstView.width, firstView.height);
      context.drawImage(
        secondView.canvas,
        firstView.width,
        0,
        secondView.width,
        secondView.height,
      );
      onProgress?.({ stage: 'encoding', progress: 0.7 });
      const blob = await canvasToBlob(canvas);

      if (canceled) {
        throw new ExportCanceledError();
      }

      onProgress?.({ stage: 'ready', progress: 1 });
      return blob;
    } finally {
      canvas.width = 1;
      canvas.height = 1;
    }
  })();

  return {
    promise,
    cancel: () => {
      canceled = true;
    },
  };
}
