import type { StereoLayout } from '@/types/app';
import type { ResolvedStereoLayout, StereoSplitResult, StereoView } from '@/types/stereo';

const LAYOUT_CONFIDENCE_RATIO = 1.15;

export function resolveStereoLayout(
  width: number,
  height: number,
  preferredLayout: StereoLayout,
): ResolvedStereoLayout {
  if (preferredLayout !== 'auto') {
    return preferredLayout;
  }

  if (height > width * LAYOUT_CONFIDENCE_RATIO) {
    return 'top-bottom';
  }

  return 'side-by-side';
}

function createView(
  source: HTMLCanvasElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): StereoView {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  canvas.width = Math.max(1, Math.floor(sw));
  canvas.height = Math.max(1, Math.floor(sh));
  context.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return {
    width: canvas.width,
    height: canvas.height,
    dataUrl: canvas.toDataURL('image/jpeg', 0.88),
    canvas,
  };
}

export function splitStereoImage(
  source: HTMLCanvasElement,
  preferredLayout: StereoLayout,
): StereoSplitResult {
  const layout = resolveStereoLayout(source.width, source.height, preferredLayout);

  if (layout === 'top-bottom') {
    const viewHeight = Math.floor(source.height / 2);

    return {
      layout,
      leftView: createView(source, 0, 0, source.width, viewHeight),
      rightView: createView(source, 0, viewHeight, source.width, viewHeight),
    };
  }

  const viewWidth = Math.floor(source.width / 2);

  return {
    layout,
    leftView: createView(source, 0, 0, viewWidth, source.height),
    rightView: createView(source, viewWidth, 0, viewWidth, source.height),
  };
}
