import {
  EmbeddingProvider,
  EmbeddingResponse,
} from "./embedding.provider.js";

export class MockEmbeddingProvider
  implements EmbeddingProvider
{
  private readonly dimensions = 16;

  async embed(
    text: string
  ): Promise<EmbeddingResponse> {
    return {
      vector: this.generateVector(text),
      model: "mock-embedding-model",
      usage: {
        inputTokens:
          Math.ceil(text.length / 4),
      },
    };
  }

  async embedBatch(
    texts: string[]
  ): Promise<EmbeddingResponse[]> {
    return Promise.all(
      texts.map(text =>
        this.embed(text)
      )
    );
  }

  private generateVector(
    text: string
  ): number[] {
    const vector =
      new Array<number>(
        this.dimensions
      ).fill(0);

    const normalized =
      text.toLowerCase();

    for (
      let i = 0;
      i < normalized.length;
      i++
    ) {
      const charCode =
        normalized.charCodeAt(i);

      const index =
        charCode % this.dimensions;

      vector[index] += 1;
    }

    return this.normalize(vector);
  }

  private normalize(
    vector: number[]
  ): number[] {
    const magnitude =
      Math.sqrt(
        vector.reduce(
          (sum, value) =>
            sum + value * value,
          0
        )
      );

    if (magnitude === 0) {
      return vector;
    }

    return vector.map(
      value => value / magnitude
    );
  }
}