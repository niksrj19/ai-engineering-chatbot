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
  InMemoryKeywordSearch,
} from "../keyword/in-memory-keyword.search.js";

import {
  HybridSearchService,
} from "./hybrid-search.service.js";

async function main(): Promise<void> {
  const embeddingProvider =
    new MockEmbeddingProvider();

  const embeddingService =
    new EmbeddingService(
      embeddingProvider
    );

  const vectorRepository =
    new InMemoryVectorRepository();

  const retrievalService =
    new RetrievalService(
      embeddingService,
      vectorRepository
    );

  const keywordSearch =
    new InMemoryKeywordSearch();

  const documents = [
    {
      id: "doc-1",
      content:
        "Orders that are already out for delivery cannot normally be cancelled.",
      metadata: {
        category: "delivery",
      },
    },

    {
      id: "doc-2",
      content:
        "Customers can contact support when their delivery is delayed.",
      metadata: {
        category: "delivery",
      },
    },

    {
      id: "doc-3",
      content:
        "Order 12345 is currently out for delivery.",
      metadata: {
        category: "order",
      },
    },
  ];

  for (
    const document of documents
  ) {
    const embedding =
      await embeddingService.embed(
        document.content
      );

    const record = {
      id: document.id,
      content:
        document.content,
      vector:
        embedding.vector,
      metadata:
        document.metadata,
    };

    await vectorRepository.upsert(
      record
    );

    await keywordSearch.index(
      record
    );
  }

  const hybridSearch =
    new HybridSearchService(
      retrievalService,
      keywordSearch
    );

  const results =
    await hybridSearch.search(
      "What is the status of order 12345?",
      {
        vectorTopK: 5,
        keywordTopK: 5,
        finalTopK: 3,
        filter: {
          category: "order",
        },
      }
    );

  console.log(
    "\nHybrid Search Results:\n"
  );

  for (
    const result of results
  ) {
    console.log({
      id:
        result.record.id,

      content:
        result.record.content,

      vectorScore:
        result.vectorScore,

      keywordScore:
        result.keywordScore,

      fusionScore:
        result.fusionScore,
    });
  }
}

main().catch(error => {
  console.error(
    "Hybrid demo failed:",
    error
  );

  process.exit(1);
});