import express from "express";

import { env } from "./config/env.js";

import { OpenAIProvider } from "./providers/openai.provider.js";

import { GroqAIProvider } from "./providers/groqai.provider.js";

import { LLMService } from "./services/llm.service.js";

import { ChatService } from "./services/chat.service.js";

import { ChatController } from "./controllers/chat.controller.js";

import { createChatRoutes } from "./routes/chat.routes.js";

import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

const provider =
  new GroqAIProvider(
    env.groqApiKey,
    env.groqModel
  );

const llmService =
  new LLMService(provider);

const chatService =
  new ChatService(llmService);

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