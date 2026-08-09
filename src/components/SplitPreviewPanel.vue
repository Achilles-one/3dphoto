<script setup lang="ts">
import type { AppPhase } from '@/types/app';
import type { StereoSplitResult } from '@/types/stereo';

defineProps<{
  phase: AppPhase;
  stereoSplit: StereoSplitResult | null;
}>();
</script>

<template>
  <section class="split-panel" aria-label="Split preview">
    <div class="split-stage">
      <template v-if="phase === 'loading'">Preparing split preview...</template>
      <template v-else-if="stereoSplit">
        <div class="stereo-views">
          <figure>
            <img :src="stereoSplit.leftView.dataUrl" alt="Left stereo view" />
            <figcaption>Left view</figcaption>
          </figure>
          <figure>
            <img :src="stereoSplit.rightView.dataUrl" alt="Right stereo view" />
            <figcaption>Right view</figcaption>
          </figure>
        </div>


      </template>
      <template v-else>
        Upload a side-by-side or top-bottom 3D photo to see the split.
      </template>
    </div>
  </section>
</template>
