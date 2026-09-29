import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";

import { LLMProvider } from "./llm.provider.js";

export class MockLLMProvider
  implements LLMProvider {

  async generate(
    request: LLMRequest
  ): Promise<LLMResponse> {

    return {
      content: "This is a mocked AI response.",

      model: "mock-model",

      usage: {
        inputTokens: 10,
        outputTokens: 10,
        totalTokens: 20,
      },

      finishReason: "stop",
    };
  }

  async *stream(
    request: LLMRequest
  ): AsyncIterable<string> {

    yield "This ";
    yield "is ";
    yield "a ";
    yield "mock ";
    yield "stream.";
  }
}