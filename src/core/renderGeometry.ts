import type { WiggleSettings } from '@/types/app';
import type { StereoSplitResult, StereoView } from '@/types/stereo';
import type { WiggleFrame } from './frameSequence.ts';

import { getScaledAlignmentOffset } from './alignment.ts';

export interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface FrameGeometry {
  first: DrawRect;
  second: DrawRect;
}

export const MATTE_BACKGROUND = '#eef3f0';

export function getOrderedViews(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
): [StereoView, StereoView] {
  return settings.swapEyes
    ? [stereoSplit.rightView, stereoSplit.leftView]
    : [stereoSplit.leftView, stereoSplit.rightView];
}

export function drawWiggleFrame(
  context: CanvasRenderingContext2D,
  views: [StereoView, StereoView],
  geometry: FrameGeometry,
  frame: WiggleFrame,
) {
  if (frame.sourceView === 'crossfade') {
    context.globalAlpha = 1;
    context.drawImage(
      views[0].canvas,
      geometry.first.x,
      geometry.first.y,
      geometry.first.width,
      geometry.first.height,
    );
    context.globalAlpha = frame.crossfadeAmount;
    context.drawImage(
      views[1].canvas,
      geometry.second.x,
      geometry.second.y,
      geometry.second.width,
      geometry.second.height,
    );
  } else {
    const viewIndex = frame.sourceView === 'first' ? 0 : 1;
    const rect = viewIndex === 0 ? geometry.first : geometry.second;
    context.globalAlpha = 1;
    context.drawImage(
      views[viewIndex].canvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    );
  }

  context.globalAlpha = 1;
}

function getContainScale(
  view: StereoView,
  targetWidth: number,
  targetHeight: number,
): number {
  return Math.min(targetWidth / view.width, targetHeight / view.height);
}

function getDrawRect(
  stereoSplit: StereoSplitResult,
  view: StereoView,
  targetWidth: number,
  targetHeight: number,
  settings: WiggleSettings,
): DrawRect {
  const scale = getContainScale(view, targetWidth, targetHeight);
  const width = Math.max(1, Math.ceil(view.width * scale));
  const height = Math.max(1, Math.ceil(view.height * scale));
  const alignment = getScaledAlignmentOffset(stereoSplit, view, settings, scale);

  return {
    x: Math.round((targetWidth - width) / 2 + alignment.x),
    y: Math.round((targetHeight - height) / 2 + alignment.y),
    width,
    height,
    scale,
  };
}

export function getFrameGeometry(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  targetWidth: number,
  targetHeight: number,
): FrameGeometry {
  const views = getOrderedViews(stereoSplit, settings);

  return {
    first: getDrawRect(
      stereoSplit,
      views[0],
      targetWidth,
      targetHeight,
      settings,
    ),
    second: getDrawRect(
      stereoSplit,
      views[1],
      targetWidth,
      targetHeight,
      settings,
    ),
  };
}
