import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isAnalyticsEnabled,
  setAnalyticsEnabled,
} from '../src/utils/analytics.ts';

test('analytics stays disabled until explicitly enabled', () => {
  const originalWindow = globalThis.window;
  const values = new Map<string, string>();
  const storage = {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: storage },
  });

  try {
    assert.equal(isAnalyticsEnabled(), false);

    setAnalyticsEnabled(true);
    assert.equal(isAnalyticsEnabled(), true);

    setAnalyticsEnabled(false);
    assert.equal(isAnalyticsEnabled(), false);
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  }
});
