<script setup lang="ts">
import { ref } from 'vue';

import { useDialogFocus } from '@/composables/useDialogFocus';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '@/utils/analytics';
import type { Locale } from '@/types/app';

const emit = defineEmits<{
  closed: [];
}>();
const props = defineProps<{ locale: Locale }>();

const dialogElement = ref<HTMLElement | null>(null);
const analyticsEnabled = ref(isAnalyticsEnabled());
useDialogFocus(dialogElement, () => emit('closed'));

function updateAnalytics(event: Event) {
  const input = event.target as HTMLInputElement;
  analyticsEnabled.value = input.checked;
  setAnalyticsEnabled(input.checked);
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" role="presentation" @click.self="emit('closed')">
      <section
        class="privacy-modal"
        ref="dialogElement"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
      >
        <header class="dialog-header privacy-dialog-header">
          <p class="panel-kicker">{{ props.locale === 'en' ? 'Privacy' : '隐私政策' }}</p>
          <!-- <span class="dialog-index" aria-hidden="true">PRIVACY / 01</span> -->
          <h2 id="privacy-title">{{ props.locale === 'en' ? 'All data is processed locally and is not sent/saved online' : '所有数据均在本地处理，不会发送或保存到线上' }}</h2>
        </header>

        <p class="guide-copy">
          {{ props.locale === 'en' ? '3D Photo Lab decodes, previews, animates, and exports images locally in your browser. Original photo pixels, MPO contents, and generated files are not uploaded by this tool.' : '3D Photo Lab 会在您的浏览器中本地解码、预览、制作和导出图片。原始像素、MPO 内容与生成文件都不会上传。' }}
        </p>
        <p class="guide-copy">
          {{ props.locale === 'en' ? 'Any future online sharing will require a separate, explicit upload and deletion policy.' : '未来如增加在线分享功能，将另行提供明确的上传与删除政策。' }}
        </p>

        <label class="privacy-toggle">
          <input
            type="checkbox"
            :checked="analyticsEnabled"
            @change="updateAnalytics"
          />
          <span>
            <strong>{{ props.locale === 'en' ? 'Allow anonymous product events' : '允许匿名产品事件' }}</strong>
            <small>{{ props.locale === 'en' ? 'No photo pixels, file names, or image contents are included.' : '不包含图片像素、文件名或图片内容。' }}</small>
          </span>
        </label>

        <button class="primary-action privacy-confirm" type="button" @click="emit('closed')">
          {{ props.locale === 'en' ? 'Got it' : '我知道了' }}
        </button>
      </section>
    </div>
  </Teleport>
</template>
