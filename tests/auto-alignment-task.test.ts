import assert from 'node:assert/strict';
import test from 'node:test';
import { reactive, toRaw } from 'vue';

import {
  AUTO_ALIGNMENT_TIMEOUT_MS,
  startAutoAlignmentWorker,
} from '../src/core/autoAlignment.ts';
import type {
  AlignmentWorkerRequest,
  AlignmentWorkerResponse,
} from '../src/types/alignment.ts';
import { ALIGNMENT_WORKER_RUNTIME_VERSION } from '../src/types/alignment.ts';
import type { StereoSplitResult } from '../src/types/stereo.ts';

class FakeWorker {
  onmessage: ((event: MessageEvent<AlignmentWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminateCount = 0;
  postCount = 0;

  postMessage() { this.postCount += 1; }
  terminate() { this.terminateCount += 1; }
}

function fixture() {
  const worker = new FakeWorker();
  const timers = new Map<number, () => void>();
  let nextTimer = 0;
  const cleared: number[] = [];
  const clock = {
    setTimeout(callback: () => void, delay: number) {
      assert.equal(delay, AUTO_ALIGNMENT_TIMEOUT_MS);
      const id = ++nextTimer;
      timers.set(id, callback);
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeout(timer: ReturnType<typeof setTimeout>) {
      const id = timer as unknown as number;
      cleared.push(id);
      timers.delete(id);
    },
  };
  const pixels = () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1, colorSpace: 'srgb' }) as ImageData;
  const request: AlignmentWorkerRequest = {
    runtimeVersion: ALIGNMENT_WORKER_RUNTIME_VERSION,
    left: pixels(), right: pixels(), maxOffsetX: 10, maxOffsetY: 10,
  };
  const task = startAutoAlignmentWorker(worker, request, 0.5, clock);
  return { worker, timers, cleared, task };
}

function assertReleased(worker: FakeWorker, timers: Map<number, () => void>, cleared: number[]) {
  assert.equal(worker.terminateCount, 1);
  assert.equal(worker.onmessage, null);
  assert.equal(worker.onerror, null);
  assert.equal(timers.size, 0);
  assert.equal(cleared.length, 1);
}

test('Vue proxy identity accepts current original and proxied stereo split inputs', () => {
  const original = {
    layout: 'side-by-side',
    leftView: { width: 1, height: 1, dataUrl: '', canvas: {} },
    rightView: { width: 1, height: 1, dataUrl: '', canvas: {} },
  } as unknown as StereoSplitResult;
  const state = reactive<{ stereoSplit: StereoSplitResult | null }>({ stereoSplit: original });
  const proxiedTaskInput = state.stereoSplit!;
  assert.notEqual(state.stereoSplit, original);
  assert.equal(toRaw(state.stereoSplit), original);
  assert.notEqual(toRaw(state.stereoSplit), proxiedTaskInput);
  assert.equal(toRaw(state.stereoSplit), toRaw(proxiedTaskInput));
});

test('successful worker result settles once, rescales offsets and releases resources', async () => {
  const { worker, timers, cleared, task } = fixture();
  worker.onmessage?.({ data: { ok: true, alignmentX: 4, alignmentY: -2, confidence: 0.9 } } as MessageEvent<AlignmentWorkerResponse>);
  assert.deepEqual(await task.promise, { ok: true, alignmentX: 8, alignmentY: -4, confidence: 0.9 });
  worker.onerror?.({} as ErrorEvent);
  task.cancel();
  assertReleased(worker, timers, cleared);
});

test('worker error settles as a safe failure and releases resources', async () => {
  const { worker, timers, cleared, task } = fixture();
  worker.onerror?.({} as ErrorEvent);
  assert.deepEqual(await task.promise, { ok: false, reason: 'runtime-failure' });
  assertReleased(worker, timers, cleared);
});

test('active task does not time out before 30 seconds and times out at the deadline', async () => {
  const { worker, timers, cleared, task } = fixture();
  assert.equal(timers.size, 1);
  const timeout = [...timers.values()][0]!;
  let settled = false;
  void task.promise.then(() => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  timeout();
  assert.deepEqual(await task.promise, { ok: false, reason: 'timeout' });
  assertReleased(worker, timers, cleared);
});

test('cancel settles the waiting task once and releases resources', async () => {
  const { worker, timers, cleared, task } = fixture();
  task.cancel();
  task.cancel();
  assert.deepEqual(await task.promise, { ok: false, reason: 'canceled' });
  assertReleased(worker, timers, cleared);
});
