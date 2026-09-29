import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";


export interface LLMProvider {

  generate(
    request: LLMRequest,
    signal?: AbortSignal
  ): Promise<LLMResponse>;

  stream(
    request: LLMRequest,
    signal?: AbortSignal
  ): AsyncIterable<string>;
}