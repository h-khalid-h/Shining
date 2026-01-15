import { createAnthropic } from '@ai-sdk/anthropic';

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  // Claude Sonnet 4 - May 2025, latest working model
  return anthropic('claude-sonnet-4-20250514');
}
