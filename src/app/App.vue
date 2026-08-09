<script setup lang="ts">
import { ref } from "vue";

import ControlPanel from "@/components/ControlPanel.vue";
import AlignmentPreviewPanel from "@/components/AlignmentPreviewPanel.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import GifExportDialog from "@/components/GifExportDialog.vue";
import PreviewCanvas from "@/components/PreviewCanvas.vue";
import SplitPreviewPanel from "@/components/SplitPreviewPanel.vue";
import UploadPanel from "@/components/UploadPanel.vue";
import {
  closeDecodedImage,
  createProcessedImageInfo,
  decodeImageFile,
} from "@/core/imageLoader";
import { decodeMpoStereoPair } from "@/core/mpoDecoder";
import { exportGif } from "@/core/exportEngine";
import { isTooSmallForStereo, isTooSmallForStereoView } from "@/core/sizePolicy";
import { splitStereoImage } from "@/core/stereoSplitter";
import { MpoParseError } from "@/core/mpoParser";
import type { AppErrorCode, ExportSize, StereoLayout } from "@/types/app";
import { createGifFileName, downloadBlob } from "@/utils/download";
import { isMpoFile } from "@/utils/file";

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
  setIntensity,
  setAlignment,
  setOverlayOpacity,
  resetAlignment,
  togglePlayback,
  toggleSwapEyes,
  resetUpload,
  showSplitPreview,
  showAlignPreview,
  showWigglePreview,
} = useAppState();

const isExportDialogOpen = ref(false);

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
  setUploadedFile(file);

  try {
    if (isMpoFile(file)) {
      const mpoPair = await decodeMpoStereoPair(file);

      if (
        isTooSmallForStereoView(mpoPair.leftView.width, mpoPair.leftView.height) ||
        isTooSmallForStereoView(mpoPair.rightView.width, mpoPair.rightView.height)
      ) {
        setError("image-too-small");
        return;
      }

      showMpoPreview({
        layout: "side-by-side",
        leftView: mpoPair.leftView,
        rightView: mpoPair.rightView,
      });

      if (mpoPair.ignoredImageCount > 0) {
        setRecoverableError("mpo-extra-images");
      }

      return;
    }

    const decodedImage = await decodeImageFile(file);

    if (isTooSmallForStereo(decodedImage.width, decodedImage.height)) {
      closeDecodedImage(decodedImage);
      setError("image-too-small");
      return;
    }

    const processedImage = createProcessedImageInfo(decodedImage);
    const stereoSplit = splitStereoImage(
      processedImage.previewCanvas,
      state.settings.layout
    );
    closeDecodedImage(decodedImage);
    showPreview(processedImage, stereoSplit);
  } catch (error) {
    if (isMpoFile(file)) {
      setError(getMpoErrorCode(error));
      return;
    }

    setError("file-read-failed");
  }
}

async function handleExportConfirmed(exportSize: ExportSize) {
  if (!state.stereoSplit) {
    return;
  }

  startExporting();

  try {
    const gifBlob = await exportGif(
      state.stereoSplit,
      state.settings,
      exportSize
    );
    downloadBlob(gifBlob, createGifFileName(state.selectedFile?.name));
    state.settings.exportSize = exportSize;
    isExportDialogOpen.value = false;
    finishExporting();
  } catch {
    setRecoverableError("export-failed");
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

      <ControlPanel
        :settings="state.settings"
        :is-wiggle-mode="state.previewMode === 'wiggle'"
        :is-align-mode="state.previewMode === 'align'"
        :disabled="
          state.phase === 'empty' ||
          state.phase === 'error' ||
          state.phase === 'exporting'
        "
        :can-change-layout="Boolean(state.processedImage)"
        @speed-changed="setSpeed"
        @intensity-changed="setIntensity"
        @alignment-changed="setAlignment"
        @overlay-opacity-changed="setOverlayOpacity"
        @alignment-reset="resetAlignment"
        @playback-toggled="togglePlayback"
        @swap-eyes-toggled="toggleSwapEyes"
        @align-preview-requested="showAlignPreview"
        @split-review-requested="showSplitPreview"
        @export-dialog-requested="isExportDialogOpen = true"
        @layout-changed="splitCurrentImage"
      />
    </section>

    <ErrorMessage
      :error="state.error"
      @dismissed="clearError"
      @reset-requested="resetUpload"
    />

    <GifExportDialog
      v-if="isExportDialogOpen"
      :initial-size="state.settings.exportSize"
      :is-exporting="state.phase === 'exporting'"
      @canceled="isExportDialogOpen = false"
      @confirmed="handleExportConfirmed"
    />
  </main>
</template>
