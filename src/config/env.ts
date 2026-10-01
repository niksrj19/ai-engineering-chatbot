import dotenv from "dotenv";

dotenv.config();

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),

  groqApiKey: getRequiredEnv("GROQ_API_KEY"),

  groqModel: getRequiredEnv("GROQ_MODEL"),

  retry: {
    maxAttempts: 3,

    baseDelayMs: 500,

    maxDelayMs: 5000,
  },
  tokenBudget: {
    maxContextTokens: 16000,
    reservedOutputTokens: 4000,
    safetyBufferTokens: 1000,
  },
};

export const aiBudget = {
  maxLLMRounds: 5,
  maxToolCalls: 5,
  maxInputTokens: 50_000,
  maxOutputTokens: 10_000,
  maxTotalTokens: 100_000,
};