import express from "express";

import {
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
  errorMiddleware,
} from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

/*
 * --------------------------------------------------
 * Provider
 * --------------------------------------------------
 */

const provider =
  new GroqAIProvider(
    env.groqApiKey,
    env.groqModel
  );

/*
 * --------------------------------------------------
 * LLM Service
 * --------------------------------------------------
 */

const llmService =
  new LLMService(
    provider,
    env.retry
  );

/*
 * --------------------------------------------------
 * Repository
 * --------------------------------------------------
 */

const conversationRepository =
  new InMemoryConversationRepository();

/*
 * --------------------------------------------------
 * Token Service
 * --------------------------------------------------
 */

const tokenService =
  new TokenService();

/*
 * --------------------------------------------------
 * Context Service
 * --------------------------------------------------
 */

const contextService =
  new ContextService(
    env.tokenBudget,
    tokenService
  );

/*
 * --------------------------------------------------
 * Cost Service
 * --------------------------------------------------
 */

const costService =
  new CostService();

/*
 * --------------------------------------------------
 * Chat Service
 * --------------------------------------------------
 */

const chatService =
  new ChatService(
    llmService,
    conversationRepository,
    contextService,
    tokenService,
    costService
  );

/*
 * --------------------------------------------------
 * Controller
 * --------------------------------------------------
 */

const chatController =
  new ChatController(
    chatService
  );

/*
 * --------------------------------------------------
 * Routes
 * --------------------------------------------------
 */

app.use(
  "/api",
  createChatRoutes(
    chatController
  )
);

/*
 * --------------------------------------------------
 * Error Middleware
 * --------------------------------------------------
 */

app.use(
  errorMiddleware
);

app.listen(
  env.port,
  () => {
    console.log(
      `AI server running on port ${env.port}`
    );
  }
);