import { GIFEncoder, applyPalette, quantize } from 'gifenc';

import type { GifWorkerRequest, GifWorkerResponse } from '@/types/export';

interface GifWorkerScope {
  onmessage: ((event: MessageEvent<GifWorkerRequest>) => void) | null;
  postMessage(message: GifWorkerResponse, transfer?: Transferable[]): void;
}

const workerScope = self as unknown as GifWorkerScope;

workerScope.onmessage = (event: MessageEvent<GifWorkerRequest>) => {
  try {
    const { frames } = event.data;
    const gif = GIFEncoder();

    frames.forEach((frame, index) => {
      const palette = quantize(frame.data, 256);
      const indexedFrame = applyPalette(frame.data, palette);

      gif.writeFrame(indexedFrame, frame.width, frame.height, {
        palette,
        delay: frame.delay,
        repeat: index === 0 ? 0 : undefined,
      });
    });

    gif.finish();

    const bytes = gif.bytes();
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const response: GifWorkerResponse = {
      type: 'success',
      buffer,
    };

    workerScope.postMessage(response, [buffer]);
  } catch (error) {
    const response: GifWorkerResponse = {
      type: 'failure',
      message: error instanceof Error ? error.message : 'GIF encoding failed.',
    };

    workerScope.postMessage(response);
  }
};
