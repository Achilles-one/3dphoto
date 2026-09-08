import cvModule from '@techstark/opencv-js';

import { estimateSubjectAlignment } from '@/core/alignmentEstimate';
import type { AlignmentMatch, AlignmentWorkerRequest, AlignmentWorkerResponse } from '@/types/alignment';

type OpenCv = typeof cvModule;

async function getOpenCv(): Promise<OpenCv> {
  const candidate = await cvModule;
  if (candidate.Mat) return candidate;
  await new Promise<void>((resolve) => { candidate.onRuntimeInitialized = resolve; });
  return candidate;
}

function extractMatches(cv: OpenCv, request: AlignmentWorkerRequest): AlignmentMatch[] {
  const resources: Array<{ delete(): void }> = [];
  try {
    const leftRgba = cv.matFromImageData(request.left);
    const rightRgba = cv.matFromImageData(request.right);
    const leftGray = new cv.Mat();
    const rightGray = new cv.Mat();
    const leftKeypoints = new cv.KeyPointVector();
    const rightKeypoints = new cv.KeyPointVector();
    const leftDescriptors = new cv.Mat();
    const rightDescriptors = new cv.Mat();
    const mask = new cv.Mat();
    const orb = new cv.ORB(1200, 1.2, 8, 24, 0, 2, cv.ORB_HARRIS_SCORE, 31, 12);
    resources.push(leftRgba, rightRgba, leftGray, rightGray, leftKeypoints, rightKeypoints, leftDescriptors, rightDescriptors, mask, orb);
    cv.cvtColor(leftRgba, leftGray, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(rightRgba, rightGray, cv.COLOR_RGBA2GRAY);
    orb.detectAndCompute(leftGray, mask, leftKeypoints, leftDescriptors);
    orb.detectAndCompute(rightGray, mask, rightKeypoints, rightDescriptors);
    if (leftDescriptors.rows < 24 || rightDescriptors.rows < 24) return [];

    const forward = new cv.DMatchVectorVector();
    const reverse = new cv.DMatchVectorVector();
    const matcher = new cv.BFMatcher(cv.NORM_HAMMING, false);
    resources.push(forward, reverse, matcher);
    matcher.knnMatch(leftDescriptors, rightDescriptors, forward, 2);
    matcher.knnMatch(rightDescriptors, leftDescriptors, reverse, 2);

    const reverseAccepted = new Set<string>();
    for (let index = 0; index < reverse.size(); index += 1) {
      const pair = reverse.get(index);
      if (pair.size() >= 2) {
        const first = pair.get(0);
        const second = pair.get(1);
        if (first.distance < second.distance * 0.75) reverseAccepted.add(`${first.queryIdx}:${first.trainIdx}`);
      }
      pair.delete();
    }

    const matches: AlignmentMatch[] = [];
    for (let index = 0; index < forward.size(); index += 1) {
      const pair = forward.get(index);
      if (pair.size() >= 2) {
        const first = pair.get(0);
        const second = pair.get(1);
        if (first.distance < second.distance * 0.75 && reverseAccepted.has(`${first.trainIdx}:${first.queryIdx}`)) {
          const left = leftKeypoints.get(first.queryIdx).pt;
          const right = rightKeypoints.get(first.trainIdx).pt;
          matches.push({ leftX: left.x, leftY: left.y, rightX: right.x, rightY: right.y, distance: first.distance });
        }
      }
      pair.delete();
    }
    return matches;
  } finally {
    for (const resource of resources.reverse()) resource.delete();
  }
}

self.onmessage = async (event: MessageEvent<AlignmentWorkerRequest>) => {
  let response: AlignmentWorkerResponse;
  try {
    const cv = await getOpenCv();
    const matches = extractMatches(cv, event.data);
    response = matches.length
      ? estimateSubjectAlignment(matches, event.data.left.width, event.data.left.height, event.data.maxOffsetX, event.data.maxOffsetY)
      : { ok: false, reason: 'insufficient-features' };
  } catch {
    response = { ok: false, reason: 'runtime-failure' };
  }
  self.postMessage(response);
};
