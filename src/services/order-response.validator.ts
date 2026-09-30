import {
  OrderResponse,
} from "../schemas/order-response.schema.js";

export class OrderResponseValidator {

  validate(
    response: OrderResponse
  ): OrderResponse {

    if (
      response.status === "DELIVERED" &&
      response.estimatedMinutes > 0
    ) {
      throw new Error(
        "Delivered orders cannot have a future ETA"
      );
    }

    if (
      response.status === "CANCELLED" &&
      response.estimatedMinutes !== 0
    ) {
      throw new Error(
        "Cancelled orders cannot have a delivery ETA"
      );
    }

    return response;
  }
}