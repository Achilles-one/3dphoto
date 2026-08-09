import type { ExportSize, WiggleSettings } from '@/types/app';
import type {
  GifFramePayload,
  GifWorkerRequest,
  GifWorkerResponse,
} from '@/types/export';
import type { StereoSplitResult, StereoView } from '@/types/stereo';

import { getScaledAlignmentOffset } from './alignment';
import { EXPORT_WIDTHS } from './sizePolicy';
import { getFrameInterval, getIntensityOffset } from './wiggleParams';

function getOrderedViews(
  stereoSplit: StereoSplitResult,
  swapEyes: boolean,
): [StereoView, StereoView] {
  return swapEyes
    ? [stereoSplit.rightView, stereoSplit.leftView]
    : [stereoSplit.leftView, stereoSplit.rightView];
}

function getExportDimensions(view: StereoView, exportSize: ExportSize) {
  const width = EXPORT_WIDTHS[exportSize];
  const height = Math.max(1, Math.round((view.height / view.width) * width));

  return { width, height };
}

function drawExportFrame(
  stereoSplit: StereoSplitResult,
  view: StereoView,
  frameIndex: 0 | 1,
  settings: WiggleSettings,
  width: number,
  height: number,
): ImageData {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#172026';
  context.fillRect(0, 0, width, height);

  const offset = getIntensityOffset(settings.intensity, width);
  const direction = frameIndex === 0 ? -1 : 1;
  const overscanWidth = width + offset * 2;
  const overscanScale = overscanWidth / view.width;
  const overscanHeight = Math.max(
    height,
    Math.round((view.height / view.width) * overscanWidth),
  );
  const alignmentOffset = getScaledAlignmentOffset(
    stereoSplit,
    view,
    settings,
    overscanScale,
  );
  const x = Math.round((width - overscanWidth) / 2 + offset * direction);
  const y = Math.round((height - overscanHeight) / 2);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    view.canvas,
    x + alignmentOffset.x,
    y + alignmentOffset.y,
    overscanWidth,
    overscanHeight,
  );

  return context.getImageData(0, 0, width, height);
}

export function createGifFrames(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
): GifFramePayload[] {
  const views = getOrderedViews(stereoSplit, settings.swapEyes);
  const dimensions = getExportDimensions(views[0], exportSize);
  const delay = getFrameInterval(settings.speed);

  return views.map((view, index) => {
    const frameIndex = index as 0 | 1;
    const imageData = drawExportFrame(
      stereoSplit,
      view,
      frameIndex,
      settings,
      dimensions.width,
      dimensions.height,
    );

    return {
      data: imageData.data,
      width: dimensions.width,
      height: dimensions.height,
      delay,
    };
  });
}

export function encodeGifInWorker(frames: GifFramePayload[]): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/gifWorker.ts', import.meta.url), {
      type: 'module',
    });
    const transferables = frames.map((frame) => frame.data.buffer as ArrayBuffer);
    const request: GifWorkerRequest = {
      type: 'encode',
      frames,
    };

    worker.onmessage = (event: MessageEvent<GifWorkerResponse>) => {
      worker.terminate();

      if (event.data.type === 'failure') {
        reject(new Error(event.data.message));
        return;
      }

      resolve(new Blob([event.data.buffer], { type: 'image/gif' }));
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message));
    };

    worker.postMessage(request, transferables);
  });
}

export async function exportGif(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
): Promise<Blob> {
  const frames = createGifFrames(stereoSplit, settings, exportSize);
  return encodeGifInWorker(frames);
}
