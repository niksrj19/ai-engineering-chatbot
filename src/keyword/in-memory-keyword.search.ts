import {
  KeywordSearch,
  KeywordSearchOptions,
  KeywordSearchResult,
} from "./keyword.search.js";

import {
  VectorRecord,
} from "../vector/vector.types.js";

export class InMemoryKeywordSearch
  implements KeywordSearch
{
  private readonly records =
    new Map<string, VectorRecord>();

  async index(
    record: VectorRecord
  ): Promise<void> {
    this.records.set(
      record.id,
      record
    );
  }

  async search(
    query: string,
    options: KeywordSearchOptions
  ): Promise<KeywordSearchResult[]> {
    if (
      options.topK <= 0
    ) {
      return [];
    }

    const queryTerms =
      tokenize(query);

    if (
      queryTerms.length === 0
    ) {
      return [];
    }

    const results =
      Array.from(
        this.records.values()
      )
        .filter(record =>
          matchesFilter(
            record,
            options.filter
          )
        )
        .map(record => {
          const documentTerms =
            tokenize(
              record.content
            );

          const score =
            calculateKeywordScore(
              queryTerms,
              documentTerms
            );

          return {
            record,
            score,
          };
        })
        .filter(result =>
          result.score > 0
        )
        .sort(
          (a, b) =>
            b.score - a.score
        );

    return results.slice(
      0,
      options.topK
    );
  }
}

function tokenize(
  text: string
): string[] {
  return text
    .toLowerCase()
    .replace(
      /[^a-z0-9\s-_]/g,
      " "
    )
    .split(/\s+/)
    .filter(Boolean);
}

function calculateKeywordScore(
  queryTerms: string[],
  documentTerms: string[]
): number {
  if (
    queryTerms.length === 0
  ) {
    return 0;
  }

  const documentTermSet =
    new Set(documentTerms);

  let matches = 0;

  for (
    const term of queryTerms
  ) {
    if (
      documentTermSet.has(term)
    ) {
      matches++;
    }
  }

  return (
    matches /
    queryTerms.length
  );
}

function matchesFilter(
  record: VectorRecord,
  filter:
    | Record<
        string,
        string | number | boolean
      >
    | undefined
): boolean {
  if (!filter) {
    return true;
  }

  if (!record.metadata) {
    return false;
  }

  return Object.entries(
    filter
  ).every(
    ([key, expectedValue]) =>
      record.metadata?.[key] ===
      expectedValue
  );
}