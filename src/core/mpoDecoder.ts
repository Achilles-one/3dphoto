import type { ExifOrientation, MpoStereoPair } from '@/types/mpo';
import type { StereoView } from '@/types/stereo';

import { extractMpoImages, parseMpfMetadata, readExifOrientation } from './mpoParser';

interface RawDecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

function loadImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('MPO JPEG decode failed.'));
    };

    image.src = objectUrl;
  });
}

async function decodeRawImage(blob: Blob): Promise<RawDecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'none' });

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Fall back to an HTMLImageElement for browsers without ImageBitmap options.
    }
  }

  const image = await loadImageElement(blob);

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => undefined,
  };
}

function getOrientedSize(width: number, height: number, orientation: ExifOrientation) {
  return orientation >= 5 && orientation <= 8
    ? { width: height, height: width }
    : { width, height };
}

function applyOrientation(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  orientation: ExifOrientation,
) {
  switch (orientation) {
    case 2:
      context.setTransform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      context.setTransform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      context.setTransform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      context.setTransform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      context.setTransform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      context.setTransform(0, -1, -1, 0, height, width);
      break;
    case 8:
      context.setTransform(0, -1, 1, 0, 0, width);
      break;
    case 1:
      context.setTransform(1, 0, 0, 1, 0, 0);
      break;
  }
}

async function createOrientedView(
  blob: Blob,
  bytes: Uint8Array,
): Promise<{ view: StereoView; orientation: ExifOrientation }> {
  const orientation = readExifOrientation(bytes);
  const decoded = await decodeRawImage(blob);
  const size = getOrientedSize(decoded.width, decoded.height, orientation);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    decoded.close();
    throw new Error('Canvas 2D context is unavailable.');
  }

  canvas.width = size.width;
  canvas.height = size.height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  applyOrientation(context, decoded.width, decoded.height, orientation);
  context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);
  decoded.close();

  return {
    orientation,
    view: {
      width: canvas.width,
      height: canvas.height,
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      canvas,
    },
  };
}

export async function decodeMpoStereoPair(file: File): Promise<MpoStereoPair> {
  const input = await file.arrayBuffer();
  const metadata = parseMpfMetadata(input);
  const images = extractMpoImages(input, metadata);

  if (images.length < 2) {
    throw new Error('MPO does not contain two decodable images.');
  }

  const [leftImage, rightImage] = images;

  if (!leftImage || !rightImage) {
    throw new Error('MPO stereo image pair is incomplete.');
  }

  const [left, right] = await Promise.all([
    createOrientedView(leftImage.blob, leftImage.bytes),
    createOrientedView(rightImage.blob, rightImage.bytes),
  ]);

  return {
    leftView: left.view,
    rightView: right.view,
    numberOfImages: metadata.numberOfImages,
    ignoredImageCount: Math.max(0, metadata.numberOfImages - 2),
    orientations: [left.orientation, right.orientation],
  };
}
