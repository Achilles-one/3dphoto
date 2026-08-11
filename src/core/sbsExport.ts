import type { StereoSplitResult } from '@/types/stereo';

import type { GifExportProgress, GifExportTask } from './exportEngine.ts';

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
  onProgress?: (progress: GifExportProgress) => void,
): GifExportTask {
  const { leftView, rightView } = stereoSplit;

  if (!getSbsOutputDimensions(stereoSplit)) {
    return {
      promise: Promise.reject(new SbsDimensionsMismatchError()),
      cancel: () => undefined,
    };
  }

  const promise = (async () => {
    onProgress?.({ stage: 'preparing', progress: 0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }

    canvas.width = leftView.width + rightView.width;
    canvas.height = leftView.height;
    context.imageSmoothingEnabled = false;
    context.drawImage(leftView.canvas, 0, 0, leftView.width, leftView.height);
    context.drawImage(
      rightView.canvas,
      leftView.width,
      0,
      rightView.width,
      rightView.height,
    );
    onProgress?.({ stage: 'encoding', progress: 0.7 });
    const blob = await canvasToBlob(canvas);
    canvas.width = 1;
    canvas.height = 1;
    onProgress?.({ stage: 'ready', progress: 1 });
    return blob;
  })();

  return { promise, cancel: () => undefined };
}
