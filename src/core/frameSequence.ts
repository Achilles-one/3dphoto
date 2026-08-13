export type WiggleFrameSource = 'first' | 'crossfade' | 'second';

export interface WiggleFrame {
  sourceView: WiggleFrameSource;
  crossfadeAmount: number;
  isTransition: boolean;
  delayMultiplier: number;
}

const firstFrame: WiggleFrame = {
  sourceView: 'first', crossfadeAmount: 0, isTransition: false, delayMultiplier: 1,
};
const secondFrame: WiggleFrame = {
  sourceView: 'second', crossfadeAmount: 1, isTransition: false, delayMultiplier: 1,
};
const intermediateFrame: WiggleFrame = {
  sourceView: 'crossfade', crossfadeAmount: 0.5, isTransition: true, delayMultiplier: 1,
};

/** Returns A → M → B → M, or A → B when intermediate frames are disabled. */
export function createWiggleFrameSequence(includeIntermediateFrames = true): WiggleFrame[] {
  return includeIntermediateFrames
    ? [firstFrame, intermediateFrame, secondFrame, intermediateFrame]
    : [firstFrame, secondFrame];
}

export function getWiggleFrameCount(includeIntermediateFrames = true): number {
  return createWiggleFrameSequence(includeIntermediateFrames).length;
}
