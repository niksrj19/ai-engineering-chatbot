export class OutputGuardrailService {

  validateText(
    content: string
  ): void {

    if (!content.trim()) {
      throw new Error(
        "LLM returned an empty response"
      );
    }

    if (content.length > 20000) {
      throw new Error(
        "LLM response exceeds allowed size"
      );
    }
  }
}