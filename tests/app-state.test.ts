import assert from 'node:assert/strict';
import test from 'node:test';

import { useAppState } from '../src/app/appState.ts';

const stereoSplit = {
  layout: 'side-by-side',
  leftView: { width: 400, height: 300, dataUrl: '', canvas: null },
  rightView: { width: 400, height: 300, dataUrl: '', canvas: null },
} as never;

test('upload starts in loading and preview starts in split mode', () => {
  const app = useAppState();
  const file = new File(['image'], 'sample.jpg', { type: 'image/jpeg' });

  app.setUploadedFile(file);

  assert.equal(app.state.phase, 'loading');
  assert.equal(app.state.previewMode, 'split');
  assert.equal(app.state.selectedFile?.name, 'sample.jpg');

  app.showPreview({} as never, stereoSplit);

  assert.equal(app.state.phase, 'preview');
  assert.equal(app.state.previewMode, 'split');
  assert.equal(app.state.stereoSplit?.layout, 'side-by-side');
  assert.equal(app.state.stereoSplit?.leftView.width, 400);
});

test('playback toggles between split and wiggle modes', () => {
  const app = useAppState();
  app.showPreview({} as never, stereoSplit);

  app.togglePlayback();
  assert.equal(app.state.previewMode, 'wiggle');
  assert.equal(app.state.settings.isPlaying, true);

  app.togglePlayback();
  assert.equal(app.state.settings.isPlaying, false);

  app.showSplitPreview();
  assert.equal(app.state.previewMode, 'split');
  assert.equal(app.state.settings.isPlaying, false);
});

test('alignment preview keeps calibration settings outside playback', () => {
  const app = useAppState();
  app.showPreview({} as never, stereoSplit);

  app.showAlignPreview();
  app.setAlignment(12, -8);
  app.setOverlayOpacity(0.7);

  assert.equal(app.state.previewMode, 'align');
  assert.equal(app.state.settings.isPlaying, false);
  assert.equal(app.state.settings.alignmentX, 12);
  assert.equal(app.state.settings.alignmentY, -8);
  assert.equal(app.state.settings.overlayOpacity, 0.7);

  app.resetAlignment();

  assert.equal(app.state.settings.alignmentX, 0);
  assert.equal(app.state.settings.alignmentY, 0);
  assert.equal(app.state.settings.overlayOpacity, 0.55);

  app.setAlignment(12, -8);

  app.togglePlayback();

  assert.equal(app.state.previewMode, 'wiggle');
  assert.equal(app.state.settings.isPlaying, true);
  assert.equal(app.state.settings.alignmentX, 12);
  assert.equal(app.state.settings.alignmentY, -8);
});

test('reset upload clears the selected file, preview, and settings', () => {
  const app = useAppState();
  app.showPreview({} as never, stereoSplit);
  app.setSpeed(90);
  app.setIntensity(60);
  app.setAlignment(18, -10);
  app.togglePlayback();

  app.resetUpload();

  assert.equal(app.state.phase, 'empty');
  assert.equal(app.state.selectedFile, null);
  assert.equal(app.state.stereoSplit, null);
  assert.equal(app.state.settings.speed, 50);
  assert.equal(app.state.settings.intensity, 0);
  assert.equal(app.state.settings.alignmentX, 0);
  assert.equal(app.state.settings.alignmentY, 0);
  assert.equal(app.state.previewMode, 'split');
});
