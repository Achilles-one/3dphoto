<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { AlignmentRenderer } from '@/core/alignmentRenderer';
import type { AppPhase, Locale, WiggleSettings } from '@/types/app';
import type { StereoSplitResult } from '@/types/stereo';

const props = defineProps<{
  phase: AppPhase;
  stereoSplit: StereoSplitResult | null;
  settings: WiggleSettings;
  locale: Locale;
}>();

const canvasElement = ref<HTMLCanvasElement | null>(null);
let renderer: AlignmentRenderer | null = null;
let rendererCanvas: HTMLCanvasElement | null = null;
let resizeObserver: ResizeObserver | null = null;

function resizeCanvas() {
  if (!canvasElement.value || !renderer) {
    return;
  }

  const { width, height } = canvasElement.value.getBoundingClientRect();
  renderer.setSize(width, height);
}

function initializeRenderer() {
  const canvas = canvasElement.value;
  if (!canvas) {
    return;
  }

  if (renderer && rendererCanvas === canvas) {
    return;
  }

  resizeObserver?.disconnect();
  renderer?.destroy();
  renderer = new AlignmentRenderer(canvas);
  rendererCanvas = canvas;
  resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(canvas);
  resizeCanvas();
}

function renderAlignment() {
  if (!renderer || !props.stereoSplit) {
    return;
  }

  renderer.render(props.stereoSplit, props.settings);
}

onMounted(async () => {
  await nextTick();
  initializeRenderer();
  renderAlignment();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  renderer?.destroy();
  renderer = null;
  rendererCanvas = null;
});

watch(
  () => [
    props.stereoSplit,
    props.settings.alignmentX,
    props.settings.alignmentY,
    props.settings.overlayOpacity,
  ],
  async () => {
    await nextTick();
    initializeRenderer();
    renderAlignment();
  },
  { deep: false, flush: 'post' },
);
</script>

<template>
  <section class="alignment-panel preview-stage-panel preview-state" :aria-label="locale === 'en' ? 'Alignment preview' : '对齐预览'">
    <div class="align-stage">
      <slot name="stage-input" />
      <template v-if="phase === 'loading'">{{ locale === 'en' ? 'Preparing alignment preview…' : '正在准备对齐预览…' }}</template>
      <template v-else-if="stereoSplit">
        <canvas
          ref="canvasElement"
          class="alignment-canvas"
          :aria-label="locale === 'en' ? 'Overlapped left and right views' : '左右眼叠加画面'"
        />
      </template>
      <template v-else>
        {{ locale === 'en' ? 'Upload a stereo photo to align the left and right views here.' : '上传立体照片后，可在这里对齐左右眼画面。' }}
      </template>
    </div>
  </section>
</template>
