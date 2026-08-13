export const MIN_FRAME_INTERVAL_MS = 100;
export const MAX_FRAME_INTERVAL_MS = 2000;
export const DEFAULT_FRAME_INTERVAL_MS = 200;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getFrameInterval(speed: number): number {
  if (!Number.isFinite(speed)) {
    return DEFAULT_FRAME_INTERVAL_MS;
  }

  return clamp(Math.round(speed), MIN_FRAME_INTERVAL_MS, MAX_FRAME_INTERVAL_MS);
}
