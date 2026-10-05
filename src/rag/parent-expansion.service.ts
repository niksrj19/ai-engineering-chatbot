import {
  ParentRepository,
} from "../ingestion/parent.repository.js";

import {
  RAGSearchResult,
} from "./rag-search.types.js";

export interface ExpandedRAGResult
  extends RAGSearchResult {
  parentId?: string;

  contextContent: string;
}

export class ParentExpansionService {
  constructor(
    private readonly parentRepository:
      ParentRepository
  ) {}

  async expand(
    results: RAGSearchResult[]
  ): Promise<ExpandedRAGResult[]> {
    const expanded: ExpandedRAGResult[] =
      [];

    for (
      const result of results
    ) {
      const parentId =
        result.record.metadata
          ?.parentId;

      if (
        typeof parentId !==
        "string"
      ) {
        expanded.push({
          ...result,

          contextContent:
            result.record.content,
        });

        continue;
      }

      const parent =
        await this.parentRepository.get(
          parentId
        );

      if (!parent) {
        expanded.push({
          ...result,

          parentId,

          contextContent:
            result.record.content,
        });

        continue;
      }

      expanded.push({
        ...result,

        parentId,

        contextContent:
          parent.content,
      });
    }

    return deduplicateParents(
      expanded
    );
  }
}

function deduplicateParents(
  results: ExpandedRAGResult[]
): ExpandedRAGResult[] {
  const seen =
    new Set<string>();

  const output:
    ExpandedRAGResult[] = [];

  for (
    const result of results
  ) {
    const key =
      result.parentId ??
      result.record.id;

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    output.push(result);
  }

  return output;
}