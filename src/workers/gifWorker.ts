import type { GifWorkerRequest, GifWorkerResponse } from '@/types/export';
import { createSharedGifEncodingSession } from '@/core/gifEncoding';

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

async function encode(frames: NonNullable<GifWorkerRequest['frames']>) {
  try {
    cancelRequested = false;
    const session = createSharedGifEncodingSession(frames);

    for (const [index, frame] of frames.entries()) {
      if (cancelRequested) {
        workerScope.postMessage({ type: 'canceled' });
        return;
      }

      session.writeFrame(frame, index);

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

    const bytes = session.finish();
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
