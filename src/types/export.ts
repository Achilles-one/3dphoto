import type { ExportFormat, ExportSize, WiggleSettings } from './app';

export interface GifFramePayload {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  delay: number;
}

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

export interface GifExportRequest {
  format: ExportFormat;
  settings: WiggleSettings;
  exportSize: ExportSize;
}
