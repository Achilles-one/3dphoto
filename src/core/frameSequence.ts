export type WiggleFrameSource = 'first' | 'crossfade' | 'second';

export interface WiggleFrame {
  sourceView: WiggleFrameSource;
  crossfadeAmount: number;
  isTransition: boolean;
  delayMultiplier: number;
}

/** A single blended frame is used to keep the transition smooth and predictable. */
export function createWiggleFrameSequence(): WiggleFrame[] {
  return [
    {
      sourceView: 'first',
      crossfadeAmount: 0,
      isTransition: false,
      delayMultiplier: 1,
    },
    {
      sourceView: 'crossfade',
      crossfadeAmount: 0.5,
      isTransition: true,
      delayMultiplier: 1,
    },
    {
      sourceView: 'second',
      crossfadeAmount: 1,
      isTransition: false,
      delayMultiplier: 1,
    },
    {
      sourceView: 'crossfade',
      crossfadeAmount: 0.5,
      isTransition: true,
      delayMultiplier: 1,
    },
  ];
}

export function getWiggleFrameCount(): number {
  return createWiggleFrameSequence().length;
}
