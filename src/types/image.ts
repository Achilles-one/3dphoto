export type DrawableImage = HTMLCanvasElement | HTMLImageElement | ImageBitmap;

export interface DecodedImage {
  source: HTMLImageElement | ImageBitmap;
  width: number;
  height: number;
}

export interface SizePlan {
  width: number;
  height: number;
  scale: number;
  wasDownsampled: boolean;
}

export interface ProcessedImageInfo {
  originalWidth: number;
  originalHeight: number;
  previewWidth: number;
  previewHeight: number;
  wasDownsampled: boolean;
  previewDataUrl: string;
  previewCanvas: HTMLCanvasElement;
}
