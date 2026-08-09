export const MIN_FRAME_INTERVAL_MS = 220;
export const MAX_FRAME_INTERVAL_MS = 920;
export const MAX_INTENSITY_OFFSET_RATIO = 0.035;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getFrameInterval(speed: number): number {
  const normalizedSpeed = clamp(speed, 0, 100) / 100;
  return Math.round(
    MAX_FRAME_INTERVAL_MS -
      (MAX_FRAME_INTERVAL_MS - MIN_FRAME_INTERVAL_MS) * normalizedSpeed,
  );
}

export function getIntensityOffset(intensity: number, renderedWidth: number): number {
  const normalizedIntensity = clamp(intensity, 0, 100) / 100;
  return Math.round(renderedWidth * MAX_INTENSITY_OFFSET_RATIO * normalizedIntensity);
}
