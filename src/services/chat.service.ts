import crypto from "node:crypto";

import {
  ChatMessage,
  LLMMessage,
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
  ToolExecutor,
} from "../tools/tool.executor.js";

import {
  ToolRegistry,
} from "../tools/tool.registry.js";

import {
  ToolContext,
} from "../tools/tool.types.js";

import {
  CostService,
} from "./cost.service.js";

import {
  LLMService,
} from "./llm.service.js";

import {
  modelPricing,
} from "../config/model-pricing.js";
import { StructuredOutputService } from "./structured-output.service.js";
import { OrderResponseValidator } from "./order-response.validator.js";
import { OrderResponseSchema } from "../schemas/order-response.schema.js";
import { InputGuardrailService } from "./input-guardrail.service.js";
import { AIBudgetService } from "./ai-budget.service.js";

export class ChatService {

  private readonly maxToolRounds = 5;

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
      CostService,

    private readonly toolRegistry:
      ToolRegistry,

    private readonly toolExecutor:
      ToolExecutor,

    private readonly structuredOutputService: StructuredOutputService,

    private readonly orderResponseValidator: OrderResponseValidator,
    private readonly inputGuardrailService:
      InputGuardrailService,
    private readonly aiBudgetService:
      AIBudgetService,
  ) { }

  async chat(
    conversationId: string,
    message: string,
    requestContext: ToolContext
  ): Promise<LLMResponse> {
    //guardrail validation at starting of chat function
    const guardrail =
      this.inputGuardrailService.validate(
        message
      );

    if (!guardrail.allowed) {
      throw new Error(
        guardrail.reason ??
        "Request rejected by input guardrail"
      );
    }

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
   * 4. Add system instructions
   */
    const messages: LLMMessage[] = [
      {
        role: "system",

        content:
          `You are a helpful enterprise AI assistant.

You can use available tools when necessary.

Never invent tool results.

Use the tool result as the source of truth.`,
      },

      ...context,
    ];

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
    //This is a preflight check. below

    if (
      !this.aiBudgetService.canConsumeEstimatedTokens(
        estimatedUsage.inputTokens,
        estimatedUsage.outputTokens
      )
    ) {
      throw new Error(
        "AI request would exceed token budget"
      );
    }

    console.log(
      "Estimated token usage:",
      estimatedUsage
    );



    /*
     * 5. Convert registered tools
     *    into LLM tool definitions.
     */
    const tools =
      this.toolRegistry
        .getAll()
        .map(tool => ({
          name: tool.name,

          description:
            tool.description,

          parameters:
            tool.parameters,
        }));

    const isOrderRequest =
      message
        .toLowerCase()
        .includes("order");

    const outputSchema =
      isOrderRequest
        ? {
          name: "order_response",

          description:
            "Structured response containing order information.",

          schema: {
            type: "object",

            properties: {
              orderId: {
                type: "string",
              },

              status: {
                type: "string",
              },

              estimatedMinutes: {
                type: "integer",
              },
            },

            required: [
              "orderId",
              "status",
              "estimatedMinutes",
            ],

            additionalProperties:
              false,
          },
        }
        : undefined;

    /*
        * 6. Track total usage across
        *    every LLM call.
        */
    const totalUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };

    let finalResponse:
      LLMResponse | undefined;

    /*
     * --------------------------------------------------
     * 7. Call LLM
     * --------------------------------------------------
     */


    /*
   * 7. Tool loop
   */
    for (
      let round = 1;
      round <= this.maxToolRounds;
      round++
    ) {

      console.log(
        `LLM execution round: ${round}`
      );
      /*
      How much did this request cost?
      CostService
       * 7.1 Record LLM round in AI budget
      */
      this.aiBudgetService.recordLLMRound();

      const response =
        await this.llmService.generate({
          messages,

          temperature: 0.2,

          maxTokens: 4000,

          tools,

          outputSchema
        });

      /*
       * Accumulate usage from
       * every LLM invocation.
       */
      this.accumulateUsage(
        totalUsage,
        response
      );

      /* checking AI budget for estimated tokens
        Are we still allowed to continue?

        This is the actual enforcement check.
      */

      if (response.usage) {
        this.aiBudgetService.recordUsage(
          response.usage
        );
      }

      /*
       * 8. No tool call
       *
       * This is the final answer.
       */
      if (
        !response.toolCalls ||
        response.toolCalls.length === 0
      ) {
        finalResponse = response;
        break;
      }

      /*
       * 9. Add assistant tool-call
       *    message to context.
       */
      messages.push({
        role: "assistant",

        content:
          response.content || null,

        toolCalls:
          response.toolCalls,
      });

      //Record tool calls

      if (
        response.toolCalls &&
        response.toolCalls.length > 0
      ) {
        this.aiBudgetService.recordToolCall(
          response.toolCalls.length
        );
      }

      /*
       * 10. Execute each requested tool.
       */
      for (
        const toolCall
        of response.toolCalls
      ) {

        console.log(
          `Executing tool: ${toolCall.name}`
        );

        let args:
          Record<string, unknown>;

        /*
         * Tool arguments come from
         * the LLM and are untrusted.
         */
        try {
          const parsed =
            JSON.parse(
              toolCall.arguments
            );

          if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
          ) {
            throw new Error(
              "Tool arguments must be an object"
            );
          }

          args =
            parsed as Record<
              string,
              unknown
            >;

        } catch {
          messages.push({
            role: "tool",

            toolCallId:
              toolCall.id,

            content:
              JSON.stringify({
                success: false,

                error:
                  "Invalid tool arguments",
              }),
          });

          continue;
        }

        /*
         * 11. Execute through our
         *     controlled ToolExecutor.
         */
        const result =
          await this.toolExecutor.execute(
            toolCall.name,

            args,

            requestContext
          );

        /*
         * 12. Feed tool result
         *     back to the LLM.
         */
        messages.push({
          role: "tool",

          toolCallId:
            toolCall.id,

          content:
            JSON.stringify(result),
        });
      }

    }

    console.log(
  "AI budget usage:",
  this.aiBudgetService.getUsage()
);

    if (!finalResponse) {
      throw new Error(
        "Maximum tool execution rounds exceeded"
      );
    }

    let validatedResponse:
      | ReturnType<
        OrderResponseValidator["validate"]
      >
      | undefined;

    if (isOrderRequest) {

      const structuredResponse =
        this.structuredOutputService.parse(
          finalResponse.content,
          OrderResponseSchema
        );

      validatedResponse =
        this.orderResponseValidator.validate(
          structuredResponse
        );
    }

    // const response =
    //   await this.llmService.generate({
    //     messages: context,

    //     temperature: 0.2,

    //     maxTokens:
    //       maxOutputTokens,
    //   });

    /*
     * --------------------------------------------------
     * 8. Calculate actual cost
     *
     * Provider usage is authoritative.
     * --------------------------------------------------
     */

    // if (response.usage) {

    //   const pricing =
    //     modelPricing[
    //       response.model
    //     ];

    //   if (pricing) {

    //     const cost =
    //       this.costService.calculate(
    //         {
    //           inputTokens:
    //             response.usage
    //               .inputTokens,

    //           outputTokens:
    //             response.usage
    //               .outputTokens,
    //         },

    //         pricing
    //       );

    //     console.log(
    //       "Actual token usage:",
    //       response.usage
    //     );

    //     console.log(
    //       "Actual AI cost:",
    //       cost
    //     );
    //   } else {

    //     console.warn(
    //       `No pricing configured for model: ${response.model}`
    //     );
    //   }
    // }




    this.logCost(
      finalResponse.model,
      totalUsage
    );

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
        finalResponse.content,

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

    return {
      ...finalResponse,

      structuredOutput:
        validatedResponse,

      usage: totalUsage,
    };
  }

  private accumulateUsage(
    total: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    },
    response: LLMResponse
  ): void {

    if (!response.usage) {
      return;
    }

    total.inputTokens +=
      response.usage.inputTokens;

    total.outputTokens +=
      response.usage.outputTokens;

    total.totalTokens +=
      response.usage.totalTokens;
  }

  private logCost(
    model: string,
    usage: {
      inputTokens: number;
      outputTokens: number;
    }
  ): void {

    const pricing =
      modelPricing[model];

    if (!pricing) {
      console.warn(
        `No pricing configured for ${model}`
      );

      return;
    }

    const cost =
      this.costService.calculate(
        usage,
        pricing
      );

    console.log(
      "Total AI usage:",
      usage
    );

    console.log(
      "Total AI cost:",
      cost
    );
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