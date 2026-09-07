import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
} from 'mediabunny';

import {
  createMp4Timeline,
  MP4_FRAME_DURATION_MS,
  MP4_FRAME_RATE,
} from '@/core/mp4Policy';
import type { Mp4WorkerRequest, Mp4WorkerResponse } from '@/types/export';

interface Mp4WorkerScope {
  onmessage: ((event: MessageEvent<Mp4WorkerRequest>) => void) | null;
  postMessage(message: Mp4WorkerResponse, transfer?: Transferable[]): void;
}

const workerScope = self as unknown as Mp4WorkerScope;

workerScope.onmessage = (event) => {
  void encode(event.data);
};

async function encode(request: Mp4WorkerRequest) {
  let output: Output<Mp4OutputFormat, BufferTarget> | null = null;

  try {
    const firstFrame = request.frames[0];
    if (!firstFrame || request.frames.some(
      (frame) => frame.width !== firstFrame.width || frame.height !== firstFrame.height,
    )) {
      throw new Error('MP4 frames must have matching dimensions.');
    }

    const canvas = new OffscreenCanvas(firstFrame.width, firstFrame.height);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Offscreen Canvas 2D context is unavailable.');
    }

    const target = new BufferTarget();
    output = new Output({
      format: new Mp4OutputFormat(),
      target,
    });
    const source = new CanvasSource(canvas, {
      codec: 'avc',
      quality: new Quality({ bitrate: request.bitrate, bitrateMode: 'variable' }),
      latencyMode: 'quality',
      alpha: 'discard',
      keyFrameInterval: 2,
    });
    output.addVideoTrack(source, { frameRate: MP4_FRAME_RATE });
    await output.start();

    const timeline = createMp4Timeline(request.frames);
    const imageData = context.createImageData(firstFrame.width, firstFrame.height);
    let renderedSourceIndex = -1;
    for (let index = 0; index < timeline.sourceFrameIndices.length; index += 1) {
      const sourceIndex = timeline.sourceFrameIndices[index] ?? 0;
      if (sourceIndex !== renderedSourceIndex) {
        const frame = request.frames[sourceIndex] ?? firstFrame;
        imageData.data.set(frame.data);
        context.putImageData(imageData, 0, 0);
        renderedSourceIndex = sourceIndex;
      }
      await source.add(
        index / MP4_FRAME_RATE,
        MP4_FRAME_DURATION_MS / 1000,
        { keyFrame: index === 0 },
      );

      workerScope.postMessage({
        type: 'progress',
        completed: index + 1,
        total: timeline.sourceFrameIndices.length,
      });
    }

    source.close();
    await output.finalize();
    const buffer = target.buffer;
    if (!buffer) {
      throw new Error('MP4 output buffer is unavailable.');
    }

    const response: Mp4WorkerResponse = { type: 'success', buffer };
    workerScope.postMessage(response, [buffer]);
  } catch (error) {
    if (output && output.state !== 'finalized' && output.state !== 'canceled') {
      await output.cancel().catch(() => undefined);
    }
    workerScope.postMessage({
      type: 'failure',
      message: error instanceof Error ? error.message : 'MP4 encoding failed.',
    });
  }
}
