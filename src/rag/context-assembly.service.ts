import {
  RAGSearchResult,
} from "./rag-search.types.js";

export interface ContextAssemblyOptions {
  maxChunks: number;
  maxCharacters: number;
}

export class ContextAssemblyService {
  constructor(
    private readonly options:
      ContextAssemblyOptions
  ) {}

  assemble(
    results: RAGSearchResult[]
  ): string {
    const selectedResults =
      results.slice(
        0,
        this.options.maxChunks
      );

    const sections: string[] = [];

    let totalCharacters = 0;

    for (
      let index = 0;
      index < selectedResults.length;
      index++
    ) {
      const result =
        selectedResults[index];

      const section =
        this.formatResult(
          result,
          index + 1
        );

      if (
        totalCharacters +
          section.length >
        this.options.maxCharacters
      ) {
        break;
      }

      sections.push(section);

      totalCharacters +=
        section.length;
    }

    return sections.join(
      "\n\n"
    );
  }

  private formatResult(
    result: RAGSearchResult,
    rank: number
  ): string {
    const source =
      result.record.metadata?.source ??
      "unknown";

    const vectorScore =
      result?.vectorScore?.toFixed(3);

    const rerankScore =
      result.rerankScore !==
      undefined
        ? result.rerankScore.toFixed(3)
        : "N/A";

    return [
      `[Retrieved Source ${rank}]`,
      `Source: ${source}`,
      `Vector Score: ${vectorScore}`,
      `Rerank Score: ${rerankScore}`,
      `Content:`,
      result.record.content,
    ].join("\n");
  }
}