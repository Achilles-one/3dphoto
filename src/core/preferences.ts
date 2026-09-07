import type {
  ExportFormat,
  ExportSelectionSize,
  Locale,
} from '@/types/app';

const LOCALE_KEY = '3d-photo-enhancer-locale';
const EXPORT_KEY = '3d-photo-enhancer-export-preference';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredLocale(): Locale {
  return canUseStorage() && window.localStorage.getItem(LOCALE_KEY) === 'en'
    ? 'en'
    : 'zh-CN';
}

export function storeLocale(locale: Locale) {
  if (canUseStorage()) {
    window.localStorage.setItem(LOCALE_KEY, locale);
  }
}

export interface ExportPreference {
  format: ExportFormat;
  size: ExportSelectionSize;
}

export function getExportPreference(): ExportPreference {
  if (!canUseStorage()) {
    return { format: 'gif', size: 'medium' };
  }

  try {
    const preference = JSON.parse(window.localStorage.getItem(EXPORT_KEY) ?? '{}') as Partial<ExportPreference>;
    return {
      format:
        preference.format === 'sbs' || preference.format === 'mp4'
          ? preference.format
          : 'gif',
      size:
        preference.size === 'small' ||
        preference.size === 'large' ||
        preference.size === '1080' ||
        preference.size === '1440'
          ? preference.size
          : 'medium',
    };
  } catch {
    return { format: 'gif', size: 'medium' };
  }
}

export function storeExportPreference(preference: ExportPreference) {
  if (canUseStorage()) {
    window.localStorage.setItem(EXPORT_KEY, JSON.stringify(preference));
  }
}
