import type { SizePlan } from '@/types/image';
import type { ExportSize, Mp4ExportSize } from '@/types/app';

export const PREVIEW_MAX_EDGE = 1200;
export const MIN_IMAGE_EDGE = 96;
export const EXPORT_MAX_EDGES = {
  small: 720,
  medium: 1024,
  large: 1440,
} as const;
export const MP4_EXPORT_MAX_EDGES = {
  '1080': 1080,
  '1440': 1440,
} as const;

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
  const maxEdge = EXPORT_MAX_EDGES[exportSize];
  const sourceMaxEdge = Math.max(view.width, view.height);
  const scale = Math.min(1, maxEdge / sourceMaxEdge);
  const width = Math.max(1, Math.round(view.width * scale));
  const height = Math.max(1, Math.round(view.height * scale));

  return { width, height };
}

export function getMp4ExportDimensions(
  view: { width: number; height: number },
  exportSize: Mp4ExportSize,
) {
  const maxEdge = MP4_EXPORT_MAX_EDGES[exportSize];
  const sourceMaxEdge = Math.max(view.width, view.height);
  const scale = Math.min(1, maxEdge / sourceMaxEdge);
  const makeEven = (value: number) => Math.max(2, Math.floor(value / 2) * 2);

  return {
    width: makeEven(view.width * scale),
    height: makeEven(view.height * scale),
  };
}
