import { createAnthropic } from '@ai-sdk/anthropic';

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  // Using Claude Sonnet 4.5 - latest recommended model (Sept 2025)
  // Fallback: claude-3-5-sonnet-20241022 if newer model not available
  return anthropic('claude-sonnet-4-5-20250929');
}
