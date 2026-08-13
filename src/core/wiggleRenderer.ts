import type { WiggleSettings } from '@/types/app';
import type { StereoSplitResult } from '@/types/stereo';

import { createWiggleFrameSequence } from './frameSequence.ts';
import {
  drawWiggleFrame,
  getFrameGeometry,
  getOrderedViews,
  MATTE_BACKGROUND,
} from './renderGeometry.ts';
import { getFrameInterval } from './wiggleParams.ts';

export class WiggleRenderer {
  private animationFrameId = 0;
  private frameIndex = 0;
  private lastFrameChange = 0;
  private readonly context: CanvasRenderingContext2D;
  private stereoSplit: StereoSplitResult | null = null;
  private settings: WiggleSettings | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }

    this.context = context;
  }

  setSize(width: number, height: number) {
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(width * pixelRatio));
    this.canvas.height = Math.max(1, Math.round(height * pixelRatio));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.drawCurrentFrame();
  }

  render(stereoSplit: StereoSplitResult, settings: WiggleSettings) {
    this.stereoSplit = stereoSplit;
    const intermediateFramesChanged = this.settings?.intermediateFrames !== settings.intermediateFrames;
    this.settings = { ...settings };
    const sequence = createWiggleFrameSequence(settings.intermediateFrames !== false);
    if (intermediateFramesChanged) {
      this.frameIndex = 0;
      this.lastFrameChange = performance.now();
    } else {
      this.frameIndex %= sequence.length;
    }

    if (settings.isPlaying) {
      this.start();
    } else {
      this.stop();
      this.drawCurrentFrame();
    }
  }

  start() {
    if (this.animationFrameId !== 0) {
      return;
    }

    this.lastFrameChange = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  stop() {
    if (this.animationFrameId === 0) {
      return;
    }

    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = 0;
  }

  destroy() {
    this.stop();
    this.stereoSplit = null;
    this.settings = null;
    this.clear();
  }

  private readonly tick = (timestamp: number) => {
    if (!this.stereoSplit || !this.settings) {
      this.stop();
      return;
    }

    const sequence = createWiggleFrameSequence(this.settings.intermediateFrames !== false);
    const currentFrame = sequence[this.frameIndex % sequence.length] ?? sequence[0];

    if (!currentFrame) {
      return;
    }

    if (
      timestamp - this.lastFrameChange >=
      getFrameInterval(this.settings.speed) * currentFrame.delayMultiplier
    ) {
      this.frameIndex = (this.frameIndex + 1) % sequence.length;
      this.lastFrameChange = timestamp;
    }

    this.drawCurrentFrame();
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private drawCurrentFrame() {
    if (!this.stereoSplit || !this.settings) {
      this.clear();
      return;
    }

    const sequence = createWiggleFrameSequence(this.settings.intermediateFrames !== false);
    const frame = sequence[this.frameIndex % sequence.length] ?? sequence[0];

    if (!frame) {
      return;
    }

    const targetWidth = this.canvas.clientWidth;
    const targetHeight = this.canvas.clientHeight;
    const geometry = getFrameGeometry(
      this.stereoSplit,
      this.settings,
      targetWidth,
      targetHeight,
    );
    const views = getOrderedViews(this.stereoSplit, this.settings);

    this.clear();
    this.context.fillStyle = MATTE_BACKGROUND;
    this.context.fillRect(0, 0, targetWidth, targetHeight);
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    drawWiggleFrame(this.context, views, geometry, frame);
  }

  private clear() {
    this.context.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }
}
