import { reactive } from 'vue';

import type {
  AppErrorCode,
  AppState,
  ExportSize,
  InputDetection,
  Locale,
  StereoLayout,
  UploadedFileInfo,
  UserFacingError,
} from '@/types/app';
import type { ProcessedImageInfo } from '@/types/image';
import type { StereoSplitResult } from '@/types/stereo';
import { getAlignmentLimit } from '../core/alignment.ts';
import { getFrameInterval, DEFAULT_FRAME_INTERVAL_MS } from '../core/wiggleParams.ts';
import { getStoredLocale, storeLocale } from '../core/preferences.ts';

const defaultSettings = {
  layout: 'auto',
  swapEyes: false,
  speed: DEFAULT_FRAME_INTERVAL_MS,
  intermediateFrames: false,
  intensity: 0,
  alignmentX: 0,
  alignmentY: 0,
  overlayOpacity: 0.55,
  exportSize: 'medium',
  isPlaying: true,
} satisfies AppState['settings'];

export const diagnosticCodes: Record<AppErrorCode, string> = {
  'unsupported-file': '3DP-I001',
  'file-read-failed': '3DP-I002',
  'file-too-large': '3DP-M001',
  'image-too-small': '3DP-I003',
  'decoded-image-too-large': '3DP-M002',
  'image-too-large': '3DP-M003',
  'export-failed': '3DP-E001',
  'browser-unsupported': '3DP-B001',
  'mpo-invalid': '3DP-P001',
  'mpo-insufficient-views': '3DP-P002',
  'mpo-decode-failed': '3DP-P003',
  'mpo-extra-images': '3DP-P004',
  'sbs-dimensions-mismatch': '3DP-E002',
};

const errorCopy: Record<
  AppErrorCode,
  Omit<UserFacingError, 'code' | 'diagnosticCode'>
> = {
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
  'file-too-large': {
    message: 'This file is too large to process safely on this device.',
    action: 'Choose a smaller image file.',
    recoverable: false,
  },
  'image-too-small': {
    message: 'This image is too small to split into two views.',
    action: 'Try a larger 3D photo.',
    recoverable: false,
  },
  'decoded-image-too-large': {
    message: 'This image has too many pixels to process safely on this device.',
    action: 'Choose an image with smaller pixel dimensions.',
    recoverable: false,
  },
  'image-too-large': {
    message: 'This export exceeds the safe memory budget for this device.',
    action: 'Choose an available smaller size.',
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

const errorCopyZh: typeof errorCopy = {
  'unsupported-file': { message: '不支持此文件。', action: '请选择 JPG、PNG 或 MPO。', recoverable: false },
  'file-read-failed': { message: '无法读取此图片。', action: '请尝试其他文件。', recoverable: false },
  'file-too-large': { message: '此文件过大，无法在当前设备安全处理。', action: '请选择更小的图片文件。', recoverable: false },
  'image-too-small': { message: '此图片太小，无法拆分为双视图。', action: '请尝试更大的 3D 照片。', recoverable: false },
  'decoded-image-too-large': { message: '此图片像素过多，无法在当前设备安全处理。', action: '请选择像素尺寸更小的图片。', recoverable: false },
  'image-too-large': { message: '此导出超出当前设备的安全内存预算。', action: '请选择可用的较小尺寸。', recoverable: true },
  'export-failed': { message: 'GIF 导出失败。', action: '请尝试较小的尺寸。', recoverable: true },
  'browser-unsupported': { message: '您的浏览器不支持此功能。', action: '请使用最新版 Chrome、Edge 或 Safari。', recoverable: false },
  'mpo-invalid': { message: '此 MPO 文件无效或不完整。', action: '请选择包含两个有效视图的 MPO。', recoverable: false },
  'mpo-insufficient-views': { message: '此 MPO 不含两个有效视图。', action: '请选择由 3D 相机创建的 MPO。', recoverable: false },
  'mpo-decode-failed': { message: '无法解码 MPO 中的图片。', action: '请尝试其他 MPO 文件。', recoverable: false },
  'mpo-extra-images': { message: '此 MPO 包含超过两个视图。', action: 'Wiggle 预览仅使用前两个视图。', recoverable: true },
  'sbs-dimensions-mismatch': { message: '两个视图尺寸不匹配，无法导出 SBS。', action: '请选择 GIF，或使用尺寸相同的 MPO。', recoverable: true },
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

export function createUserFacingError(code: AppErrorCode, locale: Locale = 'en'): UserFacingError {
  return {
    code,
    diagnosticCode: diagnosticCodes[code],
    ...(locale === 'zh-CN' ? errorCopyZh : errorCopy)[code],
  };
}

export function useAppState() {
  const state = reactive<AppState>({
    phase: 'empty',
    previewMode: 'align',
    selectedFile: null,
    processedImage: null,
    stereoSplit: null,
    detection: null,
    error: null,
    locale: getStoredLocale(),
    settings: { ...defaultSettings },
  });

  function setUploadedFile(file: File) {
    state.phase = 'loading';
    state.previewMode = 'align';
    state.selectedFile = createFileInfo(file);
    state.processedImage = null;
    state.stereoSplit = null;
    state.detection = null;
    state.error = null;
    state.settings.layout = defaultSettings.layout;
    state.settings.alignmentX = defaultSettings.alignmentX;
    state.settings.alignmentY = defaultSettings.alignmentY;
    state.settings.overlayOpacity = defaultSettings.overlayOpacity;
    state.settings.speed = defaultSettings.speed;
    state.settings.intermediateFrames = defaultSettings.intermediateFrames;
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
    state.previewMode = 'align';
    state.processedImage = processedImage;
    state.stereoSplit = stereoSplit;
    state.detection = detection ?? null;
    state.error = null;
  }

  function showMpoPreview(stereoSplit: StereoSplitResult, detection: InputDetection) {
    state.phase = 'preview';
    state.previewMode = 'align';
    state.processedImage = null;
    state.stereoSplit = stereoSplit;
    state.detection = detection;
    state.error = null;
    state.settings.isPlaying = false;
  }

  function setError(code: AppErrorCode) {
    state.phase = 'error';
    state.error = createUserFacingError(code, state.locale);
  }

  function setRecoverableError(code: AppErrorCode) {
    state.phase = 'preview';
    state.error = {
      ...createUserFacingError(code, state.locale),
      recoverable: true,
    };
  }

  function setUploadRejectedError() {
    if (state.stereoSplit) {
      state.error = {
        ...createUserFacingError('unsupported-file', state.locale),
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

  function toggleLocale() {
    state.locale = state.locale === 'zh-CN' ? 'en' : 'zh-CN';
    storeLocale(state.locale);
  }

  function startCreatingWiggle() {
    if (state.phase !== 'preview' || !state.stereoSplit) {
      return false;
    }

    state.phase = 'creating';
    state.error = null;
    return true;
  }

  function finishCreatingWiggle() {
    if (state.phase !== 'creating' || !state.stereoSplit) {
      return;
    }

    state.phase = 'preview';
    state.previewMode = 'wiggle';
    state.settings.isPlaying = !prefersReducedMotion();
  }

  function resetUpload() {
    state.phase = 'empty';
    state.previewMode = 'align';
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
    state.previewMode = 'align';
    state.settings.isPlaying = false;
  }

  function setSpeed(speed: number) {
    state.settings.speed = getFrameInterval(speed);
  }

  function toggleIntermediateFrames() {
    state.settings.intermediateFrames = !state.settings.intermediateFrames;
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
    state.settings.intermediateFrames = defaultSettings.intermediateFrames;
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
    toggleLocale,
    startExporting,
    finishExporting,
    startCreatingWiggle,
    finishCreatingWiggle,
    resetUpload,
    setLayout,
    setStereoSplit,
    setSpeed,
    toggleIntermediateFrames,
    setAlignment,
    setOverlayOpacity,
    resetAlignment,
    setExportSize,
    resetAnimationSettings,
    togglePlayback,
    toggleSwapEyes,
    showSplitPreview,
    showAlignPreview,
  };
}
