import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { graphStore } from '~/lib/stores/graph';

/**
 * Hook to manage Understanding Card visibility and state
 */

export interface UnderstandingState {
    shouldShow: boolean;
    dismissed: boolean;
    confirmed: boolean;
    shownAt: number | null;
}

export function useUnderstanding(messageCount: number) {
    const graph = useStore(graphStore);
    const [state, setState] = useState<UnderstandingState>({
        shouldShow: false,
        dismissed: false,
        confirmed: false,
        shownAt: null,
    });

    useEffect(() => {
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
        }
    }, [graph.north, messageCount, state.dismissed, state.confirmed, state.shouldShow]);

    // Auto-dismiss after 30 seconds
    useEffect(() => {
        if (state.shouldShow && state.shownAt) {
            const timeout = setTimeout(() => {
                handleDismiss('timeout');
            }, 30000); // 30 seconds

            return () => clearTimeout(timeout);
        }
    }, [state.shouldShow, state.shownAt]);

    const handleConfirm = () => {
        setState((prev) => ({
            ...prev,
            shouldShow: false,
            confirmed: true,
        }));

        // Track confirmation
        if (typeof window !== 'undefined' && graph.north) {
            console.log('Understanding confirmed', {
                northId: graph.north.id,
                confidence: graph.north.confidence,
                timeToConfirm: state.shownAt ? Date.now() - state.shownAt : 0,
            });
        }
    };

    const handleDismiss = (reason: 'user_action' | 'timeout' = 'user_action') => {
        setState((prev) => ({
            ...prev,
            shouldShow: false,
            dismissed: true,
        }));

        // Track dismissal
        if (typeof window !== 'undefined' && graph.north) {
            console.log('Understanding dismissed', {
                northId: graph.north.id,
                reason,
                timeShown: state.shownAt ? Date.now() - state.shownAt : 0,
            });
        }
    };

    return {
        shouldShow: state.shouldShow,
        north: graph.north,
        bounds: graph.bounds,
        onConfirm: handleConfirm,
        onDismiss: () => handleDismiss('user_action'),
    };
}
