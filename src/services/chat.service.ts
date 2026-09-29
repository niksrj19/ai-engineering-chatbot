import { LLMService } from "./llm.service.js";

import {
  ChatMessage,
  LLMResponse,
} from "../types/ai.types.js";

export class ChatService {

  constructor(
    private readonly llmService: LLMService
  ) {}

  async chat(
    message: string
  ): Promise<LLMResponse> {

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

    return this.llmService.generate({
      messages,
      temperature: 0.2,
      maxTokens: 500,
    });
  }
}