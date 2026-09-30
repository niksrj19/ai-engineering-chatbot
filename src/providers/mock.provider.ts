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

    return {
      content:
        "This is a mocked AI response.",

      model:
        "model-a",

      usage: {
        inputTokens: 100,
        outputTokens: 20,
        totalTokens: 120,
      },

      finishReason: "stop",
    };
  }

  async *stream(
    request: LLMRequest
  ): AsyncIterable<LLMStreamEvent> {

    const chunks = [
      "This ",
      "is ",
      "a ",
      "mock ",
      "stream."
    ];

    for (const chunk of chunks) {

      yield {
        type: "token",
        content: chunk,
      };
    }

    yield {
    type: "usage",
    model: "model-a",
    usage: {
      inputTokens: 100,
      outputTokens: 20,
      totalTokens: 120,
    },
};

    yield {
      type: "done",
      finishReason: "stop",
    };
  }
}