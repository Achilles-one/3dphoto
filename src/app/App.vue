<script setup lang="ts">
import { computed, ref } from "vue";

import ControlPanel from "@/components/ControlPanel.vue";
import AlignmentPreviewPanel from "@/components/AlignmentPreviewPanel.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import GifExportDialog from "@/components/GifExportDialog.vue";
import InputDetectionPanel from "@/components/InputDetectionPanel.vue";
import PreviewCanvas from "@/components/PreviewCanvas.vue";
import SplitPreviewPanel from "@/components/SplitPreviewPanel.vue";
import UploadPanel from "@/components/UploadPanel.vue";
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
import { SbsDimensionsMismatchError, exportSbs } from "@/core/sbsExport";
import { getAlignmentLimit } from "@/core/alignment";
import { isTooSmallForStereo, isTooSmallForStereoView } from "@/core/sizePolicy";
import { splitStereoImage } from "@/core/stereoSplitter";
import { MpoParseError } from "@/core/mpoParser";
import { releaseProcessedImage, releaseStereoSplit } from "@/core/resourceCleanup";
import type {
  AppErrorCode,
  ExportFormat,
  ExportSize,
  InputDetection,
  StereoLayout,
} from "@/types/app";
import { createGifFileName, createSbsFileName, downloadBlob } from "@/utils/download";
import { getSupportedImageFileType, isMpoFile, isMpoFileName } from "@/utils/file";
import { trackEvent } from "@/utils/analytics";

import { useAppState } from "./appState";

const {
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
  setLayout,
  setStereoSplit,
  setSpeed,
  setAlignment,
  setOverlayOpacity,
  resetAlignment,
  togglePlayback,
  toggleSwapEyes,
  resetUpload,
  showSplitPreview,
  showAlignPreview,
  showWigglePreview,
  resetAnimationSettings,
} = useAppState();

const isExportDialogOpen = ref(false);
const exportProgress = ref<GifExportProgress>({ stage: "preparing", progress: 0 });
let cancelActiveExport: (() => void) | null = null;
let exportCancelRequested = false;
let uploadStartedAt = 0;

const alignmentLimit = computed(() =>
  state.stereoSplit ? getAlignmentLimit(state.stereoSplit) : 500,
);
const isMpoInput = computed(() =>
  isMpoFileName(state.selectedFile?.name ?? "", state.selectedFile?.type ?? ""),
);

function releaseCurrentResources() {
  releaseProcessedImage(state.processedImage);
  releaseStereoSplit(state.stereoSplit);
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

function splitCurrentImage(layout: StereoLayout) {
  if (!state.processedImage) {
    return;
  }

  setLayout(layout);
  setStereoSplit(splitStereoImage(state.processedImage.previewCanvas, layout));
}

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
  uploadStartedAt = performance.now();
  releaseCurrentResources();
  setUploadedFile(file);

  try {
    if (isMpoFile(file)) {
      const mpoPair = await decodeMpoStereoPair(file);

      if (
        isTooSmallForStereoView(mpoPair.leftView.width, mpoPair.leftView.height) ||
        isTooSmallForStereoView(mpoPair.rightView.width, mpoPair.rightView.height)
      ) {
        trackEvent("upload_failure", { format: "mpo", reason: "too_small" });
        setError("image-too-small");
        return;
      }

      const stereoSplit = {
        layout: "side-by-side",
        leftView: mpoPair.leftView,
        rightView: mpoPair.rightView,
      } as const;
      showMpoPreview(
        stereoSplit,
        createInputDetection("mpo", stereoSplit, {
          totalImageCount: mpoPair.numberOfImages,
          orientations: mpoPair.orientations,
        }),
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

    if (isTooSmallForStereo(decodedImage.width, decodedImage.height)) {
      closeDecodedImage(decodedImage);
      trackEvent("upload_failure", { format: getSupportedImageFileType(file) ?? "unknown", reason: "too_small" });
      setError("image-too-small");
      return;
    }

    const processedImage = createProcessedImageInfo(decodedImage);
    const stereoSplit = splitStereoImage(
      processedImage.previewCanvas,
      state.settings.layout
    );
    closeDecodedImage(decodedImage);
    const inputType = getSupportedImageFileType(file);
    if (!inputType) {
      setError("unsupported-file");
      return;
    }
    showPreview(processedImage, stereoSplit, createInputDetection(inputType, stereoSplit));
    trackEvent("upload_success", {
      format: inputType,
      durationMs: Math.round(performance.now() - uploadStartedAt),
      leftWidth: stereoSplit.leftView.width,
      leftHeight: stereoSplit.leftView.height,
      rightWidth: stereoSplit.rightView.width,
      rightHeight: stereoSplit.rightView.height,
    });
  } catch (error) {
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

async function handleExportConfirmed(format: ExportFormat, exportSize: ExportSize) {
  if (!state.stereoSplit) {
    return;
  }

  startExporting();
  const exportStartedAt = performance.now();
  exportCancelRequested = false;
  exportProgress.value = { stage: "preparing", progress: 0 };

  try {
    const onProgress = (progress: GifExportProgress) => {
      exportProgress.value = progress;
    };
    const exportTask = format === "sbs"
      ? exportSbs(state.stereoSplit, onProgress)
      : exportGif(state.stereoSplit, state.settings, exportSize, onProgress);
    cancelActiveExport = exportTask.cancel;
    const exportBlob = await exportTask.promise;
    downloadBlob(
      exportBlob,
      format === "sbs"
        ? createSbsFileName(state.selectedFile?.name)
        : createGifFileName(state.selectedFile?.name),
    );
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
    if (error instanceof ExportCanceledError || exportCancelRequested) {
      finishExporting();
      return;
    }

    trackEvent(format === "gif" ? "gif_export_failure" : "sbs_export_failure", {
      reason: error instanceof Error ? error.name : "unknown",
      durationMs: Math.round(performance.now() - exportStartedAt),
    });

    if (error instanceof SbsDimensionsMismatchError) {
      setRecoverableError("sbs-dimensions-mismatch");
    } else if (error instanceof Error && error.message.includes("safe memory budget")) {
      setRecoverableError("image-too-large");
    } else {
      setRecoverableError("export-failed");
    }
    isExportDialogOpen.value = false;
  } finally {
    cancelActiveExport = null;
    exportCancelRequested = false;
    exportProgress.value = { stage: "preparing", progress: 0 };
  }
}

function handleExportCanceled() {
  if (state.phase === "exporting") {
    exportCancelRequested = true;
    cancelActiveExport?.();
    finishExporting();
  }

  isExportDialogOpen.value = false;
}

function handleResetUpload() {
  releaseCurrentResources();
  resetUpload();
}

function handleAnimationSettingsReset() {
  resetAnimationSettings();
}

function handlePlaybackToggle() {
  const wasPlaying = state.settings.isPlaying;
  const wasWiggle = state.previewMode === "wiggle";
  togglePlayback();
  if ((!wasWiggle || !wasPlaying) && state.previewMode === "wiggle" && state.settings.isPlaying) {
    trackEvent("wiggle_play");
  }
}
</script>

<template>
  <main class="app-shell">
    <section class="upload-section" aria-label="Upload">
      <UploadPanel
        @file-accepted="handleFileAccepted"
        @file-rejected="setUploadRejectedError"
      />
    </section>

    <section class="preview-workspace" aria-label="Preview workspace">
      <header class="section-header">
        <div>
          <h2>Review and animate</h2>
        </div>

        <div class="mode-switch" role="tablist" aria-label="Preview mode">
          <button
            type="button"
            role="tab"
            :aria-selected="state.previewMode === 'split'"
            :class="{ active: state.previewMode === 'split' }"
            :disabled="state.phase === 'loading' || state.phase === 'exporting'"
            @click="showSplitPreview"
          >
            Split Preview
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="state.previewMode === 'align'"
            :class="{ active: state.previewMode === 'align' }"
            :disabled="state.phase !== 'preview'"
            @click="showAlignPreview"
          >
            Align Preview
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="state.previewMode === 'wiggle'"
            :class="{ active: state.previewMode === 'wiggle' }"
            :disabled="state.phase !== 'preview'"
            @click="showWigglePreview"
          >
            Wiggle Preview
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
      />

      <AlignmentPreviewPanel
        v-else-if="state.previewMode === 'align'"
        :phase="state.phase"
        :stereo-split="state.stereoSplit"
        :settings="state.settings"
      />

      <SplitPreviewPanel
        v-else
        :phase="state.phase"
        :stereo-split="state.stereoSplit"
      />

      <InputDetectionPanel
        v-if="state.detection"
        :detection="state.detection"
      />

      <ControlPanel
        :settings="state.settings"
        :is-wiggle-mode="state.previewMode === 'wiggle'"
        :is-align-mode="state.previewMode === 'align'"
        :alignment-limit="alignmentLimit"
        :disabled="
          state.phase === 'empty' ||
          state.phase === 'error' ||
          state.phase === 'exporting'
        "
        :can-change-layout="Boolean(state.processedImage)"
        @speed-changed="setSpeed"
        @alignment-changed="setAlignment"
        @overlay-opacity-changed="setOverlayOpacity"
        @alignment-reset="resetAlignment"
        @playback-toggled="handlePlaybackToggle"
        @swap-eyes-toggled="toggleSwapEyes"
        @align-preview-requested="showAlignPreview"
        @split-review-requested="showSplitPreview"
        @export-dialog-requested="isExportDialogOpen = true"
        @animation-settings-reset="handleAnimationSettingsReset"
        @layout-changed="splitCurrentImage"
      />
    </section>

    <ErrorMessage
      :error="state.error"
      @dismissed="clearError"
      @reset-requested="handleResetUpload"
    />

    <GifExportDialog
      v-if="isExportDialogOpen"
      :initial-size="state.settings.exportSize"
      :is-exporting="state.phase === 'exporting'"
      :is-mpo="isMpoInput"
      :progress="exportProgress"
      @canceled="handleExportCanceled"
      @confirmed="handleExportConfirmed"
    />
  </main>
</template>
