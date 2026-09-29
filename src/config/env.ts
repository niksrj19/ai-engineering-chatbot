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
};