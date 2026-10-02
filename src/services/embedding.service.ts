import {
  EmbeddingProvider,
  EmbeddingResponse,
} from "../embeddings/embedding.provider.js";

export class EmbeddingService {
  constructor(
    private readonly provider:
      EmbeddingProvider
  ) {}

  async embed(
    text: string,
    signal?: AbortSignal
  ): Promise<EmbeddingResponse> {
    if (!text.trim()) {
      throw new Error(
        "Text cannot be empty"
      );
    }

    return this.provider.embed(
      text,
      signal
    );
  }

  async embedBatch(
    texts: string[],
    signal?: AbortSignal
  ): Promise<EmbeddingResponse[]> {
    if (texts.length === 0) {
      return [];
    }

    return this.provider.embedBatch(
      texts,
      signal
    );
  }
}