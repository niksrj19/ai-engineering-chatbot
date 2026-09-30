import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";


export type LLMStreamEvent =
  | {
      type: "token";
      content: string;
    }
  | {
      type: "usage";
      model: string;
      usage: NonNullable<
        LLMResponse["usage"]
      >;
    }
  | {
      type: "done";
      finishReason?: string;
    };


export interface LLMProvider {

  generate(
    request: LLMRequest,
    signal?: AbortSignal
  ): Promise<LLMResponse>;

  stream(
    request: LLMRequest,
    signal?: AbortSignal
  ): AsyncIterable<LLMStreamEvent>;
}