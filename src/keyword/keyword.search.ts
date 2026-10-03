import {
  VectorRecord,
} from "../vector/vector.types.js";

export interface KeywordSearchOptions {
  topK: number;

  filter?: Record<
    string,
    string | number | boolean
  >;
}

export interface KeywordSearchResult {
  record: VectorRecord;
  score: number;
}

export interface KeywordSearch {
  index(
    record: VectorRecord
  ): Promise<void>;

  search(
    query: string,
    options: KeywordSearchOptions
  ): Promise<KeywordSearchResult[]>;
}