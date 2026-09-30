import {
  ChatMessage,
  ConversationMessage,
} from "../types/ai.types.js";

import {
  TokenService,
} from "./token.service.js";

export interface ContextOptions {
  maxContextTokens: number;
  reservedOutputTokens: number;
  safetyBufferTokens: number;
}

export class ContextService {

  constructor(
    private readonly options: ContextOptions,
    private readonly tokenService: TokenService
  ) {}

  getAvailableInputTokens(): number {

    return (
      this.options.maxContextTokens -
      this.options.reservedOutputTokens -
      this.options.safetyBufferTokens
    );
  }

  buildContext(
    history: ConversationMessage[]
  ): ChatMessage[] {

    const maxInputTokens =
      this.getAvailableInputTokens();

    const selected: ChatMessage[] = [];

    let tokenCount = 0;

    // Start from the newest message
    // and work backwards.
    for (
      let i = history.length - 1;
      i >= 0;
      i--
    ) {

      const message = history[i];

      const messageTokens =
        this.tokenService
          .estimateTextTokens(
            message.content
          );

      if (
        tokenCount +
          messageTokens >
        maxInputTokens
      ) {
        break;
      }

      selected.unshift({
        role: message.role,
        content: message.content,
      });

      tokenCount += messageTokens;
    }

    return selected;
  }
}