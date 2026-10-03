import {
  VectorRecord,
} from "../vector/vector.types.js";

export interface RAGSearchResult {
  record: VectorRecord;

  /**
   * Score returned by the vector retrieval stage.
   */
  vectorScore: number;

  /**
   * Score returned by the reranking stage.
   */
  rerankScore?: number;
}