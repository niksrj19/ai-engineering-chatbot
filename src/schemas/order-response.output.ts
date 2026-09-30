export const orderResponseOutputSchema = {
  name: "order_response",

  description:
    "Structured response containing the current order status.",

  schema: {
    type: "object",

    properties: {
      orderId: {
        type: "string",
      },

      status: {
        type: "string",

        enum: [
          "PLACED",
          "CONFIRMED",
          "PREPARING",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELLED",
        ],
      },

      estimatedMinutes: {
        type: "integer",

        minimum: 0,

        maximum: 1440,
      },
    },

    required: [
      "orderId",
      "status",
      "estimatedMinutes",
    ],

    additionalProperties: false,
  },
};