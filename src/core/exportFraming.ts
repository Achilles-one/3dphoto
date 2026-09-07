import type {
  ExportFraming,
  ExportSize,
  Mp4ExportSize,
  WiggleSettings,
} from '@/types/app';
import type { StereoSplitResult, StereoView } from '@/types/stereo';

import { getExportDimensions, getMp4ExportDimensions } from './sizePolicy.ts';
import { getFrameGeometry, getOrderedViews, type DrawRect } from './renderGeometry.ts';

export interface GifExportRenderPlan {
  dimensions: { width: number; height: number };
  first: DrawRect;
  second: DrawRect;
}

interface SourceFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getOverlapFrame(
  first: DrawRect,
  second: DrawRect,
  baseWidth: number,
  baseHeight: number,
): SourceFrame {
  const left = Math.ceil(Math.max(0, first.x, second.x));
  const top = Math.ceil(Math.max(0, first.y, second.y));
  const right = Math.floor(Math.min(baseWidth, first.x + first.width, second.x + second.width));
  const bottom = Math.floor(Math.min(baseHeight, first.y + first.height, second.y + second.height));

  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

function scaleRect(rect: DrawRect, frame: SourceFrame, scaleX: number, scaleY: number): DrawRect {
  return {
    x: (rect.x - frame.x) * scaleX,
    y: (rect.y - frame.y) * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
    scale: rect.scale * Math.min(scaleX, scaleY),
  };
}

/**
 * Produces one stable rendering plan for every A/B/M frame. The overlap frame
 * is rounded inward so neither eye can expose a one-pixel matte sliver.
 */
function getAnimatedExportRenderPlan(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  framing: ExportFraming,
  getDimensions: (frame: SourceFrame) => { width: number; height: number },
): GifExportRenderPlan {
  const [firstView] = getOrderedViews(stereoSplit, settings);
  const baseWidth = firstView.width;
  const baseHeight = firstView.height;
  const baseGeometry = getFrameGeometry(
    stereoSplit,
    settings,
    baseWidth,
    baseHeight,
  );
  const frame = framing === 'crop-overlap'
    ? getOverlapFrame(baseGeometry.first, baseGeometry.second, baseWidth, baseHeight)
    : { x: 0, y: 0, width: baseWidth, height: baseHeight };
  const dimensions = getDimensions(frame);
  const scaleX = dimensions.width / frame.width;
  const scaleY = dimensions.height / frame.height;

  return {
    dimensions,
    first: scaleRect(baseGeometry.first, frame, scaleX, scaleY),
    second: scaleRect(baseGeometry.second, frame, scaleX, scaleY),
  };
}

export function getGifExportRenderPlan(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
  framing: ExportFraming,
): GifExportRenderPlan {
  return getAnimatedExportRenderPlan(
    stereoSplit,
    settings,
    framing,
    (frame) => getExportDimensions(frame, exportSize),
  );
}

export function getMp4ExportRenderPlan(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: Mp4ExportSize,
  framing: ExportFraming,
): GifExportRenderPlan {
  return getAnimatedExportRenderPlan(
    stereoSplit,
    settings,
    framing,
    (frame) => getMp4ExportDimensions(frame, exportSize),
  );
}

export function getFramedGifOutputDimensions(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
  framing: ExportFraming,
) {
  return getGifExportRenderPlan(stereoSplit, settings, exportSize, framing)
    .dimensions;
}

export function getFramedMp4OutputDimensions(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: Mp4ExportSize,
  framing: ExportFraming,
) {
  return getMp4ExportRenderPlan(stereoSplit, settings, exportSize, framing)
    .dimensions;
}

function drawFramedView(
  view: StereoView,
  geometry: DrawRect,
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
  context.drawImage(view.canvas, geometry.x, geometry.y, geometry.width, geometry.height);

  return {
    width: dimensions.width,
    height: dimensions.height,
    dataUrl: '',
    canvas,
  };
}

/** Builds final-size GIF-only source canvases with alignment already applied. */
export function createFramedGifSource(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
  framing: ExportFraming,
): StereoSplitResult {
  const plan = getGifExportRenderPlan(stereoSplit, settings, exportSize, framing);
  const [firstView] = getOrderedViews(stereoSplit, settings);
  const firstOutput = drawFramedView(firstView, plan.first, plan.dimensions);
  const secondView = firstView === stereoSplit.leftView
    ? stereoSplit.rightView
    : stereoSplit.leftView;
  const secondOutput = drawFramedView(secondView, plan.second, plan.dimensions);

  return firstView === stereoSplit.leftView
    ? { layout: stereoSplit.layout, leftView: firstOutput, rightView: secondOutput }
    : { layout: stereoSplit.layout, leftView: secondOutput, rightView: firstOutput };
}

export function createFramedMp4Source(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: Mp4ExportSize,
  framing: ExportFraming,
): StereoSplitResult {
  const plan = getMp4ExportRenderPlan(stereoSplit, settings, exportSize, framing);
  const [firstView] = getOrderedViews(stereoSplit, settings);
  const firstOutput = drawFramedView(firstView, plan.first, plan.dimensions);
  const secondView = firstView === stereoSplit.leftView
    ? stereoSplit.rightView
    : stereoSplit.leftView;
  const secondOutput = drawFramedView(secondView, plan.second, plan.dimensions);

  return firstView === stereoSplit.leftView
    ? { layout: stereoSplit.layout, leftView: firstOutput, rightView: secondOutput }
    : { layout: stereoSplit.layout, leftView: secondOutput, rightView: firstOutput };
}
