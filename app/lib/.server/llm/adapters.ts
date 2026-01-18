import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LLMProvider } from './providers';

/**
 * Provider Adapters
 * Normalize each provider's API into a consistent interface
 */

export interface ProviderAdapter {
    createModel(apiKey: string, modelName: string): any;
}

export const PROVIDER_ADAPTERS: Record<string, ProviderAdapter> = {
    anthropic: {
        createModel(apiKey: string, modelName: string) {
            const anthropic = createAnthropic({ apiKey });
            return anthropic(modelName);
        },
    },

    google: {
        createModel(apiKey: string, modelName: string) {
            const google = createGoogleGenerativeAI({ apiKey });
            return google(modelName);
        },
    },

    openai: {
        createModel(apiKey: string, modelName: string) {
            const openai = createOpenAI({ apiKey });
            return openai(modelName);
        },
    },
};

/**
 * Get model instance for a specific provider
 */
export function getModelForProvider(
    provider: LLMProvider,
    env: Env
): any {
    const adapter = PROVIDER_ADAPTERS[provider.id];
    if (!adapter) {
        throw new Error(`No adapter found for provider: ${provider.id}`);
    }

    // Get API key based on provider
    const apiKey = getApiKeyForProvider(provider.id, env);
    if (!apiKey) {
        throw new Error(`No API key found for provider: ${provider.name}`);
    }

    return adapter.createModel(apiKey, provider.model);
}

/**
 * Get API key for a specific provider from environment
 */
function getApiKeyForProvider(providerId: string, env: Env): string | undefined {
    switch (providerId) {
        case 'anthropic':
            return env.ANTHROPIC_API_KEY;
        case 'google':
            return (env as any).GOOGLE_API_KEY;
        case 'openai':
            return (env as any).OPENAI_API_KEY;
        default:
            return undefined;
    }
}
