import {
  HybridSearchService,
  HybridSearchResult,
} from "../hybrid/hybrid-search.service.js";

import {
  QueryTransformationService,
} from "../query/query-transformation.service.js";

import {
  RerankingService,
} from "./reranking.service.js";

import {
  ParentExpansionService,
} from "./parent-expansion.service.js";

import {
  ContextCompressionService,
} from "./context-compression.service.js";

import {
  RAGDecisionService,
} from "./rag-decision.service.js";

import {
  RAGOrchestrationRequest,
  RAGOrchestrationResult,
} from "./rag-orchestrator.types.js";

import {
  VectorSearchResult,
} from "../vector/vector.types.js";

export class RAGOrchestratorService {
  constructor(
    private readonly decisionService:
      RAGDecisionService,

    private readonly queryTransformationService:
      QueryTransformationService,

    private readonly hybridSearchService:
      HybridSearchService,

    private readonly rerankingService:
      RerankingService,

    private readonly parentExpansionService:
      ParentExpansionService,

    private readonly contextCompressionService:
      ContextCompressionService
  ) {}

  async retrieve(
    request: RAGOrchestrationRequest
  ): Promise<RAGOrchestrationResult> {

     const transformed =
      await this.queryTransformationService.transform({
        query: request.query,
        conversation:
          request.conversation,
      });

       const queries = [
      transformed.rewrittenQuery,
      ...transformed.alternativeQueries,
    ];

    const decision =
  this.decisionService.decide({
    query: transformed.rewrittenQuery,
    mode: request.mode,
  });
    if (!decision.shouldRetrieve) {
  return {
    shouldRetrieve: false,
    reason: decision.reason,
    originalQuery: request.query,
    rewrittenQuery:
      transformed.rewrittenQuery,
    alternativeQueries:
      transformed.alternativeQueries,
    results: [],
    formattedContext: "",
    hasRelevantContext: false,
  };
}

  
    const uniqueQueries =
      Array.from(
        new Set(
          queries.filter(Boolean)
        )
      );

    const searchResults =
      await Promise.all(
        uniqueQueries.map(query =>
          this.hybridSearchService.search(
            query,
            {
              vectorTopK:
                request.topK,

              keywordTopK:
                request.topK,

              finalTopK:
                request.topK,

              filter:
                request.filter,
            }
          )
        )
      );

    const mergedResults =
      this.mergeSearchResults(
        searchResults.flat()
      );

    /*
     * RerankingService currently works with
     * VectorSearchResult[].
     *
     * HybridSearchService returns HybridSearchResult[].
     *
     * We therefore adapt the hybrid result into the
     * existing reranking contract.
     *
     * The fusion score becomes the ranking score because
     * RRF is the score that represents the combined
     * vector + keyword ranking.
     */
    const rerankingResults:
      VectorSearchResult[] =
      mergedResults.map(result => ({
        record: result.record,
        score: result.fusionScore,
      }));

    const reranked =
      await this.rerankingService.rerank(
        transformed.rewrittenQuery,
        rerankingResults,
        {
          topK:
            request.rerankTopK,

          minScore:
            request.rerankMinScore,
        }
      );

    const expanded =
      await this.parentExpansionService.expand(
        reranked
      );

    const compressed =
      this.contextCompressionService.compress(
        expanded
      );

    return {
      shouldRetrieve: true,

      reason: decision.reason,

      originalQuery:
        request.query,

      rewrittenQuery:
        transformed.rewrittenQuery,

      alternativeQueries:
        transformed.alternativeQueries,

      results:
        compressed.results,

      formattedContext:
        compressed.formattedContext,

      hasRelevantContext:
        compressed.results.length > 0,
    };
  }

  private mergeSearchResults(
    results: HybridSearchResult[]
  ): HybridSearchResult[] {
    const byId =
      new Map<string, HybridSearchResult>();

    for (const result of results) {
      const existing =
        byId.get(result.record.id);

      if (
        !existing ||
        result.fusionScore >
          existing.fusionScore
      ) {
        byId.set(
          result.record.id,
          result
        );
      }
    }

    return Array.from(
      byId.values()
    ).sort(
      (a, b) =>
        b.fusionScore -
        a.fusionScore
    );
  }
}