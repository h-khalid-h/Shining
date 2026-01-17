import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { graphStore } from '~/lib/stores/graph';
import { getVariant } from '~/lib/ab-testing/experiments';
import {
    trackUnderstandingShown,
    trackUnderstandingConfirmed,
    trackUnderstandingDismissed,
} from '~/lib/analytics/events';

/**
 * Hook to manage Understanding Card visibility and state
 * Includes A/B testing and analytics tracking
 */

export interface UnderstandingState {
    shouldShow: boolean;
    dismissed: boolean;
    confirmed: boolean;
    shownAt: number | null;
}

export function useUnderstanding(messageCount: number, userId: string | null) {
    const graph = useStore(graphStore);
    const [state, setState] = useState<UnderstandingState>({
        shouldShow: false,
        dismissed: false,
        confirmed: false,
        shownAt: null,
    });

    // Check A/B test variant
    const variant = userId ? getVariant('understandingCard', userId) : 'control';
    const isInTreatment = variant === 'treatment';

    useEffect(() => {
        // Only show if in treatment group
        if (!isInTreatment || !userId) {
            return;
        }

        // Conditions to show Understanding Card:
        // 1. North is identified with confidence > 70
        // 2. At least 3 messages
        // 3. Not already dismissed or confirmed
        // 4. Not currently shown

        const hasNorth = graph.north && graph.north.confidence > 70;
        const enoughMessages = messageCount >= 3;
        const notInteracted = !state.dismissed && !state.confirmed;

        if (hasNorth && enoughMessages && notInteracted && !state.shouldShow) {
            setState((prev) => ({
                ...prev,
                shouldShow: true,
                shownAt: Date.now(),
            }));

            // Track that card was shown
            if (graph.north) {
                trackUnderstandingShown(
                    userId,
                    graph.north.id || 'unknown',
                    graph.north.confidence,
                    messageCount,
                    variant,
                );
            }
        }
    }, [graph.north, messageCount, state.dismissed, state.confirmed, state.shouldShow, isInTreatment, userId, variant]);

    // Auto-dismiss after 30 seconds
    useEffect(() => {
        if (state.shouldShow && state.shownAt) {
            const timeout = setTimeout(() => {
                handleDismiss('timeout');
            }, 30000); // 30 seconds

            return () => clearTimeout(timeout);
        }
    }, [state.shouldShow, state.shownAt]);

    const handleConfirm = async () => {
        setState((prev) => ({
            ...prev,
            shouldShow: false,
            confirmed: true,
        }));

        // Track confirmation
        if (userId && graph.north) {
            const timeToConfirm = state.shownAt ? Date.now() - state.shownAt : 0;
            trackUnderstandingConfirmed(
                userId,
                graph.north.id || 'unknown',
                timeToConfirm,
                variant,
            );

            // Store bounds in Neo4j if any exist
            if (graph.bounds && graph.bounds.length > 0) {
                try {
                    await fetch('/api/graph/bounds', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            northId: graph.north.id,
                            userId,
                            bounds: graph.bounds.map(b => ({
                                metric: b.metric,
                                value: b.value,
                                threshold: b.threshold,
                                unit: b.unit,
                                confidence: b.confidence,
                            })),
                        }),
                    });
                } catch (error) {
                    console.error('Failed to store bounds:', error);
                    // Don't block confirmation on bounds storage failure
                }
            }
        }
    };

    const handleDismiss = (reason: 'user_action' | 'timeout' = 'user_action') => {
        setState((prev) => ({
            ...prev,
            shouldShow: false,
            dismissed: true,
        }));

        // Track dismissal
        if (userId && graph.north) {
            const timeShown = state.shownAt ? Date.now() - state.shownAt : 0;
            trackUnderstandingDismissed(
                userId,
                graph.north.id || 'unknown',
                reason,
                timeShown,
                variant,
            );
        }
    };

    return {
        shouldShow: state.shouldShow,
        north: graph.north,
        bounds: graph.bounds,
        onConfirm: handleConfirm,
        onDismiss: () => handleDismiss('user_action'),
        variant, // Expose variant for debugging
    };
}
