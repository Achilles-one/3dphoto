import {
  ALIGNMENT_WORKER_RUNTIME_VERSION,
  type AlignmentWorkerRequest,
  type AlignmentWorkerResponse,
  type AutoAlignmentResult,
} from '../types/alignment.ts';
import type { StereoSplitResult } from '@/types/stereo';

const MAX_ANALYSIS_EDGE = 640;
export const AUTO_ALIGNMENT_TIMEOUT_MS = 30_000;

export interface AutoAlignmentTask {
  promise: Promise<AutoAlignmentResult>;
  cancel: () => void;
}

interface AlignmentWorkerLike {
  onmessage: ((event: MessageEvent<AlignmentWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: AlignmentWorkerRequest, transfer: Transferable[]): void;
  terminate(): void;
}

interface AlignmentTaskClock {
  setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout>;
  clearTimeout(timer: ReturnType<typeof setTimeout>): void;
}

const defaultClock: AlignmentTaskClock = {
  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: (timer) => clearTimeout(timer),
};

function createAnalysisImage(source: HTMLCanvasElement, scale: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D context is unavailable.');
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  canvas.width = 1;
  canvas.height = 1;
  return image;
}

export function startAutoAlignment(
  stereoSplit: StereoSplitResult,
  alignmentLimit: number,
): AutoAlignmentTask {
  const longestEdge = Math.max(
    stereoSplit.leftView.width,
    stereoSplit.leftView.height,
    stereoSplit.rightView.width,
    stereoSplit.rightView.height,
  );
  const scale = Math.min(1, MAX_ANALYSIS_EDGE / longestEdge);
  const left = createAnalysisImage(stereoSplit.leftView.canvas, scale);
  const right = createAnalysisImage(stereoSplit.rightView.canvas, scale);
  const worker = new Worker(new URL('../workers/alignmentWorker.ts', import.meta.url), { type: 'module' });
  return startAutoAlignmentWorker(worker, {
    runtimeVersion: ALIGNMENT_WORKER_RUNTIME_VERSION,
    left,
    right,
    maxOffsetX: alignmentLimit * scale,
    maxOffsetY: alignmentLimit * scale,
  }, scale);
}

export function startAutoAlignmentWorker(
  worker: AlignmentWorkerLike,
  request: AlignmentWorkerRequest,
  scale: number,
  clock: AlignmentTaskClock = defaultClock,
): AutoAlignmentTask {
  let finish: (result: AutoAlignmentResult) => void = () => undefined;

  const promise = new Promise<AutoAlignmentResult>((resolve) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    finish = (result) => {
      if (settled) return;
      settled = true;
      if (timeout !== null) {
        clock.clearTimeout(timeout);
        timeout = null;
      }
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
      resolve(result);
    };
    worker.onmessage = (event: MessageEvent<AlignmentWorkerResponse>) => {
      const result = event.data;
      finish(result.ok ? {
        ...result,
        alignmentX: Math.round(result.alignmentX / scale),
        alignmentY: Math.round(result.alignmentY / scale),
      } : result);
    };
    worker.onerror = () => {
      finish({ ok: false, reason: 'runtime-failure' });
    };
    timeout = clock.setTimeout(
      () => finish({ ok: false, reason: 'timeout' }),
      AUTO_ALIGNMENT_TIMEOUT_MS,
    );
    try {
      worker.postMessage(request, [request.left.data.buffer, request.right.data.buffer]);
    } catch {
      finish({ ok: false, reason: 'runtime-failure' });
    }
  });

  return {
    promise,
    cancel() {
      finish({ ok: false, reason: 'canceled' });
    },
  };
}
