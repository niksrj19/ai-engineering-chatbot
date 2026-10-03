export interface RankedItem {
  id: string;
}

export interface FusionResult {
  id: string;
  score: number;
}

export interface RRFOptions {
  k: number;
}

export function reciprocalRankFusion(
  resultLists: RankedItem[][],
  options: RRFOptions
): FusionResult[] {
  const scores =
    new Map<string, number>();

  for (
    const results of resultLists
  ) {
    for (
      let index = 0;
      index < results.length;
      index++
    ) {
      const item =
        results[index];

      const rank =
        index + 1;

      const contribution =
        1 /
        (options.k + rank);

      scores.set(
        item.id,
        (scores.get(item.id) ?? 0) +
          contribution
      );
    }
  }

  return Array.from(
    scores.entries()
  )
    .map(([id, score]) => ({
      id,
      score,
    }))
    .sort(
      (a, b) =>
        b.score - a.score
    );
}