import {
  EmbeddingService,
} from "./embedding.service.js";

import {
  VectorRepository,
  VectorSearchOptions,
} from "../vector/vector.repository.js";

import {
  VectorSearchResult,
} from "../vector/vector.types.js";

export interface RetrievalOptions {
  topK: number;
  minScore?: number;
  filter?: Record<
    string,
    string | number | boolean
  >;
}

export class RetrievalService {
  constructor(
    private readonly embeddingService:
      EmbeddingService,

    private readonly vectorRepository:
      VectorRepository
  ) {}

  async retrieve(
    query: string,
    options: RetrievalOptions
  ): Promise<VectorSearchResult[]> {
    if (!query.trim()) {
      throw new Error(
        "Query cannot be empty"
      );
    }

    if (
      options.topK <= 0
    ) {
      throw new Error(
        "topK must be greater than 0"
      );
    }

    if (
      options.minScore !==
        undefined &&
      (
        options.minScore < -1 ||
        options.minScore > 1
      )
    ) {
      throw new Error(
        "minScore must be between -1 and 1"
      );
    }

    const embedding =
      await this.embeddingService.embed(
        query
      );

    const searchOptions:
      VectorSearchOptions = {
        topK: options.topK,
        minScore:
          options.minScore,
        filter:
          options.filter,
      };

    return this.vectorRepository.search(
      embedding.vector,
      searchOptions
    );
  }
}