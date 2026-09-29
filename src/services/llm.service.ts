import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";

import { LLMProvider } from "../providers/llm.provider.js";

export class LLMService {

  constructor(
    private readonly provider: LLMProvider
  ) {}

  async generate(
    request: LLMRequest
  ): Promise<LLMResponse> {

    return this.provider.generate(request);
  }

  stream(
    request: LLMRequest
  ): AsyncIterable<string> {

    return this.provider.stream(request);
  }
}