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
        tool.name === "get_order_status"
    ) ?? false;

  const hasToolResult =
    request.messages.some(
      message =>
        message.role === "tool"
    );

  const lastUserMessage =
    [...request.messages]
      .reverse()
      .find(
        message =>
          message.role === "user"
      );

  const userMessage =
    lastUserMessage?.content
      ?.toLowerCase() ?? "";

  const isOrderRequest =
    userMessage.includes("order");

  /*
   * Debug information
   */
  console.log(
    "Mock Provider:",
    {
      userMessage,
      hasTool,
      hasToolResult,
      outputSchema:
        request.outputSchema?.name,
      isOrderRequest,
    }
  );

  /*
   * --------------------------------------------------
   * 1. First LLM turn
   *
   * Only request the order tool when the user
   * actually asks about an order.
   * --------------------------------------------------
   */

  if (
    hasTool &&
    isOrderRequest &&
    !hasToolResult
  ) {
    return {
      content: "",

      model: "model-a",

      finishReason:
        "tool_calls",

      toolCalls: [
        {
          id:
            "call-order-status-1",

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
   * --------------------------------------------------
   * 2. Structured order response
   *
   * Only return JSON when ChatService explicitly
   * requests the order_response schema.
   * --------------------------------------------------
   */

  if (
    request.outputSchema?.name ===
      "order_response" &&
    hasToolResult
  ) {
    return {
      content:
        JSON.stringify({
          orderId:
            "12345",

          status:
            "OUT_FOR_DELIVERY",

          estimatedMinutes:
            30,
        }),

      model:
        "model-a",

      finishReason:
        "stop",

      usage: {
        inputTokens: 180,
        outputTokens: 40,
        totalTokens: 220,
      },
    };
  }

  /*
   * --------------------------------------------------
   * 3. Normal response after tool
   * --------------------------------------------------
   */

  if (hasToolResult) {
    return {
      content:
        "Your order 12345 is out for delivery and should arrive in about 30 minutes.",

      model:
        "model-a",

      finishReason:
        "stop",

      usage: {
        inputTokens: 180,
        outputTokens: 30,
        totalTokens: 210,
      },
    };
  }

  /*
   * --------------------------------------------------
   * 4. Normal conversation
   * --------------------------------------------------
   */

  return {
    content:
      "This is a mocked AI response.",

    model:
      "model-a",

    finishReason:
      "stop",

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