export type AnalyticsEventName =
  | 'upload_success'
  | 'upload_failure'
  | 'mpo_decode_failure'
  | 'wiggle_play'
  | 'gif_export_success'
  | 'gif_export_failure'
  | 'sbs_export_success'
  | 'sbs_export_failure';

type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

const ANALYTICS_STORAGE_KEY = '3d-photo-enhancer-analytics-enabled';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function isAnalyticsEnabled(): boolean {
  if (!canUseStorage()) {
    return true;
  }

  return window.localStorage.getItem(ANALYTICS_STORAGE_KEY) !== 'false';
}

export function setAnalyticsEnabled(enabled: boolean) {
  if (canUseStorage()) {
    window.localStorage.setItem(ANALYTICS_STORAGE_KEY, String(enabled));
  }
}

export function trackEvent(name: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') {
    return;
  }

  const event = {
    name,
    properties: {
      ...properties,
      userAgent: navigator.userAgent,
      deviceType: window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'pointer',
    },
  };
  const endpoint = import.meta.env?.VITE_ANALYTICS_ENDPOINT;

  if (endpoint) {
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => undefined);
  }
}
