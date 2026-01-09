export type PairingMetric = "unit" | "total";

export type PairingLine = {
  total: number;
  units: number;
};

export type PairingResult<T extends PairingLine> = {
  matches: Array<{ previous: T; current: T }>;
  unmatchedPrevious: T[];
  unmatchedCurrent: T[];
};

function getMetric(line: PairingLine, metric: PairingMetric) {
  if (metric === "total") return line.total;
  return line.units > 0 ? line.total / line.units : Number.NaN;
}

export function pairLines<T extends PairingLine>({
  previous,
  current,
  metric,
  tolerance,
}: {
  previous: T[];
  current: T[];
  metric: PairingMetric;
  tolerance: number;
}): PairingResult<T> {
  // Business rule: pair lines by closest unit price (or total) within tolerance,
  // so small differences do not create false "new/missing" lines.
  const available = new Set(current.map((_, index) => index));
  const matches: Array<{ previous: T; current: T }> = [];
  const unmatchedPrevious: T[] = [];

  for (const prev of previous) {
    const prevMetric = getMetric(prev, metric);
    if (!Number.isFinite(prevMetric)) {
      unmatchedPrevious.push(prev);
      continue;
    }

    let bestIndex: number | null = null;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (const index of available) {
      const curr = current[index];
      const currMetric = getMetric(curr, metric);
      if (!Number.isFinite(currMetric)) continue;
      const diff = Math.abs(prevMetric - currMetric);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = index;
      }
    }

    if (bestIndex !== null && bestDiff <= tolerance) {
      matches.push({ previous: prev, current: current[bestIndex] });
      available.delete(bestIndex);
    } else {
      unmatchedPrevious.push(prev);
    }
  }

  const unmatchedCurrent = Array.from(available).map((index) => current[index]);

  return { matches, unmatchedPrevious, unmatchedCurrent };
}
