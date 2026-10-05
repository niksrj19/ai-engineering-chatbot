import {
 ExpandedRAGResult } from "./parent-expansion.service";

export interface ContextCompressionOptions {
  maxCharacters: number;

  maxResults: number;
}

export interface CompressedContext {
  results: ExpandedRAGResult[];

  formattedContext: string;
}

export class ContextCompressionService {
  constructor(
    private readonly options:
      ContextCompressionOptions
  ) {}

  compress(
    results: ExpandedRAGResult[]
  ): CompressedContext {
    const selected:
      ExpandedRAGResult[] = [];

    let totalCharacters = 0;

    for (
      const result of results
    ) {
      if (
        selected.length >=
        this.options.maxResults
      ) {
        break;
      }

      const content =
        result.contextContent;

      if (
        totalCharacters +
          content.length >
        this.options.maxCharacters
      ) {
        break;
      }

      selected.push(
        result
      );

      totalCharacters +=
        content.length;
    }

    const formattedContext =
      selected
        .map(
          (result, index) =>
            [
              `[Context ${index + 1}]`,
              `Source: ${
                result.record.metadata
                  ?.source ??
                "unknown"
              }`,
              result.contextContent,
            ].join("\n")
        )
        .join("\n\n");

    return {
      results:
        selected,

      formattedContext,
    };
  }
}