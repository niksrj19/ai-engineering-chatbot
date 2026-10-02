import {
  SourceDocument,
} from "./document.types.js";

import {
  ChunkingService,
} from "./chunking.service.js";

import {
  EmbeddingService,
} from "../services/embedding.service.js";

import {
  VectorRepository,
} from "../vector/vector.repository.js";

export class DocumentIngestionService {
  constructor(
    private readonly chunkingService:
      ChunkingService,

    private readonly embeddingService:
      EmbeddingService,

    private readonly vectorRepository:
      VectorRepository
  ) {}

  async ingest(
    document: SourceDocument
  ): Promise<{
    documentId: string;
    chunksIndexed: number;
  }> {
    const chunks =
      this.chunkingService.chunk(
        document
      );

    if (chunks.length === 0) {
      return {
        documentId: document.id,
        chunksIndexed: 0,
      };
    }

    const embeddings =
      await this.embeddingService.embedBatch(
        chunks.map(
          chunk => chunk.content
        )
      );

    if (
      embeddings.length !==
      chunks.length
    ) {
      throw new Error(
        "Embedding count does not match chunk count"
      );
    }

    for (
      let i = 0;
      i < chunks.length;
      i++
    ) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      await this.vectorRepository.upsert({
        id: chunk.id,
        vector: embedding.vector,
        content: chunk.content,
        metadata: {
          ...chunk.metadata,
          documentId:
            chunk.documentId,
          chunkIndex:
            chunk.chunkIndex,
          embeddingModel:
            embedding.model,
        },
      });
    }

    return {
      documentId: document.id,
      chunksIndexed: chunks.length,
    };
  }
}