export interface DecodedGifFrame {
  rgba: Uint8ClampedArray;
  delay: number;
  hasLocalPalette: boolean;
}

export interface DecodedGif {
  width: number;
  height: number;
  repeat: number | null;
  frames: DecodedGifFrame[];
}

class ByteReader {
  offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  byte(): number {
    const value = this.bytes[this.offset];
    if (value === undefined) {
      throw new Error('Unexpected end of GIF data.');
    }

    this.offset += 1;
    return value;
  }

  uint16(): number {
    return this.byte() | (this.byte() << 8);
  }

  read(length: number): Uint8Array {
    const end = this.offset + length;
    if (end > this.bytes.length) {
      throw new Error('Unexpected end of GIF data.');
    }

    const result = this.bytes.subarray(this.offset, end);
    this.offset = end;
    return result;
  }

  subBlocks(): Uint8Array {
    const blocks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const length = this.byte();
      if (length === 0) {
        break;
      }

      const block = this.read(length);
      blocks.push(block);
      total += block.length;
    }

    const result = new Uint8Array(total);
    let offset = 0;
    for (const block of blocks) {
      result.set(block, offset);
      offset += block.length;
    }
    return result;
  }
}

function readColorTable(reader: ByteReader, size: number): Uint8Array {
  return reader.read(size * 3);
}

function decodeLzw(
  minimumCodeSize: number,
  data: Uint8Array,
  expectedPixels: number,
): Uint8Array {
  const clearCode = 1 << minimumCodeSize;
  const endCode = clearCode + 1;
  let dictionary: Array<number[] | undefined> = [];
  let codeSize = minimumCodeSize + 1;
  let nextCode = endCode + 1;
  let bitOffset = 0;
  let previous: number[] | null = null;
  const output: number[] = [];

  const reset = () => {
    dictionary = new Array(endCode + 1);
    for (let index = 0; index < clearCode; index += 1) {
      dictionary[index] = [index];
    }
    codeSize = minimumCodeSize + 1;
    nextCode = endCode + 1;
    previous = null;
  };

  const readCode = (): number | null => {
    if (bitOffset + codeSize > data.length * 8) {
      return null;
    }

    let code = 0;
    for (let bit = 0; bit < codeSize; bit += 1) {
      const absoluteBit = bitOffset + bit;
      const byte = data[Math.floor(absoluteBit / 8)] ?? 0;
      code |= ((byte >> (absoluteBit % 8)) & 1) << bit;
    }
    bitOffset += codeSize;
    return code;
  };

  reset();
  while (output.length < expectedPixels) {
    const code = readCode();
    if (code === null || code === endCode) {
      break;
    }

    if (code === clearCode) {
      reset();
      continue;
    }

    let entry = dictionary[code];
    if (!entry && code === nextCode && previous) {
      entry = [...previous, previous[0] ?? 0];
    }
    if (!entry) {
      throw new Error('GIF LZW stream contains an invalid code.');
    }

    output.push(...entry);
    if (previous && nextCode < 4096) {
      dictionary[nextCode] = [...previous, entry[0] ?? 0];
      nextCode += 1;
      if (nextCode === 1 << codeSize && codeSize < 12) {
        codeSize += 1;
      }
    }
    previous = entry;
  }

  if (output.length < expectedPixels) {
    throw new Error('GIF LZW stream ended before the frame was complete.');
  }

  return Uint8Array.from(output.slice(0, expectedPixels));
}

function deinterlace(indices: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(indices.length);
  const passes = [
    { start: 0, step: 8 },
    { start: 4, step: 8 },
    { start: 2, step: 4 },
    { start: 1, step: 2 },
  ];
  let sourceRow = 0;

  for (const pass of passes) {
    for (let row = pass.start; row < height; row += pass.step) {
      result.set(
        indices.subarray(sourceRow * width, (sourceRow + 1) * width),
        row * width,
      );
      sourceRow += 1;
    }
  }

  return result;
}

export function decodeGif(bytes: Uint8Array): DecodedGif {
  const reader = new ByteReader(bytes);
  const signature = new TextDecoder('ascii').decode(reader.read(6));
  if (signature !== 'GIF87a' && signature !== 'GIF89a') {
    throw new Error('Input is not a GIF image.');
  }

  const width = reader.uint16();
  const height = reader.uint16();
  const packed = reader.byte();
  const hasGlobalPalette = (packed & 0x80) !== 0;
  const globalPaletteSize = 1 << ((packed & 0x07) + 1);
  reader.byte();
  reader.byte();
  const globalPalette = hasGlobalPalette
    ? readColorTable(reader, globalPaletteSize)
    : null;
  const canvas = new Uint8ClampedArray(width * height * 4);
  const frames: DecodedGifFrame[] = [];
  let repeat: number | null = null;
  let delay = 0;
  let transparentIndex: number | null = null;

  while (true) {
    const marker = reader.byte();
    if (marker === 0x3b) {
      break;
    }

    if (marker === 0x21) {
      const label = reader.byte();
      if (label === 0xf9) {
        const blockSize = reader.byte();
        if (blockSize !== 4) {
          throw new Error('GIF graphic control extension is malformed.');
        }
        const control = reader.byte();
        delay = reader.uint16() * 10;
        const candidateTransparency = reader.byte();
        transparentIndex = (control & 0x01) !== 0
          ? candidateTransparency
          : null;
        if (reader.byte() !== 0) {
          throw new Error('GIF graphic control extension is unterminated.');
        }
      } else if (label === 0xff) {
        const appName = new TextDecoder('ascii').decode(reader.read(reader.byte()));
        const appData = reader.subBlocks();
        if (
          appName === 'NETSCAPE2.0' &&
          appData[0] === 1 &&
          appData.length >= 3
        ) {
          repeat = (appData[1] ?? 0) | ((appData[2] ?? 0) << 8);
        }
      } else {
        reader.subBlocks();
      }
      continue;
    }

    if (marker !== 0x2c) {
      throw new Error('GIF contains an unsupported block marker.');
    }

    const left = reader.uint16();
    const top = reader.uint16();
    const frameWidth = reader.uint16();
    const frameHeight = reader.uint16();
    const imagePacked = reader.byte();
    const hasLocalPalette = (imagePacked & 0x80) !== 0;
    const isInterlaced = (imagePacked & 0x40) !== 0;
    const localPaletteSize = 1 << ((imagePacked & 0x07) + 1);
    const palette = hasLocalPalette
      ? readColorTable(reader, localPaletteSize)
      : globalPalette;
    if (!palette) {
      throw new Error('GIF frame has no color table.');
    }

    const minimumCodeSize = reader.byte();
    let indices = decodeLzw(
      minimumCodeSize,
      reader.subBlocks(),
      frameWidth * frameHeight,
    );
    if (isInterlaced) {
      indices = deinterlace(indices, frameWidth, frameHeight);
    }

    for (let y = 0; y < frameHeight; y += 1) {
      for (let x = 0; x < frameWidth; x += 1) {
        const colorIndex = indices[y * frameWidth + x] ?? 0;
        if (colorIndex === transparentIndex) {
          continue;
        }
        const target = ((top + y) * width + left + x) * 4;
        const color = colorIndex * 3;
        canvas[target] = palette[color] ?? 0;
        canvas[target + 1] = palette[color + 1] ?? 0;
        canvas[target + 2] = palette[color + 2] ?? 0;
        canvas[target + 3] = 255;
      }
    }

    frames.push({
      rgba: canvas.slice(),
      delay,
      hasLocalPalette,
    });
    delay = 0;
    transparentIndex = null;
  }

  return { width, height, repeat, frames };
}
