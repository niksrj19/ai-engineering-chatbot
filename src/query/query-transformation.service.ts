import {
  QueryTransformer,
  QueryTransformationRequest,
  QueryTransformationResult,
} from "./query-transformer.js";

export class QueryTransformationService {
  constructor(
    private readonly transformer:
      QueryTransformer
  ) {}

  async transform(
    request: QueryTransformationRequest
  ): Promise<QueryTransformationResult> {
    const query =
      request.query.trim();

    if (!query) {
      throw new Error(
        "Query cannot be empty"
      );
    }

    const result =
      await this.transformer.transform(
        {
          ...request,
          query,
        }
      );

    if (
      !result.rewrittenQuery.trim()
    ) {
      throw new Error(
        "Query transformer returned an empty query"
      );
    }

    return result;
  }
}