<script setup lang="ts">
import type { AppMessage } from '@/composables/useMessageCenter';
import type { Locale } from '@/types/app';

defineProps<{ messages: AppMessage[]; locale: Locale }>();
const emit = defineEmits<{ dismissed: [id: number] }>();

const icons: Record<AppMessage['type'], string> = {
  success: '✓',
  info: 'i',
  warning: '!',
  error: '!',
};

const labels: Record<AppMessage['type'], { en: string; zh: string }> = {
  success: { en: 'Success', zh: '成功' },
  info: { en: 'Info', zh: '提示' },
  warning: { en: 'Notice', zh: '注意' },
  error: { en: 'Error', zh: '错误' },
};
</script>

<template>
  <section
    class="message-center"
    :aria-label="locale === 'en' ? 'Status messages' : '状态消息'"
    aria-live="polite"
    aria-atomic="false"
  >
    <article
      v-for="message in messages"
      :key="message.id"
      class="app-message"
      :class="message.type"
      role="status"
    >
      <span class="message-icon" aria-hidden="true">{{ icons[message.type] }}</span>
      <span class="message-body">
        <span class="message-type">{{ locale === 'en' ? labels[message.type].en : labels[message.type].zh }}</span>
        <span class="message-copy">{{ message.text }}<small v-if="message.count > 1">（{{ message.count }}）</small></span>
      </span>
      <button
        type="button"
        :aria-label="`${locale === 'en' ? 'Dismiss message' : '关闭消息'}: ${message.text}`"
        @click="emit('dismissed', message.id)"
      >×</button>
    </article>
  </section>
</template>
