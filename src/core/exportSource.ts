import type {
  ExportFraming,
  ExportSize,
  Mp4ExportSize,
  WiggleSettings,
} from '@/types/app';
import type { DecodedImage } from '@/types/image';
import type {
  ResolvedStereoLayout,
  StereoSplitResult,
  StereoView,
} from '@/types/stereo';

import { getExportDimensions } from './sizePolicy.ts';
import {
  getGifExportRenderPlan,
  getMp4ExportRenderPlan,
  type GifExportRenderPlan,
} from './exportFraming.ts';

interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getStereoViewDimensions(
  sourceWidth: number,
  sourceHeight: number,
  layout: ResolvedStereoLayout,
) {
  return layout === 'top-bottom'
    ? { width: sourceWidth, height: Math.max(1, Math.floor(sourceHeight / 2)) }
    : { width: Math.max(1, Math.floor(sourceWidth / 2)), height: sourceHeight };
}

function getStereoSourceRects(
  sourceWidth: number,
  sourceHeight: number,
  layout: ResolvedStereoLayout,
): [SourceRect, SourceRect] {
  const view = getStereoViewDimensions(sourceWidth, sourceHeight, layout);

  return layout === 'top-bottom'
    ? [
        { x: 0, y: 0, width: view.width, height: view.height },
        { x: 0, y: view.height, width: view.width, height: view.height },
      ]
    : [
        { x: 0, y: 0, width: view.width, height: view.height },
        { x: view.width, y: 0, width: view.width, height: view.height },
      ];
}

function createExportView(
  source: CanvasImageSource,
  sourceRect: SourceRect,
  target: { width: number; height: number },
): StereoView {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  canvas.width = target.width;
  canvas.height = target.height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    source,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    target.width,
    target.height,
  );

  return {
    width: target.width,
    height: target.height,
    dataUrl: '',
    canvas,
  };
}

function createDecodedFramedView(
  source: CanvasImageSource,
  sourceRect: SourceRect,
  geometry: SourceRect,
  dimensions: { width: number; height: number },
): StereoView {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    source,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    geometry.x,
    geometry.y,
    geometry.width,
    geometry.height,
  );

  return { width: dimensions.width, height: dimensions.height, dataUrl: '', canvas };
}

/**
 * Builds export-only stereo canvases directly from the decoded original image.
 * The preview canvas is intentionally not used and the source is never enlarged.
 */
export function createStereoExportSource(
  decodedImage: DecodedImage,
  layout: ResolvedStereoLayout,
  exportSize: ExportSize,
): StereoSplitResult {
  const sourceDimensions = getStereoViewDimensions(
    decodedImage.width,
    decodedImage.height,
    layout,
  );
  const targetDimensions = getExportDimensions(sourceDimensions, exportSize);
  const [leftRect, rightRect] = getStereoSourceRects(
    decodedImage.width,
    decodedImage.height,
    layout,
  );
  const leftView = createExportView(decodedImage.source, leftRect, targetDimensions);

  try {
    return {
      layout,
      leftView,
      rightView: createExportView(decodedImage.source, rightRect, targetDimensions),
    };
  } catch (error) {
    leftView.canvas.width = 1;
    leftView.canvas.height = 1;
    throw error;
  }
}

/**
 * Renders directly from the decoded original into final-size GIF frames, so a
 * crop-overlap export never has to create full-resolution split canvases.
 */
function createFramedAnimatedExportSource(
  decodedImage: DecodedImage,
  layout: ResolvedStereoLayout,
  previewSource: StereoSplitResult,
  settings: WiggleSettings,
  createPlan: (rawSource: StereoSplitResult, sourceSettings: WiggleSettings) => GifExportRenderPlan,
): StereoSplitResult {
  const sourceDimensions = getStereoViewDimensions(
    decodedImage.width,
    decodedImage.height,
    layout,
  );
  const rawSource = {
    layout,
    leftView: {
      width: sourceDimensions.width,
      height: sourceDimensions.height,
      dataUrl: '',
      canvas: decodedImage.source as unknown as HTMLCanvasElement,
    },
    rightView: {
      width: sourceDimensions.width,
      height: sourceDimensions.height,
      dataUrl: '',
      canvas: decodedImage.source as unknown as HTMLCanvasElement,
    },
  } satisfies StereoSplitResult;
  const sourceSettings = getExportSettings(previewSource, rawSource, settings);
  const plan = createPlan(rawSource, sourceSettings);
  const [leftRect, rightRect] = getStereoSourceRects(
    decodedImage.width,
    decodedImage.height,
    layout,
  );
  const firstIsLeft = !settings.swapEyes;
  const leftGeometry = firstIsLeft ? plan.first : plan.second;
  const rightGeometry = firstIsLeft ? plan.second : plan.first;

  return {
    layout,
    leftView: createDecodedFramedView(
      decodedImage.source,
      leftRect,
      leftGeometry,
      plan.dimensions,
    ),
    rightView: createDecodedFramedView(
      decodedImage.source,
      rightRect,
      rightGeometry,
      plan.dimensions,
    ),
  };
}

export function createFramedGifExportSource(
  decodedImage: DecodedImage,
  layout: ResolvedStereoLayout,
  previewSource: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
  framing: ExportFraming,
): StereoSplitResult {
  return createFramedAnimatedExportSource(
    decodedImage,
    layout,
    previewSource,
    settings,
    (rawSource, sourceSettings) => getGifExportRenderPlan(
      rawSource,
      sourceSettings,
      exportSize,
      framing,
    ),
  );
}

export function createFramedMp4ExportSource(
  decodedImage: DecodedImage,
  layout: ResolvedStereoLayout,
  previewSource: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: Mp4ExportSize,
  framing: ExportFraming,
): StereoSplitResult {
  return createFramedAnimatedExportSource(
    decodedImage,
    layout,
    previewSource,
    settings,
    (rawSource, sourceSettings) => getMp4ExportRenderPlan(
      rawSource,
      sourceSettings,
      exportSize,
      framing,
    ),
  );
}

/** Maps alignment measured on preview pixels to equivalent export-source pixels. */
export function getExportSettings(
  previewSource: StereoSplitResult,
  exportSource: StereoSplitResult,
  settings: WiggleSettings,
): WiggleSettings {
  const previewView = previewSource.rightView;
  const exportView = exportSource.rightView;

  return {
    ...settings,
    alignmentX: settings.alignmentX * (exportView.width / previewView.width),
    alignmentY: settings.alignmentY * (exportView.height / previewView.height),
  };
}
