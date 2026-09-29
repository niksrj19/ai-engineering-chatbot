import {
  ChatMessage,
  ConversationMessage,
} from "../types/ai.types.js";

export interface ContextOptions {
  maxMessages: number;
}

export class ContextService {

  constructor(
    private readonly options: ContextOptions
  ) {}

  buildContext(
    history: ConversationMessage[]
  ): ChatMessage[] {

    const recentMessages =
      history.slice(
        -this.options.maxMessages
      );

    return recentMessages.map(
      message => ({
        role: message.role,
        content: message.content,
      })
    );
  }
}