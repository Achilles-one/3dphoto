<script setup lang="ts">
import { ref } from 'vue';

import { useDialogFocus } from '@/composables/useDialogFocus';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '@/utils/analytics';

const emit = defineEmits<{
  closed: [];
}>();

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
        <header class="guide-header">
          <div>
            <p class="panel-kicker">Privacy</p>
            <h2 id="privacy-title">Your photos stay in this browser</h2>
          </div>
          <button class="modal-close" type="button" @click="emit('closed')">
            Close
          </button>
        </header>

        <p class="guide-copy">
          3D Photo Enhancer decodes, previews, animates, and exports your images locally in
          your browser. The original photo pixels, MPO contents, and generated GIF are not
          uploaded by this tool.
        </p>
        <p class="guide-copy">
          If online sharing is added later, it will require a separate, explicit upload and
          deletion policy.
        </p>

        <label class="privacy-toggle">
          <input
            type="checkbox"
            :checked="analyticsEnabled"
            @change="updateAnalytics"
          />
          <span>
            <strong>Allow anonymous product events</strong>
            <small>No photo pixels, file names, or image contents are included.</small>
          </span>
        </label>

        <button class="primary-action" type="button" @click="emit('closed')">
          Got it
        </button>
      </section>
    </div>
  </Teleport>
</template>
