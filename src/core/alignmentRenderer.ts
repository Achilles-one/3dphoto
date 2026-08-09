import type { WiggleSettings } from '@/types/app';
import type { StereoSplitResult } from '@/types/stereo';

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

export class AlignmentRenderer {
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
    this.draw();
  }

  render(stereoSplit: StereoSplitResult, settings: WiggleSettings) {
    this.stereoSplit = stereoSplit;
    this.settings = { ...settings };
    this.draw();
  }

  destroy() {
    this.stereoSplit = null;
    this.settings = null;
    this.clear();
  }

  private draw() {
    if (!this.stereoSplit || !this.settings) {
      this.clear();
      return;
    }

    const { leftView, rightView } = this.stereoSplit;
    const rect = getContainRect(
      leftView.width,
      leftView.height,
      this.canvas.clientWidth,
      this.canvas.clientHeight,
    );
    const overlayX = rect.x + Math.round(this.settings.alignmentX * rect.scale);
    const overlayY = rect.y + Math.round(this.settings.alignmentY * rect.scale);
    const overlayWidth = Math.max(1, Math.round(rightView.width * rect.scale));
    const overlayHeight = Math.max(1, Math.round(rightView.height * rect.scale));

    this.clear();
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    this.context.drawImage(leftView.canvas, rect.x, rect.y, rect.width, rect.height);

    this.context.save();
    this.context.globalAlpha = this.settings.overlayOpacity;
    this.context.globalCompositeOperation = 'multiply';
    this.context.drawImage(
      rightView.canvas,
      overlayX,
      overlayY,
      overlayWidth,
      overlayHeight,
    );
    this.context.restore();
  }

  private clear() {
    this.context.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }
}
