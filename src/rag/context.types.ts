import {
  VectorSearchResult,
} from "../vector/vector.types.js";

export interface RetrievedContext {
  results: VectorSearchResult[];
  formattedContext: string;
  hasRelevantContext: boolean;
}