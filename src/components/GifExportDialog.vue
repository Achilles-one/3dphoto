<script setup lang="ts">
import { ref } from "vue";

import { useDialogFocus } from "@/composables/useDialogFocus";
import type { ExportFormat, ExportSize } from "@/types/app";

const props = defineProps<{
  initialSize: ExportSize;
  isExporting: boolean;
  isMpo: boolean;
  progress: {
    stage: "preparing" | "encoding" | "ready";
    progress: number;
  };
}>();

const emit = defineEmits<{
  canceled: [];
  confirmed: [format: ExportFormat, exportSize: ExportSize];
}>();

const selectedSize = ref<ExportSize>(props.initialSize);
const selectedFormat = ref<ExportFormat>("gif");
const dialogElement = ref<HTMLElement | null>(null);
useDialogFocus(dialogElement, () => emit("canceled"));

const exportSizes: Array<{ label: string; value: ExportSize; description: string }> = [
  { label: "Small", value: "small", description: "Fastest, smallest file" },
  { label: "Medium", value: "medium", description: "Recommended" },
  { label: "Large", value: "large", description: "Best detail, slower" },
];
</script>

<template>
  <Teleport to="body">
    <div
      class="modal-backdrop"
      role="presentation"
      @click.self="emit('canceled')"
    >
      <section
        class="export-dialog"
        ref="dialogElement"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <header class="guide-header">
          <div>
            <p class="panel-kicker">Export</p>
            <h2 id="export-title">Download</h2>
          </div>
          <button
            class="modal-close"
            type="button"
            aria-label="Cancel export"
            @click="emit('canceled')"
          >
            Cancel
          </button>
        </header>

        <fieldset v-if="isMpo" class="export-format-options" :disabled="isExporting">
          <legend>Choose format</legend>
          <label :class="{ active: selectedFormat === 'gif' }">
            <input v-model="selectedFormat" type="radio" name="export-format" value="gif" />
            <span>
              <strong>GIF</strong>
              <small>Animated wiggle preview</small>
            </span>
          </label>
          <label :class="{ active: selectedFormat === 'sbs' }">
            <input v-model="selectedFormat" type="radio" name="export-format" value="sbs" />
            <span>
              <strong>SBS PNG</strong>
              <small>Original left and right view sizes</small>
            </span>
          </label>
        </fieldset>

        <fieldset v-if="selectedFormat === 'gif'" class="export-size-options" :disabled="isExporting">
          <legend>Choose size</legend>
          <label
            v-for="size in exportSizes"
            :key="size.value"
            :class="{ active: selectedSize === size.value }"
          >
            <input v-model="selectedSize" type="radio" name="gif-size" :value="size.value" />
            <span>
              <strong>{{ size.label }}</strong>
              <small>{{ size.description }}</small>
            </span>
          </label>
        </fieldset>

        <div v-if="isExporting" class="export-progress" aria-live="polite">
          <div class="export-progress-heading">
            <strong>{{ progress.stage === "preparing" ? "Preparing frames" : "Encoding" }}</strong>
            <span>{{ Math.round(progress.progress * 100) }}%</span>
          </div>
          <div class="export-progress-track" aria-hidden="true">
            <span :style="{ width: `${Math.max(4, progress.progress * 100)}%` }" />
          </div>
          <p>Keep this window open while the GIF is created.</p>
        </div>

        <div class="dialog-actions">
          <button type="button" @click="emit('canceled')">
            {{ isExporting ? "Cancel export" : "Cancel" }}
          </button>
          <button
            class="primary-action"
            type="button"
            :disabled="isExporting"
            @click="emit('confirmed', selectedFormat, selectedSize)"
          >
            {{ isExporting ? "Creating GIF..." : "Confirm download" }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
