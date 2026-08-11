import type { ProcessedImageInfo } from '@/types/image';
import type { StereoSplitResult } from '@/types/stereo';

export function releaseStereoSplit(stereoSplit: StereoSplitResult | null) {
  if (!stereoSplit) {
    return;
  }

  for (const view of [stereoSplit.leftView, stereoSplit.rightView]) {
    view.canvas.width = 1;
    view.canvas.height = 1;
    view.canvas.getContext('2d')?.clearRect(0, 0, 1, 1);
  }
}

export function releaseProcessedImage(processedImage: ProcessedImageInfo | null) {
  if (!processedImage) {
    return;
  }

  processedImage.previewCanvas.width = 1;
  processedImage.previewCanvas.height = 1;
  processedImage.previewCanvas.getContext('2d')?.clearRect(0, 0, 1, 1);
}
