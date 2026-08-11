import type { SizePlan } from '@/types/image';
import type { ExportSize, WiggleSettings } from '@/types/app';
import type { StereoSplitResult } from '@/types/stereo';

import { getWiggleFrameCount } from './frameSequence.ts';

export const PREVIEW_MAX_EDGE = 1200;
export const MIN_IMAGE_EDGE = 96;
export const EXPORT_WIDTHS = {
  small: 480,
  medium: 720,
  large: 1024,
} as const;
export const MAX_EXPORT_MEMORY_BYTES = 192 * 1024 * 1024;

export function isTooSmallForStereo(width: number, height: number): boolean {
  return width < MIN_IMAGE_EDGE * 2 && height < MIN_IMAGE_EDGE * 2;
}

export function isTooSmallForStereoView(width: number, height: number): boolean {
  return width < MIN_IMAGE_EDGE || height < MIN_IMAGE_EDGE;
}

export function createPreviewSizePlan(
  width: number,
  height: number,
  maxEdge = PREVIEW_MAX_EDGE,
): SizePlan {
  const largestEdge = Math.max(width, height);

  if (largestEdge <= maxEdge) {
    return {
      width,
      height,
      scale: 1,
      wasDownsampled: false,
    };
  }

  const scale = maxEdge / largestEdge;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
    wasDownsampled: true,
  };
}

export function getExportDimensions(
  view: { width: number; height: number },
  exportSize: ExportSize,
) {
  const width = EXPORT_WIDTHS[exportSize];
  const height = Math.max(1, Math.round((view.height / view.width) * width));

  return { width, height };
}

export function estimateGifMemoryBytes(
  stereoSplit: StereoSplitResult,
  _settings: WiggleSettings,
  exportSize: ExportSize,
): number {
  const dimensions = getExportDimensions(stereoSplit.leftView, exportSize);
  const sourceBytes =
    (stereoSplit.leftView.width * stereoSplit.leftView.height +
      stereoSplit.rightView.width * stereoSplit.rightView.height) *
    4;
  const frameBytes =
    dimensions.width * dimensions.height * getWiggleFrameCount() * 4;

  return sourceBytes + frameBytes + dimensions.width * dimensions.height * 4;
}

export function isGifMemoryBudgetExceeded(
  stereoSplit: StereoSplitResult,
  settings: WiggleSettings,
  exportSize: ExportSize,
): boolean {
  return estimateGifMemoryBytes(stereoSplit, settings, exportSize) > MAX_EXPORT_MEMORY_BYTES;
}
