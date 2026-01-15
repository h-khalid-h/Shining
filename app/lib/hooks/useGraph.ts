import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import {
    graphStore,
    setNorth,
    setBounds,
    updateSignal,
    setLoading,
    setError,
    type GraphState,
} from '../stores/graph';
import { graphClient } from '../api/graph.client';

/**
 * React hook for graph state management
 * Automatically fetches and subscribes to graph updates
 */
export function useGraph(northId: string | null) {
    const state = useStore(graphStore);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        // Cleanup previous subscription
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        // No North ID - reset state
        if (!northId) {
            setLoading(false);
            return;
        }

        // Fetch initial state
        setLoading(true);
        setError(null);

        graphClient
            .getGraphState(northId)
            .then((data) => {
                if (data.north) setNorth(data.north);
                if (data.bounds) setBounds(data.bounds);
                if (data.signal) updateSignal(data.signal);
                setLoading(false);

                // Subscribe to updates
                unsubscribeRef.current = graphClient.subscribeToUpdates(
                    northId,
                    (updatedData) => {
                        if (updatedData.north) setNorth(updatedData.north);
                        if (updatedData.bounds) setBounds(updatedData.bounds);
                        if (updatedData.signal) updateSignal(updatedData.signal);
                    },
                    {
                        interval: 10000, // Poll every 10 seconds
                        onError: (error) => {
                            setError(error.message);
                        },
                    },
                );
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });

        // Cleanup on unmount or northId change
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [northId]);

    return state;
}

/**
 * Hook to get active North ID
 */
export function useActiveNorth() {
    const [northId, setNorthId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        graphClient
            .getActiveNorth()
            .then((data) => {
                setNorthId(data?.northId || null);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Failed to fetch active North:', error);
                setLoading(false);
            });
    }, []);

    return { northId, loading };
}
