import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFeedbackUrl,
  FEEDBACK_ISSUE_URL,
  getBrowserLabel,
  type FeedbackContext,
} from '../src/core/feedback.ts';

test('browser diagnostics expose only browser family and version', () => {
  assert.equal(
    getBrowserLabel(
      'Mozilla/5.0 (...) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
    ),
    'Edge 140.0.0.0',
  );
  assert.equal(
    getBrowserLabel(
      'Mozilla/5.0 (...) Version/18.5 Safari/605.1.15',
    ),
    'Safari 18.5',
  );
  assert.equal(getBrowserLabel('custom-agent'), 'Other browser');
});

test('GitHub feedback URL includes safe diagnostics and excludes file names', () => {
  const context: FeedbackContext & { fileName: string } = {
    version: '0.1.0',
    buildId: 'abc12345',
    locale: 'en',
    browser: 'Chrome 140.0.0.0',
    inputFormat: 'mpo',
    exportFormat: 'gif',
    exportSize: 'large',
    exportFraming: 'crop-overlap',
    errorCode: '3DP-P001 (mpo-invalid)',
    fileName: 'private-family-photo.mpo',
  };
  const url = new URL(createFeedbackUrl(context));
  const body = url.searchParams.get('body') ?? '';

  assert.equal(`${url.origin}${url.pathname}`, FEEDBACK_ISSUE_URL);
  assert.match(url.searchParams.get('title') ?? '', /Beta v0\.1\.0/);
  assert.match(body, /Build: abc12345/);
  assert.match(body, /Browser: Chrome 140\.0\.0\.0/);
  assert.match(body, /Input format: mpo/);
  assert.match(body, /Export format: gif/);
  assert.match(body, /Export size: large/);
  assert.match(body, /Export framing: crop-overlap/);
  assert.match(body, /Error code: 3DP-P001 \(mpo-invalid\)/);
  assert.match(body, /No image content or file name is included/);
  assert.doesNotMatch(body, /private-family-photo/);
});

test('Chinese feedback copy keeps diagnostic values intact', () => {
  const body = new URL(createFeedbackUrl({
    version: '0.1.0',
    buildId: 'abc12345',
    locale: 'zh-CN',
    browser: 'Chrome 140.0.0.0',
    inputFormat: 'mpo',
    exportFormat: 'gif',
    exportSize: 'medium',
    exportFraming: 'crop-overlap',
    errorCode: '3DP-E001 (export-failed)',
  })).searchParams.get('body') ?? '';

  assert.match(body, /安全诊断信息/);
  assert.match(body, /GIF\/MP4 导出取景: crop-overlap/);
  assert.match(body, /错误码: 3DP-E001 \(export-failed\)/);
});
