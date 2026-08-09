import assert from 'node:assert/strict';
import test from 'node:test';

import { parseMpfMetadata, MpoParseError } from '../src/core/mpoParser.ts';
import { resolveStereoLayout } from '../src/core/stereoSplitter.ts';
import { getFrameInterval, getIntensityOffset } from '../src/core/wiggleParams.ts';
import { getScaledAlignmentOffset } from '../src/core/alignment.ts';
import {
  formatFileSize,
  getSupportedImageFileType,
  isAcceptedImageFile,
  isMpoFile,
} from '../src/utils/file.ts';

test('speed and intensity values are clamped to safe output ranges', () => {
  assert.equal(getFrameInterval(0), 920);
  assert.equal(getFrameInterval(100), 220);
  assert.equal(getFrameInterval(-10), 920);
  assert.equal(getFrameInterval(120), 220);

  assert.equal(getIntensityOffset(0, 1000), 0);
  assert.equal(getIntensityOffset(100, 1000), 35);
  assert.equal(getIntensityOffset(-1, 1000), 0);
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
