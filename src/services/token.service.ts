import {
  LLMMessage,
} from "../types/ai.types.js";

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
    messages: LLMMessage[]
  ): number {

    return messages.reduce(
      (total, message) => {

        /*
         * Tool-call assistant messages can
         * have content === null.
         *
         * For token estimation we only
         * estimate textual content here.
         */
        const content =
          message.content ?? "";

        return (
          total +
          this.estimateTextTokens(
            content
          )
        );

      },
      0
    );
  }

  estimateRequest(
    messages: LLMMessage[],
    maxOutputTokens: number
  ): TokenEstimate {

    const inputTokens =
      this.estimateMessagesTokens(
        messages
      );

    return {
      inputTokens,

      outputTokens:
        maxOutputTokens,

      totalTokens:
        inputTokens +
        maxOutputTokens,
    };
  }
}