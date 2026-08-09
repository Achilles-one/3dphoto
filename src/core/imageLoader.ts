import type { DecodedImage, DrawableImage, ProcessedImageInfo } from '@/types/image';

import { createPreviewSizePlan } from './sizePolicy';

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image element decode failed.'));
    };

    image.src = objectUrl;
  });
}

export async function decodeImageFile(file: File): Promise<DecodedImage> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
      };
    } catch {
      // Fall back to HTMLImageElement for browsers or files createImageBitmap cannot decode.
    }
  }

  const image = await loadImageElement(file);

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

export function closeDecodedImage(image: DecodedImage | null) {
  if (image?.source instanceof ImageBitmap) {
    image.source.close();
  }
}

export function renderToCanvas(
  image: DrawableImage,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  canvas.width = width;
  canvas.height = height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  return canvas;
}

export function createProcessedImageInfo(decodedImage: DecodedImage): ProcessedImageInfo {
  const previewSize = createPreviewSizePlan(decodedImage.width, decodedImage.height);
  const previewCanvas = renderToCanvas(
    decodedImage.source,
    previewSize.width,
    previewSize.height,
  );

  return {
    originalWidth: decodedImage.width,
    originalHeight: decodedImage.height,
    previewWidth: previewSize.width,
    previewHeight: previewSize.height,
    wasDownsampled: previewSize.wasDownsampled,
    previewDataUrl: previewCanvas.toDataURL('image/jpeg', 0.86),
    previewCanvas,
  };
}
