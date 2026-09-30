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

  async *stream(
  conversationId: string,
  message: string,
  signal?: AbortSignal
): AsyncIterable<
  | {
      type: "token";
      content: string;
    }
  | {
      type: "usage";
      usage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
      };
      cost?: {
        inputCost: number;
        outputCost: number;
        totalCost: number;
      };
    }
  | {
      type: "done";
      finishReason?: string;
    }
> {

  /*
   * 1. Load conversation
   */

  const history =
    await this.conversationRepository
      .getMessages(
        conversationId
      );

  /*
   * 2. Create user message
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
   * 3. Persist user message
   */

  await this.conversationRepository
    .addMessage(
      userMessage
    );

  /*
   * 4. Build complete history
   */

  const updatedHistory = [
    ...history,
    userMessage,
  ];

  /*
   * 5. Build token-aware context
   */

  const context =
    this.contextService
      .buildContext(
        updatedHistory
      );

  /*
   * 6. Preflight token estimate
   */

  const maxOutputTokens = 4000;

  const estimatedUsage =
    this.tokenService
      .estimateRequest(
        context,
        maxOutputTokens
      );

  console.log(
    "Estimated streaming usage:",
    estimatedUsage
  );

  /*
   * 7. Start LLM stream
   */

  const stream =
    this.llmService.stream(
      {
        messages: context,
        temperature: 0.2,
        maxTokens: maxOutputTokens,
      },
      signal
    );

  /*
   * 8. Accumulate assistant response
   */

  let assistantContent = "";

  for await (
    const event of stream
  ) {

    if (
      signal?.aborted
    ) {
      return;
    }

    /*
     * Token event
     */

    if (
      event.type === "token"
    ) {

      assistantContent +=
        event.content;

      yield event;

      continue;
    }

    /*
     * Usage event
     */

   if (event.type === "usage") {

  const pricing =
    modelPricing[
      event.model
    ];

  let cost;

  if (pricing) {

    cost =
      this.costService.calculate(
        {
          inputTokens:
            event.usage.inputTokens,

          outputTokens:
            event.usage.outputTokens,
        },
        pricing
      );
  }

  yield {
    type: "usage",

    usage: event.usage,

    cost,
  };

  continue;
}

    /*
     * Done event
     */

    if (
      event.type === "done"
    ) {

      /*
       * Persist assistant message
       * only after the stream completed.
       */

      if (
        assistantContent
      ) {

        const assistantMessage:
          ConversationMessage = {

          id:
            crypto.randomUUID(),

          conversationId,

          role: "assistant",

          content:
            assistantContent,

          createdAt: new Date(),
        };

        await this.conversationRepository
          .addMessage(
            assistantMessage
          );
      }

      yield event;
    }
  }
}
}