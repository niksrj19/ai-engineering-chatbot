export interface InputGuardrailResult {
  allowed: boolean;
  reason?: string;
}

export class InputGuardrailService {

  private readonly maxMessageLength = 4000;

  validate(
    message: string
  ): InputGuardrailResult {

    if (!message || !message.trim()) {
      return {
        allowed: false,
        reason: "Message cannot be empty",
      };
    }

    if (
      message.length >
      this.maxMessageLength
    ) {
      return {
        allowed: false,
        reason:
          "Message exceeds maximum allowed length",
      };
    }

    return {
      allowed: true,
    };
  }
}