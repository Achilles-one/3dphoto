<script setup lang="ts">
import type { UserFacingError } from '@/types/app';

defineProps<{
  error: UserFacingError | null;
}>();

const emit = defineEmits<{
  dismissed: [];
  resetRequested: [];
}>();
</script>

<template>
  <section
    v-if="error"
    class="error-message"
    :class="{ recoverable: error.recoverable }"
    role="alert"
  >
    <div>
      <strong>{{ error.message }}</strong>
      <span>{{ error.action }}</span>
    </div>
    <button
      v-if="error.recoverable"
      type="button"
      @click="emit('dismissed')"
    >
      Keep editing
    </button>
    <button
      v-else
      type="button"
      @click="emit('resetRequested')"
    >
      Try another file
    </button>
  </section>
</template>
