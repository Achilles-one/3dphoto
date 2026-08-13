<script setup lang="ts">
import type { WiggleSettings } from "@/types/app";
import { getFrameInterval } from "@/core/wiggleParams";

const props = defineProps<{
  settings: WiggleSettings;
  disabled: boolean;
  isWiggleMode: boolean;
  alignmentLimit: number;
  locale: 'zh-CN' | 'en';
}>();

const emit = defineEmits<{
  alignmentChanged: [alignmentX: number, alignmentY: number];
  overlayOpacityChanged: [overlayOpacity: number];
  alignmentReset: [];
  createWiggleRequested: [];
  playbackToggled: [];
  speedChanged: [speed: number];
  swapEyesToggled: [];
  alignPreviewRequested: [];
  exportDialogRequested: [];
  intermediateFrameToggled: [];
}>();

function sliderValue(event: Event): number {
  return Number((event.target as HTMLInputElement).value);
}

function emitSpeed(event: Event) {
  const input = event.target as HTMLInputElement;
  const speed = getFrameInterval(input.valueAsNumber);
  input.value = String(speed);
  emit("speedChanged", speed);
}
</script>

<template>
  <section class="controls-panel" :aria-label="props.locale === 'en' ? 'Preview controls' : '预览控制'">
    <template v-if="!isWiggleMode">
      <div class="align-control-stack">
        <div class="slider-grid align-slider-grid">
          <label class="slider-control"><span>{{ props.locale === 'en' ? 'Horizontal' : '水平偏移' }} <strong>{{ settings.alignmentX }}px</strong></span><input type="range" :min="-alignmentLimit" :max="alignmentLimit" :value="settings.alignmentX" :disabled="disabled" :aria-label="props.locale === 'en' ? 'Horizontal alignment' : '水平偏移'" @input="emit('alignmentChanged', sliderValue($event), settings.alignmentY)" /></label>
          <label class="slider-control"><span>{{ props.locale === 'en' ? 'Vertical' : '垂直偏移' }} <strong>{{ settings.alignmentY }}px</strong></span><input type="range" :min="-alignmentLimit" :max="alignmentLimit" :value="settings.alignmentY" :disabled="disabled" :aria-label="props.locale === 'en' ? 'Vertical alignment' : '垂直偏移'" @input="emit('alignmentChanged', settings.alignmentX, sliderValue($event))" /></label>
          <label class="slider-control"><span>{{ props.locale === 'en' ? 'Overlay' : '叠加强度' }} <strong>{{ Math.round(settings.overlayOpacity * 100) }}%</strong></span><input type="range" min="10" max="90" :value="Math.round(settings.overlayOpacity * 100)" :disabled="disabled" :aria-label="props.locale === 'en' ? 'Overlay opacity' : '叠加强度'" @input="emit('overlayOpacityChanged', sliderValue($event) / 100)" /></label>
          <button class="secondary-action reset-action" type="button" :disabled="disabled" @click="emit('alignmentReset')">{{ props.locale === 'en' ? 'Reset alignment' : '重置对齐' }}</button>
        </div>
        <button class="primary-action workspace-action" type="button" :disabled="disabled" @click="emit('createWiggleRequested')">{{ props.locale === 'en' ? 'Create Wiggle' : '创建 Wiggle' }}</button>
      </div>
    </template>
    <template v-else>
      <div class="wiggle-control-grid">
        <label class="speed-control">{{ props.locale === 'en' ? 'Speed' : '速度' }} <span><input type="number" min="100" max="2000" step="1" :value="settings.speed" :disabled="disabled" :aria-label="props.locale === 'en' ? 'Frame interval, 100 to 2000 milliseconds' : '每帧间隔，100 到 2000 毫秒'" @change="emitSpeed" /> ms</span></label>
        <button type="button" :disabled="disabled" @click="emit('playbackToggled')">{{ settings.isPlaying ? (props.locale === 'en' ? 'Pause' : '暂停') : (props.locale === 'en' ? 'Play' : '播放') }}</button>
        <button type="button" :disabled="disabled" @click="emit('swapEyesToggled')">{{ props.locale === 'en' ? 'Swap eyes' : '交换左右眼' }}</button>
        <button type="button" :disabled="disabled" :aria-pressed="settings.intermediateFrames !== false" @click="emit('intermediateFrameToggled')">{{ props.locale === 'en' ? `Intermediate: ${settings.intermediateFrames !== false ? 'On' : 'Off'}` : `中间帧：${settings.intermediateFrames !== false ? '开启' : '关闭'}` }}</button>
        <button type="button" :disabled="disabled" @click="emit('alignPreviewRequested')">{{ props.locale === 'en' ? 'Adjust alignment' : '调整对齐' }}</button>
      </div>
      <button class="primary-action workspace-action" type="button" :disabled="disabled" @click="emit('exportDialogRequested')">{{ props.locale === 'en' ? 'Download' : '下载' }}</button>
    </template>
  </section>
</template>
