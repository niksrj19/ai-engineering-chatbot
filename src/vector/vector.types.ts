export type VectorMetadataValue =
  | string
  | number
  | boolean;

export interface VectorMetadata {
  [key: string]: VectorMetadataValue;
}

export interface VectorRecord {
  id: string;
  vector: number[];
  content: string;
  metadata?: VectorMetadata;
}

export interface VectorSearchResult {
  record: VectorRecord;
  score: number;
}