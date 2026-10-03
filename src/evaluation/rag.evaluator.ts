import {
  EvaluationQuery,
  RAGEvaluationResult,
  RetrievalEvaluationResult,
} from "./evaluation.types.js";

import {
  recallAtK,
  precisionAtK,
  reciprocalRank,
} from "./retrieval.metrics.js";

export class RAGEvaluator {
  evaluateRetrieval(
    queries: EvaluationQuery[],
    retrievalResults: Map<
      string,
      string[]
    >,
    k: number
  ): RAGEvaluationResult {
    const results:
      RetrievalEvaluationResult[] =
      queries.map(query => {
        const retrievedIds =
          retrievalResults.get(
            query.id
          ) ?? [];

        return {
          queryId:
            query.id,

          recallAtK:
            recallAtK(
              retrievedIds,
              query.relevantDocumentIds,
              k
            ),

          precisionAtK:
            precisionAtK(
              retrievedIds,
              query.relevantDocumentIds,
              k
            ),

          reciprocalRank:
            reciprocalRank(
              retrievedIds,
              query.relevantDocumentIds
            ),
        };
      });

    return {
      retrieval: results,

      averageRecallAtK:
        average(
          results.map(
            result =>
              result.recallAtK
          )
        ),

      averagePrecisionAtK:
        average(
          results.map(
            result =>
              result.precisionAtK
          )
        ),

      meanReciprocalRank:
        average(
          results.map(
            result =>
              result.reciprocalRank
          )
        ),
    };
  }
}

function average(
  values: number[]
): number {
  if (
    values.length === 0
  ) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    values.length
  );
}