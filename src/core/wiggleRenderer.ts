import type { WiggleSettings } from '@/types/app';
import type { StereoSplitResult, StereoView } from '@/types/stereo';

import { getScaledAlignmentOffset } from './alignment';
import { getFrameInterval, getIntensityOffset } from './wiggleParams';

function getOrderedViews(
  stereoSplit: StereoSplitResult,
  swapEyes: boolean,
): [StereoView, StereoView] {
  return swapEyes
    ? [stereoSplit.rightView, stereoSplit.leftView]
    : [stereoSplit.leftView, stereoSplit.rightView];
}

function getContainRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  return {
    scale,
    width,
    height,
    x: Math.round((targetWidth - width) / 2),
    y: Math.round((targetHeight - height) / 2),
  };
}

export class WiggleRenderer {
  private animationFrameId = 0;
  private frameIndex: 0 | 1 = 0;
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
    this.settings = { ...settings };

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

    if (timestamp - this.lastFrameChange >= getFrameInterval(this.settings.speed)) {
      this.frameIndex = this.frameIndex === 0 ? 1 : 0;
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

    const views = getOrderedViews(this.stereoSplit, this.settings.swapEyes);
    const activeView = views[this.frameIndex];

    this.clear();

    const rect = getContainRect(
      activeView.width,
      activeView.height,
      this.canvas.clientWidth,
      this.canvas.clientHeight,
    );
    const offset = getIntensityOffset(this.settings.intensity, rect.width);
    const frameDirection = this.frameIndex === 0 ? -1 : 1;
    const overscanWidth = rect.width + offset * 2;
    const overscanScale = overscanWidth / activeView.width;
    const overscanHeight = Math.max(
      rect.height,
      Math.round((activeView.height / activeView.width) * overscanWidth),
    );
    const alignmentOffset = getScaledAlignmentOffset(
      this.stereoSplit,
      activeView,
      this.settings,
      overscanScale,
    );
    const x = Math.round(rect.x + (rect.width - overscanWidth) / 2);
    const y = Math.round(rect.y + (rect.height - overscanHeight) / 2);

    this.context.drawImage(
      activeView.canvas,
      x + offset * frameDirection + alignmentOffset.x,
      y + alignmentOffset.y,
      overscanWidth,
      overscanHeight,
    );
  }

  private clear() {
    this.context.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }
}
