<script setup lang="ts">
import { computed } from "vue";

import type { Locale } from "@/types/app";

const props = withDefaults(
  defineProps<{
    locale: Locale;
    activeSection?: "lab";
  }>(),
  {
    activeSection: "lab",
  },
);

const emit = defineEmits<{
  (event: "toggle-locale"): void;
}>();

const isEnglish = computed(() => props.locale === "en");
</script>

<template>
  <header
    class="site-header"
    :aria-label="isEnglish ? 'Achilles Cat navigation' : 'Achilles Cat 导航'"
  >
    <span class="site-brand">ACHILLES CAT</span>

    <nav class="site-nav" :aria-label="isEnglish ? 'Sections' : '栏目'">
      <span class="site-nav-item is-future">{{ isEnglish ? "Works" : "作品" }}</span>
      <span class="site-nav-item is-future">{{ isEnglish ? "Archive" : "档案" }}</span>
      <span class="site-nav-item is-future">MiuMiu</span>
      <span
        class="site-nav-item"
        :class="{ 'is-active': activeSection === 'lab' }"
        aria-current="page"
      >
        Lab
      </span>
    </nav>

    <div class="site-utilities">
      <button
        type="button"
        class="text-action locale-toggle"
        :aria-label="isEnglish ? 'Switch language' : '切换语言'"
        @click="emit('toggle-locale')"
      >
        {{ isEnglish ? "EN / 中文" : "中文 / EN" }}
      </button>
      <span class="site-settings">
        {{ isEnglish ? "Settings" : "设置" }}
        <span class="status-dot" aria-hidden="true"></span>
      </span>
    </div>
  </header>
</template>
