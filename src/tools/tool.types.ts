export type ToolRisk =
  | "read"
  | "write";

export interface ToolContext {
  userId: string;
  requestId: string;
  conversationId: string;
}

export interface ToolExecutionResult {
  success: boolean;

  data?: unknown;

  error?: string;

  metadata?: {
    executionTimeMs?: number;
  };
}

export interface ToolDefinition {
  name: string;

  description: string;

  risk: ToolRisk;

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

  execute(
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolExecutionResult>;
}