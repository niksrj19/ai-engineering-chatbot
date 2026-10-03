export interface QueryTransformationRequest {
  query: string;

  conversation?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface QueryTransformationResult {
  originalQuery: string;

  rewrittenQuery: string;

  alternativeQueries: string[];
}

export interface QueryTransformer {
  transform(
    request: QueryTransformationRequest
  ): Promise<QueryTransformationResult>;
}