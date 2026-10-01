import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";

import {
  retry,
  RetryOptions,
} from "../utils/retry.js";

import {
  LLMProvider,
  LLMStreamEvent,
} from "../providers/llm.provider.js";

import {
  CircuitBreaker,
} from "./circuit-breaker.service.js";

export class LLMService {
  constructor(
    private readonly provider: LLMProvider,
    private readonly retryOptions: RetryOptions,
    private readonly circuitBreaker: CircuitBreaker
  ) {}

  async generate(
    request: LLMRequest,
    signal?: AbortSignal
  ): Promise<LLMResponse> {

    /**
     * Circuit breaker wraps the complete logical
     * LLM operation.
     *
     * Retry remains inside the circuit breaker.
     *
     * Therefore:
     *
     * Request
     *   ↓
     * Circuit Breaker
     *   ↓
     * Retry
     *   ↓
     * Provider
     */
    return this.circuitBreaker.execute(
      () =>
        retry(
          () =>
            this.provider.generate(
              request,
              signal
            ),
          this.retryOptions
        )
    );
  }

  stream(
    request: LLMRequest,
    signal?: AbortSignal
  ): AsyncIterable<LLMStreamEvent> {

    /**
     * Streaming behavior remains unchanged.
     *
     * We intentionally do not wrap the AsyncIterable
     * with the Promise-based circuit breaker yet.
     */
    return this.provider.stream(
      request,
      signal
    );
  }
}