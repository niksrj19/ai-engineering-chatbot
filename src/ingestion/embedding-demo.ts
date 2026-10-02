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
} from "./chunking.service.js";

import {
  DocumentIngestionService,
} from "./document-ingestion.service.js";

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
      chunkSize: 120,
      chunkOverlap: 20,
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

  const document = {
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
  };

  const result =
    await ingestionService.ingest(
      document
    );

  console.log(
    "Ingestion result:",
    result
  );

  const weatherDocument = {
  id: "weather-policy",
  content: `
    Delivery availability can be affected
    by severe weather conditions.

    Customers may receive updated delivery
    estimates during periods of heavy rain.
  `,
  metadata: {
    source: "weather-policy",
    category: "weather",
  },
};

await ingestionService.ingest(
  weatherDocument
);



const searchResults =
  await retrievalService.retrieve(
    "Can I cancel my delivery?",
    {
      topK: 3,
      minScore: 0.50,
      filter: {
        category: "delivery",
      },
    }
  );

  console.log(
    "\nSearch results:"
  );

  for (const result of searchResults) {
    console.log({
      score: result.score,
      content:
        result.record.content,
    });
  }
}

main().catch(error => {
  console.error(
    "Embedding demo failed:",
    error
  );

  process.exit(1);
});