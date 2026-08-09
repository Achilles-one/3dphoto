import type { ProcessedImageInfo } from './image';
import type { StereoSplitResult } from './stereo';

export type AppPhase = 'empty' | 'loading' | 'preview' | 'exporting' | 'error';

export type PreviewMode = 'split' | 'align' | 'wiggle';

export type StereoLayout = 'auto' | 'side-by-side' | 'top-bottom';

export type ExportSize = 'small' | 'medium' | 'large';

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
  | 'mpo-extra-images';

export interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
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
  error: UserFacingError | null;
  settings: WiggleSettings;
}
