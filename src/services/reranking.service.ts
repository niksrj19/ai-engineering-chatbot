import {
  Reranker,
  RerankCandidate,
} from "../reranking/reranker.js";

import {
  VectorSearchResult,
} from "../vector/vector.types.js";

import {
  RAGSearchResult,
} from "../rag/rag-search.types.js";

export interface RerankingOptions {
  topK: number;
  minScore?: number;
}

export class RerankingService {
  constructor(
    private readonly reranker:
      Reranker
  ) {}

  async rerank(
    query: string,
    results: VectorSearchResult[],
    options: RerankingOptions
  ): Promise<RAGSearchResult[]> {
    if (results.length === 0) {
      return [];
    }

    if (options.topK <= 0) {
      throw new Error(
        "topK must be greater than 0"
      );
    }

    const candidates:
      RerankCandidate[] =
      results.map(result => ({
        id: result.record.id,
        content:
          result.record.content,
        metadata:
          result.record.metadata,
      }));

    const reranked =
      await this.reranker.rerank(
        query,
        candidates
      );

    const resultMap =
      new Map(
        results.map(result => [
          result.record.id,
          result,
        ])
      );

    return reranked
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
      .slice(0, options.topK)
      .map(result => {
        const original =
          resultMap.get(result.id);

        if (!original) {
          throw new Error(
            `Reranker returned unknown candidate: ${result.id}`
          );
        }

        return {
          record: original.record,
          vectorScore:
            original.score,
          rerankScore:
            result.score,
        };
      });
  }
}