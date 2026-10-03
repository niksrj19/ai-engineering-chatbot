import {
  RetrievalService,
  RetrievalOptions,
} from "../services/retrieval.service.js";

import {
  RerankingService,
} from "../services/reranking.service.js";

import {
  ContextAssemblyService,
} from "./context-assembly.service.js";

import {
  RAGSearchResult,
} from "./rag-search.types.js";

export interface RAGPipelineOptions
  extends RetrievalOptions {
  rerankTopK: number;
  rerankMinScore?: number;
}

export interface RAGPipelineResult {
  results: RAGSearchResult[];
  formattedContext: string;
  hasRelevantContext: boolean;
}

export class RAGPipelineService {
  constructor(
    private readonly retrievalService:
      RetrievalService,

    private readonly rerankingService:
      RerankingService,

    private readonly contextAssemblyService:
      ContextAssemblyService
  ) {}

  async retrieve(
    query: string,
    options: RAGPipelineOptions
  ): Promise<RAGPipelineResult> {
    const vectorResults =
      await this.retrievalService.retrieve(
        query,
        {
          topK: options.topK,
          minScore:
            options.minScore,
          filter:
            options.filter,
        }
      );

    if (
      vectorResults.length === 0
    ) {
      return {
        results: [],
        formattedContext: "",
        hasRelevantContext: false,
      };
    }

    const rerankedResults =
      await this.rerankingService.rerank(
        query,
        vectorResults,
        {
          topK:
            options.rerankTopK,

          minScore:
            options.rerankMinScore,
        }
      );

    const formattedContext =
      this.contextAssemblyService.assemble(
        rerankedResults
      );

    return {
      results:
        rerankedResults,

      formattedContext,

      hasRelevantContext:
        rerankedResults.length >
          0 &&
        formattedContext.length >
          0,
    };
  }
}