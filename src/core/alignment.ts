import type { WiggleSettings } from '@/types/app';
import type { StereoSplitResult, StereoView } from '@/types/stereo';

export const ALIGNMENT_LIMIT_PX = 500;

export function isRightView(stereoSplit: StereoSplitResult, view: StereoView): boolean {
  return view === stereoSplit.rightView;
}

export function getScaledAlignmentOffset(
  stereoSplit: StereoSplitResult,
  view: StereoView,
  settings: WiggleSettings,
  scale: number,
) {
  if (!isRightView(stereoSplit, view)) {
    return { x: 0, y: 0 };
  }

  return {
    x: Math.round(settings.alignmentX * scale),
    y: Math.round(settings.alignmentY * scale),
  };
}
