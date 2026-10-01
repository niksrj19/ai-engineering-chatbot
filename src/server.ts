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
import { MockLLMProvider } from "./providers/mock.provider.js";
import { ToolAuthorizationService } from "./tools/tool.authorization.js";
import { OrderResponseValidator } from "./services/order-response.validator.js";
import { StructuredOutputService } from "./services/structured-output.service.js";
import { InputGuardrailService } from "./services/input-guardrail.service.js";

const app = express();

app.use(express.json());

const inputGuardrailService =
  new InputGuardrailService();

const toolRegistry =
  new ToolRegistry();

toolRegistry.register(
  getOrderStatusTool
);

const toolAuthorization =
  new ToolAuthorizationService();


const toolExecutor =
  new ToolExecutor(
    toolRegistry , toolAuthorization
  );

/*
 * --------------------------------------------------
 * Provider
 * --------------------------------------------------
 */

const provider = new MockLLMProvider();

// const provider =
//   new GroqAIProvider(
//     env.groqApiKey,
//     env.groqModel
//   );

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


const structuredOutputService =
  new StructuredOutputService();

  const orderResponseValidator =
  new OrderResponseValidator();

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
    costService,
    toolRegistry,
    toolExecutor,
    structuredOutputService,
    orderResponseValidator,
    inputGuardrailService
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