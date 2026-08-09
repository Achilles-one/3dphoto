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
const renderer = ref<WiggleRenderer | null>(null);

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

  if (!activeRenderer || !shell) {
    return;
  }

  activeRenderer.setSize(shell.clientWidth, shell.clientHeight);
}

async function renderPreview() {
  await nextTick();
  const activeRenderer = ensureRenderer();

  if (!activeRenderer || !props.stereoSplit) {
    return;
  }

  resizeCanvas();
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
  () => [props.settings.speed, props.settings.intensity] as const,
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
  renderer.value?.destroy();
});
</script>

<template>
  <section class="preview-panel" aria-labelledby="preview-title">


    <div class="preview-stage">
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
