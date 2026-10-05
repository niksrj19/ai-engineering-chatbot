import express from "express";

import {
  ToolRegistry,
} from "./tools/tool.registry.js";

import {
  ToolExecutor,
} from "./tools/tool.executor.js";

import {
  getOrderStatusTool,
} from "./tools/tools/get-order-status.tool.js";

import {
  aiBudget,
  env,
} from "./config/env.js";

import { GroqAIProvider } from "./providers/groqai.provider.js";

import {
  LLMService,
} from "./services/llm.service.js";

import {
  ChatService,
} from "./services/chat.service.js";

import {
  ContextService,
} from "./services/context.service.js";

import {
  TokenService,
} from "./services/token.service.js";

import {
  CostService,
} from "./services/cost.service.js";

import {
  InMemoryConversationRepository,
} from "./repositories/in-memory-conversation.repository.js";

import {
  ChatController,
} from "./controllers/chat.controller.js";

import {
  createChatRoutes,
} from "./routes/chat.routes.js";

import {
  CircuitBreaker,
} from "./services/circuit-breaker.service.js";

import {
  errorMiddleware,
} from "./middleware/error.middleware.js";

import {
  MockLLMProvider,
} from "./providers/mock.provider.js";

import {
  ToolAuthorizationService,
} from "./tools/tool.authorization.js";

import {
  OrderResponseValidator,
} from "./services/order-response.validator.js";

import {
  StructuredOutputService,
} from "./services/structured-output.service.js";

import {
  InputGuardrailService,
} from "./services/input-guardrail.service.js";

import {
  AIBudgetService,
} from "./services/ai-budget.service.js";

/*
 * --------------------------------------------------
 * RAG imports
 * --------------------------------------------------
 */

import {
  RAGOrchestratorService,
} from "./rag/rag-orchestrator.service.js";

import {
  ContextCompressionService,
} from "./rag/context-compression.service.js";

import {
  ParentExpansionService,
} from "./rag/parent-expansion.service.js";

import {
  RerankingService,
} from "./rag/reranking.service.js";

import {
  HybridSearchService,
} from "./hybrid/hybrid-search.service.js";

import {
  QueryTransformationService,
} from "./query/query-transformation.service.js";

import {
  RAGDecisionService,
} from "./rag/rag-decision.service.js";

/*
 * --------------------------------------------------
 * Embedding / Vector / Search imports
 * --------------------------------------------------
 */

import {
  EmbeddingService,
} from "./services/embedding.service.js";

import {
  MockEmbeddingProvider,
} from "./embeddings/mock.embedding.provider.js";

import {
  InMemoryVectorRepository,
} from "./vector/in-memory-vector.repository.js";

import {
  RetrievalService,
} from "./services/retrieval.service.js";

import {
  InMemoryKeywordSearch,
} from "./keyword/in-memory-keyword.search.js";

import {
  MockReranker,
} from "./reranking/mock.reranker.js";

import {
  InMemoryParentRepository,
} from "./ingestion/in-memory-parent.repository.js";

import { MockQueryTransformer } from "./query/mock.query-transformer.js";


const app = express();

app.use(express.json());


/*
 * ==================================================
 * EMBEDDING / VECTOR SEARCH
 * ==================================================
 */

/*
 * Embedding provider
 *
 * This is currently the deterministic mock provider
 * used for learning/testing the RAG architecture.
 */
const embeddingProvider =
  new MockEmbeddingProvider();

/*
 * Embedding service
 */
const embeddingService =
  new EmbeddingService(
    embeddingProvider
  );

/*
 * Vector repository
 */
const vectorRepository =
  new InMemoryVectorRepository();

/*
 * Retrieval service
 *
 * Query
 *   ↓
 * EmbeddingService
 *   ↓
 * VectorRepository
 */
const retrievalService =
  new RetrievalService(
    embeddingService,
    vectorRepository
  );


/*
 * ==================================================
 * KEYWORD SEARCH
 * ==================================================
 */

const keywordSearch =
  new InMemoryKeywordSearch();


/*
 * ==================================================
 * QUERY TRANSFORMATION
 * ==================================================
 */

const queryTransformer =
  new MockQueryTransformer();

const queryTransformationService =
  new QueryTransformationService(
    queryTransformer
  );


/*
 * ==================================================
 * RERANKING
 * ==================================================
 */

const reranker =
  new MockReranker();

const rerankingService =
  new RerankingService(
    reranker
  );


/*
 * ==================================================
 * PARENT DOCUMENT RETRIEVAL
 * ==================================================
 */

const parentRepository =
  new InMemoryParentRepository();

const parentExpansionService =
  new ParentExpansionService(
    parentRepository
  );


/*
 * ==================================================
 * CONTEXT COMPRESSION
 * ==================================================
 */

const contextCompressionService =
  new ContextCompressionService({
    maxCharacters: 12_000,
    maxResults: 5,
  });


/*
 * ==================================================
 * RAG DECISION
 * ==================================================
 */

const ragDecisionService =
  new RAGDecisionService();


/*
 * ==================================================
 * HYBRID SEARCH
 * ==================================================
 */

const hybridSearchService =
  new HybridSearchService(
    retrievalService,
    keywordSearch
  );


/*
 * ==================================================
 * RAG ORCHESTRATOR
 * ==================================================
 *
 * Overall flow:
 *
 * User Query
 *     ↓
 * RAG Decision
 *     ↓
 * Query Transformation
 *     ↓
 * Hybrid Search
 *     ├── Vector Search
 *     └── Keyword Search
 *     ↓
 * RRF Fusion
 *     ↓
 * Reranking
 *     ↓
 * Parent Expansion
 *     ↓
 * Context Compression
 *     ↓
 * RAG Context
 *
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
 * INPUT GUARDRAIL
 * ==================================================
 */

const inputGuardrailService =
  new InputGuardrailService();


/*
 * ==================================================
 * TOOL REGISTRY
 * ==================================================
 */

const toolRegistry =
  new ToolRegistry();

toolRegistry.register(
  getOrderStatusTool
);


/*
 * ==================================================
 * TOOL AUTHORIZATION
 * ==================================================
 */

const toolAuthorization =
  new ToolAuthorizationService();


/*
 * ==================================================
 * TOOL EXECUTOR
 * ==================================================
 */

const toolExecutor =
  new ToolExecutor(
    toolRegistry,
    toolAuthorization
  );


/*
 * ==================================================
 * PROVIDER
 * ==================================================
 */

const provider =
  new MockLLMProvider();

/*
 * For Groq later:
 *
 * const provider =
 *   new GroqAIProvider(
 *     env.groqApiKey,
 *     env.groqModel
 *   );
 */


/*
 * ==================================================
 * CIRCUIT BREAKER
 * ==================================================
 */

const llmCircuitBreaker =
  new CircuitBreaker({
    failureThreshold: 3,

    resetTimeoutMs: 10_000,

    onStateChange: (
      previousState,
      nextState
    ) => {
      console.log(
        `[LLM Circuit Breaker] ${previousState} → ${nextState}`
      );
    },
  });


/*
 * ==================================================
 * LLM SERVICE
 * ==================================================
 */

const llmService =
  new LLMService(
    provider,
    env.retry,
    llmCircuitBreaker
  );


/*
 * ==================================================
 * CONVERSATION REPOSITORY
 * ==================================================
 */

const conversationRepository =
  new InMemoryConversationRepository();


/*
 * ==================================================
 * TOKEN SERVICE
 * ==================================================
 */

const tokenService =
  new TokenService();


/*
 * ==================================================
 * CONTEXT SERVICE
 * ==================================================
 */

const contextService =
  new ContextService(
    env.tokenBudget,
    tokenService
  );


/*
 * ==================================================
 * COST SERVICE
 * ==================================================
 */

const costService =
  new CostService();


/*
 * ==================================================
 * STRUCTURED OUTPUT
 * ==================================================
 */

const structuredOutputService =
  new StructuredOutputService();


const orderResponseValidator =
  new OrderResponseValidator();


/*
 * ==================================================
 * AI BUDGET SERVICE
 * ==================================================
 */

const aiBudgetService =
  new AIBudgetService(
    aiBudget
  );


/*
 * ==================================================
 * CHAT SERVICE
 * ==================================================
 *
 * ChatService now has access to:
 *
 * - LLM
 * - Conversation memory
 * - Context management
 * - Token management
 * - Cost management
 * - Tool registry
 * - Tool executor
 * - Structured output
 * - Business validation
 * - Input guardrails
 * - AI budget
 * - RAG orchestrator
 *
 */

const chatService =
  new ChatService(
    llmService,
    conversationRepository,
    contextService,
    tokenService,
    costService,
    toolRegistry,
    toolExecutor,
    structuredOutputService,
    orderResponseValidator,
    inputGuardrailService,
    aiBudgetService,
    ragOrchestrator
  );


/*
 * ==================================================
 * CONTROLLER
 * ==================================================
 */

const chatController =
  new ChatController(
    chatService
  );


/*
 * ==================================================
 * ROUTES
 * ==================================================
 */

app.use(
  "/api",
  createChatRoutes(
    chatController
  )
);


/*
 * ==================================================
 * ERROR MIDDLEWARE
 * ==================================================
 */

app.use(
  errorMiddleware
);


/*
 * ==================================================
 * SERVER
 * ==================================================
 */

app.listen(
  env.port,
  () => {
    console.log(
      `AI server running on port ${env.port}`
    );
  }
);