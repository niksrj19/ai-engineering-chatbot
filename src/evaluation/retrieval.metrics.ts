export function recallAtK(
  retrievedIds: string[],
  relevantIds: string[],
  k: number
): number {
  if (
    relevantIds.length === 0
  ) {
    return 0;
  }

  const retrieved =
    new Set(
      retrievedIds.slice(0, k)
    );

  const relevantCount =
    relevantIds.filter(id =>
      retrieved.has(id)
    ).length;

  return (
    relevantCount /
    relevantIds.length
  );
}

export function precisionAtK(
  retrievedIds: string[],
  relevantIds: string[],
  k: number
): number {
  const topK =
    retrievedIds.slice(0, k);

  if (
    topK.length === 0
  ) {
    return 0;
  }

  const relevant =
    new Set(relevantIds);

  const relevantCount =
    topK.filter(id =>
      relevant.has(id)
    ).length;

  return (
    relevantCount /
    topK.length
  );
}

export function reciprocalRank(
  retrievedIds: string[],
  relevantIds: string[]
): number {
  const relevant =
    new Set(relevantIds);

  for (
    let index = 0;
    index < retrievedIds.length;
    index++
  ) {
    if (
      relevant.has(
        retrievedIds[index]
      )
    ) {
      return 1 / (index + 1);
    }
  }

  return 0;
}