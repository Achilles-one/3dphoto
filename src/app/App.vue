<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";

import ControlPanel from "@/components/ControlPanel.vue";
import AlignmentPreviewPanel from "@/components/AlignmentPreviewPanel.vue";
import GifExportDialog from "@/components/GifExportDialog.vue";
import PrivacyModal from "@/components/PrivacyModal.vue";
import PreviewCanvas from "@/components/PreviewCanvas.vue";
import UploadPanel from "@/components/UploadPanel.vue";
import MessageCenter from "@/components/MessageCenter.vue";
import {
  closeDecodedImage,
  createProcessedImageInfo,
  decodeImageFile,
} from "@/core/imageLoader";
import { decodeMpoStereoPair } from "@/core/mpoDecoder";
import {
  ExportCanceledError,
  exportGif,
  type GifExportProgress,
} from "@/core/exportEngine";
import {
  createFramedGifExportSource,
  getExportSettings,
  getStereoViewDimensions,
} from "@/core/exportSource";
import {
  createFramedGifSource,
  getFramedGifOutputDimensions,
} from "@/core/exportFraming";
import { SbsDimensionsMismatchError, exportSbs } from "@/core/sbsExport";
import { getAlignmentLimit } from "@/core/alignment";
import {
  isTooSmallForStereo,
  isTooSmallForStereoView,
} from "@/core/sizePolicy";
import { splitStereoImage } from "@/core/stereoSplitter";
import { MpoParseError } from "@/core/mpoParser";
import {
  releaseProcessedImage,
  releaseStereoSplit,
} from "@/core/resourceCleanup";
import {
  createFileReadMemoryPlan,
  createGifExportMemoryPlans,
  createMpoDecodeMemoryPlan,
  createRasterDecodeMemoryPlan,
  createSbsExportMemoryPlan,
  getRuntimeMemoryBudget,
  MemoryBudgetExceededError,
} from "@/core/memoryBudget";
import { createFeedbackUrl, getBrowserLabel } from "@/core/feedback";
import { storeExportPreference } from "@/core/preferences";
import type {
  AppErrorCode,
  ExportFormat,
  ExportFraming,
  ExportSize,
  InputDetection,
  InputFormat,
} from "@/types/app";
import type { StereoSplitResult } from "@/types/stereo";
import {
  createGifFileName,
  createSbsFileName,
  downloadBlob,
} from "@/utils/download";
import {
  getSupportedImageFileType,
  isMpoFile,
  isMpoFileName,
} from "@/utils/file";
import { trackEvent } from "@/utils/analytics";

import { useAppState } from "./appState";
import { useMessageCenter } from "@/composables/useMessageCenter";

const {
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
  setLayout,
  setSpeed,
  toggleIntermediateFrames,
  setAlignment,
  setOverlayOpacity,
  resetAlignment,
  togglePlayback,
  toggleSwapEyes,
  showAlignPreview,
  showWigglePreview,
} = useAppState();
const { messages, dismiss: dismissMessage, showMessage } = useMessageCenter();

const isExportDialogOpen = ref(false);
const isPrivacyOpen = ref(false);
const exportProgress = ref<GifExportProgress>({
  stage: "preparing",
  progress: 0,
});
const lastDiagnosticCode = ref("none");
let uploadStartedAt = 0;
let currentSourceFile: File | null = null;
let uploadGeneration = 0;
let wiggleCreationGeneration = 0;
let layoutChangeGeneration = 0;
const isLayoutChanging = ref(false);
const memoryBudget = getRuntimeMemoryBudget();
const appVersion = __APP_VERSION__;
const buildId = __BUILD_ID__;

interface ExportSession {
  id: number;
  canceled: boolean;
  cancelTask: (() => void) | null;
}

let nextExportSessionId = 0;
let activeExportSession: ExportSession | null = null;

const alignmentLimit = computed(() =>
  state.stereoSplit ? getAlignmentLimit(state.stereoSplit) : 500,
);
const isMpoInput = computed(() =>
  isMpoFileName(state.selectedFile?.name ?? "", state.selectedFile?.type ?? ""),
);
const isEnglish = computed(() => state.locale === "en");
const nextLayout = computed(() =>
  state.settings.layout === "top-bottom" ? "side-by-side" : "top-bottom",
);
const layoutToggleLabel = computed(() =>
  isEnglish.value
    ? `Switch to ${nextLayout.value === "top-bottom" ? "Top-Bottom" : "SBS"} layout`
    : `切换为${nextLayout.value === "top-bottom" ? "上下拼接" : "左右拼接"}布局`,
);
const feedbackInputFormat = computed<InputFormat | "not-loaded" | "unknown">(
  () => {
    if (state.detection) {
      return state.detection.format;
    }

    if (!state.selectedFile) {
      return "not-loaded";
    }

    if (isMpoInput.value) {
      return "mpo";
    }

    if (state.selectedFile.type === "image/png") {
      return "png";
    }

    if (
      state.selectedFile.type === "image/jpeg" ||
      state.selectedFile.type === "image/jpg"
    ) {
      return "jpeg";
    }

    return "unknown";
  },
);
const lastExportAttempt = ref<{
  format: ExportFormat;
  size: ExportSize;
  framing: ExportFraming | "not-applicable";
} | null>(null);
const feedbackHref = computed(() =>
  createFeedbackUrl({
    version: appVersion,
    buildId,
    locale: state.locale,
    browser: getBrowserLabel(navigator.userAgent),
    inputFormat: feedbackInputFormat.value,
    exportFormat: lastExportAttempt.value?.format ?? "not-applicable",
    exportSize: lastExportAttempt.value?.size ?? "not-applicable",
    exportFraming: lastExportAttempt.value?.framing ?? "not-applicable",
    errorCode: lastDiagnosticCode.value,
  }),
);
const gifSourceDimensions = computed(() => {
  if (!state.stereoSplit) {
    return null;
  }

  if (state.processedImage) {
    return getStereoViewDimensions(
      state.processedImage.originalWidth,
      state.processedImage.originalHeight,
      state.stereoSplit.layout,
    );
  }

  return {
    width: state.stereoSplit.leftView.width,
    height: state.stereoSplit.leftView.height,
  };
});
const gifFramingSource = computed(() => {
  if (!state.stereoSplit || !gifSourceDimensions.value) {
    return null;
  }

  if (!state.processedImage) {
    return { stereoSplit: state.stereoSplit, settings: state.settings };
  }

  const rawStereoSplit = {
    layout: state.stereoSplit.layout,
    leftView: {
      width: gifSourceDimensions.value.width,
      height: gifSourceDimensions.value.height,
      dataUrl: "",
      canvas: null,
    },
    rightView: {
      width: gifSourceDimensions.value.width,
      height: gifSourceDimensions.value.height,
      dataUrl: "",
      canvas: null,
    },
  } as unknown as StereoSplitResult;

  return {
    stereoSplit: rawStereoSplit,
    settings: getExportSettings(
      state.stereoSplit,
      rawStereoSplit,
      state.settings,
    ),
  };
});
function getGifMemoryPlans(framing: ExportFraming) {
  if (
    !state.stereoSplit ||
    !gifSourceDimensions.value ||
    !gifFramingSource.value
  ) {
    return null;
  }

  const splitPixels =
    state.stereoSplit.leftView.width * state.stereoSplit.leftView.height +
    state.stereoSplit.rightView.width * state.stereoSplit.rightView.height;
  const previewPixels = state.processedImage
    ? state.processedImage.previewCanvas.width *
      state.processedImage.previewCanvas.height
    : 0;
  const decodePixels = state.processedImage
    ? state.processedImage.originalWidth * state.processedImage.originalHeight
    : 0;

  return createGifExportMemoryPlans(
    {
      viewWidth: gifSourceDimensions.value.width,
      viewHeight: gifSourceDimensions.value.height,
      residentPixels: splitPixels + previewPixels,
      decodePixels,
    },
    memoryBudget,
    {
      small: getFramedGifOutputDimensions(
        gifFramingSource.value.stereoSplit,
        gifFramingSource.value.settings,
        "small",
        framing,
      ),
      medium: getFramedGifOutputDimensions(
        gifFramingSource.value.stereoSplit,
        gifFramingSource.value.settings,
        "medium",
        framing,
      ),
      large: getFramedGifOutputDimensions(
        gifFramingSource.value.stereoSplit,
        gifFramingSource.value.settings,
        "large",
        framing,
      ),
    },
  );
}
const cropOverlapGifMemoryPlans = computed(() =>
  getGifMemoryPlans("crop-overlap"),
);
const fullFrameGifMemoryPlans = computed(() => getGifMemoryPlans("full-frame"));
const sbsMemoryPlan = computed(() =>
  state.stereoSplit
    ? createSbsExportMemoryPlan(state.stereoSplit, memoryBudget)
    : null,
);

function releaseCurrentResources() {
  releaseProcessedImage(state.processedImage);
  releaseStereoSplit(state.stereoSplit);
}

function invalidateActiveExportSession() {
  const session = activeExportSession;
  if (!session) {
    return;
  }

  session.canceled = true;
  session.cancelTask?.();
}

function createInputDetection(
  format: InputDetection["format"],
  stereoSplit: NonNullable<typeof state.stereoSplit>,
  extra: Pick<InputDetection, "totalImageCount" | "orientations"> = {},
): InputDetection {
  return {
    format,
    leftWidth: stereoSplit.leftView.width,
    leftHeight: stereoSplit.leftView.height,
    rightWidth: stereoSplit.rightView.width,
    rightHeight: stereoSplit.rightView.height,
    usedImageCount: 2,
    ...extra,
  };
}

async function toggleLayout() {
  const sourceFile = currentSourceFile;
  const previousProcessedImage = state.processedImage;
  const previousStereoSplit = state.stereoSplit;
  if (
    !sourceFile ||
    !previousProcessedImage ||
    !previousStereoSplit ||
    isLayoutChanging.value
  ) {
    return;
  }

  const generation = ++layoutChangeGeneration;
  const layout = nextLayout.value;
  isLayoutChanging.value = true;
  let processedImage: ReturnType<typeof createProcessedImageInfo> | null = null;
  let stereoSplit: StereoSplitResult | null = null;

  try {
    const decodedImage = await decodeImageFile(sourceFile);
    try {
      if (generation !== layoutChangeGeneration) {
        return;
      }

      processedImage = createProcessedImageInfo(decodedImage);
      stereoSplit = splitStereoImage(processedImage.previewCanvas, layout);
      setLayout(layout);
      showPreview(
        processedImage,
        stereoSplit,
        state.detection ??
          createInputDetection(
            getSupportedImageFileType(sourceFile) ?? "jpeg",
            stereoSplit,
          ),
      );
      releaseProcessedImage(previousProcessedImage);
      releaseStereoSplit(previousStereoSplit);
      processedImage = null;
      stereoSplit = null;
    } finally {
      closeDecodedImage(decodedImage);
    }
  } catch {
    if (generation === layoutChangeGeneration) {
      setRecoverableError("file-read-failed");
    }
  } finally {
    releaseProcessedImage(processedImage);
    releaseStereoSplit(stereoSplit);
    if (generation === layoutChangeGeneration) {
      isLayoutChanging.value = false;
    }
  }
}

async function handleCreateWiggle() {
  if (!startCreatingWiggle()) {
    return;
  }

  const generation = ++wiggleCreationGeneration;
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  if (generation === wiggleCreationGeneration) {
    finishCreatingWiggle();
  }
}

function showErrorMessage(code: AppErrorCode) {
  const error = state.error;
  if (!error) {
    return;
  }

  lastDiagnosticCode.value = `${error.diagnosticCode} (${error.code})`;
  showMessage(
    code === "mpo-extra-images" ? "warning" : "error",
    `${error.message} ${error.action} [${error.diagnosticCode}]`,
  );
  clearError();
}

watch(
  () => state.error?.code,
  (code) => {
    if (code) {
      showErrorMessage(code);
    }
  },
);

function getMpoErrorCode(error: unknown): AppErrorCode {
  if (error instanceof MpoParseError) {
    return error.code === "insufficient-images"
      ? "mpo-insufficient-views"
      : "mpo-invalid";
  }

  if (error instanceof Error && error.message.includes("Canvas 2D")) {
    return "browser-unsupported";
  }

  return "mpo-decode-failed";
}

async function handleFileAccepted(file: File) {
  if (activeExportSession) {
    return;
  }

  lastDiagnosticCode.value = "none";

  const fileMemoryPlan = createFileReadMemoryPlan(
    file.size,
    memoryBudget,
    isMpoFile(file) ? "mpo" : "raster",
  );
  if (!fileMemoryPlan.allowed) {
    trackEvent("upload_failure", {
      format: getSupportedImageFileType(file) ?? "unknown",
      reason: "file_too_large",
      fileBytes: file.size,
      memoryProfile: memoryBudget.kind,
    });
    if (state.stereoSplit) {
      setRecoverableError("file-too-large");
    } else {
      setUploadedFile(file);
      setError("file-too-large");
    }
    return;
  }

  invalidateActiveExportSession();
  const generation = ++uploadGeneration;
  wiggleCreationGeneration += 1;
  layoutChangeGeneration += 1;
  uploadStartedAt = performance.now();
  releaseCurrentResources();
  currentSourceFile = null;
  setUploadedFile(file);

  try {
    if (isMpoFile(file)) {
      const mpoPair = await decodeMpoStereoPair(file);
      const stereoSplit = {
        layout: "side-by-side",
        leftView: mpoPair.leftView,
        rightView: mpoPair.rightView,
      } as const;

      if (generation !== uploadGeneration) {
        releaseStereoSplit(stereoSplit);
        return;
      }

      const decodeMemoryPlan = createMpoDecodeMemoryPlan(
        file.size,
        mpoPair.leftView.width,
        mpoPair.leftView.height,
        mpoPair.rightView.width,
        mpoPair.rightView.height,
        memoryBudget,
      );
      if (!decodeMemoryPlan.allowed) {
        releaseStereoSplit(stereoSplit);
        trackEvent("upload_failure", {
          format: "mpo",
          reason: "decoded_image_too_large",
          decodedPixels: decodeMemoryPlan.decodedPixels,
          estimatedPeakBytes: decodeMemoryPlan.estimatedPeakBytes,
          memoryProfile: memoryBudget.kind,
        });
        setError("decoded-image-too-large");
        return;
      }

      if (
        isTooSmallForStereoView(
          mpoPair.leftView.width,
          mpoPair.leftView.height,
        ) ||
        isTooSmallForStereoView(
          mpoPair.rightView.width,
          mpoPair.rightView.height,
        )
      ) {
        releaseStereoSplit(stereoSplit);
        trackEvent("upload_failure", { format: "mpo", reason: "too_small" });
        setError("image-too-small");
        return;
      }

      showMpoPreview(
        stereoSplit,
        createInputDetection("mpo", stereoSplit, {
          totalImageCount: mpoPair.numberOfImages,
          orientations: mpoPair.orientations,
        }),
      );
      currentSourceFile = file;
      showMessage(
        "success",
        isEnglish.value
          ? "Photo parsed. You can start aligning."
          : "照片已解析，可以开始对齐",
      );

      if (mpoPair.ignoredImageCount > 0) {
        setRecoverableError("mpo-extra-images");
      }

      trackEvent("upload_success", {
        format: "mpo",
        durationMs: Math.round(performance.now() - uploadStartedAt),
        leftWidth: mpoPair.leftView.width,
        leftHeight: mpoPair.leftView.height,
        rightWidth: mpoPair.rightView.width,
        rightHeight: mpoPair.rightView.height,
      });

      return;
    }

    const decodedImage = await decodeImageFile(file);
    let processedImage: ReturnType<typeof createProcessedImageInfo> | null =
      null;
    let stereoSplit: StereoSplitResult | null = null;
    let committed = false;

    try {
      if (generation !== uploadGeneration) {
        return;
      }

      const decodeMemoryPlan = createRasterDecodeMemoryPlan(
        file.size,
        decodedImage.width,
        decodedImage.height,
        memoryBudget,
      );
      if (!decodeMemoryPlan.allowed) {
        trackEvent("upload_failure", {
          format: getSupportedImageFileType(file) ?? "unknown",
          reason: "decoded_image_too_large",
          decodedPixels: decodeMemoryPlan.decodedPixels,
          estimatedPeakBytes: decodeMemoryPlan.estimatedPeakBytes,
          memoryProfile: memoryBudget.kind,
        });
        setError("decoded-image-too-large");
        return;
      }

      if (isTooSmallForStereo(decodedImage.width, decodedImage.height)) {
        trackEvent("upload_failure", {
          format: getSupportedImageFileType(file) ?? "unknown",
          reason: "too_small",
        });
        setError("image-too-small");
        return;
      }

      processedImage = createProcessedImageInfo(decodedImage);
      stereoSplit = splitStereoImage(
        processedImage.previewCanvas,
        state.settings.layout,
      );
      const inputType = getSupportedImageFileType(file);
      if (!inputType) {
        setError("unsupported-file");
        return;
      }

      showPreview(
        processedImage,
        stereoSplit,
        createInputDetection(inputType, stereoSplit),
      );
      currentSourceFile = file;
      committed = true;
      showMessage(
        "success",
        isEnglish.value
          ? "Photo parsed. You can start aligning."
          : "照片已解析，可以开始对齐",
      );
      trackEvent("upload_success", {
        format: inputType,
        durationMs: Math.round(performance.now() - uploadStartedAt),
        leftWidth: stereoSplit.leftView.width,
        leftHeight: stereoSplit.leftView.height,
        rightWidth: stereoSplit.rightView.width,
        rightHeight: stereoSplit.rightView.height,
      });
    } finally {
      closeDecodedImage(decodedImage);
      if (!committed) {
        releaseProcessedImage(processedImage);
        releaseStereoSplit(stereoSplit);
      }
    }
  } catch (error) {
    if (generation !== uploadGeneration) {
      return;
    }

    if (isMpoFile(file)) {
      const errorCode = getMpoErrorCode(error);
      trackEvent("upload_failure", { format: "mpo", reason: errorCode });
      trackEvent("mpo_decode_failure", { reason: errorCode });
      setError(errorCode);
      return;
    }

    trackEvent("upload_failure", {
      format: getSupportedImageFileType(file) ?? "unknown",
      reason: "file_read_failed",
    });
    setError("file-read-failed");
  }
}

async function handleExportConfirmed(
  format: ExportFormat,
  exportSize: ExportSize,
  framing: ExportFraming,
) {
  if (
    !state.stereoSplit ||
    activeExportSession ||
    state.phase === "exporting"
  ) {
    return;
  }

  if (format === "gif" && !getGifMemoryPlans(framing)?.[exportSize].allowed) {
    setRecoverableError("image-too-large");
    isExportDialogOpen.value = false;
    return;
  }

  if (format === "sbs" && !sbsMemoryPlan.value?.allowed) {
    setRecoverableError(
      sbsMemoryPlan.value?.dimensions === null
        ? "sbs-dimensions-mismatch"
        : "image-too-large",
    );
    isExportDialogOpen.value = false;
    return;
  }

  lastExportAttempt.value = {
    format,
    size: exportSize,
    framing: format === "gif" ? framing : "not-applicable",
  };
  const previewSource = state.stereoSplit;
  storeExportPreference({ format, size: exportSize });
  const previewSettings = { ...state.settings };
  const sourceFile = currentSourceFile;
  const selectedFileName = state.selectedFile?.name;
  const shouldUseOriginalImage = Boolean(state.processedImage);
  const session: ExportSession = {
    id: ++nextExportSessionId,
    canceled: false,
    cancelTask: null,
  };
  activeExportSession = session;
  startExporting();
  const exportStartedAt = performance.now();
  exportProgress.value = { stage: "preparing", progress: 0 };
  let temporaryExportSource: StereoSplitResult | null = null;

  try {
    const onProgress = (progress: GifExportProgress) => {
      if (activeExportSession === session && !session.canceled) {
        exportProgress.value = progress;
      }
    };
    let exportSource: StereoSplitResult;
    const exportSettings = {
      ...previewSettings,
      alignmentX: 0,
      alignmentY: 0,
    };

    if (format === "gif") {
      if (shouldUseOriginalImage) {
        if (!sourceFile) {
          throw new Error("The original image source is unavailable.");
        }

        const decodedImage = await decodeImageFile(sourceFile);
        try {
          if (session.canceled || activeExportSession !== session) {
            throw new ExportCanceledError();
          }

          temporaryExportSource = createFramedGifExportSource(
            decodedImage,
            previewSource.layout,
            previewSource,
            previewSettings,
            exportSize,
            framing,
          );
        } finally {
          closeDecodedImage(decodedImage);
        }
      } else {
        temporaryExportSource = createFramedGifSource(
          previewSource,
          previewSettings,
          exportSize,
          framing,
        );
      }

      exportSource = temporaryExportSource;
    } else {
      exportSource = previewSource;
    }

    const exportTask =
      format === "sbs"
        ? exportSbs(
            exportSource,
            onProgress,
            memoryBudget.maxWorkingMemoryBytes,
          )
        : exportGif(
            exportSource,
            exportSettings,
            exportSize,
            onProgress,
            memoryBudget.maxWorkingMemoryBytes,
          );
    session.cancelTask = exportTask.cancel;
    const exportBlob = await exportTask.promise;

    if (session.canceled || activeExportSession !== session) {
      throw new ExportCanceledError();
    }

    downloadBlob(
      exportBlob,
      format === "sbs"
        ? createSbsFileName(selectedFileName)
        : createGifFileName(selectedFileName),
    );
    showMessage("success", isEnglish.value ? "Downloaded" : "已下载");
    if (format === "gif") {
      state.settings.exportSize = exportSize;
      trackEvent("gif_export_success", {
        size: exportSize,
        durationMs: Math.round(performance.now() - exportStartedAt),
      });
    } else {
      trackEvent("sbs_export_success", {
        durationMs: Math.round(performance.now() - exportStartedAt),
      });
    }
    isExportDialogOpen.value = false;
    finishExporting();
  } catch (error) {
    if (error instanceof ExportCanceledError || session.canceled) {
      if (activeExportSession === session) {
        finishExporting();
      }
      return;
    }

    if (activeExportSession !== session) {
      return;
    }

    trackEvent(format === "gif" ? "gif_export_failure" : "sbs_export_failure", {
      reason: error instanceof Error ? error.name : "unknown",
      durationMs: Math.round(performance.now() - exportStartedAt),
    });

    if (error instanceof SbsDimensionsMismatchError) {
      setRecoverableError("sbs-dimensions-mismatch");
    } else if (error instanceof MemoryBudgetExceededError) {
      setRecoverableError("image-too-large");
    } else {
      setRecoverableError("export-failed");
    }
    isExportDialogOpen.value = false;
  } finally {
    releaseStereoSplit(temporaryExportSource);
    session.cancelTask = null;
    if (activeExportSession === session) {
      activeExportSession = null;
      exportProgress.value = { stage: "preparing", progress: 0 };
    }
  }
}

function handleExportCanceled() {
  const session = activeExportSession;
  if (session) {
    invalidateActiveExportSession();
    activeExportSession = null;
    finishExporting();
    exportProgress.value = { stage: "preparing", progress: 0 };
    return;
  }

  isExportDialogOpen.value = false;
}

function handlePlaybackToggle() {
  const wasPlaying = state.settings.isPlaying;
  const wasWiggle = state.previewMode === "wiggle";
  togglePlayback();
  if (
    (!wasWiggle || !wasPlaying) &&
    state.previewMode === "wiggle" &&
    state.settings.isPlaying
  ) {
    trackEvent("wiggle_play");
  }
}

onUnmounted(() => {
  uploadGeneration += 1;
  wiggleCreationGeneration += 1;
  layoutChangeGeneration += 1;
  invalidateActiveExportSession();
  releaseCurrentResources();
  currentSourceFile = null;
});
</script>

<template>
  <main class="app-shell">
    <header class="site-header" :aria-label="isEnglish ? 'Achilles Cat navigation' : 'Achilles Cat 导航'">
      <span class="site-brand">ACHILLES CAT</span>

      <nav class="site-nav" :aria-label="isEnglish ? 'Sections' : '栏目'">
        <span class="site-nav-item is-future">{{ isEnglish ? "Works" : "作品" }}</span>
        <span class="site-nav-item is-future">{{ isEnglish ? "Archive" : "档案" }}</span>
        <span class="site-nav-item is-future">MiuMiu</span>
        <span class="site-nav-item is-active" aria-current="page">Lab</span>
      </nav>

      <div class="site-utilities">
        <button
          type="button"
          class="text-action locale-toggle"
          :aria-label="isEnglish ? 'Switch language' : '切换语言'"
          @click="toggleLocale"
        >
          {{ isEnglish ? "EN / 中文" : "中文 / EN" }}
        </button>
        <span class="site-settings">
          {{ isEnglish ? "Settings" : "设置" }}
          <span class="status-dot" aria-hidden="true"></span>
        </span>
      </div>
    </header>

    <section class="lab-intro" aria-labelledby="lab-title">
      <div class="lab-intro-copy">
        <p class="eyebrow">{{ isEnglish ? "ACHILLES CAT / 01" : "ACHILLES CAT / 01" }}</p>
        <h1 id="lab-title">3D Photo Lab</h1>
        <p class="subtitle">
          {{
            isEnglish
              ? "A quiet instrument for turning stereo photographs into depth motion."
              : "将立体照片转换为深度运动影像的安静工具。"
          }}
        </p>
        <p class="local-processing">
          <span class="local-processing-dot" aria-hidden="true"></span>
          {{
            isEnglish
              ? "Local processing — your images stay in this browser."
              : "本地处理 — 图像只留在当前浏览器中。"
          }}
        </p>
      </div>

      <ol class="guide-band" :aria-label="isEnglish ? 'Four-step guide' : '四步指南'">
        <li class="guide-band-intro">
          <span class="guide-label">{{ isEnglish ? "GUIDE" : "指南" }}</span>
          <span>{{ isEnglish ? "Four quiet steps from pair to motion." : "从双图到运动影像的四个步骤。" }}</span>
        </li>
        <li class="guide-step">
          <span class="guide-step-index">01</span>
          <span class="guide-step-copy">
            <strong>{{ isEnglish ? "Upload" : "上传" }}</strong>
            <span>{{ isEnglish ? "Stereo image" : "立体图像" }}</span>
          </span>
        </li>
        <li class="guide-step">
          <span class="guide-step-index">02</span>
          <span class="guide-step-copy">
            <strong>{{ isEnglish ? "Align" : "对齐" }}</strong>
            <span>{{ isEnglish ? "Images" : "图像" }}</span>
          </span>
        </li>
        <li class="guide-step">
          <span class="guide-step-index">03</span>
          <span class="guide-step-copy">
            <strong>{{ isEnglish ? "Preview" : "预览" }}</strong>
            <span>{{ isEnglish ? "Depth motion" : "深度运动" }}</span>
          </span>
        </li>
        <li class="guide-step">
          <span class="guide-step-index">04</span>
          <span class="guide-step-copy">
            <strong>{{ isEnglish ? "Export" : "导出" }}</strong>
            <span>{{ isEnglish ? "Result" : "结果" }}</span>
          </span>
        </li>
      </ol>
    </section>

    <section class="lab-workspace" :aria-label="isEnglish ? '3D Photo Lab workspace' : '3D Photo Lab 工作区'">
      <aside class="utility-rail" :aria-label="isEnglish ? 'Utility rail' : '工具轨'">
        <div class="rail-heading">
          <span class="panel-kicker">{{ isEnglish ? "UTILITY RAIL" : "工具轨" }}</span>
          <strong>{{ isEnglish ? "Input" : "输入" }}</strong>
          <span>{{ isEnglish ? "A stereo source for the Lab." : "为 Lab 准备立体素材。" }}</span>
        </div>

        <UploadPanel
          :disabled="state.phase === 'loading' || state.phase === 'exporting'"
          :is-loading="state.phase === 'loading'"
          :locale="state.locale"
          @file-accepted="handleFileAccepted"
          @file-rejected="setUploadRejectedError"
        />

        <div class="rail-note">
          <span class="rail-note-label">{{ isEnglish ? "ACCEPTS" : "支持格式" }}</span>
          <span class="rail-note-value">MPO / JPG / PNG</span>
          <span>{{ isEnglish ? "Processed locally" : "本地处理" }}</span>
        </div>
      </aside>

      <div class="workbench-zone">
        <section
          class="preview-workspace"
          :aria-label="isEnglish ? 'Preview stage' : '预览舞台'"
        >
          <header class="section-header">
            <div class="section-title">
              <span class="panel-kicker">{{ isEnglish ? "VIEW" : "视图" }}</span>
              <h2>
                {{
                  state.previewMode === "wiggle"
                    ? isEnglish
                      ? "Wiggle Preview"
                      : "Wiggle 预览"
                    : isEnglish
                      ? "Alignment Preview"
                      : "对齐预览"
                }}
              </h2>
            </div>

            <div
              class="mode-switch"
              role="tablist"
              :aria-label="isEnglish ? 'Preview mode' : '预览模式'"
            >
              <button
                type="button"
                role="tab"
                :aria-selected="state.previewMode === 'align'"
                :class="{ active: state.previewMode === 'align' }"
                :disabled="state.phase !== 'preview'"
                @click="showAlignPreview"
              >
                {{ isEnglish ? "Alignment Preview" : "对齐预览" }}
              </button>
              <button
                type="button"
                role="tab"
                :aria-selected="state.previewMode === 'wiggle'"
                :class="{ active: state.previewMode === 'wiggle' }"
                :disabled="state.phase !== 'preview'"
                @click="showWigglePreview"
              >
                {{ isEnglish ? "Wiggle Preview" : "Wiggle 预览" }}
              </button>
            </div>
          </header>

          <PreviewCanvas
            v-if="state.previewMode === 'wiggle'"
            :phase="state.phase"
            :selected-file="state.selectedFile"
            :processed-image="state.processedImage"
            :stereo-split="state.stereoSplit"
            :settings="state.settings"
            :locale="state.locale"
          />

          <div v-else class="alignment-preview-wrap">
            <AlignmentPreviewPanel
              :phase="state.phase"
              :stereo-split="state.stereoSplit"
              :settings="state.settings"
              :locale="state.locale"
            />
            <button
              class="layout-toggle"
              type="button"
              :disabled="
                !state.processedImage ||
                state.phase !== 'preview' ||
                isLayoutChanging
              "
              :title="
                state.processedImage
                  ? layoutToggleLabel
                  : isEnglish
                    ? 'Only for JPG/PNG combined images'
                    : '仅适用于 JPG/PNG 拼接图'
              "
              :aria-label="
                state.processedImage
                  ? layoutToggleLabel
                  : isEnglish
                    ? 'Image layout is available for JPG/PNG only'
                    : '图片布局仅适用于 JPG/PNG'
              "
              @click="toggleLayout"
            >
              <svg
                v-if="nextLayout === 'top-bottom'"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M4 8h16M4 16h16M8 4l-4 4 4 4M16 12l4 4-4 4" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 4v16M16 4v16M4 8l4-4 4 4M12 16l4 4 4-4" />
              </svg>
            </button>
          </div>
        </section>

        <section class="controls-zone" :aria-label="isEnglish ? 'Controls' : '控制'">
          <header class="controls-zone-header">
            <span class="panel-kicker">{{ isEnglish ? "CONTROLS" : "控制" }}</span>
            <span class="controls-zone-mode">
              {{
                state.previewMode === "wiggle"
                  ? isEnglish
                    ? "Motion"
                    : "运动"
                  : isEnglish
                    ? "Alignment"
                    : "对齐"
              }}
            </span>
          </header>

          <ControlPanel
            :settings="state.settings"
            :is-wiggle-mode="state.previewMode === 'wiggle'"
            :alignment-limit="alignmentLimit"
            :locale="state.locale"
            :disabled="state.phase !== 'preview'"
            @alignment-changed="setAlignment"
            @overlay-opacity-changed="setOverlayOpacity"
            @alignment-reset="resetAlignment"
            @create-wiggle-requested="handleCreateWiggle"
            @playback-toggled="handlePlaybackToggle"
            @swap-eyes-toggled="toggleSwapEyes"
            @speed-changed="setSpeed"
            @intermediate-frame-toggled="toggleIntermediateFrames"
            @align-preview-requested="showAlignPreview"
            @export-dialog-requested="isExportDialogOpen = true"
          />
        </section>

        <div
          v-if="state.phase === 'creating'"
          class="workspace-loading"
          role="status"
          aria-live="polite"
        >
          <span class="loading-indicator" aria-hidden="true" />
          {{ isEnglish ? "Creating Wiggle" : "正在创建 Wiggle" }}
        </div>
      </div>
    </section>

    <MessageCenter
      :messages="messages"
      :locale="state.locale"
      @dismissed="dismissMessage"
    />

    <GifExportDialog
      v-if="isExportDialogOpen"
      :initial-size="state.settings.exportSize"
      :is-exporting="state.phase === 'exporting'"
      :is-mpo="isMpoInput"
      :locale="state.locale"
      :gif-frame-count="state.settings.intermediateFrames !== false ? 4 : 2"
      :gif-source-dimensions="gifSourceDimensions"
      :crop-overlap-gif-memory-plans="cropOverlapGifMemoryPlans"
      :full-frame-gif-memory-plans="fullFrameGifMemoryPlans"
      :sbs-memory-plan="sbsMemoryPlan"
      :memory-profile="memoryBudget.kind"
      :progress="exportProgress"
      @canceled="handleExportCanceled"
      @confirmed="handleExportConfirmed"
    />

    <footer class="app-footer">
      <span>{{ isEnglish ? "Beta" : "测试版" }} v{{ appVersion }}</span>
      <button class="text-action" type="button" @click="isPrivacyOpen = true">
        {{ isEnglish ? "Privacy" : "隐私政策" }}
      </button>
      <a :href="feedbackHref" target="_blank" rel="noopener noreferrer">{{
        isEnglish ? "Feedback" : "反馈"
      }}</a>
    </footer>
    <PrivacyModal
      v-if="isPrivacyOpen"
      :locale="state.locale"
      @closed="isPrivacyOpen = false"
    />
  </main>
</template>
