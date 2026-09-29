import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";


export interface LLMProvider {
  generate(
    request: LLMRequest
  ): Promise<LLMResponse>;

  stream(
    request: LLMRequest
  ): AsyncIterable<string>;
}