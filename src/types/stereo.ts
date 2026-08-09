import type { StereoLayout } from './app';

export type ResolvedStereoLayout = Exclude<StereoLayout, 'auto'>;

export interface StereoView {
  width: number;
  height: number;
  dataUrl: string;
  canvas: HTMLCanvasElement;
}

export interface StereoSplitResult {
  layout: ResolvedStereoLayout;
  leftView: StereoView;
  rightView: StereoView;
}
