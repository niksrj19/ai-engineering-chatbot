import crypto from "node:crypto";

import {
  ChatMessage,
  ConversationMessage,
  LLMResponse,
} from "../types/ai.types.js";

import {
  ConversationRepository,
} from "../repositories/conversation.repository.js";

import {
  ContextService,
} from "./context.service.js";

import {
  TokenService,
} from "./token.service.js";

import {
  CostService,
} from "./cost.service.js";

import {
  LLMService,
} from "./llm.service.js";

import {
  modelPricing,
} from "../config/model-pricing.js";

export class ChatService {

  constructor(
    private readonly llmService:
      LLMService,

    private readonly conversationRepository:
      ConversationRepository,

    private readonly contextService:
      ContextService,

    private readonly tokenService:
      TokenService,

    private readonly costService:
      CostService
  ) {}

  async chat(
    conversationId: string,
    message: string
  ): Promise<LLMResponse> {

    /*
     * --------------------------------------------------
     * 1. Load existing conversation history
     * --------------------------------------------------
     */

    const history =
      await this.conversationRepository
        .getMessages(
          conversationId
        );

    /*
     * --------------------------------------------------
     * 2. Create user message
     * --------------------------------------------------
     */

    const userMessage:
      ConversationMessage = {

      id:
        crypto.randomUUID(),

      conversationId,

      role: "user",

      content: message,

      createdAt: new Date(),
    };

    /*
     * --------------------------------------------------
     * 3. Persist user message
     * --------------------------------------------------
     */

    await this.conversationRepository
      .addMessage(
        userMessage
      );

    /*
     * --------------------------------------------------
     * 4. Build updated history
     *
     * Existing history + current user message
     * --------------------------------------------------
     */

    const updatedHistory = [
      ...history,
      userMessage,
    ];

    /*
     * --------------------------------------------------
     * 5. Build token-aware context
     * --------------------------------------------------
     */

    const context =
      this.contextService
        .buildContext(
          updatedHistory
        );

    /*
     * --------------------------------------------------
     * 6. Estimate token usage
     *
     * This is only a preflight estimate.
     * --------------------------------------------------
     */

    const maxOutputTokens = 4000;

    const estimatedUsage =
      this.tokenService
        .estimateRequest(
          context,
          maxOutputTokens
        );

    console.log(
      "Estimated token usage:",
      estimatedUsage
    );

    /*
     * --------------------------------------------------
     * 7. Call LLM
     * --------------------------------------------------
     */

    const response =
      await this.llmService.generate({
        messages: context,

        temperature: 0.2,

        maxTokens:
          maxOutputTokens,
      });

    /*
     * --------------------------------------------------
     * 8. Calculate actual cost
     *
     * Provider usage is authoritative.
     * --------------------------------------------------
     */

    if (response.usage) {

      const pricing =
        modelPricing[
          response.model
        ];

      if (pricing) {

        const cost =
          this.costService.calculate(
            {
              inputTokens:
                response.usage
                  .inputTokens,

              outputTokens:
                response.usage
                  .outputTokens,
            },

            pricing
          );

        console.log(
          "Actual token usage:",
          response.usage
        );

        console.log(
          "Actual AI cost:",
          cost
        );
      } else {

        console.warn(
          `No pricing configured for model: ${response.model}`
        );
      }
    }

    /*
     * --------------------------------------------------
     * 9. Create assistant message
     * --------------------------------------------------
     */

    const assistantMessage:
      ConversationMessage = {

      id:
        crypto.randomUUID(),

      conversationId,

      role: "assistant",

      content:
        response.content,

      createdAt: new Date(),
    };

    /*
     * --------------------------------------------------
     * 10. Persist assistant response
     * --------------------------------------------------
     */

    await this.conversationRepository
      .addMessage(
        assistantMessage
      );

    /*
     * --------------------------------------------------
     * 11. Return LLM response
     * --------------------------------------------------
     */

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