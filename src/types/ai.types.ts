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


export interface LLMTool {
  name: string;
  description: string;

  parameters: {
    type: "object";

    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;

    required?: string[];
  };
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ToolCallMessage {
  role: "assistant";
  content: string | null;
  toolCalls: LLMToolCall[];
}

export interface ToolResultMessage {
  role: "tool";
  content: string;
  toolCallId: string;
}

export type LLMMessage = ChatMessage | ToolCallMessage | ToolResultMessage;

export interface LLMRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  tools?: LLMTool[];
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

  toolCalls?: LLMToolCall[];
}

export interface ConversationMessage {
  id: string;

  conversationId: string;

  role: ChatMessageRole;

  content: string;

  createdAt: Date;
}

export interface ContextBudget {
  maxContextTokens: number;
  reservedOutputTokens: number;
  safetyBufferTokens: number;
}