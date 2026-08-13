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
</script>

<template>
  <section class="message-center" aria-live="polite" aria-atomic="false">
    <article v-for="message in messages" :key="message.id" class="app-message" :class="message.type" role="status">
      <span class="message-icon" aria-hidden="true">{{ icons[message.type] }}</span>
      <span>{{ message.text }}<small v-if="message.count > 1">（{{ message.count }}）</small></span>
      <button type="button" :aria-label="`${locale === 'en' ? 'Dismiss message' : '关闭消息'}: ${message.text}`" @click="emit('dismissed', message.id)">×</button>
    </article>
  </section>
</template>
