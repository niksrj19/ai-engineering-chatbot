import {
  RAGPipelineService,
  RAGPipelineOptions,
} from "./rag-pipeline.service.js";

import {
  RAGSearchResult,
} from "./rag-search.types.js";

export interface RetrievedContext {
  results: RAGSearchResult[];
  formattedContext: string;
  hasRelevantContext: boolean;
}

export class RAGService {
  constructor(
    private readonly ragPipeline:
      RAGPipelineService
  ) {}

  async retrieveContext(
    query: string,
    options: RAGPipelineOptions
  ): Promise<RetrievedContext> {
    return this.ragPipeline.retrieve(
      query,
      options
    );
  }
}