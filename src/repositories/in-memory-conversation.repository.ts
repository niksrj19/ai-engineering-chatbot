import {
  ConversationMessage,
} from "../types/ai.types.js";

import {
  ConversationRepository,
} from "./conversation.repository.js";

export class InMemoryConversationRepository
  implements ConversationRepository {

  private conversations =
    new Map<
      string,
      ConversationMessage[]
    >();

  async getMessages(
    conversationId: string
  ): Promise<ConversationMessage[]> {

    return [
      ...(this.conversations.get(
        conversationId
      ) ?? []),
    ];
  }

  async addMessage(
    message: ConversationMessage
  ): Promise<void> {

    const messages =
      this.conversations.get(
        message.conversationId
      ) ?? [];

    messages.push(message);

    this.conversations.set(
      message.conversationId,
      messages
    );
  }

  async clear(
    conversationId: string
  ): Promise<void> {

    this.conversations.delete(
      conversationId
    );
  }
}