import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";

import {
  LLMProvider,
  LLMStreamEvent,
} from "./llm.provider.js";

export class MockLLMProvider
  implements LLMProvider {

  async generate(
    request: LLMRequest
  ): Promise<LLMResponse> {

    const hasTool =
      request.tools?.some(
        tool =>
          tool.name ===
          "get_order_status"
      );

    const hasToolResult =
      request.messages.some(
        message =>
          message.role === "tool"
      );

    /*
     * First LLM turn:
     * Ask for a tool.
     */
    if (
      hasTool &&
      !hasToolResult
    ) {
      return {
        content: "",

        model: "model-a",

        finishReason:
          "tool_calls",

        toolCalls: [
          {
            id: "call-order-status-1",

            name:
              "get_order_status",

            arguments:
              JSON.stringify({
                orderId: "12345",
              }),
          },
        ],

        usage: {
          inputTokens: 100,
          outputTokens: 20,
          totalTokens: 120,
        },
      };
    }

    /*
     * Second LLM turn:
     * Tool result is available.
     */
    if (hasToolResult) {
      return {
        content:
          "Your order 12345 is out for delivery and should arrive in about 30 minutes.",

        model: "model-a",

        finishReason: "stop",

        usage: {
          inputTokens: 180,
          outputTokens: 30,
          totalTokens: 210,
        },
      };
    }

    return {
      content:
        "This is a mocked AI response.",

      model: "model-a",

      finishReason: "stop",

      usage: {
        inputTokens: 50,
        outputTokens: 20,
        totalTokens: 70,
      },
    };
  }

  async *stream(
    request: LLMRequest
  ): AsyncIterable<LLMStreamEvent> {

    yield {
      type: "token",
      content: "This ",
    };

    yield {
      type: "token",
      content: "is ",
    };

    yield {
      type: "token",
      content: "a ",
    };

    yield {
      type: "token",
      content: "mock ",
    };

    yield {
      type: "token",
      content: "stream.",
    };

    yield {
      type: "usage",

      model: "model-a",

      usage: {
        inputTokens: 20,
        outputTokens: 10,
        totalTokens: 30,
      },
    };

    yield {
      type: "done",

      finishReason: "stop",
    };
  }
}