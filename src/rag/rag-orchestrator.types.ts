import { RAGSearchResult } from "./rag-search.types.js";

export interface RAGOrchestrationRequest {
  query: string;

  mode: "disabled" | "required" | "auto";

  topK: number;

  rerankTopK: number;

  rerankMinScore?: number;

  retrievalMinScore?: number;

  maxContextCharacters: number;

  maxContextResults: number;

  filter?: Record<
    string,
    string | number | boolean
  >;

  conversation?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface RAGOrchestrationResult {
  shouldRetrieve: boolean;

  reason: string;

  originalQuery: string;

  rewrittenQuery?: string;

  alternativeQueries?: string[];

  results: RAGSearchResult[];

  formattedContext: string;

  hasRelevantContext: boolean;
}