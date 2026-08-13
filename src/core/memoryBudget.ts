import type { ExportSize } from '@/types/app';
import type { StereoSplitResult } from '@/types/stereo';

import { getWiggleFrameCount } from './frameSequence.ts';
import { createPreviewSizePlan, getExportDimensions } from './sizePolicy.ts';

const MEBIBYTE = 1024 * 1024;
const RGBA_BYTES_PER_PIXEL = 4;

export type MemoryBudgetKind = 'standard' | 'conservative';

export interface MemoryBudgetSignals {
  deviceMemoryGb?: number;
  hardwareConcurrency?: number;
  coarsePointer?: boolean;
}

export interface MemoryBudgetProfile {
  kind: MemoryBudgetKind;
  maxWorkingMemoryBytes: number;
  maxFileBytes: number;
  maxDecodedPixels: number;
  maxMpoFileBytes: number;
  maxMpoDecodedPixels: number;
}

export interface MemoryPlan {
  estimatedPeakBytes: number;
  limitBytes: number;
  allowed: boolean;
}

export interface DecodedImageMemoryPlan extends MemoryPlan {
  decodedPixels: number;
  pixelLimit: number;
}

export interface GifSourceMetrics {
  viewWidth: number;
  viewHeight: number;
  residentPixels: number;
  decodePixels: number;
}

export interface GifExportMemoryPlan extends MemoryPlan {
  size: ExportSize;
  dimensions: { width: number; height: number };
  sourceDecodeBytes: number;
  mainThreadBytes: number;
  workerBytes: number;
  outputBytes: number;
}

export type GifExportMemoryPlans = Record<ExportSize, GifExportMemoryPlan>;

export interface SbsExportMemoryPlan extends MemoryPlan {
  dimensions: { width: number; height: number } | null;
  sourceBytes: number;
  outputCanvasBytes: number;
  encoderBytes: number;
  outputBytes: number;
}

export class MemoryBudgetExceededError extends Error {
  constructor(message = 'This export exceeds the device memory budget.') {
    super(message);
    this.name = 'MemoryBudgetExceededError';
  }
}

export const STANDARD_MEMORY_BUDGET: MemoryBudgetProfile = Object.freeze({
  kind: 'standard',
  maxWorkingMemoryBytes: 192 * MEBIBYTE,
  maxFileBytes: 64 * MEBIBYTE,
  maxDecodedPixels: 40_000_000,
  maxMpoFileBytes: 32 * MEBIBYTE,
  maxMpoDecodedPixels: 16_000_000,
});

export const CONSERVATIVE_MEMORY_BUDGET: MemoryBudgetProfile = Object.freeze({
  kind: 'conservative',
  maxWorkingMemoryBytes: 96 * MEBIBYTE,
  maxFileBytes: 32 * MEBIBYTE,
  maxDecodedPixels: 16_000_000,
  maxMpoFileBytes: 16 * MEBIBYTE,
  maxMpoDecodedPixels: 8_000_000,
});

export function getMemoryBudgetProfile(
  signals: MemoryBudgetSignals,
): MemoryBudgetProfile {
  // A coarse pointer only identifies touch input. It does not identify a
  // low-memory device, and iOS does not expose deviceMemory at all. Treating
  // every phone as constrained rejects the required MPO and Weeview baselines
  // before preview downsampling can happen.
  const isConstrainedDevice =
    typeof signals.deviceMemoryGb === 'number' && signals.deviceMemoryGb <= 2;

  return isConstrainedDevice
    ? CONSERVATIVE_MEMORY_BUDGET
    : STANDARD_MEMORY_BUDGET;
}

export function getRuntimeMemoryBudget(): MemoryBudgetProfile {
  if (typeof navigator === 'undefined') {
    return STANDARD_MEMORY_BUDGET;
  }

  const runtimeNavigator = navigator as Navigator & { deviceMemory?: number };
  const coarsePointer =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

  return getMemoryBudgetProfile({
    deviceMemoryGb: runtimeNavigator.deviceMemory,
    hardwareConcurrency: runtimeNavigator.hardwareConcurrency,
    coarsePointer,
  });
}

export function createFileReadMemoryPlan(
  fileBytes: number,
  profile: MemoryBudgetProfile,
  format: 'raster' | 'mpo' = 'raster',
): MemoryPlan {
  const limitBytes = format === 'mpo'
    ? profile.maxMpoFileBytes
    : profile.maxFileBytes;

  return {
    estimatedPeakBytes: fileBytes,
    limitBytes,
    allowed: Number.isFinite(fileBytes) && fileBytes >= 0 && fileBytes <= limitBytes,
  };
}

export function createRasterDecodeMemoryPlan(
  fileBytes: number,
  width: number,
  height: number,
  profile: MemoryBudgetProfile,
): DecodedImageMemoryPlan {
  const decodedPixels = width * height;
  const previewPlan = createPreviewSizePlan(width, height);
  const previewPixels = previewPlan.width * previewPlan.height;
  const estimatedPeakBytes =
    fileBytes +
    decodedPixels * RGBA_BYTES_PER_PIXEL +
    previewPixels * 10;

  return createDecodedPlan(estimatedPeakBytes, decodedPixels, profile);
}

export function createMpoDecodeMemoryPlan(
  fileBytes: number,
  leftWidth: number,
  leftHeight: number,
  rightWidth: number,
  rightHeight: number,
  profile: MemoryBudgetProfile,
): DecodedImageMemoryPlan {
  const decodedPixels =
    leftWidth * leftHeight + rightWidth * rightHeight;
  const estimatedPeakBytes = fileBytes * 3 + decodedPixels * 12;

  return createDecodedPlan(
    estimatedPeakBytes,
    decodedPixels,
    profile,
    profile.maxMpoDecodedPixels,
  );
}

function createDecodedPlan(
  estimatedPeakBytes: number,
  decodedPixels: number,
  profile: MemoryBudgetProfile,
  pixelLimit = profile.maxDecodedPixels,
): DecodedImageMemoryPlan {
  return {
    estimatedPeakBytes,
    limitBytes: profile.maxWorkingMemoryBytes,
    decodedPixels,
    pixelLimit,
    allowed:
      Number.isFinite(decodedPixels) &&
      decodedPixels >= 0 &&
      decodedPixels <= pixelLimit &&
      estimatedPeakBytes <= profile.maxWorkingMemoryBytes,
  };
}

export function createGifExportMemoryPlan(
  source: GifSourceMetrics,
  size: ExportSize,
  profile: MemoryBudgetProfile,
  outputDimensions?: { width: number; height: number },
): GifExportMemoryPlan {
  const dimensions = outputDimensions ?? getExportDimensions(
    { width: source.viewWidth, height: source.viewHeight },
    size,
  );
  const outputPixels = dimensions.width * dimensions.height;
  const residentBytes = source.residentPixels * RGBA_BYTES_PER_PIXEL;
  const exportViewsBytes = outputPixels * RGBA_BYTES_PER_PIXEL * 2;
  const sourceDecodeBytes = source.decodePixels * RGBA_BYTES_PER_PIXEL;
  const frameBytes = outputPixels * RGBA_BYTES_PER_PIXEL;
  const outputBytes = estimateGifOutputCopiesBytes(outputPixels);
  const workerBytes =
    frameBytes * getWiggleFrameCount() +
    outputPixels +
    16 * MEBIBYTE +
    outputBytes;
  const mainThreadBytes =
    residentBytes +
    exportViewsBytes +
    frameBytes * (getWiggleFrameCount() + 1);
  const decodePeakBytes =
    residentBytes +
    sourceDecodeBytes +
    exportViewsBytes;
  const workerPeakBytes = residentBytes + exportViewsBytes + workerBytes;
  const estimatedPeakBytes = Math.max(
    decodePeakBytes,
    mainThreadBytes,
    workerPeakBytes,
  );

  return {
    size,
    dimensions,
    sourceDecodeBytes,
    mainThreadBytes,
    workerBytes,
    outputBytes,
    estimatedPeakBytes,
    limitBytes: profile.maxWorkingMemoryBytes,
    allowed: estimatedPeakBytes <= profile.maxWorkingMemoryBytes,
  };
}

export function createGifExportMemoryPlans(
  source: GifSourceMetrics,
  profile: MemoryBudgetProfile,
  outputDimensions?: Partial<Record<ExportSize, { width: number; height: number }>>,
): GifExportMemoryPlans {
  return {
    small: createGifExportMemoryPlan(source, 'small', profile, outputDimensions?.small),
    medium: createGifExportMemoryPlan(source, 'medium', profile, outputDimensions?.medium),
    large: createGifExportMemoryPlan(source, 'large', profile, outputDimensions?.large),
  };
}

export function getRecommendedGifSize(
  plans: GifExportMemoryPlans,
  requestedSize: ExportSize,
): ExportSize | null {
  const orderedSizes: ExportSize[] = ['small', 'medium', 'large'];
  const requestedIndex = orderedSizes.indexOf(requestedSize);

  for (let index = requestedIndex; index >= 0; index -= 1) {
    const size = orderedSizes[index];
    if (!size) {
      continue;
    }

    if (plans[size].allowed) {
      return size;
    }
  }

  return null;
}

export function estimateGifEncodingMemoryBytes(
  stereoSplit: StereoSplitResult,
  size: ExportSize,
): number {
  const dimensions = getExportDimensions(stereoSplit.leftView, size);
  const outputPixels = dimensions.width * dimensions.height;
  const sourcePixels =
    stereoSplit.leftView.width * stereoSplit.leftView.height +
    stereoSplit.rightView.width * stereoSplit.rightView.height;

  const frameBytes = outputPixels * RGBA_BYTES_PER_PIXEL;
  const preparePeakBytes =
    sourcePixels * RGBA_BYTES_PER_PIXEL +
    frameBytes * (getWiggleFrameCount() + 1);
  const workerPeakBytes =
    sourcePixels * RGBA_BYTES_PER_PIXEL +
    frameBytes * getWiggleFrameCount() +
    outputPixels +
    16 * MEBIBYTE +
    estimateGifOutputCopiesBytes(outputPixels);

  return Math.max(preparePeakBytes, workerPeakBytes);
}

function estimateGifOutputCopiesBytes(outputPixels: number): number {
  const encodedUpperBound =
    outputPixels * getWiggleFrameCount() * 2 + 4 * 1024;
  return Math.ceil(encodedUpperBound * 3.125);
}

export function createSbsExportMemoryPlan(
  stereoSplit: StereoSplitResult,
  profile: MemoryBudgetProfile,
): SbsExportMemoryPlan {
  const { leftView, rightView } = stereoSplit;
  if (
    leftView.width !== rightView.width ||
    leftView.height !== rightView.height
  ) {
    return {
      dimensions: null,
      sourceBytes: 0,
      outputCanvasBytes: 0,
      encoderBytes: 0,
      outputBytes: 0,
      estimatedPeakBytes: 0,
      limitBytes: profile.maxWorkingMemoryBytes,
      allowed: false,
    };
  }

  const dimensions = {
    width: leftView.width + rightView.width,
    height: leftView.height,
  };
  const estimatedPeakBytes = estimateSbsEncodingMemoryBytes(stereoSplit);
  const outputPixels = dimensions.width * dimensions.height;
  const sourcePixels =
    leftView.width * leftView.height +
    rightView.width * rightView.height;
  const sourceBytes = sourcePixels * RGBA_BYTES_PER_PIXEL;
  const outputCanvasBytes = outputPixels * RGBA_BYTES_PER_PIXEL;
  const encoderBytes = outputPixels * RGBA_BYTES_PER_PIXEL;
  const outputBytes = outputPixels * RGBA_BYTES_PER_PIXEL;

  return {
    dimensions,
    sourceBytes,
    outputCanvasBytes,
    encoderBytes,
    outputBytes,
    estimatedPeakBytes,
    limitBytes: profile.maxWorkingMemoryBytes,
    allowed: estimatedPeakBytes <= profile.maxWorkingMemoryBytes,
  };
}

export function estimateSbsEncodingMemoryBytes(
  stereoSplit: StereoSplitResult,
): number {
  const sourcePixels =
    stereoSplit.leftView.width * stereoSplit.leftView.height +
    stereoSplit.rightView.width * stereoSplit.rightView.height;
  const outputPixels =
    (stereoSplit.leftView.width + stereoSplit.rightView.width) *
    stereoSplit.leftView.height;

  // The two decoded MPO views stay resident while one SBS canvas is encoded.
  // Model those three RGBA surfaces; the encoded PNG blob is compressed and is
  // not another full-size RGBA surface.
  return (sourcePixels + outputPixels * 2) * RGBA_BYTES_PER_PIXEL;
}
