import {
  ZodType,
  ZodError,
} from "zod";

// export interface StructuredOutputOptions {
//   maxAttempts: number;
// }

export class StructuredOutputService {

  // constructor(
  //   private readonly options:
  //     StructuredOutputOptions
  // ) {}

  parse<T>(
    rawContent: string,

    schema: ZodType<T>
  ): T {

    let parsed: unknown;

    try {

      parsed =
        JSON.parse(rawContent);

    } catch {

      throw new Error(
        "LLM returned invalid JSON"
      );
    }

    const result =
      schema.safeParse(parsed);

    if (!result.success) {

      throw new Error(
        this.formatValidationError(
          result.error
        )
      );
    }

    return result.data;
  }

  private formatValidationError(
    error: ZodError
  ): string {

    return error.issues
      .map(issue =>
        `${issue.path.join(".")}: ${issue.message}`
      )
      .join("; ");
  }
}