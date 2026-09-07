import type {
  ExportFormat,
  ExportSelectionSize,
  WiggleSettings,
} from './app';

export interface AnimationFramePayload {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  delay: number;
}

export type GifFramePayload = AnimationFramePayload;

export interface GifWorkerRequest {
  type: 'encode' | 'cancel';
  frames?: GifFramePayload[];
}

export interface GifWorkerSuccess {
  type: 'success';
  buffer: ArrayBuffer;
}

export interface GifWorkerProgress {
  type: 'progress';
  completed: number;
  total: number;
}

export interface GifWorkerCanceled {
  type: 'canceled';
}

export interface GifWorkerFailure {
  type: 'failure';
  message: string;
}

export type GifWorkerResponse =
  | GifWorkerSuccess
  | GifWorkerProgress
  | GifWorkerCanceled
  | GifWorkerFailure;

export interface Mp4WorkerRequest {
  type: 'encode';
  frames: AnimationFramePayload[];
  bitrate: number;
}

export type Mp4WorkerResponse = GifWorkerResponse;

export interface GifExportRequest {
  format: ExportFormat;
  settings: WiggleSettings;
  exportSize: ExportSelectionSize;
}
