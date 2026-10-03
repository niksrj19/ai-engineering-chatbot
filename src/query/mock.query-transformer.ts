import {
  QueryTransformer,
  QueryTransformationRequest,
  QueryTransformationResult,
} from "./query-transformer.js";

export class MockQueryTransformer
  implements QueryTransformer
{
  async transform(
    request: QueryTransformationRequest
  ): Promise<QueryTransformationResult> {
    const original =
      request.query.trim();

    if (!original) {
      throw new Error(
        "Query cannot be empty"
      );
    }

    const previousUserMessages =
      request.conversation
        ?.filter(
          message =>
            message.role === "user"
        )
        .map(
          message =>
            message.content
        ) ?? [];

    const lastUserMessage =
      previousUserMessages.at(-2);

    if (
      lastUserMessage &&
      isFollowUpQuery(original)
    ) {
      return {
        originalQuery: original,

        rewrittenQuery:
          `${lastUserMessage} ${original}`,

        alternativeQueries: [],
      };
    }

    return {
      originalQuery: original,

      rewrittenQuery: original,

      alternativeQueries:
    generateAlternatives(original),
    };
  }
}

function generateAlternatives(
  query: string
): string[] {
  const normalized =
    query.toLowerCase();

  if (
    normalized.includes(
      "cancel"
    ) &&
    normalized.includes(
      "delivery"
    )
  ) {
    return [
      "delivery cancellation policy",
      "cancel order after dispatch",
      "can an out-for-delivery order be cancelled",
    ];
  }

  return [];
}

function isFollowUpQuery(
  query: string
): boolean {
  const normalized =
    query.toLowerCase();

  const followUpPatterns = [
    "when will it arrive",
    "when will it come",
    "what about it",
    "what about that",
    "can i cancel it",
    "where is it",
    "when will it be delivered",
  ];

  return followUpPatterns.some(
    pattern =>
      normalized.includes(pattern)
  );
}