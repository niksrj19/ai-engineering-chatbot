import {
  ConversationMessage,
} from "../types/ai.types.js";

export interface ConversationRepository {

  getMessages(
    conversationId: string
  ): Promise<ConversationMessage[]>;

  addMessage(
    message: ConversationMessage
  ): Promise<void>;

  clear(
    conversationId: string
  ): Promise<void>;
}