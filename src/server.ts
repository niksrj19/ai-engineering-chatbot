import express from "express";

import { env } from "./config/env.js";

import { OpenAIProvider } from "./providers/openai.provider.js";

import { GroqAIProvider } from "./providers/groqai.provider.js";

import { MockLLMProvider } from "./providers/mock.provider.js";

import { LLMService } from "./services/llm.service.js";

import { ChatService } from "./services/chat.service.js";

import { ChatController } from "./controllers/chat.controller.js";

import { createChatRoutes } from "./routes/chat.routes.js";

import { errorMiddleware } from "./middleware/error.middleware.js";

import {ContextService }  from "./services/context.service.js";

import { ConversationRepository } from "./repositories/conversation.repository.js";

import { InMemoryConversationRepository } from "./repositories/in-memory-conversation.repository.js";

const conversationRepository =
  new InMemoryConversationRepository();

const app = express();

app.use(express.json());

const provider =
  new GroqAIProvider(
    env.groqApiKey,
    env.groqModel
  );

// const provider = new MockLLMProvider();

const contextService = new ContextService({
  maxMessages: 10,
});

const llmService =
  new LLMService(
    provider,
    env.retry
  );

const chatService =
  new ChatService(llmService, conversationRepository, contextService);

const chatController =
  new ChatController(chatService);

app.use(
  "/api",
  createChatRoutes(chatController)
);

app.use(errorMiddleware);

app.listen(env.port, () => {
  console.log(
    `AI server running on port ${env.port}`
  );
});