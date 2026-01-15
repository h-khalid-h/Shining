/**
 * Graph Query Cache
 * Reduces database load by caching recent queries
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export class GraphCache {
    private cache: Map<string, CacheEntry<any>>;
    private ttl: number; // Time to live in milliseconds

    constructor(ttlSeconds: number = 30) {
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000;
    }

    /**
     * Get cached data if available and not expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        const age = now - entry.timestamp;

        if (age > this.ttl) {
            // Expired - remove from cache
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Store data in cache
     */
    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Clear specific key
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * Clean up expired entries
     */
    cleanup(): void {
        const now = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

// Singleton instance
export const graphCache = new GraphCache(30); // 30 second TTL

// Cleanup expired entries every minute
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        graphCache.cleanup();
    }, 60000);
}
