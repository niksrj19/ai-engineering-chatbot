import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";

import {
  retry,
  RetryOptions,
} from "../utils/retry.js";

import { LLMProvider } from "../providers/llm.provider.js";

export class LLMService {

  constructor(
    private readonly provider: LLMProvider,
    private readonly retryOptions: RetryOptions
  ) {}

  async generate(
    request: LLMRequest, signal?: AbortSignal
  ): Promise<LLMResponse> {

     return retry(
      () =>
        this.provider.generate(request,signal),
      

      this.retryOptions
    );
  }

  stream(
    request: LLMRequest ,signal?: AbortSignal
  ): AsyncIterable<string> {

    return this.provider.stream(request,signal);
  }
}