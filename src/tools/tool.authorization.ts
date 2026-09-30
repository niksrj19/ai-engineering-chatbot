import {
  ToolDefinition,
  ToolContext,
} from "./tool.types.js";

export class ToolAuthorizationService {

  async authorize(
    tool: ToolDefinition,
    context: ToolContext
  ): Promise<boolean> {

    /*
     * In production this would normally
     * consult RBAC/ABAC/policy services.
     */

    if (
      tool.name === "get_order_status"
    ) {
      return true;
    }

    /*
     * Default deny.
     */
    return false;
  }
}