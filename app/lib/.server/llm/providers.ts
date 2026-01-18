/**
 * LLM Provider Configuration
 * Defines available providers, their priorities, and capabilities
 */

export interface LLMProvider {
    id: 'anthropic' | 'google' | 'openai';
    name: string;
    model: string;
    priority: number; // Lower = higher priority
    enabled: boolean;
    maxRetries: number;
}

export const LLM_PROVIDERS: LLMProvider[] = [
    {
        id: 'anthropic',
        name: 'Anthropic Claude',
        model: 'claude-sonnet-4-20250514',
        priority: 1,
        enabled: false, // Temporarily disabled due to billing issue - will use Google/OpenAI
        maxRetries: 1,
    },
    {
        id: 'google',
        name: 'Google Gemini',
        model: 'gemini-2.0-flash-exp',
        priority: 2,
        enabled: true,
        maxRetries: 1,
    },
    {
        id: 'openai',
        name: 'OpenAI GPT-4',
        model: 'gpt-4-turbo',
        priority: 3,
        enabled: true, // Enabled with API key
        maxRetries: 1,
    },
];

/**
 * Get enabled providers sorted by priority
 */
export function getEnabledProviders(): LLMProvider[] {
    return LLM_PROVIDERS
        .filter(p => p.enabled)
        .sort((a, b) => a.priority - b.priority);
}

/**
 * Get provider by ID
 */
export function getProvider(id: string): LLMProvider | undefined {
    return LLM_PROVIDERS.find(p => p.id === id);
}
