<script setup lang="ts">
import type { WiggleSettings } from "@/types/app";
import { getFrameInterval } from "@/core/wiggleParams";

const props = defineProps<{
  settings: WiggleSettings;
  disabled: boolean;
  isWiggleMode: boolean;
  alignmentLimit: number;
  locale: "zh-CN" | "en";
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
  clearImgRequested: [];
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
  <section
    class="controls-panel"
    :aria-label="props.locale === 'en' ? 'Preview controls' : '预览控制'"
  >
    <div class="control-group control-group-view">
      <header class="control-group-header">
        <span class="control-group-label">{{
          props.locale === "en" ? "VIEW" : "视图"
        }}</span>
        <span class="control-group-note">{{
          props.locale === "en" ? "Preview mode" : "预览模式"
        }}</span>
      </header>
      <div class="view-status">
        <span v-if="!isWiggleMode" class="active">
          {{ props.locale === "en" ? "Alignment Preview" : "对齐预览" }}</span
        >
        <span v-else class="active">
          {{ props.locale === "en" ? "Wiggle Preview" : "Wiggle 预览" }}</span
        >

        <button
          type="button"
          :disabled="disabled"
          @click="emit('clearImgRequested')"
        >
          {{ props.locale === "en" ? "Delete" : "删除" }}
        </button>
      </div>
    </div>

    <template v-if="!isWiggleMode">
      <div class="control-group">
        <header class="control-group-header">
          <span class="control-group-label">{{
            props.locale === "en" ? "ALIGN" : "对齐"
          }}</span>
          <span class="control-group-note">{{
            props.locale === "en" ? "Calibration" : "校准"
          }}</span>
        </header>
        <div class="align-control-stack">
          <div class="slider-grid align-slider-grid">
            <label class="slider-control"
              ><span class="slider-label">{{
                props.locale === "en" ? "Horizontal" : "水平偏移"
              }}</span
              ><input
                type="range"
                :min="-alignmentLimit"
                :max="alignmentLimit"
                :value="settings.alignmentX"
                :disabled="disabled"
                :aria-label="
                  props.locale === 'en' ? 'Horizontal alignment' : '水平偏移'
                "
                @input="
                  emit(
                    'alignmentChanged',
                    sliderValue($event),
                    settings.alignmentY,
                  )
                "
              /><strong>{{ settings.alignmentX }}px</strong></label
            >
            <label class="slider-control"
              ><span class="slider-label">{{
                props.locale === "en" ? "Vertical" : "垂直偏移"
              }}</span
              ><input
                type="range"
                :min="-alignmentLimit"
                :max="alignmentLimit"
                :value="settings.alignmentY"
                :disabled="disabled"
                :aria-label="
                  props.locale === 'en' ? 'Vertical alignment' : '垂直偏移'
                "
                @input="
                  emit(
                    'alignmentChanged',
                    settings.alignmentX,
                    sliderValue($event),
                  )
                "
              /><strong>{{ settings.alignmentY }}px</strong></label
            >
            <label class="slider-control"
              ><span class="slider-label">{{
                props.locale === "en" ? "Overlay" : "叠加强度"
              }}</span
              ><input
                type="range"
                min="10"
                max="90"
                :value="Math.round(settings.overlayOpacity * 100)"
                :disabled="disabled"
                :aria-label="
                  props.locale === 'en' ? 'Overlay opacity' : '叠加强度'
                "
                @input="
                  emit('overlayOpacityChanged', sliderValue($event) / 100)
                "
              /><strong
                >{{ Math.round(settings.overlayOpacity * 100) }}%</strong
              ></label
            >
            <button
              class="secondary-action reset-action"
              type="button"
              :disabled="disabled"
              @click="emit('alignmentReset')"
            >
              {{ props.locale === "en" ? "Reset alignment" : "重置对齐" }}
            </button>
          </div>
        </div>
      </div>
      <div class="control-group control-group-action">
        <header class="control-group-header">
          <span class="control-group-label">{{
            props.locale === "en" ? "MOTION" : "运动"
          }}</span>
          <span class="control-group-note">{{
            props.locale === "en" ? "Create" : "创建"
          }}</span>
        </header>
        <button
          class="primary-action workspace-action"
          type="button"
          :disabled="disabled"
          @click="emit('createWiggleRequested')"
        >
          {{ props.locale === "en" ? "Create Wiggle" : "创建 Wiggle" }}
        </button>
      </div>
    </template>
    <template v-else>
      <div class="control-group">
        <header class="control-group-header">
          <span class="control-group-label">{{
            props.locale === "en" ? "MOTION" : "运动"
          }}</span>
          <span class="control-group-note">{{
            props.locale === "en" ? "Playback" : "播放"
          }}</span>
        </header>
        <div class="wiggle-control-grid">
          <div class="control-row">
            <span class="control-row-label">{{
              props.locale === "en" ? "Play / Pause" : "播放 / 暂停"
            }}</span>
            <button
              class="toggle-control"
              type="button"
              :disabled="disabled"
              :aria-pressed="settings.isPlaying"
              :aria-label="
                props.locale === 'en'
                  ? settings.isPlaying
                    ? 'Pause preview'
                    : 'Play preview'
                  : settings.isPlaying
                    ? '暂停预览'
                    : '播放预览'
              "
              @click="emit('playbackToggled')"
            >
              <span class="toggle-track" aria-hidden="true"
                ><span class="toggle-thumb"
              /></span>
            </button>
          </div>
          <label class="control-row">
            <span class="control-row-label">{{
              props.locale === "en" ? "Speed" : "速度"
            }}</span>
            <span class="control-value">
              <input
                type="number"
                min="100"
                max="2000"
                step="1"
                :value="settings.speed"
                :disabled="disabled"
                :aria-label="
                  props.locale === 'en'
                    ? 'Frame interval, 100 to 2000 milliseconds'
                    : '每帧间隔，100 到 2000 毫秒'
                "
                @change="emitSpeed"
              />
              <span aria-hidden="true">ms</span>
            </span>
          </label>
          <div class="control-row">
            <span class="control-row-label">{{
              props.locale === "en" ? "Swap Eyes" : "交换左右眼"
            }}</span>
            <button
              class="toggle-control"
              type="button"
              :disabled="disabled"
              :aria-pressed="settings.swapEyes"
              :aria-label="props.locale === 'en' ? 'Swap eyes' : '交换左右眼'"
              @click="emit('swapEyesToggled')"
            >
              <span class="toggle-track" aria-hidden="true"
                ><span class="toggle-thumb"
              /></span>
            </button>
          </div>
          <div class="control-row">
            <span class="control-row-label">{{
              props.locale === "en" ? "Intermediate Frames" : "中间帧"
            }}</span>
            <button
              class="toggle-control"
              type="button"
              :disabled="disabled"
              :aria-pressed="settings.intermediateFrames !== false"
              :aria-label="
                props.locale === 'en' ? 'Intermediate frames' : '中间帧'
              "
              @click="emit('intermediateFrameToggled')"
            >
              <span class="toggle-track" aria-hidden="true"
                ><span class="toggle-thumb"
              /></span>
            </button>
          </div>

          <button
            class="secondary-action reset-action"
            type="button"
            :disabled="disabled"
            @click="emit('alignPreviewRequested')"
          >
            {{ props.locale === "en" ? "Adjust Alignment" : "调整对齐" }}
          </button>
        </div>
      </div>
      <div class="control-group control-group-action">
        <header class="control-group-header">
          <span class="control-group-label">{{
            props.locale === "en" ? "EXPORT" : "导出"
          }}</span>
          <span class="control-group-note">{{
            props.locale === "en" ? "Save result" : "保存结果"
          }}</span>
        </header>

        <button
          class="primary-action workspace-action"
          type="button"
          :disabled="disabled"
          @click="emit('exportDialogRequested')"
        >
          {{ props.locale === "en" ? "Download" : "下载" }}
        </button>
      </div>
    </template>
  </section>
</template>
