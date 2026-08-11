import assert from 'node:assert/strict';
import test from 'node:test';

import { parseMpfMetadata, MpoParseError } from '../src/core/mpoParser.ts';
import { resolveStereoLayout } from '../src/core/stereoSplitter.ts';
import { getFrameInterval } from '../src/core/wiggleParams.ts';
import { getAlignmentLimit, getScaledAlignmentOffset } from '../src/core/alignment.ts';
import {
  drawWiggleFrame,
  getFrameGeometry,
} from '../src/core/renderGeometry.ts';
import {
  createWiggleFrameSequence,
  getWiggleFrameCount,
} from '../src/core/frameSequence.ts';
import { estimateGifMemoryBytes, isGifMemoryBudgetExceeded } from '../src/core/sizePolicy.ts';
import { getSbsOutputDimensions } from '../src/core/sbsExport.ts';
import {
  formatFileSize,
  getSupportedImageFileType,
  isAcceptedImageFile,
  isMpoFile,
} from '../src/utils/file.ts';

test('speed values are clamped to safe output ranges', () => {
  assert.equal(getFrameInterval(0), 920);
  assert.equal(getFrameInterval(100), 220);
  assert.equal(getFrameInterval(-10), 920);
  assert.equal(getFrameInterval(120), 220);

});

test('automatic stereo layout detects side-by-side and top-bottom images', () => {
  assert.equal(resolveStereoLayout(1600, 800, 'auto'), 'side-by-side');
  assert.equal(resolveStereoLayout(800, 1600, 'auto'), 'top-bottom');
  assert.equal(resolveStereoLayout(800, 1600, 'side-by-side'), 'side-by-side');
  assert.equal(resolveStereoLayout(1600, 800, 'top-bottom'), 'top-bottom');
});

test('alignment offsets only apply to the physical right view', () => {
  const leftView = { width: 400, height: 300, dataUrl: '', canvas: null };
  const rightView = { width: 400, height: 300, dataUrl: '', canvas: null };
  const stereoSplit = {
    layout: 'side-by-side',
    leftView,
    rightView,
  } as never;
  const settings = {
    alignmentX: 12,
    alignmentY: -8,
  } as never;

  assert.deepEqual(getScaledAlignmentOffset(stereoSplit, leftView as never, settings, 2), {
    x: 0,
    y: 0,
  });
  assert.deepEqual(getScaledAlignmentOffset(stereoSplit, rightView as never, settings, 2), {
    x: 24,
    y: -16,
  });
});

test('file type detection accepts supported extensions even without a MIME type', () => {
  const jpeg = new File(['jpeg'], 'sample.JPG', { type: '' });
  const mpo = new File(['mpo'], 'stereo.MPO', { type: '' });
  const text = new File(['text'], 'notes.txt', { type: 'text/plain' });

  assert.equal(getSupportedImageFileType(jpeg), 'jpeg');
  assert.equal(getSupportedImageFileType(mpo), 'mpo');
  assert.equal(isMpoFile(mpo), true);
  assert.equal(isAcceptedImageFile(jpeg), true);
  assert.equal(isAcceptedImageFile(text), false);
});

test('file size formatting remains readable for bytes, kilobytes, and megabytes', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(2 * 1024 * 1024), '2.0 MB');
});

test('invalid MPO input returns a structured parser error', () => {
  assert.throws(
    () => parseMpfMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xd9])),
    (error: unknown) =>
      error instanceof MpoParseError && error.code === 'mpf-not-found',
  );
});

test('wiggle sequence makes a seamless forward and reverse loop', () => {
  assert.equal(getWiggleFrameCount(), 4);

  assert.deepEqual(
    createWiggleFrameSequence().map(({ sourceView, crossfadeAmount }) => [
      sourceView,
      crossfadeAmount,
    ]),
    [
      ['first', 0],
      ['crossfade', 0.5],
      ['second', 1],
      ['crossfade', 0.5],
    ],
  );

  assert.ok(
    createWiggleFrameSequence().filter((frame) => frame.isTransition).every(
      (frame) => frame.sourceView === 'crossfade' && frame.crossfadeAmount === 0.5,
    ),
  );
  assert.equal(createWiggleFrameSequence().at(-1)?.delayMultiplier, 1);
});

test('crossfade draws an opaque base before the half-opacity overlay', () => {
  const alphaAtDraw: number[] = [];
  const context = {
    globalAlpha: 0,
    drawImage() {
      alphaAtDraw.push(this.globalAlpha);
    },
  } as unknown as CanvasRenderingContext2D;
  const views = [
    { canvas: {} },
    { canvas: {} },
  ] as unknown as Parameters<typeof drawWiggleFrame>[1];
  const geometry = {
    first: { x: 0, y: 0, width: 640, height: 480, scale: 1 },
    second: { x: 8, y: 0, width: 640, height: 480, scale: 1 },
  };
  const frame = createWiggleFrameSequence()[1];

  assert.ok(frame);
  drawWiggleFrame(context, views, geometry, frame);

  assert.deepEqual(alphaAtDraw, [1, 0.5]);
  assert.equal(context.globalAlpha, 1);
});

test('GIF memory estimates include the fixed crossfade loop frames', () => {
  const stereoSplit = {
    leftView: { width: 2160, height: 2160 },
    rightView: { width: 2160, height: 2160 },
  } as never;
  const settings = {} as never;

  assert.ok(estimateGifMemoryBytes(stereoSplit, settings, 'large') > 50 * 1024 * 1024);
  assert.equal(isGifMemoryBudgetExceeded(stereoSplit, settings, 'large'), false);
});

test('fixed render geometry preserves the full view and exposes matte background on offset', () => {
  const leftView = { width: 600, height: 600, canvas: null };
  const rightView = { width: 600, height: 600, canvas: null };
  const stereoSplit = { leftView, rightView } as never;
  const settings = {
    intensity: 100,
    alignmentX: 90,
    alignmentY: -90,
    swapEyes: false,
  } as never;
  const geometry = getFrameGeometry(stereoSplit, settings, 720, 720);

  assert.equal(getAlignmentLimit(stereoSplit), 90);
  assert.equal(geometry.first.x, 0);
  assert.equal(geometry.first.y, 0);
  assert.equal(geometry.first.width, 720);
  assert.equal(geometry.first.height, 720);
  assert.equal(geometry.second.width, 720);
  assert.equal(geometry.second.height, 720);
  assert.ok(geometry.second.x > 0);
  assert.ok(geometry.second.y < 0);
});

test('SBS output preserves equal view dimensions and rejects mismatched views', () => {
  const matching = {
    leftView: { width: 1200, height: 800 },
    rightView: { width: 1200, height: 800 },
  } as never;
  const mismatched = {
    leftView: { width: 1200, height: 800 },
    rightView: { width: 1180, height: 800 },
  } as never;

  assert.deepEqual(getSbsOutputDimensions(matching), { width: 2400, height: 800 });
  assert.equal(getSbsOutputDimensions(mismatched), null);
});
