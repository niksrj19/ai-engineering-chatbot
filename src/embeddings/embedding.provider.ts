export interface EmbeddingUsage {
  inputTokens: number;
}

export interface EmbeddingResponse {
  vector: number[];
  model: string;
  usage?: EmbeddingUsage;
}

export interface EmbeddingProvider {
  embed(
    text: string,
    signal?: AbortSignal
  ): Promise<EmbeddingResponse>;

  embedBatch(
    texts: string[],
    signal?: AbortSignal
  ): Promise<EmbeddingResponse[]>;
}