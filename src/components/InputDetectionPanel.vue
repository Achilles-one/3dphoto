<script setup lang="ts">
import type { InputDetection } from '@/types/app';

defineProps<{
  detection: InputDetection;
}>();

function formatName(format: InputDetection['format']) {
  return format === 'mpo' ? 'MPO' : format.toUpperCase();
}
</script>

<template>
  <section class="input-detection" aria-label="Input detection">
    <div>
      <span>Input</span>
      <strong>{{ formatName(detection.format) }}</strong>
    </div>
    <div>
      <span>Left view</span>
      <strong>{{ detection.leftWidth }} × {{ detection.leftHeight }}</strong>
    </div>
    <div>
      <span>Right view</span>
      <strong>{{ detection.rightWidth }} × {{ detection.rightHeight }}</strong>
    </div>
    <div>
      <span>Views used</span>
      <strong>
        {{ detection.usedImageCount }}<template v-if="detection.totalImageCount">
          / {{ detection.totalImageCount }}</template>
      </strong>
    </div>
    <div v-if="detection.orientations">
      <span>Orientation</span>
      <strong>EXIF {{ detection.orientations[0] }} / {{ detection.orientations[1] }}</strong>
    </div>
  </section>
</template>
