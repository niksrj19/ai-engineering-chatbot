import OpenAI from "openai";

import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";

import { LLMProvider, LLMStreamEvent } from "./llm.provider.js";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {
    this.client = new OpenAI({
      apiKey,
    });
  }

  async generate(
    request: LLMRequest,
    signal?: AbortSignal
  ): Promise<LLMResponse> {

    const response =
      await this.client.chat.completions.create({
        model: this.model,

        messages: request.messages.map(
          message => ({
            role: message.role,
            content: message.content,
          })
        ),

        temperature: request.temperature,

        max_tokens: request.maxTokens,

        // signal
      });

    const choice = response.choices[0];

    return {
      content: choice?.message?.content ?? "",

      model: response.model,

      usage: response.usage
        ? {
            inputTokens:
              response.usage.prompt_tokens,

            outputTokens:
              response.usage.completion_tokens,

            totalTokens:
              response.usage.total_tokens,
          }
        : undefined,

      finishReason:
        choice?.finish_reason ?? undefined,
    };
  }

  async *stream(
    request: LLMRequest,
    signal?: AbortSignal
  ): AsyncIterable<LLMStreamEvent> {

    const stream =
      await this.client.chat.completions.create({
        model: this.model,

        messages: request.messages.map(
          message => ({
            role: message.role,
            content: message.content,
          })
        ),

        temperature: request.temperature,

        max_tokens: request.maxTokens,

        stream: true,

        // signal
      });

       let finishReason:
      string | undefined;

    for await (const chunk of stream) {
      const content =
        chunk.choices[0]?.delta?.content;

      if (content) {
       yield {
          type: "token",
          content,
        };
      }

      const chunkFinishReason =
        chunk.choices[0]
          ?.finish_reason;

      if (chunkFinishReason) {
        finishReason = chunkFinishReason;
      }
    }
     yield {
      type: "done",
      finishReason,
    };
  }
}