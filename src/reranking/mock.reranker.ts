import {
  Reranker,
  RerankCandidate,
  RerankResult,
} from "./reranker.js";

export class MockReranker
  implements Reranker
{
  async rerank(
    query: string,
    candidates: RerankCandidate[]
  ): Promise<RerankResult[]> {
    const queryTerms =
      this.tokenize(query);

    return candidates
      .map(candidate => {
        const documentTerms =
          this.tokenize(
            candidate.content
          );

        const score =
          this.calculateScore(
            queryTerms,
            documentTerms
          );

        return {
          id: candidate.id,
          score,
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score
      );
  }

  private tokenize(
    text: string
  ): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(
          /[^a-z0-9\s]/g,
          ""
        )
        .split(/\s+/)
        .filter(Boolean)
    );
  }

  private calculateScore(
    queryTerms: Set<string>,
    documentTerms: Set<string>
  ): number {
    if (queryTerms.size === 0) {
      return 0;
    }

    let matches = 0;

    for (const term of queryTerms) {
      if (
        documentTerms.has(term)
      ) {
        matches += 1;
      }
    }

    return (
      matches / queryTerms.size
    );
  }
}