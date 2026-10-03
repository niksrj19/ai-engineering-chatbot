import {
  VectorRecord,
} from "../vector/vector.types.js";

export interface EvaluationQuery {
  id: string;

  question: string;

  /**
   * Documents/chunks known to be relevant
   * for this question.
   */
  relevantDocumentIds: string[];
}

export interface RetrievalEvaluationResult {
  queryId: string;

  recallAtK: number;

  precisionAtK: number;

  reciprocalRank: number;
}

export interface RAGEvaluationResult {
  retrieval: RetrievalEvaluationResult[];

  averageRecallAtK: number;

  averagePrecisionAtK: number;

  meanReciprocalRank: number;
}