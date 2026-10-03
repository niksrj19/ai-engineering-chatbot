import {
  MockEmbeddingProvider,
} from "../embeddings/mock.embedding.provider.js";

import {
  EmbeddingService,
} from "../services/embedding.service.js";

import {
  InMemoryVectorRepository,
} from "../vector/in-memory-vector.repository.js";

import {
  RetrievalService,
} from "../services/retrieval.service.js";

import {
  ChunkingService,
} from "../ingestion/chunking.service.js";

import {
  DocumentIngestionService,
} from "../ingestion/document-ingestion.service.js";

import {
  ContextAssemblyService,
} from "./context-assembly.service.js";

import {
  RAGService,
} from "./rag.service.js";

import {
  MockReranker,
} from "../reranking/mock.reranker.js";

import {
  RerankingService,
} from "../services/reranking.service.js";

import {
  RAGPipelineService,
} from "./rag-pipeline.service.js";

async function main(): Promise<void> {
  const embeddingProvider =
    new MockEmbeddingProvider();

  const embeddingService =
    new EmbeddingService(
      embeddingProvider
    );

  const vectorRepository =
    new InMemoryVectorRepository();

  const chunkingService =
    new ChunkingService({
      chunkSize: 150,
      chunkOverlap: 30,
    });

  const ingestionService =
    new DocumentIngestionService(
      chunkingService,
      embeddingService,
      vectorRepository
    );

  const retrievalService =
    new RetrievalService(
      embeddingService,
      vectorRepository
    );

  const reranker =
  new MockReranker();

const rerankingService =
  new RerankingService(
    reranker
  );

  const contextAssemblyService =
    new ContextAssemblyService({
      maxChunks: 3,
      maxCharacters: 3000,
    });

    const ragPipeline =
  new RAGPipelineService(
    retrievalService,
    rerankingService,
    contextAssemblyService
  );

  const ragService =
  new RAGService(
    ragPipeline
  );

  // const ragService =
  //   new RAGService(
  //     retrievalService,
  //     contextAssemblyService
  //   );

  await ingestionService.ingest({
    id: "delivery-policy",
    content: `
      Customers can track their grocery delivery
      from the order tracking page.

      Orders that are already out for delivery
      cannot normally be cancelled.

      If an order is delayed, customers can contact
      customer support for assistance.

      Delivery estimates may change depending on
      traffic, weather, and delivery availability.
    `,
    metadata: {
      source: "delivery-policy",
      category: "delivery",
    },
  });

 const context =
  await ragService.retrieveContext(
    "What happens if my delivery is delayed?",
    {
      topK: 5,
      minScore: 0.5,

      rerankTopK: 3,

      rerankMinScore: 0.25,

      filter: {
        category: "delivery",
      },
    }
  );

  console.log(
    "\nHas relevant context:",
    context.hasRelevantContext
  );

  console.log(
    "\nRetrieved Context:\n"
  );

  console.log(
    context.formattedContext
  );
}

main().catch(error => {
  console.error(
    "RAG demo failed:",
    error
  );

  process.exit(1);
});