import type { StereoView } from './stereo';

export type MpoByteOrder = 'little' | 'big';

export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface MpfImageEntry {
  index: number;
  attributes: number;
  size: number;
  dataOffset: number;
  absoluteOffset: number;
  jpegEndOffset: number;
}

export interface MpfMetadata {
  byteOrder: MpoByteOrder;
  numberOfImages: number;
  tiffOffset: number;
  entries: MpfImageEntry[];
}

export interface ExtractedMpoImage {
  index: number;
  bytes: Uint8Array;
  blob: Blob;
}

export interface MpoStereoPair {
  leftView: StereoView;
  rightView: StereoView;
  numberOfImages: number;
  ignoredImageCount: number;
  orientations: [ExifOrientation, ExifOrientation];
}
