<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { WiggleRenderer } from '@/core/wiggleRenderer';
import type { AppPhase, UploadedFileInfo, WiggleSettings } from '@/types/app';
import type { ProcessedImageInfo } from '@/types/image';
import type { StereoSplitResult } from '@/types/stereo';

const props = defineProps<{
  phase: AppPhase;
  selectedFile: UploadedFileInfo | null;
  processedImage: ProcessedImageInfo | null;
  stereoSplit: StereoSplitResult | null;
  settings: WiggleSettings;
}>();

const canvasElement = ref<HTMLCanvasElement | null>(null);
const canvasShell = ref<HTMLDivElement | null>(null);
const previewStage = ref<HTMLDivElement | null>(null);
const renderer = ref<WiggleRenderer | null>(null);
let resizeObserver: ResizeObserver | null = null;

const hasPreview = computed(() => Boolean(props.selectedFile && props.stereoSplit));
const canvasAspectRatio = computed(() => {
  const leftView = props.stereoSplit?.leftView;
  return leftView ? `${leftView.width} / ${leftView.height}` : '16 / 9';
});

function ensureRenderer() {
  if (!canvasElement.value) {
    return null;
  }

  renderer.value ??= new WiggleRenderer(canvasElement.value);
  return renderer.value;
}

function resizeCanvas() {
  const activeRenderer = ensureRenderer();
  const shell = canvasShell.value;
  const stage = previewStage.value;
  const view = props.stereoSplit?.leftView;

  if (!activeRenderer || !shell || !stage || !view) {
    return;
  }

  const ratio = view.width / view.height;
  const width = Math.max(1, Math.min(stage.clientWidth, stage.clientHeight * ratio));
  const height = Math.max(1, Math.round(width / ratio));
  shell.style.width = `${Math.round(width)}px`;
  shell.style.height = `${height}px`;
  activeRenderer.setSize(width, height);
}

async function renderPreview() {
  await nextTick();
  const activeRenderer = ensureRenderer();

  if (!activeRenderer || !props.stereoSplit) {
    return;
  }

  resizeCanvas();
  resizeObserver?.disconnect();
  resizeObserver = previewStage.value ? new ResizeObserver(resizeCanvas) : null;
  if (resizeObserver && previewStage.value) {
    resizeObserver.observe(previewStage.value);
  }
  activeRenderer.render(props.stereoSplit, props.settings);
}

watch(
  () => [props.stereoSplit, props.settings.swapEyes, props.settings.isPlaying] as const,
  () => {
    if (props.stereoSplit) {
      void renderPreview();
    } else {
      renderer.value?.destroy();
      renderer.value = null;
    }
  },
  { immediate: true },
);

watch(
  () => [props.settings.speed] as const,
  () => {
    if (props.stereoSplit) {
      void renderPreview();
    }
  },
);

watch(
  () => [props.settings.alignmentX, props.settings.alignmentY] as const,
  () => {
    if (props.stereoSplit) {
      void renderPreview();
    }
  },
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  renderer.value?.destroy();
});
</script>

<template>
  <section class="preview-panel" aria-labelledby="preview-title">


    <div ref="previewStage" class="preview-stage">
      <template v-if="phase === 'loading'">Preparing preview...</template>
      <template v-else-if="selectedFile && stereoSplit">
        <div
          ref="canvasShell"
          class="wiggle-canvas-shell"
          :style="{ aspectRatio: canvasAspectRatio }"
        >
          <canvas
            v-if="hasPreview"
            ref="canvasElement"
            class="wiggle-canvas"
            aria-label="Wiggle preview"
          />
        </div>


      </template>
      <template v-else>Your wiggle preview will appear here.</template>
    </div>
  </section>
</template>
