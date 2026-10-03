export interface RerankCandidate {
  id: string;
  content: string;
  metadata?: Record<
    string,
    string | number | boolean
  >;
}

export interface RerankResult {
  id: string;
  score: number;
}

export interface Reranker {
  rerank(
    query: string,
    candidates: RerankCandidate[]
  ): Promise<RerankResult[]>;
}