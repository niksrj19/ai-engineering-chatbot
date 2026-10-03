import {
  RAGEvaluator,
} from "./rag.evaluator.js";

import {
  EvaluationQuery,
} from "./evaluation.types.js";

async function main(): Promise<void> {
  const queries:
    EvaluationQuery[] = [
      {
        id: "q1",

        question:
          "Can I cancel my delivery?",

        relevantDocumentIds: [
          "doc-cancellation",
        ],
      },

      {
        id: "q2",

        question:
          "What should I do if my delivery is delayed?",

        relevantDocumentIds: [
          "doc-delay",
        ],
      },

      {
        id: "q3",

        question:
          "What is the status of order 12345?",

        relevantDocumentIds: [
          "doc-order-12345",
        ],
      },
    ];

  const retrievalResults =
    new Map<string, string[]>([
      [
        "q1",
        [
          "doc-delivery-hours",
          "doc-cancellation",
          "doc-refund",
        ],
      ],

      [
        "q2",
        [
          "doc-delay",
          "doc-delivery-hours",
          "doc-refund",
        ],
      ],

      [
        "q3",
        [
          "doc-order-12345",
          "doc-delivery-hours",
          "doc-refund",
        ],
      ],
    ]);

  const evaluator =
    new RAGEvaluator();

  const result =
    evaluator.evaluateRetrieval(
      queries,
      retrievalResults,
      3
    );

  console.log(
    "\nRAG Evaluation:\n"
  );

  console.table(
    result.retrieval
  );

  console.log(
    "\nAverage Recall@3:",
    result.averageRecallAtK
  );

  console.log(
    "Average Precision@3:",
    result.averagePrecisionAtK
  );

  console.log(
    "MRR:",
    result.meanReciprocalRank
  );
}

main().catch(error => {
  console.error(
    "Evaluation failed:",
    error
  );

  process.exit(1);
});