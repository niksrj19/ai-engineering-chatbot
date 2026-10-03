import {
  RetrievalService,
} from "../services/retrieval.service.js";

import {
  KeywordSearch,
} from "../keyword/keyword.search.js";

import {
  VectorSearchResult,
} from "../vector/vector.types.js";

import {
  reciprocalRankFusion,
} from "./reciprocal-rank-fusion.js";

export interface HybridSearchOptions {
  vectorTopK: number;
  keywordTopK: number;
  finalTopK: number;

  vectorMinScore?: number;

  filter?: Record<
    string,
    string | number | boolean
  >;
}

export interface HybridSearchResult {
  record: VectorSearchResult["record"];

  vectorScore?: number;

  keywordScore?: number;

  fusionScore: number;
}

export class HybridSearchService {
  constructor(
    private readonly retrievalService:
      RetrievalService,

    private readonly keywordSearch:
      KeywordSearch
  ) {}

  async search(
    query: string,
    options: HybridSearchOptions
  ): Promise<HybridSearchResult[]> {
    const [
      vectorResults,
      keywordResults,
    ] = await Promise.all([
      this.retrievalService.retrieve(
        query,
        {
          topK:
            options.vectorTopK,

          minScore:
            options.vectorMinScore,

          filter:
            options.filter,
        }
      ),

      this.keywordSearch.search(
        query,
        {
          topK:
            options.keywordTopK,

          filter:
            options.filter,
        }
      ),
    ]);

    const vectorRanked =
      vectorResults.map(
        result => ({
          id:
            result.record.id,
        })
      );

    const keywordRanked =
      keywordResults.map(
        result => ({
          id:
            result.record.id,
        })
      );

    const fused =
      reciprocalRankFusion(
        [
          vectorRanked,
          keywordRanked,
        ],
        {
          k: 60,
        }
      );

    const vectorMap =
      new Map(
        vectorResults.map(
          result => [
            result.record.id,
            result,
          ]
        )
      );

    const keywordMap =
      new Map(
        keywordResults.map(
          result => [
            result.record.id,
            result,
          ]
        )
      );

    const records =
      new Map<string, VectorSearchResult["record"]>();

    for (
      const result of vectorResults
    ) {
      records.set(
        result.record.id,
        result.record
      );
    }

    for (
      const result of keywordResults
    ) {
      records.set(
        result.record.id,
        result.record
      );
    }

    return fused
      .slice(
        0,
        options.finalTopK
      )
      .map(result => ({
        record:
          records.get(result.id)!,

        vectorScore:
          vectorMap.get(
            result.id
          )?.score,

        keywordScore:
          keywordMap.get(
            result.id
          )?.score,

        fusionScore:
          result.score,
      }));
  }
}