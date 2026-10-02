import {
  VectorRecord,
  VectorSearchResult,
  VectorMetadata,
} from "./vector.types.js";

export interface VectorSearchOptions {
  topK: number;
  minScore?: number;
  filter?: VectorMetadata;
}

export interface VectorRepository {
  upsert(
    record: VectorRecord
  ): Promise<void>;

  search(
    queryVector: number[],
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]>;

  delete(
    id: string
  ): Promise<void>;
}