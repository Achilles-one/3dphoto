<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { WiggleRenderer } from '@/core/wiggleRenderer';
import type { AppPhase, Locale, UploadedFileInfo, WiggleSettings } from '@/types/app';
import type { ProcessedImageInfo } from '@/types/image';
import type { StereoSplitResult } from '@/types/stereo';

const props = defineProps<{
  phase: AppPhase;
  selectedFile: UploadedFileInfo | null;
  processedImage: ProcessedImageInfo | null;
  stereoSplit: StereoSplitResult | null;
  settings: WiggleSettings;
  locale: Locale;
}>();

const canvasElement = ref<HTMLCanvasElement | null>(null);
const canvasShell = ref<HTMLDivElement | null>(null);
const previewStage = ref<HTMLDivElement | null>(null);
const renderer = ref<WiggleRenderer | null>(null);
let resizeObserver: ResizeObserver | null = null;

const hasPreview = computed(() => Boolean(props.selectedFile && props.stereoSplit));

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

  if (!activeRenderer || !shell || !stage) {
    return;
  }

  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  shell.style.width = "100%";
  shell.style.height = "100%";
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
  () => [props.stereoSplit, props.settings.swapEyes, props.settings.isPlaying, props.settings.intermediateFrames] as const,
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
  <section class="preview-panel preview-stage-panel preview-state" :aria-label="locale === 'en' ? 'Wiggle preview' : 'Wiggle 预览'">
    <div
      ref="previewStage"
      class="preview-stage"
      :class="{ 'has-wiggle-canvas': hasPreview }"
    >
      <template v-if="phase === 'loading'">{{ locale === 'en' ? 'Preparing Wiggle preview…' : '正在准备 Wiggle 预览…' }}</template>
      <template v-else-if="selectedFile && stereoSplit">
        <div
          ref="canvasShell"
          class="wiggle-canvas-shell"
        >
          <canvas
            v-if="hasPreview"
            ref="canvasElement"
            class="wiggle-canvas"
            :aria-label="locale === 'en' ? 'Wiggle preview' : 'Wiggle 预览'"
          />
        </div>


      </template>
      <template v-else>{{ locale === 'en' ? 'Your preview will appear here after creating a Wiggle.' : '创建 Wiggle 后，预览会显示在这里。' }}</template>
    </div>
  </section>
</template>
