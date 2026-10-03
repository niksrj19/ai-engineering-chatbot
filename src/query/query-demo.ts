import {
  MockQueryTransformer,
} from "./mock.query-transformer.js";

import {
  QueryTransformationService,
} from "./query-transformation.service.js";

async function main(): Promise<void> {
  const transformer =
    new MockQueryTransformer();

  const service =
    new QueryTransformationService(
      transformer
    );

  const result =
    await service.transform({
      query:
        "When will it arrive?",

      conversation: [
        {
          role: "user",
          content:
            "Where is order 12345?",
        },

        {
          role: "assistant",
          content:
            "Your order is out for delivery.",
        },

        {
          role: "user",
          content:
            "When will it arrive?",
        },
      ],
    });

  console.log(
    "\nQuery Transformation:\n"
  );

  console.log(
    "Original:",
    result.originalQuery
  );

  console.log(
    "Rewritten:",
    result.rewrittenQuery
  );

  console.log(
    "Alternatives:",
    result.alternativeQueries
  );
}

main().catch(error => {
  console.error(
    "Query demo failed:",
    error
  );

  process.exit(1);
});