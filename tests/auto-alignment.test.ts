import assert from 'node:assert/strict';
import test from 'node:test';

import { estimateSubjectAlignment } from '../src/core/alignmentEstimate.ts';
import type { AlignmentMatch } from '../src/types/alignment.ts';

function cluster(
  count: number,
  disparityX: number,
  disparityY: number,
  startX = 180,
  startY = 120,
): AlignmentMatch[] {
  return Array.from({ length: count }, (_, index) => {
    const leftX = startX + (index % 6) * 45;
    const leftY = startY + Math.floor(index / 6) * 36;
    const jitter = (index % 3 - 1) * 0.2;
    return {
      leftX,
      leftY,
      rightX: leftX - disparityX - jitter,
      rightY: leftY - disparityY + jitter,
      distance: 20,
    };
  });
}

test('returns known positive and negative X/Y subject offsets', () => {
  for (const [x, y] of [[14, -3], [-11, 4]] as const) {
    const result = estimateSubjectAlignment(cluster(36, x, y), 640, 400, 100, 100);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.ok(Math.abs(result.alignmentX - x) < 0.5);
      assert.ok(Math.abs(result.alignmentY - y) < 0.5);
    }
  }
});

test('selects the central subject plane over a smaller background plane', () => {
  const matches = [
    ...cluster(36, 12, 2),
    ...cluster(14, -5, 2, 20, 20),
  ];
  const result = estimateSubjectAlignment(matches, 640, 400, 100, 100);
  assert.equal(result.ok, true);
  if (result.ok) assert.ok(Math.abs(result.alignmentX - 12) < 0.5);
});

test('tolerates mild correspondence noise and partial occlusion', () => {
  const matches = cluster(28, 9, -2).map((match, index) => ({
    ...match,
    rightX: match.rightX + (index % 5 === 0 ? 1.1 : 0),
  }));
  const result = estimateSubjectAlignment(matches, 640, 400, 100, 100);
  assert.equal(result.ok, true);
});

test('fails safely for low texture, repeated ambiguity, vertical inconsistency and range overflow', () => {
  assert.deepEqual(
    estimateSubjectAlignment(cluster(8, 4, 1), 640, 400, 100, 100),
    { ok: false, reason: 'insufficient-matches' },
  );

  const ambiguous = [
    ...cluster(24, -16, 1, 150, 100),
    ...cluster(24, 16, 1, 150, 100),
  ];
  assert.equal(estimateSubjectAlignment(ambiguous, 640, 400, 100, 100).ok, false);

  const inconsistent = cluster(30, 8, 1).map((match, index) => ({
    ...match,
    rightY: match.leftY - (index % 2 ? 10 : -10),
  }));
  assert.deepEqual(
    estimateSubjectAlignment(inconsistent, 640, 400, 100, 100),
    { ok: false, reason: 'vertical-inconsistency' },
  );

  assert.deepEqual(
    estimateSubjectAlignment(cluster(30, 120, 2), 640, 400, 40, 40),
    { ok: false, reason: 'offset-out-of-range' },
  );
});
