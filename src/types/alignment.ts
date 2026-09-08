export const ALIGNMENT_WORKER_RUNTIME_VERSION = 'wasm-csp-v1' as const;

export type AutoAlignmentFailureReason =
  | 'insufficient-features'
  | 'insufficient-matches'
  | 'vertical-inconsistency'
  | 'subject-ambiguity'
  | 'offset-out-of-range'
  | 'validation-failed'
  | 'runtime-failure'
  | 'timeout'
  | 'canceled';

export interface AlignmentMatch {
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
  distance: number;
}

export interface AutoAlignmentSuccess {
  ok: true;
  alignmentX: number;
  alignmentY: number;
  confidence: number;
}

export interface AutoAlignmentFailure {
  ok: false;
  reason: AutoAlignmentFailureReason;
}

export type AutoAlignmentResult = AutoAlignmentSuccess | AutoAlignmentFailure;

export interface AlignmentWorkerRequest {
  runtimeVersion: typeof ALIGNMENT_WORKER_RUNTIME_VERSION;
  left: ImageData;
  right: ImageData;
  maxOffsetX: number;
  maxOffsetY: number;
}

export type AlignmentWorkerResponse = AutoAlignmentResult;
