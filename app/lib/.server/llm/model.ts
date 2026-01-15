import { createAnthropic } from '@ai-sdk/anthropic';

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  // Claude 3.5 Sonnet - Released Oct 2024, stable and widely supported
  // To upgrade: claude-sonnet-4-5-20250929 (requires compatible API key)
  return anthropic('claude-3-5-sonnet-20241022');
}
