<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { AlignmentRenderer } from '@/core/alignmentRenderer';
import type { AppPhase, WiggleSettings } from '@/types/app';
import type { StereoSplitResult } from '@/types/stereo';

const props = defineProps<{
  phase: AppPhase;
  stereoSplit: StereoSplitResult | null;
  settings: WiggleSettings;
}>();

const canvasElement = ref<HTMLCanvasElement | null>(null);
let renderer: AlignmentRenderer | null = null;
let resizeObserver: ResizeObserver | null = null;

function resizeCanvas() {
  if (!canvasElement.value || !renderer) {
    return;
  }

  const { width, height } = canvasElement.value.getBoundingClientRect();
  renderer.setSize(width, height);
}

function renderAlignment() {
  if (!renderer || !props.stereoSplit) {
    return;
  }

  renderer.render(props.stereoSplit, props.settings);
}

onMounted(async () => {
  await nextTick();

  if (!canvasElement.value) {
    return;
  }

  renderer = new AlignmentRenderer(canvasElement.value);
  resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(canvasElement.value);
  resizeCanvas();
  renderAlignment();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  renderer?.destroy();
  renderer = null;
});

watch(
  () => [
    props.stereoSplit,
    props.settings.alignmentX,
    props.settings.alignmentY,
    props.settings.overlayOpacity,
  ],
  () => renderAlignment(),
  { deep: false },
);
</script>

<template>
  <section class="alignment-panel" aria-label="Alignment preview">
    <div class="align-stage">
      <template v-if="phase === 'loading'">Preparing alignment preview...</template>
      <template v-else-if="stereoSplit">
        <canvas
          ref="canvasElement"
          class="alignment-canvas"
          aria-label="Overlapped left and right views"
        />
      </template>
      <template v-else>
        Upload a 3D photo to align the left and right views.
      </template>
    </div>
  </section>
</template>
