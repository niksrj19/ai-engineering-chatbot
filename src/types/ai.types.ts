export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  answer: string;
  conversationId?: string;
}

// export interface LLMRequest {
//   system: string;
//   user: string;
// }

export type ChatMessageRole =
  | "system"
  | "user"
  | "assistant";

  export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface LLMRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;

  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  model: string;

  finishReason?: string;
}