import type { SizePlan } from '@/types/image';

export const PREVIEW_MAX_EDGE = 1200;
export const MIN_IMAGE_EDGE = 96;
export const EXPORT_WIDTHS = {
  small: 480,
  medium: 720,
  large: 1024,
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
