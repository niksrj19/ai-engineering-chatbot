export interface ModelPricing {
  inputPerMillionTokens: number;
  outputPerMillionTokens: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export class CostService {

  calculate(
    usage: {
      inputTokens: number;
      outputTokens: number;
    },
    pricing: ModelPricing
  ): CostBreakdown {

    const inputCost =
      (usage.inputTokens / 1_000_000) *
      pricing.inputPerMillionTokens;

    const outputCost =
      (usage.outputTokens / 1_000_000) *
      pricing.outputPerMillionTokens;

    return {
      inputCost,
      outputCost,
      totalCost:
        inputCost +
        outputCost,
    };
  }
}