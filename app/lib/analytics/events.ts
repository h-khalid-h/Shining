/**
 * Analytics Events System
 * Track user interactions for A/B testing and product analytics
 */

export interface AnalyticsEvent {
    event: string;
    userId: string;
    timestamp: string;
    properties: Record<string, any>;
}

/**
 * Track an analytics event
 * In production, this would send to your analytics service
 */
export function trackEvent(event: AnalyticsEvent): void {
    // For now, log to console
    // In production, send to analytics service (Mixpanel, Amplitude, etc.)
    console.log('[Analytics]', event);

    // Store in localStorage for development
    if (typeof window !== 'undefined') {
        const events = getStoredEvents();
        events.push(event);

        // Keep last 100 events
        if (events.length > 100) {
            events.shift();
        }

        localStorage.setItem('analytics_events', JSON.stringify(events));
    }
}

/**
 * Get stored events from localStorage
 */
function getStoredEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem('analytics_events');
    return stored ? JSON.parse(stored) : [];
}

/**
 * Understanding Card Events
 */

export function trackUnderstandingShown(
    userId: string,
    northId: string,
    confidence: number,
    messageCount: number,
    variant: 'control' | 'treatment',
): void {
    trackEvent({
        event: 'understanding_shown',
        userId,
        timestamp: new Date().toISOString(),
        properties: {
            northId,
            confidence,
            messageCount,
            variant,
        },
    });
}

export function trackUnderstandingConfirmed(
    userId: string,
    northId: string,
    timeToConfirm: number,
    variant: 'control' | 'treatment',
): void {
    trackEvent({
        event: 'understanding_confirmed',
        userId,
        timestamp: new Date().toISOString(),
        properties: {
            northId,
            timeToConfirm,
            variant,
        },
    });
}

export function trackUnderstandingDismissed(
    userId: string,
    northId: string,
    reason: 'user_action' | 'timeout',
    timeShown: number,
    variant: 'control' | 'treatment',
): void {
    trackEvent({
        event: 'understanding_dismissed',
        userId,
        timestamp: new Date().toISOString(),
        properties: {
            northId,
            reason,
            timeShown,
            variant,
        },
    });
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: AnalyticsEvent[];
} {
    const events = getStoredEvents();

    const eventsByType: Record<string, number> = {};
    events.forEach((event) => {
        eventsByType[event.event] = (eventsByType[event.event] || 0) + 1;
    });

    return {
        totalEvents: events.length,
        eventsByType,
        recentEvents: events.slice(-10),
    };
}

/**
 * Clear analytics data (for testing)
 */
export function clearAnalytics(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('analytics_events');
    }
}
