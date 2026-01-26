import posthog from 'posthog-js';

/**
 * Initialize PostHog analytics
 * Call this once in the root component
 */
export function initAnalytics() {
    if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
        posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
            api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
            autocapture: false, // Manual tracking for precision
            capture_pageview: true,
            capture_pageleave: true,
            persistence: 'localStorage',
        });
    }
}

/**
 * Analytics event tracking
 * Provides type-safe event tracking for key user actions
 */
export const analytics = {
    // Intent extraction events
    intentExtracted: (data: {
        intent: string;
        confidence: number;
        extractionTimeMs: number;
    }) => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.capture('intent_extracted', data);
        }
    },

    // Vector generation events
    vectorGenerated: (data: {
        vectorCount: number;
        generationTimeMs: number;
    }) => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.capture('vector_generated', data);
        }
    },

    // Drift detection events
    driftDetected: (data: {
        driftScore: number;
        userAction: 'dismissed' | 'corrected' | 'ignored';
    }) => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.capture('drift_detected', data);
        }
    },

    // Graph visualization events
    graphVisualized: (data: {
        nodeCount: number;
        edgeCount: number;
    }) => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.capture('graph_visualized', data);
        }
    },

    // User journey events
    understandingCardShown: () => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.capture('understanding_card_shown');
        }
    },

    understandingCardConfirmed: () => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.capture('understanding_card_confirmed');
        }
    },

    vectorOptionSelected: (option: string) => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.capture('vector_option_selected', { option });
        }
    },

    // Performance tracking
    trackPerformance: (metric: string, value: number) => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.capture('performance_metric', { metric, value });
        }
    },

    // User identification
    identify: (userId: string, properties?: Record<string, any>) => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.identify(userId, properties);
        }
    },

    // Generic event tracking
    track: (event: string, properties?: Record<string, any>) => {
        if (typeof window !== 'undefined' && posthog.__loaded) {
            posthog.capture(event, properties);
        }
    },
};
