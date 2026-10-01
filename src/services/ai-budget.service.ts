export interface AIBudget {
  maxLLMRounds: number;
  maxToolCalls: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxTotalTokens: number;
}

export interface AIBudgetUsage {
  llmRounds: number;
  toolCalls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export class AIBudgetService {
  private readonly usage: AIBudgetUsage = {
    llmRounds: 0,
    toolCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  };

  constructor(
    private readonly budget: AIBudget
  ) {}

  recordLLMRound(): void {
    this.usage.llmRounds += 1;

    if (
      this.usage.llmRounds >
      this.budget.maxLLMRounds
    ) {
      throw new Error(
        "AI request exceeded maximum LLM rounds"
      );
    }
  }

  recordToolCall(count = 1): void {
    this.usage.toolCalls += count;

    if (
      this.usage.toolCalls >
      this.budget.maxToolCalls
    ) {
      throw new Error(
        "AI request exceeded maximum tool calls"
      );
    }
  }

  recordUsage(usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }): void {
    this.usage.inputTokens +=
      usage.inputTokens;

    this.usage.outputTokens +=
      usage.outputTokens;

    this.usage.totalTokens +=
      usage.totalTokens;

    this.validateTokenBudget();
  }

  canConsumeEstimatedTokens(
    estimatedInputTokens: number,
    estimatedOutputTokens: number
  ): boolean {
    const estimatedTotal =
      estimatedInputTokens +
      estimatedOutputTokens;

    return (
      this.usage.totalTokens +
        estimatedTotal <=
      this.budget.maxTotalTokens
    );
  }

  getUsage(): AIBudgetUsage {
    return {
      ...this.usage,
    };
  }

  getBudget(): AIBudget {
    return {
      ...this.budget,
    };
  }

  private validateTokenBudget(): void {
    if (
      this.usage.inputTokens >
      this.budget.maxInputTokens
    ) {
      throw new Error(
        "AI request exceeded maximum input token budget"
      );
    }

    if (
      this.usage.outputTokens >
      this.budget.maxOutputTokens
    ) {
      throw new Error(
        "AI request exceeded maximum output token budget"
      );
    }

    if (
      this.usage.totalTokens >
      this.budget.maxTotalTokens
    ) {
      throw new Error(
        "AI request exceeded maximum total token budget"
      );
    }
  }
}