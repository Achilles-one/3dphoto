import type { ProcessedImageInfo } from './image';
import type { StereoSplitResult } from './stereo';

export type AppPhase = 'empty' | 'loading' | 'creating' | 'preview' | 'exporting' | 'error';

export type PreviewMode = 'split' | 'align' | 'wiggle';

export type StereoLayout = 'auto' | 'side-by-side' | 'top-bottom';

export type ExportSize = 'small' | 'medium' | 'large';
export type Mp4ExportSize = '1080' | '1440';
export type ExportSelectionSize = ExportSize | Mp4ExportSize;

export type ExportFormat = 'gif' | 'mp4' | 'sbs';
export type ExportFraming = 'crop-overlap' | 'full-frame';

export type InputFormat = 'jpeg' | 'png' | 'mpo';

export type Locale = 'zh-CN' | 'en';

export type AppErrorCode =
  | 'unsupported-file'
  | 'file-read-failed'
  | 'file-too-large'
  | 'image-too-small'
  | 'decoded-image-too-large'
  | 'image-too-large'
  | 'export-failed'
  | 'browser-unsupported'
  | 'mpo-invalid'
  | 'mpo-insufficient-views'
  | 'mpo-decode-failed'
  | 'mpo-extra-images'
  | 'sbs-dimensions-mismatch';

export interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface InputDetection {
  format: InputFormat;
  leftWidth: number;
  leftHeight: number;
  rightWidth: number;
  rightHeight: number;
  usedImageCount: number;
  totalImageCount?: number;
  orientations?: [number, number];
}

export interface UserFacingError {
  code: AppErrorCode;
  diagnosticCode: string;
  message: string;
  action: string;
  recoverable: boolean;
}

export interface WiggleSettings {
  layout: StereoLayout;
  swapEyes: boolean;
  speed: number;
  intermediateFrames?: boolean;
  intensity: number;
  alignmentX: number;
  alignmentY: number;
  overlayOpacity: number;
  exportSize: ExportSize;
  isPlaying: boolean;
}

export interface AppState {
  phase: AppPhase;
  previewMode: PreviewMode;
  selectedFile: UploadedFileInfo | null;
  processedImage: ProcessedImageInfo | null;
  stereoSplit: StereoSplitResult | null;
  detection: InputDetection | null;
  error: UserFacingError | null;
  locale: Locale;
  settings: WiggleSettings;
}
