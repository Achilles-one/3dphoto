<script setup lang="ts">
import { ref } from "vue";

import { isAcceptedImageFile } from "@/utils/file";

const props = defineProps<{
  disabled?: boolean;
  isLoading?: boolean;
  locale: 'zh-CN' | 'en';
  selectedFile?: { name: string } | null;
}>();

const emit = defineEmits<{
  fileAccepted: [file: File];
  fileRejected: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

function openFilePicker() {
  if (props.disabled) {
    return;
  }

  fileInput.value?.click();
}

function handleCandidate(file: File | undefined) {
  if (!file || props.disabled) {
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
  if (props.disabled) {
    return;
  }

  handleCandidate(event.dataTransfer?.files[0]);
}
</script>

<template>
  <section class="upload-panel" :aria-label="props.locale === 'en' ? 'Upload a 3D photo' : '上传 3D 照片'">
    <div class="upload-panel-mark" aria-hidden="true">
      <span>01</span>
      <span>{{ props.locale === 'en' ? 'STEREO SOURCE' : '立体素材' }}</span>
    </div>
    <button
      class="drop-zone"
      :class="{ 'is-dragging': isDragging }"
      type="button"
      :disabled="disabled"
      @click="openFilePicker"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <span class="drop-zone-title">{{ props.locale === 'en' ? 'Upload a 3D photo' : '上传 3D 照片' }}</span>
      <span v-if="props.isLoading && props.selectedFile" class="drop-zone-file">{{ props.selectedFile.name }}</span>
      <span class="drop-zone-hint">
        {{ props.locale === 'en' ? 'Supports JPG, PNG, and MPO. Images stay in your browser.' : '支持 JPG、PNG 和 MPO；图片仅在您的浏览器中本地处理。' }}
      </span>
      <span class="drop-zone-copy">{{ props.locale === 'en' ? 'Click to choose a file, or drop it here' : '点击选择文件，或拖放到这里' }}</span>
      <span v-if="isLoading" class="upload-loading" role="status">{{ props.locale === 'en' ? 'Reading and parsing photo…' : '正在读取并解析照片…' }}</span>
    </button>

    <input
      ref="fileInput"
      class="visually-hidden"
      type="file"
      accept="image/jpeg,image/png,image/mpo,.mpo"
      :disabled="disabled"
      @change="handleFileChange"
    />
  </section>
</template>
