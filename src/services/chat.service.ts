import { LLMService } from "./llm.service.js";

import {
  ChatMessage,
  ConversationMessage,
  LLMResponse,
} from "../types/ai.types.js";
import { ContextService } from "./context.service.js";
import { ConversationRepository } from "../repositories/conversation.repository.js";

export class ChatService {

  constructor(
    private readonly llmService: LLMService,

    private readonly conversationRepository:
      ConversationRepository,

    private readonly contextService:
      ContextService
  ) {}

 async chat(
  conversationId: string,
  message: string
): Promise<LLMResponse> {

  const history =
    await this.conversationRepository
      .getMessages(conversationId);

  console.log({history, conversationId, message});

  const userMessage: ConversationMessage = {
    id: crypto.randomUUID(),

    conversationId,

    role: "user",

    content: message,

    createdAt: new Date(),
  };

  await this.conversationRepository
    .addMessage(userMessage);

  const updatedHistory = [
    ...history,
    userMessage,
  ];

  const context =
    this.contextService
      .buildContext(updatedHistory);

  console.log({context, updatedHistory, conversationId, message});

  const response =
    await this.llmService.generate({
      messages: context,
      temperature: 0.2,
      maxTokens: 500,
    });

  const assistantMessage:
    ConversationMessage = {

    id: crypto.randomUUID(),

    conversationId,

    role: "assistant",

    content: response.content,

    createdAt: new Date(),
  };

  await this.conversationRepository
    .addMessage(assistantMessage);

  return response;
}

  stream(message: string, signal?: AbortSignal): AsyncIterable<string> {

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a helpful enterprise AI assistant.",
    },
    {
      role: "user",
      content: message,
    },
  ];

  return this.llmService.stream({
    messages,
    temperature: 0.2,
    maxTokens: 500,
  }, signal);
}
}