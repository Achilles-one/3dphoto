<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { useDialogFocus } from "@/composables/useDialogFocus";
import { estimateGifFileBytes, estimatePngFileBytes } from "@/core/exportEstimate";
import { getExportPreference } from "@/core/preferences";
import { getRecommendedGifSize, type GifExportMemoryPlans, type MemoryBudgetKind, type SbsExportMemoryPlan } from "@/core/memoryBudget";
import { getExportDimensions } from "@/core/sizePolicy";
import type { ExportFormat, ExportFraming, ExportSelectionSize, ExportSize, Locale, Mp4ExportSize } from "@/types/app";
import { formatFileSize } from "@/utils/file";

interface Mp4OptionPlan {
  dimensions: { width: number; height: number };
  durationMs: number;
  outputBytes: number;
  allowed: boolean;
  codecSupported: boolean | null;
}
type Mp4OptionPlans = Record<Mp4ExportSize, Mp4OptionPlan>;

const props = defineProps<{
  initialSize: ExportSize;
  isExporting: boolean;
  isMpo: boolean;
  locale: Locale;
  gifFrameCount: number;
  gifSourceDimensions: { width: number; height: number } | null;
  cropOverlapGifMemoryPlans: GifExportMemoryPlans | null;
  fullFrameGifMemoryPlans: GifExportMemoryPlans | null;
  cropOverlapMp4Plans: Mp4OptionPlans | null;
  fullFrameMp4Plans: Mp4OptionPlans | null;
  sbsMemoryPlan: SbsExportMemoryPlan | null;
  memoryProfile: MemoryBudgetKind;
  progress: { stage: "preparing" | "encoding" | "ready"; progress: number };
}>();

const emit = defineEmits<{ canceled: []; confirmed: [format: ExportFormat, exportSize: ExportSelectionSize, framing: ExportFraming] }>();
const preference = getExportPreference();
const preferredSize = props.cropOverlapGifMemoryPlans
  ? getRecommendedGifSize(
      props.cropOverlapGifMemoryPlans,
      preference.size === "small" || preference.size === "medium" || preference.size === "large"
        ? preference.size
        : props.initialSize,
    )
  : props.initialSize;
const selectedSize = ref<ExportSize>(preferredSize ?? props.initialSize);
const selectedMp4Size = ref<Mp4ExportSize>(preference.size === "1440" ? "1440" : "1080");
const selectedFormat = ref<ExportFormat>(
  props.isMpo && preference.format === "sbs" && props.sbsMemoryPlan?.allowed
    ? "sbs"
    : preference.format === "mp4"
      ? "mp4"
      : "gif",
);
const selectedFraming = ref<ExportFraming>("crop-overlap");
const dialogElement = ref<HTMLElement | null>(null);
useDialogFocus(dialogElement, () => emit("canceled"));

const isEn = computed(() => props.locale === "en");
const copy = computed(() => isEn.value ? {
  kicker: "Download", title: "Download", format: "Format", gif: "Animated Wiggle", mp4: "High-quality video", sbs: "Original SBS PNG", framing: "Export framing",
  cropOverlap: "Crop overlap", fullFrame: "Full frame (keep edge background)", cropHint: "No white edges; image edges will be cropped.", fullHint: "Keeps all content; edge background may appear.",
  size: "GIF size (maximum edge)", estimated: "Estimated", unavailable: "Unavailable on this device",
  small: "Small", medium: "Medium", large: "Large",
  mp4Size: "MP4 size (maximum edge)", seconds: "seconds", localMp4Unavailable: "Local MP4 encoding is unavailable in this browser.", checkingMp4: "Checking encoder…",
  noUpscale: "No upscaling", preparing: "Preparing frames", encoding: "Encoding", progress: "Keep this window open while the file is created.",
  cancel: "Cancel", cancelExport: "Cancel export", confirm: "Confirm download", creating: "Creating file…",
  conservative: "A conservative memory limit is active for this device.", none: "No GIF size fits the current device memory budget.",
} : {
  kicker: "下载", title: "下载", format: "输出格式", gif: "Wiggle 动图", mp4: "高清无声视频", sbs: "原始 SBS PNG", framing: "导出取景",
  cropOverlap: "裁切重叠区", fullFrame: "完整画面（保留边缘背景）", cropHint: "无白边，边缘会裁切。", fullHint: "保留全部内容，可能出现边缘背景。",
  size: "GIF 尺寸（最长边）", estimated: "预计", unavailable: "当前设备不可用",
  small: "小", medium: "中", large: "大",
  mp4Size: "MP4 尺寸（最长边）", seconds: "秒", localMp4Unavailable: "当前浏览器不支持本地 MP4 编码。", checkingMp4: "正在检测编码器…",
  noUpscale: "不放大源图", preparing: "正在准备帧", encoding: "正在编码", progress: "文件创建期间请保持此窗口打开。",
  cancel: "取消", cancelExport: "取消导出", confirm: "确认下载", creating: "正在创建文件…",
  conservative: "当前设备使用保守内存限制。", none: "当前设备没有可执行的 GIF 尺寸。",
});

const activeGifMemoryPlans = computed(() =>
  selectedFraming.value === "crop-overlap"
    ? props.cropOverlapGifMemoryPlans
    : props.fullFrameGifMemoryPlans,
);
const activeMp4Plans = computed(() =>
  selectedFraming.value === "crop-overlap"
    ? props.cropOverlapMp4Plans
    : props.fullFrameMp4Plans,
);
const mp4FormatDisabled = computed(() => {
  const plans = [props.cropOverlapMp4Plans, props.fullFrameMp4Plans]
    .filter((value): value is Mp4OptionPlans => Boolean(value));
  return plans.length > 0 && plans.every((plan) =>
    Object.values(plan).every((option) => !option.allowed || option.codecSupported === false),
  );
});
watch(mp4FormatDisabled, (disabled) => {
  if (disabled && selectedFormat.value === "mp4") selectedFormat.value = "gif";
});
watch(activeGifMemoryPlans, (plans) => {
  if (!plans || plans[selectedSize.value].allowed) {
    return;
  }

  const recommended = getRecommendedGifSize(plans, selectedSize.value);
  if (recommended) {
    selectedSize.value = recommended;
  }
}, { immediate: true });
const exportSizes = computed(() => (["small", "medium", "large"] as ExportSize[]).map((value) => {
  const plan = activeGifMemoryPlans.value?.[value];
  const dimensions = plan?.dimensions ?? (props.gifSourceDimensions ? getExportDimensions(props.gifSourceDimensions, value) : null);
  const isSourceSize = Boolean(dimensions && props.gifSourceDimensions && dimensions.width === props.gifSourceDimensions.width && dimensions.height === props.gifSourceDimensions.height);
  const description = [
    dimensions ? `${dimensions.width} × ${dimensions.height}` : null,
    dimensions ? `${copy.value.estimated} ${formatFileSize(estimateGifFileBytes(dimensions.width, dimensions.height, props.gifFrameCount))}` : null,
    isSourceSize ? copy.value.noUpscale : null,
    plan && !plan.allowed ? copy.value.unavailable : null,
  ].filter(Boolean).join(" · ");
  return { value, label: copy.value[value], disabled: Boolean(plan && !plan.allowed), description };
}));
const mp4Sizes = computed(() => (["1080", "1440"] as Mp4ExportSize[]).map((value) => {
  const plan = activeMp4Plans.value?.[value];
  const description = plan
    ? [
        `${plan.dimensions.width} × ${plan.dimensions.height}`,
        `${copy.value.estimated} ${formatFileSize(plan.outputBytes)}`,
        `${(plan.durationMs / 1000).toFixed(2).replace(/\.00$/, "")} ${copy.value.seconds}`,
        plan.codecSupported === null ? copy.value.checkingMp4 : null,
        !plan.allowed || plan.codecSupported === false ? copy.value.unavailable : null,
      ].filter(Boolean).join(" · ")
    : copy.value.checkingMp4;
  return {
    value,
    label: value,
    description,
    disabled: Boolean(plan && (!plan.allowed || plan.codecSupported === false)),
  };
}));

const memoryGuidance = computed(() => {
  if (!activeGifMemoryPlans.value) return null;
  const recommended = getRecommendedGifSize(activeGifMemoryPlans.value, selectedSize.value);
  if (!recommended) return copy.value.none;
  return props.memoryProfile === "conservative" ? copy.value.conservative : null;
});
const canConfirm = computed(() => {
  if (props.isExporting) return false;
  if (selectedFormat.value === "sbs") return Boolean(props.sbsMemoryPlan?.allowed);
  if (selectedFormat.value === "gif") return activeGifMemoryPlans.value?.[selectedSize.value].allowed ?? true;
  const plan = activeMp4Plans.value?.[selectedMp4Size.value];
  return Boolean(plan?.allowed && plan.codecSupported === true);
});
const sbsDescription = computed(() => {
  const dimensions = props.sbsMemoryPlan?.dimensions;
  if (!dimensions) return props.sbsMemoryPlan ? copy.value.unavailable : "";
  return `${dimensions.width} × ${dimensions.height} · ${copy.value.estimated} ${formatFileSize(estimatePngFileBytes(dimensions.width, dimensions.height))}`;
});
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" role="presentation" @click.self="emit('canceled')">
      <section
        ref="dialogElement"
        class="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <header class="dialog-header export-dialog-header">
          <p class="panel-kicker">{{ copy.kicker }}</p>
        </header>

        <fieldset class="export-format-options" :disabled="isExporting">
          <legend>{{ copy.format }}</legend>
          <label :class="{ active: selectedFormat === 'gif' }">
            <input v-model="selectedFormat" type="radio" name="export-format" value="gif" />
            <span><strong>GIF</strong><small>{{ copy.gif }}</small></span>
          </label>
          <label :class="{ active: selectedFormat === 'mp4', unavailable: mp4FormatDisabled }">
            <input v-model="selectedFormat" type="radio" name="export-format" value="mp4" :disabled="mp4FormatDisabled" />
            <span><strong>MP4</strong><small>{{ mp4FormatDisabled ? copy.localMp4Unavailable : copy.mp4 }}</small></span>
          </label>
          <label v-if="isMpo" :class="{ active: selectedFormat === 'sbs' }">
            <input v-model="selectedFormat" type="radio" name="export-format" value="sbs" :disabled="!sbsMemoryPlan?.allowed" />
            <span><strong>SBS PNG</strong><small>{{ sbsDescription }}</small></span>
          </label>
        </fieldset>

        <!-- <p v-if="selectedFormat === 'gif'" class="dialog-section-label">{{ isEn ? 'Options' : '选项' }}</p> -->

        <p v-if="selectedFormat === 'gif' && memoryGuidance" class="memory-guidance" aria-live="polite">{{ memoryGuidance }}</p>

        <p v-if="selectedFormat === 'mp4' && activeMp4Plans && Object.values(activeMp4Plans).every((plan) => plan.codecSupported === false)" class="memory-guidance" aria-live="polite">{{ copy.localMp4Unavailable }}</p>

        <fieldset v-if="selectedFormat === 'gif' || selectedFormat === 'mp4'" class="export-format-options" :disabled="isExporting">
          <legend>{{ copy.framing }}</legend>
          <label :class="{ active: selectedFraming === 'crop-overlap' }">
            <input v-model="selectedFraming" type="radio" name="export-framing" value="crop-overlap" />
            <span><strong>{{ copy.cropOverlap }}</strong><small>{{ copy.cropHint }}</small></span>
          </label>
          <label :class="{ active: selectedFraming === 'full-frame' }">
            <input v-model="selectedFraming" type="radio" name="export-framing" value="full-frame" />
            <span><strong>{{ copy.fullFrame }}</strong><small>{{ copy.fullHint }}</small></span>
          </label>
        </fieldset>

        <fieldset v-if="selectedFormat === 'gif'" class="export-size-options" :disabled="isExporting">
          <legend>{{ copy.size }}</legend>
          <label
            v-for="size in exportSizes"
            :key="size.value"
            :class="{ active: selectedSize === size.value, unavailable: size.disabled }"
          >
            <input v-model="selectedSize" type="radio" name="gif-size" :value="size.value" :disabled="size.disabled" />
            <span><strong>{{ size.label }}</strong><small>{{ size.description }}</small></span>
          </label>
        </fieldset>

        <fieldset v-if="selectedFormat === 'mp4'" class="export-size-options" :disabled="isExporting">
          <legend>{{ copy.mp4Size }}</legend>
          <label
            v-for="size in mp4Sizes"
            :key="size.value"
            :class="{ active: selectedMp4Size === size.value, unavailable: size.disabled }"
          >
            <input v-model="selectedMp4Size" type="radio" name="mp4-size" :value="size.value" :disabled="size.disabled" />
            <span><strong>{{ size.label }}</strong><small>{{ size.description }}</small></span>
          </label>
        </fieldset>

        <div v-if="isExporting" class="export-progress" aria-live="polite" aria-busy="true">
          <div class="export-progress-heading">
            <strong>{{ progress.stage === 'preparing' ? copy.preparing : copy.encoding }}</strong>
            <span>{{ Math.round(progress.progress * 100) }}%</span>
          </div>
          <div class="export-progress-track" aria-hidden="true">
            <span :style="{ width: `${Math.max(4, progress.progress * 100)}%` }" />
          </div>
          <p>{{ copy.progress }}</p>
        </div>

        <div class="dialog-actions">
          <button type="button" @click="emit('canceled')">{{ isExporting ? copy.cancelExport : copy.cancel }}</button>
          <button
            class="primary-action"
            :class="{ 'is-loading': isExporting }"
            type="button"
            :disabled="!canConfirm"
            :aria-busy="isExporting"
            @click="emit('confirmed', selectedFormat, selectedFormat === 'mp4' ? selectedMp4Size : selectedSize, selectedFraming)"
          >{{ isExporting ? copy.creating : copy.confirm }}</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
