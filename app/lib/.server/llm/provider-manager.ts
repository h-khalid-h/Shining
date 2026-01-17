import type { LLMProvider } from './providers';
import { getEnabledProviders } from './providers';
import { getModelForProvider } from './adapters';

/**
 * Provider Health Status
 */
interface ProviderHealth {
    successCount: number;
    failureCount: number;
    lastFailure?: Date;
    lastSuccess?: Date;
    isCircuitOpen: boolean; // Circuit breaker: true = temporarily disabled
}

/**
 * Provider Manager
 * Handles provider selection, rotation, and health tracking
 */
export class ProviderManager {
    private healthStatus: Map<string, ProviderHealth> = new Map();
    private readonly CIRCUIT_BREAKER_THRESHOLD = 3; // Failures before opening circuit
    private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute cooldown

    constructor() {
        // Initialize health status for all providers
        getEnabledProviders().forEach(provider => {
            this.healthStatus.set(provider.id, {
                successCount: 0,
                failureCount: 0,
                isCircuitOpen: false,
            });
        });
    }

    /**
     * Execute operation with automatic failover
     */
    async executeWithFailover<T>(
        operation: (provider: LLMProvider, model: any) => Promise<T>,
        env: Env,
        options?: { skipProviders?: string[] }
    ): Promise<{ result: T; provider: LLMProvider }> {
        const providers = this.getSortedHealthyProviders(options?.skipProviders);

        if (providers.length === 0) {
            throw new Error('No healthy LLM providers available');
        }

        let lastError: Error | undefined;

        for (const provider of providers) {
            try {
                console.log(`[LLM] Attempting provider: ${provider.name}`);

                const model = getModelForProvider(provider, env);
                const result = await operation(provider, model);

                this.recordSuccess(provider.id);
                console.log(`[LLM] ✓ Success with provider: ${provider.name}`);

                return { result, provider };
            } catch (error: any) {
                lastError = error;
                this.recordFailure(provider.id, error);

                console.warn(`[LLM] ✗ Provider ${provider.name} failed:`, error.message);

                // Continue to next provider
                continue;
            }
        }

        // All providers failed
        throw new Error(
            `All LLM providers failed. Last error: ${lastError?.message || 'Unknown error'}`
        );
    }

    /**
     * Get providers sorted by priority, excluding unhealthy ones
     */
    private getSortedHealthyProviders(skipProviders?: string[]): LLMProvider[] {
        return getEnabledProviders().filter(provider => {
            // Skip explicitly excluded providers
            if (skipProviders?.includes(provider.id)) {
                return false;
            }

            const health = this.healthStatus.get(provider.id);
            if (!health) return true;

            // Check circuit breaker
            if (health.isCircuitOpen) {
                // Check if cooldown period has passed
                if (health.lastFailure) {
                    const timeSinceFailure = Date.now() - health.lastFailure.getTime();
                    if (timeSinceFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
                        // Reset circuit breaker
                        health.isCircuitOpen = false;
                        health.failureCount = 0;
                        console.log(`[LLM] Circuit breaker reset for ${provider.name}`);
                        return true;
                    }
                }
                return false;
            }

            return true;
        });
    }

    /**
     * Record successful provider operation
     */
    private recordSuccess(providerId: string): void {
        const health = this.healthStatus.get(providerId);
        if (health) {
            health.successCount++;
            health.lastSuccess = new Date();
            health.failureCount = 0; // Reset failure count on success
            health.isCircuitOpen = false;
        }
    }

    /**
     * Record failed provider operation
     */
    private recordFailure(providerId: string, error: Error): void {
        const health = this.healthStatus.get(providerId);
        if (health) {
            health.failureCount++;
            health.lastFailure = new Date();

            // Open circuit breaker if threshold exceeded
            if (health.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
                health.isCircuitOpen = true;
                console.warn(
                    `[LLM] Circuit breaker opened for ${providerId} after ${health.failureCount} failures`
                );
            }
        }
    }

    /**
     * Get health status for all providers (for debugging/monitoring)
     */
    getHealthStatus(): Map<string, ProviderHealth> {
        return new Map(this.healthStatus);
    }
}

// Singleton instance
let managerInstance: ProviderManager | null = null;

/**
 * Get or create provider manager instance
 */
export function getProviderManager(): ProviderManager {
    if (!managerInstance) {
        managerInstance = new ProviderManager();
    }
    return managerInstance;
}
