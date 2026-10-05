export interface SourceDocument {
  id: string;

  content: string;

  metadata?: Record<
    string,
    string | number | boolean
  >;
}

export interface ParentChunk {
  id: string;

  documentId: string;

  content: string;

  parentIndex: number;

  metadata?: Record<
    string,
    string | number | boolean
  >;
}