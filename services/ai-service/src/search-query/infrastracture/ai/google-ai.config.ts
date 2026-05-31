import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ProxyAgent } from 'undici';

export type GoogleAiConfig = {
  apiKey: string;
  model: string;
  proxyUrl?: string;
};

export function getGoogleAiConfig(env: NodeJS.ProcessEnv): GoogleAiConfig {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.AI_MODEL?.trim();
  const proxyUrl = env.AI_PROXY_URL?.trim();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  if (!model) {
    throw new Error('AI_MODEL is required');
  }

  return { apiKey, model, proxyUrl: proxyUrl || undefined };
}

export function createGoogleAiProvider(config: GoogleAiConfig) {
  const proxyAgent = config.proxyUrl ? new ProxyAgent(config.proxyUrl) : undefined;

  return createGoogleGenerativeAI({
    apiKey: config.apiKey,
    fetch: proxyAgent
      ? (input, init) =>
          fetch(
            input,
            { ...(init ?? {}), dispatcher: proxyAgent } as unknown as RequestInit,
          )
      : undefined,
  });
}
