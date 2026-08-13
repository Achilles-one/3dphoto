<script setup lang="ts">
import { ref } from 'vue';

import { useDialogFocus } from '@/composables/useDialogFocus';
import type { Locale } from '@/types/app';

const emit = defineEmits<{
  closed: [];
}>();
const props = defineProps<{ locale: Locale }>();

const dialogElement = ref<HTMLElement | null>(null);
useDialogFocus(dialogElement, () => emit('closed'));
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" role="presentation" @click.self="emit('closed')">
      <section
        class="guide-modal"
        ref="dialogElement"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <header class="guide-header">
          <div><p class="panel-kicker">{{ props.locale === 'en' ? 'Guide' : '使用指南' }}</p><h2 id="guide-title">{{ props.locale === 'en' ? 'Make a Wiggle in three steps' : '三步制作 Wiggle 动图' }}</h2></div>
        </header>
        <ol class="guide-steps">
          <li><strong>{{ props.locale === 'en' ? 'Upload' : '上传' }}</strong><span>{{ props.locale === 'en' ? 'Upload an SBS or top-bottom JPG/PNG, or an MPO file.' : '上传左右拼接、上下拼接的 JPG/PNG，或 MPO 文件。' }}</span></li>
          <li><strong>{{ props.locale === 'en' ? 'Align' : '对齐' }}</strong><span>{{ props.locale === 'en' ? 'Adjust horizontal, vertical, and overlay controls to align the subject.' : '调整水平、垂直偏移和叠加强度，让主体重合。' }}</span></li>
          <li><strong>{{ props.locale === 'en' ? 'Download' : '下载' }}</strong><span>{{ props.locale === 'en' ? 'Create a Wiggle preview, then download GIF or SBS PNG.' : '创建 Wiggle 预览后，选择 GIF 或 SBS PNG 下载。' }}</span></li>
        </ol>
        <div class="unsupported-list"><h3>{{ props.locale === 'en' ? 'Supported' : '支持类型' }}</h3><p>JPG/JPEG, PNG, MPO</p><h3>{{ props.locale === 'en' ? 'Not supported' : '不支持' }}</h3><p>{{ props.locale === 'en' ? 'Regular single 2D photos, HEIC/WebP, videos, and archives' : '普通单张 2D、HEIC/WebP、视频和压缩包' }}</p></div>

        <button class="primary-action" type="button" @click="emit('closed')">
          {{ props.locale === 'en' ? 'Got it' : '我知道了' }}
        </button>
      </section>
    </div>
  </Teleport>
</template>
