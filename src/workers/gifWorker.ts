import { GIFEncoder, applyPalette, quantize } from 'gifenc';

import type { GifWorkerRequest, GifWorkerResponse } from '@/types/export';

interface GifWorkerScope {
  onmessage: ((event: MessageEvent<GifWorkerRequest>) => void) | null;
  postMessage(message: GifWorkerResponse, transfer?: Transferable[]): void;
}

const workerScope = self as unknown as GifWorkerScope;
let cancelRequested = false;

workerScope.onmessage = (event: MessageEvent<GifWorkerRequest>) => {
  if (event.data.type === 'cancel') {
    cancelRequested = true;
    return;
  }

  void encode(event.data.frames ?? []);
};

async function encode(frames: GifWorkerRequest['frames']) {
  try {
    cancelRequested = false;
    if (!frames?.length) {
      throw new Error('GIF has no frames to encode.');
    }

    const gif = GIFEncoder();

    for (const [index, frame] of frames.entries()) {
      if (cancelRequested) {
        workerScope.postMessage({ type: 'canceled' });
        return;
      }

      const palette = quantize(frame.data, 256);
      const indexedFrame = applyPalette(frame.data, palette);

      gif.writeFrame(indexedFrame, frame.width, frame.height, {
        palette,
        delay: frame.delay,
        repeat: index === 0 ? 0 : undefined,
      });

      workerScope.postMessage({
        type: 'progress',
        completed: index + 1,
        total: frames.length,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (cancelRequested) {
      workerScope.postMessage({ type: 'canceled' });
      return;
    }

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
}
