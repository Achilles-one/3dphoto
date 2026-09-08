import type { AlignmentMatch, AutoAlignmentResult } from '@/types/alignment';

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};

const medianDeviation = (values: number[], center: number) =>
  median(values.map((value) => Math.abs(value - center)));

export function estimateSubjectAlignment(
  matches: AlignmentMatch[],
  width: number,
  height: number,
  maxOffsetX: number,
  maxOffsetY: number,
): AutoAlignmentResult {
  if (matches.length < 24) return { ok: false, reason: 'insufficient-matches' };

  const verticalOffsets = matches.map((match) => match.leftY - match.rightY);
  const alignmentY = median(verticalOffsets);
  const verticalMad = medianDeviation(verticalOffsets, alignmentY);
  const verticalTolerance = Math.max(1.5, verticalMad * 3);
  const verticalInliers = matches.filter((match) =>
    Math.abs(match.leftY - match.rightY - alignmentY) <= verticalTolerance,
  );
  if (verticalMad > 3 || verticalInliers.length < Math.max(18, matches.length * 0.62)) {
    return { ok: false, reason: 'vertical-inconsistency' };
  }

  const binSize = Math.max(3, Math.min(10, width / 80));
  const bins = new Map<number, AlignmentMatch[]>();
  for (const match of verticalInliers) {
    const disparity = match.leftX - match.rightX;
    const key = Math.round(disparity / binSize);
    const bin = bins.get(key) ?? [];
    bin.push(match);
    bins.set(key, bin);
  }

  const candidates = [...bins.entries()].map(([key, points]) => {
    const xs = points.map((point) => point.leftX);
    const ys = points.map((point) => point.leftY);
    const coverage = ((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))) / (width * height);
    const centerDistance = median(points.map((point) =>
      Math.hypot((point.leftX - width / 2) / width, (point.leftY - height / 2) / height),
    ));
    const compactness = medianDeviation(
      points.map((point) => point.leftX - point.rightX),
      median(points.map((point) => point.leftX - point.rightX)),
    );
    const score = points.length * Math.max(0.2, 1 - centerDistance * 1.4) * Math.min(1, 0.45 + coverage * 3);
    return { key, points, coverage, compactness, score };
  }).sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const second = candidates[1];
  if (!best || best.points.length < 12 || best.coverage < 0.025 || best.compactness > binSize) {
    return { ok: false, reason: 'subject-ambiguity' };
  }
  if (second && second.score > best.score * 0.82 && Math.abs(second.key - best.key) > 1) {
    return { ok: false, reason: 'subject-ambiguity' };
  }

  const alignmentX = median(best.points.map((point) => point.leftX - point.rightX));
  if (Math.abs(alignmentX) > maxOffsetX || Math.abs(alignmentY) > maxOffsetY) {
    return { ok: false, reason: 'offset-out-of-range' };
  }

  const residualY = medianDeviation(
    best.points.map((point) => point.leftY - point.rightY),
    alignmentY,
  );
  const residualX = medianDeviation(
    best.points.map((point) => point.leftX - point.rightX),
    alignmentX,
  );
  if (residualY > 2 || residualX > binSize * 0.75) {
    return { ok: false, reason: 'validation-failed' };
  }

  return {
    ok: true,
    alignmentX,
    alignmentY,
    confidence: Math.min(1, best.points.length / 45) * Math.min(1, best.score / Math.max(18, matches.length * 0.45)),
  };
}
