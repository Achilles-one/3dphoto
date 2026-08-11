import { reactive } from 'vue';

import type {
  AppErrorCode,
  AppState,
  ExportSize,
  InputDetection,
  StereoLayout,
  UploadedFileInfo,
  UserFacingError,
} from '@/types/app';
import type { ProcessedImageInfo } from '@/types/image';
import type { StereoSplitResult } from '@/types/stereo';
import { getAlignmentLimit } from '../core/alignment.ts';

const defaultSettings = {
  layout: 'auto',
  swapEyes: false,
  speed: 50,
  intensity: 0,
  alignmentX: 0,
  alignmentY: 0,
  overlayOpacity: 0.55,
  exportSize: 'medium',
  isPlaying: true,
} satisfies AppState['settings'];

const errorCopy: Record<AppErrorCode, Omit<UserFacingError, 'code'>> = {
  'unsupported-file': {
    message: 'This file is not supported.',
    action: 'Try a JPG, PNG, or MPO.',
    recoverable: false,
  },
  'file-read-failed': {
    message: "We couldn't read this image.",
    action: 'Try another file.',
    recoverable: false,
  },
  'image-too-small': {
    message: 'This image is too small to split into two views.',
    action: 'Try a larger 3D photo.',
    recoverable: false,
  },
  'image-too-large': {
    message: 'This image is too large to export.',
    action: 'Try Small size.',
    recoverable: true,
  },
  'export-failed': {
    message: 'GIF export failed.',
    action: 'Try a smaller size.',
    recoverable: true,
  },
  'browser-unsupported': {
    message: 'Your browser does not support this feature.',
    action: 'Try the latest Chrome, Edge, or Safari.',
    recoverable: false,
  },
  'mpo-invalid': {
    message: 'This MPO file is invalid or incomplete.',
    action: 'Use an MPO with two valid views, or choose another file.',
    recoverable: false,
  },
  'mpo-insufficient-views': {
    message: 'This MPO does not contain two valid views.',
    action: 'Choose an MPO created by a 3D camera.',
    recoverable: false,
  },
  'mpo-decode-failed': {
    message: "We couldn't decode the images inside this MPO.",
    action: 'Try another MPO file.',
    recoverable: false,
  },
  'mpo-extra-images': {
    message: 'This MPO contains more than two views.',
    action: 'Only the first two views are used for the wiggle preview.',
    recoverable: true,
  },
  'sbs-dimensions-mismatch': {
    message: 'The two views do not have matching dimensions for SBS export.',
    action: 'Choose GIF, or use an MPO with two views of the same size.',
    recoverable: true,
  },
};

function createFileInfo(file: File): UploadedFileInfo {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createUserFacingError(code: AppErrorCode): UserFacingError {
  return {
    code,
    ...errorCopy[code],
  };
}

export function useAppState() {
  const state = reactive<AppState>({
    phase: 'empty',
    previewMode: 'split',
    selectedFile: null,
    processedImage: null,
    stereoSplit: null,
    detection: null,
    error: null,
    settings: { ...defaultSettings },
  });

  function setUploadedFile(file: File) {
    state.phase = 'loading';
    state.previewMode = 'split';
    state.selectedFile = createFileInfo(file);
    state.processedImage = null;
    state.stereoSplit = null;
    state.detection = null;
    state.error = null;
    state.settings.alignmentX = defaultSettings.alignmentX;
    state.settings.alignmentY = defaultSettings.alignmentY;
    state.settings.overlayOpacity = defaultSettings.overlayOpacity;
    state.settings.speed = defaultSettings.speed;
    state.settings.intensity = 0;
    state.settings.swapEyes = defaultSettings.swapEyes;
    state.settings.exportSize = defaultSettings.exportSize;
    state.settings.isPlaying = defaultSettings.isPlaying;
  }

  function showPreview(
    processedImage: ProcessedImageInfo,
    stereoSplit: StereoSplitResult,
    detection?: InputDetection,
  ) {
    state.phase = 'preview';
    state.previewMode = 'split';
    state.processedImage = processedImage;
    state.stereoSplit = stereoSplit;
    state.detection = detection ?? null;
    state.error = null;
  }

  function showMpoPreview(stereoSplit: StereoSplitResult, detection: InputDetection) {
    state.phase = 'preview';
    state.previewMode = 'split';
    state.processedImage = null;
    state.stereoSplit = stereoSplit;
    state.detection = detection;
    state.error = null;
    state.settings.isPlaying = false;
  }

  function setError(code: AppErrorCode) {
    state.phase = 'error';
    state.error = createUserFacingError(code);
  }

  function setRecoverableError(code: AppErrorCode) {
    state.phase = 'preview';
    state.error = {
      ...createUserFacingError(code),
      recoverable: true,
    };
  }

  function setUploadRejectedError() {
    if (state.stereoSplit) {
      state.error = {
        ...createUserFacingError('unsupported-file'),
        recoverable: true,
      };
      return;
    }

    setError('unsupported-file');
  }

  function clearError() {
    state.error = null;
  }

  function startExporting() {
    state.phase = 'exporting';
    state.error = null;
  }

  function finishExporting() {
    state.phase = 'preview';
    state.error = null;
  }

  function resetUpload() {
    state.phase = 'empty';
    state.previewMode = 'split';
    state.selectedFile = null;
    state.processedImage = null;
    state.stereoSplit = null;
    state.detection = null;
    state.error = null;
    state.settings = { ...defaultSettings };
  }

  function setLayout(layout: StereoLayout) {
    state.settings.layout = layout;
  }

  function setStereoSplit(stereoSplit: StereoSplitResult) {
    state.stereoSplit = stereoSplit;
    state.previewMode = 'split';
    state.settings.isPlaying = false;
  }

  function setSpeed(speed: number) {
    state.settings.speed = speed;
  }

  function setAlignment(alignmentX: number, alignmentY: number) {
    const limit = state.stereoSplit ? getAlignmentLimit(state.stereoSplit) : 500;
    state.settings.alignmentX = Math.min(limit, Math.max(-limit, alignmentX));
    state.settings.alignmentY = Math.min(limit, Math.max(-limit, alignmentY));
  }

  function setOverlayOpacity(overlayOpacity: number) {
    state.settings.overlayOpacity = overlayOpacity;
  }

  function resetAlignment() {
    state.settings.alignmentX = defaultSettings.alignmentX;
    state.settings.alignmentY = defaultSettings.alignmentY;
    state.settings.overlayOpacity = defaultSettings.overlayOpacity;
  }

  function setExportSize(exportSize: ExportSize) {
    state.settings.exportSize = exportSize;
  }

  function resetAnimationSettings() {
    state.settings.speed = defaultSettings.speed;
    state.settings.intensity = 0;
    state.settings.swapEyes = defaultSettings.swapEyes;
    state.settings.exportSize = defaultSettings.exportSize;
  }

  function togglePlayback() {
    if (state.phase !== 'preview') {
      return;
    }

    if (state.previewMode !== 'wiggle') {
      state.previewMode = 'wiggle';
      state.settings.isPlaying = !prefersReducedMotion();
      return;
    }

    state.settings.isPlaying = !state.settings.isPlaying;
  }

  function showSplitPreview() {
    state.previewMode = 'split';
    state.settings.isPlaying = false;
  }

  function showAlignPreview() {
    if (state.phase !== 'preview' || !state.stereoSplit) {
      return;
    }

    state.previewMode = 'align';
    state.settings.isPlaying = false;
  }

  function showWigglePreview() {
    if (state.phase !== 'preview' || !state.stereoSplit) {
      return;
    }

    state.previewMode = 'wiggle';
    state.settings.isPlaying = !prefersReducedMotion();
  }

  function toggleSwapEyes() {
    state.settings.swapEyes = !state.settings.swapEyes;
  }

  return {
    state,
    setUploadedFile,
    showPreview,
    showMpoPreview,
    setError,
    setRecoverableError,
    setUploadRejectedError,
    clearError,
    startExporting,
    finishExporting,
    resetUpload,
    setLayout,
    setStereoSplit,
    setSpeed,
    setAlignment,
    setOverlayOpacity,
    resetAlignment,
    setExportSize,
    resetAnimationSettings,
    togglePlayback,
    toggleSwapEyes,
    showSplitPreview,
    showAlignPreview,
    showWigglePreview,
  };
}
