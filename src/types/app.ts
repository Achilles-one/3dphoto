import type { ProcessedImageInfo } from './image';
import type { StereoSplitResult } from './stereo';

export type AppPhase = 'empty' | 'loading' | 'preview' | 'exporting' | 'error';

export type PreviewMode = 'split' | 'align' | 'wiggle';

export type StereoLayout = 'auto' | 'side-by-side' | 'top-bottom';

export type ExportSize = 'small' | 'medium' | 'large';

export type ExportFormat = 'gif' | 'sbs';

export type InputFormat = 'jpeg' | 'png' | 'mpo';

export type AppErrorCode =
  | 'unsupported-file'
  | 'file-read-failed'
  | 'image-too-small'
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
  message: string;
  action: string;
  recoverable: boolean;
}

export interface WiggleSettings {
  layout: StereoLayout;
  swapEyes: boolean;
  speed: number;
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
  settings: WiggleSettings;
}
