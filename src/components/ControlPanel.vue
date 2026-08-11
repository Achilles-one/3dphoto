<script setup lang="ts">
import type { StereoLayout, WiggleSettings } from "@/types/app";

const props = defineProps<{
  settings: WiggleSettings;
  disabled: boolean;
  isWiggleMode: boolean;
  isAlignMode: boolean;
  canChangeLayout: boolean;
  alignmentLimit: number;
}>();

const emit = defineEmits<{
  speedChanged: [speed: number];
  alignmentChanged: [alignmentX: number, alignmentY: number];
  overlayOpacityChanged: [overlayOpacity: number];
  alignmentReset: [];
  playbackToggled: [];
  swapEyesToggled: [];
  alignPreviewRequested: [];
  splitReviewRequested: [];
  exportDialogRequested: [];
  animationSettingsReset: [];
  layoutChanged: [layout: StereoLayout];
}>();

const layouts: Array<{ label: string; value: StereoLayout }> = [
  { label: "Auto", value: "auto" },
  { label: "Side-by-side", value: "side-by-side" },
  { label: "Top-bottom", value: "top-bottom" },
];

function getSliderValue(event: Event): number {
  const input = event.target as HTMLInputElement;
  return Number(input.value);
}

function emitSpeed(event: Event) {
  emit("speedChanged", getSliderValue(event));
}

function emitAlignmentX(event: Event) {
  emit("alignmentChanged", getSliderValue(event), props.settings.alignmentY);
}

function emitAlignmentY(event: Event) {
  emit("alignmentChanged", props.settings.alignmentX, getSliderValue(event));
}

function emitOverlayOpacity(event: Event) {
  emit("overlayOpacityChanged", getSliderValue(event) / 100);
}
</script>

<template>
  <section class="controls-panel" aria-label="Preview controls">
    <div
      v-if="!isWiggleMode && !isAlignMode"
      class="split-control-grid"
      :class="{ 'without-layout': !canChangeLayout }"
    >
      <fieldset
        v-if="canChangeLayout"
        class="segmented-control layout-control"
        :disabled="disabled"
      >
        <button
          v-for="layout in layouts"
          :key="layout.value"
          type="button"
          :class="{ active: settings.layout === layout.value }"
          @click="emit('layoutChanged', layout.value)"
        >
          {{ layout.label }}
        </button>
      </fieldset>

      <div class="control-row split-play-row">
        <button
          type="button"
          :disabled="disabled"
          @click="emit('alignPreviewRequested')"
        >
          Align Views
        </button>
      </div>
    </div>

    <div v-else-if="isAlignMode" class="align-control-stack">
      <div class="control-row">
        <button
          type="button"
          :disabled="disabled"
          @click="emit('alignmentReset')"
        >
          Reset Align
        </button>
        <button
          type="button"
          :disabled="disabled"
          @click="emit('playbackToggled')"
        >
          Create Wiggle
        </button>
      </div>

      <div class="slider-grid align-slider-grid">
        <label class="slider-control">
          <span>
            Horizontal Align
            <strong>{{ settings.alignmentX }}px</strong>
          </span>
          <input
            type="range"
            :min="-alignmentLimit"
            :max="alignmentLimit"
            step="1"
            :value="settings.alignmentX"
            :disabled="disabled"
            aria-label="Horizontal alignment"
            @input="emitAlignmentX"
          />
          <span class="slider-scale">
            <small>Left</small>
            <small>Right</small>
          </span>
        </label>

        <label class="slider-control">
          <span>
            Vertical Align
            <strong>{{ settings.alignmentY }}px</strong>
          </span>
          <input
            type="range"
            :min="-alignmentLimit"
            :max="alignmentLimit"
            step="1"
            :value="settings.alignmentY"
            :disabled="disabled"
            aria-label="Vertical alignment"
            @input="emitAlignmentY"
          />
          <span class="slider-scale">
            <small>Up</small>
            <small>Down</small>
          </span>
        </label>

        <label class="slider-control">
          <span>
            Overlay
            <strong>{{ Math.round(settings.overlayOpacity * 100) }}%</strong>
          </span>
          <input
            type="range"
            min="10"
            max="90"
            step="1"
            :value="Math.round(settings.overlayOpacity * 100)"
            :disabled="disabled"
            aria-label="Overlay opacity"
            @input="emitOverlayOpacity"
          />
          <span class="slider-scale">
            <small>Light</small>
            <small>Strong</small>
          </span>
        </label>
      </div>
    </div>

    <div v-else class="wiggle-control-stack">
      <div class="control-row">
        <button
          type="button"
          :disabled="disabled"
          @click="emit('playbackToggled')"
        >
          {{ settings.isPlaying ? "Pause" : "Play" }}
        </button>

        <button
          type="button"
          :disabled="disabled"
          @click="emit('swapEyesToggled')"
        >
          Swap eyes
        </button>
        <button
          type="button"
          :disabled="disabled"
          @click="emit('splitReviewRequested')"
        >
          Review Split
        </button>

        <button
          type="button"
          :disabled="disabled"
          @click="emit('alignPreviewRequested')"
        >
          Adjust Align
        </button>
        <button
          type="button"
          :disabled="disabled"
          @click="emit('exportDialogRequested')"
        >
          Download
        </button>
        <button
          type="button"
          :disabled="disabled"
          @click="emit('animationSettingsReset')"
        >
          Reset Animation Settings
        </button>
      </div>

      <div class="slider-grid">
        <label class="slider-control">
          <span>
            Speed
            <strong>{{ settings.speed }}</strong>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="settings.speed"
            :disabled="disabled"
            aria-label="Wiggle speed"
            @input="emitSpeed"
          />
          <span class="slider-scale">
            <small>Slow</small>
            <small>Fast</small>
          </span>
        </label>

      </div>
    </div>
  </section>
</template>
