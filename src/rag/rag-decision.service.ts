import { RAGMode } from "./rag-mode.js";

export interface RAGDecisionRequest {
  query: string;
  mode: RAGMode;
}

export interface RAGDecision {
  shouldRetrieve: boolean;
  reason: string;
}

export class RAGDecisionService {
  decide(
    request: RAGDecisionRequest
  ): RAGDecision {
    if (request.mode === "disabled") {
      return {
        shouldRetrieve: false,
        reason: "RAG explicitly disabled",
      };
    }

    if (request.mode === "required") {
      return {
        shouldRetrieve: true,
        reason: "RAG explicitly required",
      };
    }

    return this.autoDecide(request.query);
  }

  private autoDecide(
    query: string
  ): RAGDecision {
    const normalizedQuery =
      query.toLowerCase();

    const knowledgeIndicators = [
      "policy",
      "documentation",
      "document",
      "company",
      "procedure",
      "process",
      "order",
      "delivery",
      "refund",
      "return",
      "internal",
    ];

    const shouldRetrieve =
      knowledgeIndicators.some(keyword =>
        normalizedQuery.includes(keyword)
      );

    return {
      shouldRetrieve,
      reason: shouldRetrieve
        ? "Query appears knowledge-oriented"
        : "Query does not require enterprise retrieval",
    };
  }
}