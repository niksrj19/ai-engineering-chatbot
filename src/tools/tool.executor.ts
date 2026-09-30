import {
  ToolRegistry,
} from "./tool.registry.js";

import {
  ToolAuthorizationService,
} from "./tool.authorization.js";

import {
  ToolContext,
  ToolExecutionResult,
} from "./tool.types.js";
import { withTimeout } from "../utils/with-timeout.js";

export class ToolExecutor {

  constructor(
    private readonly registry:
      ToolRegistry,

    private readonly authorization:
      ToolAuthorizationService
  ) { }

  async execute(
    name: string,
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolExecutionResult> {

    const tool =
      this.registry.get(name);

    if (!tool) {
      return {
        success: false,
        error:
          `Unknown tool: ${name}`,
      };
    }

    /*
    * Authorization
    */
    const allowed =
      await this.authorization.authorize(
        tool,
        context
      );

    if (!allowed) {
      return {
        success: false,

        error:
          "Tool execution is not authorized",
      };
    }



    try {
      const start =
        Date.now();
      const result =
        await withTimeout(
          tool.execute(
            args,
            context
          ),
          5000
        );


      return {
        ...result,

        metadata: {
          ...result.metadata,

          executionTimeMs:
            Date.now() - start,
        },
      };

    } catch (error) {

      console.error(
        `Tool execution failed: ${name}`,
        error
      );

      return {
        success: false,
        error:
          "Tool execution failed",
      };
    }
  }
}