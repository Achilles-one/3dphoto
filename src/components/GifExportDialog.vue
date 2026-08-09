<script setup lang="ts">
import { ref } from "vue";

import type { ExportSize } from "@/types/app";

const props = defineProps<{
  initialSize: ExportSize;
  isExporting: boolean;
}>();

const emit = defineEmits<{
  canceled: [];
  confirmed: [exportSize: ExportSize];
}>();

const selectedSize = ref<ExportSize>(props.initialSize);

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
      @click.self="!isExporting && emit('canceled')"
    >
      <section
        class="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <header class="guide-header">
          <div>
            <p class="panel-kicker">Export</p>
            <h2 id="export-title">Download GIF</h2>
          </div>
          <button
            class="modal-close"
            type="button"
            :disabled="isExporting"
            aria-label="Cancel export"
            @click="emit('canceled')"
          >
            Cancel
          </button>
        </header>

        <fieldset class="export-size-options" :disabled="isExporting">
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

        <div class="dialog-actions">
          <button type="button" :disabled="isExporting" @click="emit('canceled')">
            Cancel
          </button>
          <button
            class="primary-action"
            type="button"
            :disabled="isExporting"
            @click="emit('confirmed', selectedSize)"
          >
            {{ isExporting ? "Creating GIF..." : "Confirm download" }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
