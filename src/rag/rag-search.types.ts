import { VectorRecord } from "../vector/vector.types.js";

export interface RAGSearchResult {
  record: VectorRecord;

  vectorScore?: number;

  keywordScore?: number;

  fusionScore?: number;

  rerankScore?: number;
}