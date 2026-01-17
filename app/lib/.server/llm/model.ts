import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { getProviderManager } from './provider-manager';

/**
 * Get model with automatic provider failover
 * This is the recommended function for all LLM operations
 */
export async function getModel(env: Env) {
  const manager = getProviderManager();

  const { result: model } = await manager.executeWithFailover(
    async (provider, model) => model,
    env
  );

  return model;
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use getModel() instead for automatic failover
 */
export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({ apiKey });
  return anthropic('claude-sonnet-4-20250514');
}

/**
 * Get Google Gemini model directly (without failover)
 */
export function getGoogleModel(apiKey: string) {
  const google = createGoogleGenerativeAI({ apiKey });
  return google('gemini-2.0-flash-exp');
}

/**
 * Get OpenAI model directly (without failover)
 */
export function getOpenAIModel(apiKey: string) {
  const openai = createOpenAI({ apiKey });
  return openai('gpt-4-turbo');
}
