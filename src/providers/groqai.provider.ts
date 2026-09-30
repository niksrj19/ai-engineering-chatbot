import Groq from "groq-sdk";

import {
  LLMRequest,
  LLMResponse,
  LLMMessage,
} from "../types/ai.types.js";

import { LLMProvider, LLMStreamEvent } from "./llm.provider.js";

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
    request: LLMRequest,
    signal?: AbortSignal
  ): Promise<LLMResponse> {

    const response =
      await this.client.chat.completions.create({
        model: this.model,
        
        messages: this.mapMessages(request.messages),
        // messages: request.messages.map(
        //   message => ({
        //     role: message.role,
        //     content: message.content,
        //   })
        // ),

        temperature: request.temperature,

        max_tokens: request.maxTokens,

       tools:request.tools?.map(tool => ({
              type: "function" as const,

              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            })),   
      } , { signal }
    );

    const choice = response.choices[0];


    //TOols Calling

    const toolCalls =
      choice.message.tool_calls
        ?.filter(
          call => call.type === "function"
        )
        .map(call => ({
          id: call.id,

          name: call.function.name,

          arguments:
            call.function.arguments,
        }));

    return {
      content: choice?.message?.content ?? "",

      model: response.model,

      toolCalls:  toolCalls?.length ? toolCalls : undefined,

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

        messages: this.mapMessages(request.messages),

        temperature: request.temperature,

        max_tokens: request.maxTokens,

        stream: true,

        
      },{signal});

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

  private mapMessages(
    messages: LLMMessage[]
  ) {
    return messages.map(message => {
      if ("toolCallId" in message) {
        return {
          role: "tool" as const,
          content: message.content,
          tool_call_id:
            message.toolCallId,
        };
      }

      if ("toolCalls" in message) {
        return {
          role: "assistant" as const,

          content:
            message.content ?? null,

          tool_calls:
            message.toolCalls.map(
              call => ({
                id: call.id,

                type: "function" as const,

                function: {
                  name: call.name,
                  arguments:
                    call.arguments,
                },
              })
            ),
        };
      }

      switch (message.role) {
        case "system":
          return {
            role: "system" as const,
            content: message.content,
          };
        case "user":
          return {
            role: "user" as const,
            content: message.content,
          };
        case "assistant":
          return {
            role: "assistant" as const,
            content: message.content,
          };
      }
    });
  }
}