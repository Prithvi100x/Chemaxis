import OpenAI from "openai";

const apiKey =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;

const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? undefined;

if (!apiKey) {
  throw new Error(
    "An OpenAI API key must be set via OPENAI_API_KEY (for Railway/production) " +
      "or AI_INTEGRATIONS_OPENAI_API_KEY (for Replit).",
  );
}

export const openai = new OpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
});
