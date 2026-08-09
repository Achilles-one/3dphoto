import type { ExportSize, WiggleSettings } from './app';

export interface GifFramePayload {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  delay: number;
}

export interface GifWorkerRequest {
  type: 'encode';
  frames: GifFramePayload[];
}

export interface GifWorkerSuccess {
  type: 'success';
  buffer: ArrayBuffer;
}

export interface GifWorkerFailure {
  type: 'failure';
  message: string;
}

export type GifWorkerResponse = GifWorkerSuccess | GifWorkerFailure;

export interface GifExportRequest {
  settings: WiggleSettings;
  exportSize: ExportSize;
}
