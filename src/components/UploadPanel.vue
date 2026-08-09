<script setup lang="ts">
import { ref } from "vue";

import GuideModal from "@/components/GuideModal.vue";
import { isAcceptedImageFile } from "@/utils/file";

const emit = defineEmits<{
  fileAccepted: [file: File];
  fileRejected: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const isGuideOpen = ref(false);

function openFilePicker() {
  fileInput.value?.click();
}

function handleCandidate(file: File | undefined) {
  if (!file) {
    return;
  }

  if (!isAcceptedImageFile(file)) {
    emit("fileRejected");
    return;
  }

  emit("fileAccepted", file);
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  handleCandidate(input.files?.[0]);
  input.value = "";
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  handleCandidate(event.dataTransfer?.files[0]);
}
</script>

<template>
  <section class="upload-panel" aria-labelledby="upload-title">
    <button
      class="secondary-action guide-fixed-button"
      type="button"
      @click="isGuideOpen = true"
    >
      Guide
    </button>

    <header class="app-header">
      <h1 id="upload-title">3D Photo Enhancer</h1>
      <p class="subtitle">
        Turn side-by-side 3D photos into wiggle animations instantly.
      </p>
      <p class="eyebrow">
        *All data is processed locally and is not sent/saved online.
      </p>
    </header>

    <button
      class="drop-zone"
      :class="{ 'is-dragging': isDragging }"
      type="button"
      @click="openFilePicker"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <span class="drop-zone-title">Choose a 3D photo</span>
      <span class="drop-zone-hint">
        Use a JPG or PNG with left and right views in one image, or an MPO stereo file.
      </span>
      <span class="drop-zone-copy">or drop a JPG, PNG, or MPO here</span>
    </button>

    <input
      ref="fileInput"
      class="visually-hidden"
      type="file"
      accept="image/jpeg,image/png,image/mpo,.mpo"
      @change="handleFileChange"
    />

    <GuideModal v-if="isGuideOpen" @closed="isGuideOpen = false" />
  </section>
</template>
