import {
  SourceDocument,
  DocumentChunk,
} from "./document.types";

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export class ChunkingService {
  constructor(
    private readonly options: ChunkingOptions
  ) {
    if (
      options.chunkSize <= 0
    ) {
      throw new Error(
        "chunkSize must be greater than 0"
      );
    }

    if (
      options.chunkOverlap < 0
    ) {
      throw new Error(
        "chunkOverlap cannot be negative"
      );
    }

    if (
      options.chunkOverlap >=
      options.chunkSize
    ) {
      throw new Error(
        "chunkOverlap must be smaller than chunkSize"
      );
    }
  }

  chunk(
    document: SourceDocument
  ): DocumentChunk[] {
    const content =
      document.content.trim();

    if (!content) {
      return [];
    }

    const chunks: DocumentChunk[] = [];

    let start = 0;
    let chunkIndex = 0;

    const step =
      this.options.chunkSize -
      this.options.chunkOverlap;

    while (
      start < content.length
    ) {
      const end = Math.min(
        start +
          this.options.chunkSize,
        content.length
      );

      const chunkContent =
        content
          .slice(start, end)
          .trim();

      if (chunkContent) {
        chunks.push({
          id: `${document.id}-chunk-${chunkIndex}`,
          documentId: document.id,
          content: chunkContent,
          chunkIndex,
          metadata: {
            ...document.metadata,
          },
        });
      }

      start += step;
      chunkIndex += 1;
    }

    return chunks;
  }
}