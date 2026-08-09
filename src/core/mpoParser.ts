import type {
  ExifOrientation,
  ExtractedMpoImage,
  MpfImageEntry,
  MpfMetadata,
  MpoByteOrder,
} from '@/types/mpo';

const JPEG_SOI = [0xff, 0xd8] as const;
const MPF_IDENTIFIER = [0x4d, 0x50, 0x46, 0x00] as const;
const EXIF_IDENTIFIER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] as const;
const TIFF_MAGIC = 0x002a;
const MP_ENTRY_SIZE = 16;
const MAX_MPF_IMAGES = 4096;

export type MpoParseErrorCode =
  | 'invalid-jpeg'
  | 'mpf-not-found'
  | 'malformed-mpf'
  | 'insufficient-images'
  | 'invalid-image-range';

export class MpoParseError extends Error {
  constructor(
    public readonly code: MpoParseErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MpoParseError';
  }
}

function toBytes(input: ArrayBuffer | Uint8Array): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

function hasBytes(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function assertRange(bytes: Uint8Array, offset: number, length: number, message: string) {
  if (offset < 0 || length < 0 || offset + length > bytes.length) {
    throw new MpoParseError('malformed-mpf', message);
  }
}

function createView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function readUint16(view: DataView, offset: number, byteOrder: MpoByteOrder): number {
  return view.getUint16(offset, byteOrder === 'little');
}

function readUint32(view: DataView, offset: number, byteOrder: MpoByteOrder): number {
  return view.getUint32(offset, byteOrder === 'little');
}

function isStandaloneMarker(marker: number): boolean {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9);
}

function findJpegEnd(bytes: Uint8Array, start: number, size: number): number | null {
  const limit = start + size;
  let offset = start + 2;

  while (offset < limit - 1) {
    if (bytes[offset] !== 0xff) {
      return null;
    }

    while (offset < limit && bytes[offset] === 0xff) {
      offset += 1;
    }

    const marker = bytes[offset];

    if (marker === undefined) {
      return null;
    }

    if (marker === 0xd9) {
      return offset + 1;
    }

    if (marker === 0xda) {
      if (offset + 2 >= limit) {
        return null;
      }

      const scanLength = (bytes[offset + 1] ?? 0) * 256 + (bytes[offset + 2] ?? 0);
      const scanDataStart = offset + 1 + scanLength;

      if (scanLength < 2 || scanDataStart > limit) {
        return null;
      }

      for (let cursor = scanDataStart; cursor < limit - 1; cursor += 1) {
        if (bytes[cursor] !== 0xff) {
          continue;
        }

        let markerCursor = cursor + 1;

        while (markerCursor < limit && bytes[markerCursor] === 0xff) {
          markerCursor += 1;
        }

        const scanMarker = bytes[markerCursor];

        if (scanMarker === 0xd9) {
          return markerCursor + 1;
        }

        if (scanMarker === 0x00) {
          cursor = markerCursor;
        }
      }

      return null;
    }

    if (isStandaloneMarker(marker)) {
      offset += 1;
      continue;
    }

    if (offset + 2 >= limit) {
      return null;
    }

    const segmentLength = (bytes[offset + 1] ?? 0) * 256 + (bytes[offset + 2] ?? 0);

    if (segmentLength < 2 || offset + 1 + segmentLength > limit) {
      return null;
    }

    offset += 1 + segmentLength;
  }

  return null;
}

function findApplicationSegment(
  bytes: Uint8Array,
  expectedMarker: number,
  identifier: readonly number[],
): number | null {
  if (!hasBytes(bytes, 0, JPEG_SOI)) {
    throw new MpoParseError('invalid-jpeg', 'MPO does not start with a JPEG image.');
  }

  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      throw new MpoParseError('malformed-mpf', 'JPEG marker sequence is invalid.');
    }

    while (bytes[offset] === 0xff) {
      offset += 1;
    }

    const marker = bytes[offset];

    if (marker === undefined) {
      throw new MpoParseError('malformed-mpf', 'JPEG marker is incomplete.');
    }

    if (marker === 0xda || marker === 0xd9) {
      return null;
    }

    if (isStandaloneMarker(marker)) {
      offset += 1;
      continue;
    }

    assertRange(bytes, offset + 1, 2, 'JPEG segment length is incomplete.');
    const segmentLength = (bytes[offset + 1] ?? 0) * 256 + (bytes[offset + 2] ?? 0);

    if (segmentLength < 2) {
      throw new MpoParseError('malformed-mpf', 'JPEG segment length is invalid.');
    }

    const payloadOffset = offset + 3;
    const payloadLength = segmentLength - 2;
    assertRange(bytes, payloadOffset, payloadLength, 'JPEG segment exceeds the file boundary.');

    if (
      marker === expectedMarker &&
      payloadLength >= identifier.length &&
      hasBytes(bytes, payloadOffset, identifier)
    ) {
      return payloadOffset + identifier.length;
    }

    offset = payloadOffset + payloadLength;
  }

  return null;
}

function parseTiffByteOrder(bytes: Uint8Array, tiffOffset: number): MpoByteOrder {
  assertRange(bytes, tiffOffset, 8, 'TIFF header is incomplete.');

  if (bytes[tiffOffset] === 0x49 && bytes[tiffOffset + 1] === 0x49) {
    return 'little';
  }

  if (bytes[tiffOffset] === 0x4d && bytes[tiffOffset + 1] === 0x4d) {
    return 'big';
  }

  throw new MpoParseError('malformed-mpf', 'TIFF byte order is invalid.');
}

function getTiffValue(
  view: DataView,
  entryOffset: number,
  type: number,
  count: number,
  byteOrder: MpoByteOrder,
): number | null {
  if (count !== 1) {
    return null;
  }

  if (type === 3) {
    return readUint16(view, entryOffset + 8, byteOrder);
  }

  if (type === 4) {
    return readUint32(view, entryOffset + 8, byteOrder);
  }

  return null;
}

function getTiffOffset(
  view: DataView,
  entryOffset: number,
  type: number,
  byteOrder: MpoByteOrder,
): number | null {
  if (type !== 7 && type !== 4) {
    return null;
  }

  return readUint32(view, entryOffset + 8, byteOrder);
}

function parseMpfEntries(
  bytes: Uint8Array,
  tiffOffset: number,
  byteOrder: MpoByteOrder,
): { numberOfImages: number; entries: MpfImageEntry[] } {
  const view = createView(bytes);
  const ifdOffset = readUint32(view, tiffOffset + 4, byteOrder);
  const ifdAddress = tiffOffset + ifdOffset;

  assertRange(bytes, ifdAddress, 2, 'MPF index IFD is outside the file.');
  const entryCount = readUint16(view, ifdAddress, byteOrder);
  const ifdLength = 2 + entryCount * 12 + 4;
  assertRange(bytes, ifdAddress, ifdLength, 'MPF index IFD is incomplete.');

  let numberOfImages: number | null = null;
  let mpEntryAddress: number | null = null;
  let mpEntryCount = 0;

  for (let index = 0; index < entryCount; index += 1) {
    const entryAddress = ifdAddress + 2 + index * 12;
    const tag = readUint16(view, entryAddress, byteOrder);
    const type = readUint16(view, entryAddress + 2, byteOrder);
    const count = readUint32(view, entryAddress + 4, byteOrder);

    if (tag === 0xb001) {
      numberOfImages = getTiffValue(view, entryAddress, type, count, byteOrder);
    }

    if (tag === 0xb002) {
      mpEntryCount = count;
      const valueOffset = getTiffOffset(view, entryAddress, type, byteOrder);

      if (valueOffset !== null) {
        mpEntryAddress = tiffOffset + valueOffset;
      }
    }
  }

  if (
    numberOfImages === null ||
    numberOfImages < 2 ||
    numberOfImages > MAX_MPF_IMAGES
  ) {
    throw new MpoParseError(
      'insufficient-images',
      'MPO does not contain at least two supported images.',
    );
  }

  if (
    mpEntryAddress === null ||
    mpEntryCount < numberOfImages * MP_ENTRY_SIZE ||
    mpEntryCount % MP_ENTRY_SIZE !== 0
  ) {
    throw new MpoParseError('malformed-mpf', 'MPF image entries are invalid.');
  }

  assertRange(
    bytes,
    mpEntryAddress,
    numberOfImages * MP_ENTRY_SIZE,
    'MPF image entries exceed the file boundary.',
  );

  const entries: MpfImageEntry[] = [];

  for (let index = 0; index < numberOfImages; index += 1) {
    const entryAddress = mpEntryAddress + index * MP_ENTRY_SIZE;
    const attributes = readUint32(view, entryAddress, byteOrder);
    const size = readUint32(view, entryAddress + 4, byteOrder);
    const dataOffset = readUint32(view, entryAddress + 8, byteOrder);
    const absoluteOffset = index === 0 ? 0 : tiffOffset + dataOffset;
    const jpegEndOffset = size > 0 ? findJpegEnd(bytes, absoluteOffset, size) : null;

    if (
      size === 0 ||
      absoluteOffset < 0 ||
      absoluteOffset + size > bytes.length ||
      !hasBytes(bytes, absoluteOffset, JPEG_SOI) ||
      jpegEndOffset === null
    ) {
      throw new MpoParseError(
        'invalid-image-range',
        `MPO image ${index + 1} has an invalid byte range.`,
      );
    }

    entries.push({
      index,
      attributes,
      size,
      dataOffset,
      absoluteOffset,
      jpegEndOffset,
    });
  }

  return { numberOfImages, entries };
}

export function parseMpfMetadata(input: ArrayBuffer | Uint8Array): MpfMetadata {
  const bytes = toBytes(input);
  const tiffOffset = findApplicationSegment(bytes, 0xe2, MPF_IDENTIFIER);

  if (tiffOffset === null) {
    throw new MpoParseError('mpf-not-found', 'MPO MPF metadata was not found.');
  }

  const byteOrder = parseTiffByteOrder(bytes, tiffOffset);
  const view = createView(bytes);

  if (readUint16(view, tiffOffset + 2, byteOrder) !== TIFF_MAGIC) {
    throw new MpoParseError('malformed-mpf', 'MPF TIFF magic value is invalid.');
  }

  const parsed = parseMpfEntries(bytes, tiffOffset, byteOrder);

  return {
    byteOrder,
    numberOfImages: parsed.numberOfImages,
    tiffOffset,
    entries: parsed.entries,
  };
}

export function extractMpoImages(
  input: ArrayBuffer | Uint8Array,
  metadata = parseMpfMetadata(input),
): ExtractedMpoImage[] {
  const bytes = toBytes(input);

  return metadata.entries.slice(0, 2).map((entry) => {
    const imageBytes = bytes.slice(entry.absoluteOffset, entry.jpegEndOffset);

    return {
      index: entry.index,
      bytes: imageBytes,
      blob: new Blob([imageBytes], { type: 'image/jpeg' }),
    };
  });
}

function readExifTiffOffset(imageBytes: Uint8Array): number | null {
  const exifPayloadOffset = findApplicationSegment(imageBytes, 0xe1, EXIF_IDENTIFIER);
  return exifPayloadOffset === null ? null : exifPayloadOffset;
}

export function readExifOrientation(input: ArrayBuffer | Uint8Array): ExifOrientation {
  const bytes = toBytes(input);

  try {
    const tiffOffset = readExifTiffOffset(bytes);

    if (tiffOffset === null) {
      return 1;
    }

    const view = createView(bytes);
    const byteOrder = parseTiffByteOrder(bytes, tiffOffset);

    if (readUint16(view, tiffOffset + 2, byteOrder) !== TIFF_MAGIC) {
      return 1;
    }

    const ifdAddress = tiffOffset + readUint32(view, tiffOffset + 4, byteOrder);
    assertRange(bytes, ifdAddress, 2, 'EXIF IFD is outside the file.');
    const entryCount = readUint16(view, ifdAddress, byteOrder);

    assertRange(bytes, ifdAddress, 2 + entryCount * 12, 'EXIF IFD is incomplete.');

    for (let index = 0; index < entryCount; index += 1) {
      const entryAddress = ifdAddress + 2 + index * 12;
      const tag = readUint16(view, entryAddress, byteOrder);

      if (tag !== 0x0112) {
        continue;
      }

      const type = readUint16(view, entryAddress + 2, byteOrder);
      const count = readUint32(view, entryAddress + 4, byteOrder);
      const value = getTiffValue(view, entryAddress, type, count, byteOrder);

      return value && value >= 1 && value <= 8 ? (value as ExifOrientation) : 1;
    }
  } catch {
    return 1;
  }

  return 1;
}
