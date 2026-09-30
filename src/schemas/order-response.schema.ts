import { z } from "zod";

export const OrderResponseSchema =
  z.object({

    orderId:
      z.string()
        .min(1),

    status:
      z.enum([
        "PLACED",
        "CONFIRMED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ]),

    estimatedMinutes:
      z.number()
        .int()
        .min(0)
        .max(1440),

  });

export type OrderResponse =
  z.infer<
    typeof OrderResponseSchema
  >;