import {
  ToolDefinition,
} from "../tool.types.js";
import { z } from "zod";
const getOrderStatusSchema =
  z.object({
    orderId:
      z.string()
        .min(1)
        .max(100),
  });
export const getOrderStatusTool:
  ToolDefinition = {

  name:
    "get_order_status",

  description:
    "Get the current status of a customer's order.",

  risk: "read",

  parameters: {
    type: "object",

    properties: {

      orderId: {
        type: "string",

        description:
          "The unique order identifier.",
      },
    },

    required: [
      "orderId",
    ],
  },

  async execute(
    args,
    context
  ) {

    const result =
    getOrderStatusSchema.safeParse(
      args
    );

 

    if (!result.success) {

    return {
      success: false,
      error:
        "Invalid tool arguments",
    };
  }

    /*
     * For now this is mock data.
     *
     * Later:
     *
     * Order Service
     *     ↓
     * Database
     */

     const {
    orderId,
  } = result.data;

    console.log(
      `Fetching order ${orderId} for user ${context.userId}`
    );

    return {
      success: true,

      data: {
        orderId,

        status:
          "OUT_FOR_DELIVERY",

        estimatedDelivery:
          "30 minutes",
      },
    };
  },
};