/**
 * Usage Tracking Module
 * Tracks user usage for billing and limits
 */

export interface UsageStats {
    userId: string;
    messagesUsedToday: number;
    lastResetDate: string; // ISO date string
    totalMessagesAllTime: number;
    currentProjects: number;
}

/**
 * Get usage stats from localStorage
 */
export function getUsageStats(userId: string): UsageStats {
    const key = `gence_usage_${userId}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
        return {
            userId,
            messagesUsedToday: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
            totalMessagesAllTime: 0,
            currentProjects: 0,
        };
    }

    const stats: UsageStats = JSON.parse(stored);

    // Check if we need to reset daily counter
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastResetDate !== today) {
        stats.messagesUsedToday = 0;
        stats.lastResetDate = today;
        saveUsageStats(stats);
    }

    return stats;
}

/**
 * Save usage stats to localStorage
 */
export function saveUsageStats(stats: UsageStats): void {
    const key = `gence_usage_${stats.userId}`;
    localStorage.setItem(key, JSON.stringify(stats));
}

/**
 * Increment message count
 */
export function incrementMessageCount(userId: string): UsageStats {
    const stats = getUsageStats(userId);
    stats.messagesUsedToday += 1;
    stats.totalMessagesAllTime += 1;
    saveUsageStats(stats);
    return stats;
}

/**
 * Update project count
 */
export function updateProjectCount(userId: string, count: number): UsageStats {
    const stats = getUsageStats(userId);
    stats.currentProjects = count;
    saveUsageStats(stats);
    return stats;
}

/**
 * Reset daily usage (for testing)
 */
export function resetDailyUsage(userId: string): void {
    const stats = getUsageStats(userId);
    stats.messagesUsedToday = 0;
    stats.lastResetDate = new Date().toISOString().split('T')[0];
    saveUsageStats(stats);
}
