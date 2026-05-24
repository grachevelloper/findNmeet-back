import { createGoogleGenerativeAI } from '@ai-sdk/google';

export type GoogleAiConfig = {
  apiKey: string;
  model: string;
};

export function getGoogleAiConfig(env: NodeJS.ProcessEnv): GoogleAiConfig {
  const apiKey = env.GEMINI_API_KEY?.trim();
  const model = env.AI_MODEL?.trim();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  if (!model) {
    throw new Error('AI_MODEL is required');
  }

  return { apiKey, model };
}

export function createGoogleAiProvider(config: GoogleAiConfig) {
  return createGoogleGenerativeAI({
    apiKey: config.apiKey,
  });
}
