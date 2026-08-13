export function estimateGifFileBytes(width: number, height: number, frameCount: number): number {
  return Math.max(1024, Math.round(width * height * frameCount * 0.35));
}

export function estimatePngFileBytes(width: number, height: number): number {
  return Math.max(1024, Math.round(width * height * 4 * 0.45));
}
