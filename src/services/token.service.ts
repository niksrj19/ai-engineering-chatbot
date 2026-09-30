export interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export class TokenService {

  estimateTextTokens(
    text: string
  ): number {

    if (!text) {
      return 0;
    }

    // Approximation only.
    // Production should use
    // model-specific tokenization.
    return Math.ceil(
      text.length / 4
    );
  }

  estimateMessagesTokens(
    messages: Array<{
      role: string;
      content: string;
    }>
  ): number {

    return messages.reduce(
      (total, message) => {

        return (
          total +
          this.estimateTextTokens(
            message.content
          )
        );

      },
      0
    );
  }

  estimateRequest(
    messages: Array<{
      role: string;
      content: string;
    }>,
    maxOutputTokens: number
  ): TokenEstimate {

    const inputTokens =
      this.estimateMessagesTokens(
        messages
      );

    return {
      inputTokens,
      outputTokens: maxOutputTokens,
      totalTokens:
        inputTokens +
        maxOutputTokens,
    };
  }
}