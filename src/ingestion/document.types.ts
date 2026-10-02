export interface SourceDocument {
  id: string;
  content: string;
  metadata?: Record<
    string,
    string | number | boolean
  >;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata?: Record<
    string,
    string | number | boolean
  >;
}