import Groq from "groq-sdk";

import {
  LLMRequest,
  LLMResponse,
} from "../types/ai.types.js";

import { LLMProvider } from "./llm.provider.js";

export class GroqAIProvider implements LLMProvider {
  private client: Groq;

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {
    this.client = new Groq({
      apiKey: this.apiKey,
    });
  }

  async generate(
    request: LLMRequest
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
    request: LLMRequest
  ): AsyncIterable<string> {

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
      });

    for await (const chunk of stream) {
      const content =
        chunk.choices[0]?.delta?.content;

      if (content) {
        yield content;
      }
    }
  }
}