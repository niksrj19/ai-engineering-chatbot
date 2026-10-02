import {
  VectorRepository,
  VectorSearchOptions,
} from "./vector.repository.js";

import {
  VectorRecord,
  VectorSearchResult,
  VectorMetadata,
} from "./vector.types.js";

import {
  cosineSimilarity,
} from "./vector-similarity.js";

export class InMemoryVectorRepository
  implements VectorRepository
{
  private readonly records =
    new Map<string, VectorRecord>();

  async upsert(
    record: VectorRecord
  ): Promise<void> {
    this.records.set(
      record.id,
      record
    );
  }

  async search(
    queryVector: number[],
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    if (options.topK <= 0) {
      return [];
    }

    const filteredRecords =
      Array.from(
        this.records.values()
      ).filter(record =>
        matchesFilter(
          record.metadata,
          options.filter
        )
      );

    const results =
      filteredRecords
        .map(record => ({
          record,
          score: cosineSimilarity(
            queryVector,
            record.vector
          ),
        }))
        .filter(result => {
          if (
            options.minScore ===
            undefined
          ) {
            return true;
          }

          return (
            result.score >=
            options.minScore
          );
        })
        .sort(
          (a, b) =>
            b.score - a.score
        );

    return results.slice(
      0,
      options.topK
    );
  }

  async delete(
    id: string
  ): Promise<void> {
    this.records.delete(id);
  }
}

function matchesFilter(
  metadata: VectorMetadata | undefined,
  filter: VectorMetadata | undefined
): boolean {
  if (!filter) {
    return true;
  }

  if (!metadata) {
    return false;
  }

  return Object.entries(
    filter
  ).every(
    ([key, expectedValue]) =>
      metadata[key] ===
      expectedValue
  );
}