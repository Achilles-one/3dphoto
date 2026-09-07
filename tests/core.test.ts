import assert from 'node:assert/strict';
import test from 'node:test';

import { parseMpfMetadata, MpoParseError } from '../src/core/mpoParser.ts';
import { resolveStereoLayout } from '../src/core/stereoSplitter.ts';
import { getFrameInterval } from '../src/core/wiggleParams.ts';
import { getAlignmentLimit, getScaledAlignmentOffset } from '../src/core/alignment.ts';
import {
  drawWiggleFrame,
  getFrameGeometry,
  getOrderedViews,
} from '../src/core/renderGeometry.ts';
import {
  createWiggleFrameSequence,
  getWiggleFrameCount,
} from '../src/core/frameSequence.ts';
import {
  getExportDimensions,
  getMp4ExportDimensions,
} from '../src/core/sizePolicy.ts';
import {
  calculateMp4Bitrate,
  createMp4Timeline,
  MP4_FRAME_RATE,
} from '../src/core/mp4Policy.ts';
import {
  CONSERVATIVE_MEMORY_BUDGET,
  createFileReadMemoryPlan,
  createGifExportMemoryPlans,
  createMpoDecodeMemoryPlan,
  createRasterDecodeMemoryPlan,
  createSbsExportMemoryPlan,
  estimateGifEncodingMemoryBytes,
  getMemoryBudgetProfile,
  getRecommendedGifSize,
  STANDARD_MEMORY_BUDGET,
  type MemoryBudgetProfile,
} from '../src/core/memoryBudget.ts';
import {
  getExportSettings,
  getStereoViewDimensions,
} from '../src/core/exportSource.ts';
import { getGifExportRenderPlan } from '../src/core/exportFraming.ts';
import { getSbsOutputDimensions } from '../src/core/sbsExport.ts';
import {
  formatFileSize,
  getSupportedImageFileType,
  isAcceptedImageFile,
  isMpoFile,
} from '../src/utils/file.ts';

test('speed values are clamped to safe output ranges', () => {
  assert.equal(getFrameInterval(100), 100);
  assert.equal(getFrameInterval(2000), 2000);
  assert.equal(getFrameInterval(-10), 100);
  assert.equal(getFrameInterval(2001), 2000);
  assert.equal(getFrameInterval(500.6), 501);

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
  assert.equal(getWiggleFrameCount(false), 2);
  assert.deepEqual(
    createWiggleFrameSequence(false).map(({ sourceView }) => sourceView),
    ['first', 'second'],
  );
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
  const estimate = estimateGifEncodingMemoryBytes(stereoSplit, 'large');

  assert.ok(estimate > 50 * 1024 * 1024);
  assert.ok(estimate < STANDARD_MEMORY_BUDGET.maxWorkingMemoryBytes);
});

test('only browsers reporting very low memory use the conservative profile', () => {
  assert.equal(getMemoryBudgetProfile({ deviceMemoryGb: 2 }).kind, 'conservative');
  assert.equal(getMemoryBudgetProfile({ deviceMemoryGb: 4 }).kind, 'standard');
  assert.equal(getMemoryBudgetProfile({ coarsePointer: true }).kind, 'standard');
  assert.equal(getMemoryBudgetProfile({}).kind, 'standard');
  assert.equal(getMemoryBudgetProfile({
    deviceMemoryGb: 8,
    hardwareConcurrency: 4,
    coarsePointer: false,
  }).kind, 'standard');
});

test('upload preflight uses byte caps before decoding', () => {
  const fortyMegabytes = 40 * 1024 * 1024;

  assert.equal(
    createFileReadMemoryPlan(fortyMegabytes, STANDARD_MEMORY_BUDGET).allowed,
    true,
  );
  assert.equal(
    createFileReadMemoryPlan(fortyMegabytes, CONSERVATIVE_MEMORY_BUDGET).allowed,
    false,
  );
});

test('decoded pixel checks are more conservative on constrained devices', () => {
  const standardPlan = createRasterDecodeMemoryPlan(
    8 * 1024 * 1024,
    5000,
    4000,
    STANDARD_MEMORY_BUDGET,
  );
  const conservativePlan = createRasterDecodeMemoryPlan(
    8 * 1024 * 1024,
    5000,
    4000,
    CONSERVATIVE_MEMORY_BUDGET,
  );

  assert.equal(standardPlan.allowed, true);
  assert.equal(conservativePlan.allowed, false);
  assert.equal(conservativePlan.decodedPixels, 20_000_000);
});

test('Weeview 32.51MP SBS baseline fits the desktop decode budget', () => {
  const plan = createRasterDecodeMemoryPlan(
    9 * 1024 * 1024,
    8064,
    4032,
    STANDARD_MEMORY_BUDGET,
  );

  assert.equal(plan.allowed, true);
});

test('touch devices without a low-memory signal accept the required source baselines', () => {
  const profile = getMemoryBudgetProfile({ coarsePointer: true });
  const sbsPlan = createRasterDecodeMemoryPlan(
    9 * 1024 * 1024,
    8064,
    4032,
    profile,
  );
  const mpoPlan = createMpoDecodeMemoryPlan(
    7 * 1024 * 1024,
    3584,
    2016,
    3584,
    2016,
    profile,
  );

  assert.equal(profile.kind, 'standard');
  assert.equal(sbsPlan.allowed, true);
  assert.equal(mpoPlan.allowed, true);
});

test('GIF plans recommend the largest executable downgrade', () => {
  const testProfile: MemoryBudgetProfile = {
    kind: 'standard',
    maxWorkingMemoryBytes: 90 * 1024 * 1024,
    maxFileBytes: 64 * 1024 * 1024,
    maxDecodedPixels: 32_000_000,
    maxMpoFileBytes: 32 * 1024 * 1024,
    maxMpoDecodedPixels: 16_000_000,
  };
  const plans = createGifExportMemoryPlans(
    {
      viewWidth: 4000,
      viewHeight: 4000,
      residentPixels: 2_000_000,
      decodePixels: 0,
    },
    testProfile,
  );

  assert.equal(plans.large.allowed, false);
  assert.equal(plans.medium.allowed, true);
  assert.equal(getRecommendedGifSize(plans, 'large'), 'medium');
  assert.ok(plans.large.estimatedPeakBytes > plans.medium.estimatedPeakBytes);
});

test('SBS export has an independent source, output and encoder budget', () => {
  const stereoSplit = {
    leftView: { width: 4000, height: 3000 },
    rightView: { width: 4000, height: 3000 },
  } as never;

  assert.equal(
    createSbsExportMemoryPlan(stereoSplit, STANDARD_MEMORY_BUDGET).allowed,
    false,
  );
  assert.deepEqual(
    createSbsExportMemoryPlan(stereoSplit, STANDARD_MEMORY_BUDGET).dimensions,
    { width: 8000, height: 3000 },
  );
});

test('SBS output view order follows Swap Eyes', () => {
  const leftView = { width: 3584, height: 2016 } as never;
  const rightView = { width: 3584, height: 2016 } as never;
  const stereoSplit = { leftView, rightView } as never;

  assert.deepEqual(
    getOrderedViews(stereoSplit, { swapEyes: false } as never),
    [leftView, rightView],
  );
  assert.deepEqual(
    getOrderedViews(stereoSplit, { swapEyes: true } as never),
    [rightView, leftView],
  );
});

test('a standard FUJIFILM MPO can export its original-size SBS PNG', () => {
  const stereoSplit = {
    leftView: { width: 3584, height: 2016 },
    rightView: { width: 3584, height: 2016 },
  } as never;

  const plan = createSbsExportMemoryPlan(
    stereoSplit,
    STANDARD_MEMORY_BUDGET,
  );

  assert.equal(plan.allowed, true);
  assert.deepEqual(plan.dimensions, { width: 7168, height: 2016 });
});

test('GIF presets constrain the longest edge and never upscale the source', () => {
  assert.deepEqual(getExportDimensions({ width: 3000, height: 1000 }, 'medium'), {
    width: 1024,
    height: 341,
  });
  assert.deepEqual(getExportDimensions({ width: 1000, height: 3000 }, 'medium'), {
    width: 341,
    height: 1024,
  });
  assert.deepEqual(getExportDimensions({ width: 320, height: 200 }, 'large'), {
    width: 320,
    height: 200,
  });
});

test('MP4 presets constrain the longest edge, keep even dimensions and never upscale', () => {
  assert.deepEqual(getMp4ExportDimensions({ width: 3000, height: 1000 }, '1080'), {
    width: 1080,
    height: 360,
  });
  assert.deepEqual(getMp4ExportDimensions({ width: 1000, height: 3000 }, '1440'), {
    width: 480,
    height: 1440,
  });
  assert.deepEqual(getMp4ExportDimensions({ width: 101, height: 99 }, '1440'), {
    width: 100,
    height: 98,
  });
});

test('MP4 bitrate follows the pixel formula and preset floors', () => {
  assert.equal(MP4_FRAME_RATE, 25);
  assert.equal(calculateMp4Bitrate(1080, 608, '1080'), 9_849_600);
  assert.equal(calculateMp4Bitrate(1440, 810, '1440'), 17_496_000);
  assert.equal(calculateMp4Bitrate(320, 200, '1080'), 8_000_000);
  assert.equal(calculateMp4Bitrate(320, 200, '1440'), 16_000_000);
});

test('MP4 timeline repeats complete loops and distributes 100ms frames at 25fps', () => {
  const fast = createMp4Timeline([{ delay: 100 }, { delay: 100 }]);
  assert.equal(fast.loopCount, 10);
  assert.equal(fast.logicalDurationMs, 2000);
  assert.equal(fast.encodedDurationMs, 2000);
  assert.deepEqual(fast.sourceFrameIndices.slice(0, 5), [0, 0, 0, 1, 1]);

  const defaultFourFrame = createMp4Timeline(Array.from({ length: 4 }, () => ({ delay: 200 })));
  assert.equal(defaultFourFrame.loopCount, 3);
  assert.equal(defaultFourFrame.logicalDurationMs, 2400);
  assert.equal(defaultFourFrame.sourceFrameIndices.length, 60);

  const slow = createMp4Timeline(Array.from({ length: 4 }, () => ({ delay: 2000 })));
  assert.equal(slow.loopCount, 1);
  assert.equal(slow.logicalDurationMs, 8000);
  assert.equal(slow.sourceFrameIndices.length, 200);
});

test('full-resolution stereo dimensions are derived before preview downsampling', () => {
  assert.deepEqual(getStereoViewDimensions(4000, 2000, 'side-by-side'), {
    width: 2000,
    height: 2000,
  });
  assert.deepEqual(getStereoViewDimensions(2000, 4000, 'top-bottom'), {
    width: 2000,
    height: 2000,
  });
  assert.deepEqual(getStereoViewDimensions(1601, 800, 'side-by-side'), {
    width: 800,
    height: 800,
  });
});

test('preview alignment is mapped proportionally onto the export source', () => {
  const previewSource = {
    layout: 'side-by-side',
    leftView: { width: 600, height: 400 },
    rightView: { width: 600, height: 400 },
  } as never;
  const exportSource = {
    layout: 'side-by-side',
    leftView: { width: 1024, height: 683 },
    rightView: { width: 1024, height: 683 },
  } as never;
  const settings = {
    alignmentX: 60,
    alignmentY: -40,
    swapEyes: true,
  } as never;

  const result = getExportSettings(previewSource, exportSource, settings);

  assert.equal(result.alignmentX, 102.4);
  assert.equal(result.alignmentY, -68.3);
  assert.equal(result.swapEyes, true);
});

test('crop-overlap framing crops both alignment axes before GIF sizing', () => {
  const stereoSplit = {
    layout: 'side-by-side',
    leftView: { width: 1000, height: 800 },
    rightView: { width: 1000, height: 800 },
  } as never;
  const settings = {
    alignmentX: 200,
    alignmentY: -100,
    swapEyes: false,
  } as never;

  const cropPlan = getGifExportRenderPlan(
    stereoSplit,
    settings,
    'medium',
    'crop-overlap',
  );
  const fullPlan = getGifExportRenderPlan(
    stereoSplit,
    settings,
    'medium',
    'full-frame',
  );

  assert.deepEqual(cropPlan.dimensions, { width: 800, height: 700 });
  assert.deepEqual(fullPlan.dimensions, { width: 1000, height: 800 });
  assert.ok(cropPlan.first.x < 0);
  assert.ok(cropPlan.second.x === 0);
  assert.ok(cropPlan.first.y === 0);
  assert.ok(cropPlan.second.y < 0);
});

test('crop-overlap framing remains valid for swapped and uneven MPO views', () => {
  const stereoSplit = {
    layout: 'side-by-side',
    leftView: { width: 1000, height: 800 },
    rightView: { width: 800, height: 800 },
  } as never;
  const plan = getGifExportRenderPlan(
    stereoSplit,
    { alignmentX: 80, alignmentY: 40, swapEyes: true } as never,
    'medium',
    'crop-overlap',
  );

  assert.ok(plan.dimensions.width > 0);
  assert.ok(plan.dimensions.height > 0);
  assert.ok(plan.first.width >= plan.dimensions.width);
  assert.ok(plan.second.width >= plan.dimensions.width);
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

  assert.equal(getAlignmentLimit(stereoSplit), 120);
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
