import {
  ModelPricing
} from "../services/cost.service.js";

export const modelPricing:
  Record<string, ModelPricing> = {

  "model-a": {
    inputPerMillionTokens: 1,
    outputPerMillionTokens: 4,
  },

  "model-b": {
    inputPerMillionTokens: 0.2,
    outputPerMillionTokens: 0.8,
  },
};