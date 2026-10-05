import {
  EmbeddingService,
} from "../services/embedding.service.js";

import {
  MockEmbeddingProvider,
} from "../embeddings/mock.embedding.provider.js";

import {
  InMemoryVectorRepository,
} from "../vector/in-memory-vector.repository.js";

import {
  RetrievalService,
} from "../services/retrieval.service.js";

import {
  InMemoryKeywordSearch,
} from "../keyword/in-memory-keyword.search.js";

import {MockQueryTransformer } from "../query/mock.query-transformer.js";

import {
  QueryTransformationService,
} from "../query/query-transformation.service.js";

import {
  MockReranker,
} from "../reranking/mock.reranker.js";

import {
  RerankingService,
} from "./reranking.service.js";

import {
  InMemoryParentRepository,
} from "../ingestion/in-memory-parent.repository.js";

import {
  ParentExpansionService,
} from "./parent-expansion.service.js";

import {
  ContextCompressionService,
} from "./context-compression.service.js";

import {
  HybridSearchService,
} from "../hybrid/hybrid-search.service.js";

import {
  RAGDecisionService,
} from "./rag-decision.service.js";

import {
  RAGOrchestratorService,
} from "./rag-orchestrator.service.js";

import {
  VectorRecord,
} from "../vector/vector.types.js";


async function main() {

  /*
   * --------------------------------------------------
   * 1. Embedding
   * --------------------------------------------------
   */

  const embeddingProvider =
    new MockEmbeddingProvider();

  const embeddingService =
    new EmbeddingService(
      embeddingProvider
    );


  /*
   * --------------------------------------------------
   * 2. Vector Repository
   * --------------------------------------------------
   */

  const vectorRepository =
    new InMemoryVectorRepository();


  /*
   * --------------------------------------------------
   * 3. Retrieval Service
   * --------------------------------------------------
   */

  const retrievalService =
    new RetrievalService(
      embeddingService,
      vectorRepository
    );


  /*
   * --------------------------------------------------
   * 4. Keyword Search
   * --------------------------------------------------
   */

  const keywordSearch =
    new InMemoryKeywordSearch();


  /*
   * --------------------------------------------------
   * 5. Query Transformation
   * --------------------------------------------------
   */

  const queryTransformer =
    new MockQueryTransformer();

  const queryTransformationService =
    new QueryTransformationService(
      queryTransformer
    );


  /*
   * --------------------------------------------------
   * 6. Reranking
   * --------------------------------------------------
   */

  const reranker =
    new MockReranker();

  const rerankingService =
    new RerankingService(
      reranker
    );


  /*
   * --------------------------------------------------
   * 7. Parent Repository
   * --------------------------------------------------
   */

  const parentRepository =
    new InMemoryParentRepository();

  const parentExpansionService =
    new ParentExpansionService(
      parentRepository
    );


  /*
   * --------------------------------------------------
   * 8. Context Compression
   * --------------------------------------------------
   */

  const contextCompressionService =
    new ContextCompressionService({
      maxCharacters: 12_000,
      maxResults: 5,
    });


  /*
   * --------------------------------------------------
   * 9. Hybrid Search
   * --------------------------------------------------
   */

  const hybridSearchService =
    new HybridSearchService(
      retrievalService,
      keywordSearch
    );


  /*
   * --------------------------------------------------
   * 10. RAG Decision
   * --------------------------------------------------
   */

  const ragDecisionService =
    new RAGDecisionService();


  /*
   * --------------------------------------------------
   * 11. RAG Orchestrator
   * --------------------------------------------------
   */

  const ragOrchestrator =
    new RAGOrchestratorService(
      ragDecisionService,
      queryTransformationService,
      hybridSearchService,
      rerankingService,
      parentExpansionService,
      contextCompressionService
    );


  /*
   * ==================================================
   * DOCUMENTS
   * ==================================================
   */

  const documents: VectorRecord[] = [

    {
      id: "doc-order-1",
      vector: [],
      content:
        "Orders can be cancelled before they are dispatched. Once an order is dispatched, cancellation may no longer be available.",
      metadata: {
        category: "orders",
        source: "order-policy",
      },
    },

    {
      id: "doc-delivery-1",
      vector: [],
      content:
        "Standard delivery usually takes between 2 and 5 business days.",
      metadata: {
        category: "delivery",
        source: "delivery-policy",
      },
    },

    {
      id: "doc-refund-1",
      vector: [],
      content:
        "Refunds are normally processed within 5 to 7 business days after cancellation is confirmed.",
      metadata: {
        category: "refund",
        source: "refund-policy",
      },
    },

    {
      id: "doc-order-12345",
      vector: [],
      content:
        "Order 12345 is currently out for delivery and is expected to arrive within approximately 30 minutes.",
      metadata: {
        category: "orders",
        source: "order-system",
      },
    },
  ];


  /*
   * --------------------------------------------------
   * 12. Generate embeddings + index
   * --------------------------------------------------
   */

  for (const document of documents) {

    const embedding =
      await embeddingService.embed(
        document.content
      );

    const record: VectorRecord = {
      ...document,
      vector: embedding.vector,
    };

    await vectorRepository.upsert(
      record
    );

    await keywordSearch.index(
      record
    );
  }


  /*
   * ==================================================
   * TEST 1
   * ==================================================
   */

  console.log(
    "\n=========================================="
  );

  console.log(
    "TEST 1: Order cancellation"
  );

  console.log(
    "=========================================="
  );


  const cancellationResult =
    await ragOrchestrator.retrieve({

      query:
        "Can I cancel my order?",

      mode: "auto",

      topK: 10,

      rerankTopK: 5,

      maxContextCharacters: 12_000,

      maxContextResults: 5,

    });


  console.log(
    "\nRAG RESULT:"
  );

  console.dir(
    cancellationResult,
    {
      depth: null,
    }
  );


  /*
   * ==================================================
   * TEST 2
   * ==================================================
   */

  console.log(
    "\n=========================================="
  );

  console.log(
    "TEST 2: Exact order lookup"
  );

  console.log(
    "=========================================="
  );


  const orderResult =
    await ragOrchestrator.retrieve({

      query:
        "Where is order 12345?",

      mode: "auto",

      topK: 10,

      rerankTopK: 5,

      maxContextCharacters: 12_000,

      maxContextResults: 5,

    });


  console.log(
    "\nRAG RESULT:"
  );

  console.dir(
    orderResult,
    {
      depth: null,
    }
  );


  /*
   * ==================================================
   * TEST 3
   * ==================================================
   */

  console.log(
    "\n=========================================="
  );

  console.log(
    "TEST 3: Follow-up query"
  );

  console.log(
    "=========================================="
  );


  const followUpResult =
    await ragOrchestrator.retrieve({

      query:
        "When will it arrive?",

      mode: "auto",

      topK: 10,

      rerankTopK: 5,

      maxContextCharacters: 12_000,

      maxContextResults: 5,

      conversation: [

        {
          role: "user",
          content:
            "Where is order 12345?",
        },

        {
          role: "assistant",
          content:
            "Your order is currently out for delivery.",
        },

      ],

    });


  console.log(
    "\nRAG RESULT:"
  );

  console.dir(
    followUpResult,
    {
      depth: null,
    }
  );


  /*
   * ==================================================
   * TEST 4
   * ==================================================
   */

  console.log(
    "\n=========================================="
  );

  console.log(
    "TEST 4: RAG disabled"
  );

  console.log(
    "=========================================="
  );


  const disabledResult =
    await ragOrchestrator.retrieve({

      query:
        "What is our delivery policy?",

      mode: "disabled",

      topK: 10,

      rerankTopK: 5,

      maxContextCharacters: 12_000,

      maxContextResults: 5,

    });


  console.log(
    "\nRAG RESULT:"
  );

  console.dir(
    disabledResult,
    {
      depth: null,
    }
  );


  console.log(
    "\n=========================================="
  );

  console.log(
    "RAG ORCHESTRATOR TESTS COMPLETED"
  );

  console.log(
    "==========================================\n"
  );
}


main().catch(
  error => {

    console.error(
      "RAG demo failed:",
      error
    );

    process.exit(1);
  }
);