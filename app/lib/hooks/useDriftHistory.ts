import { useState, useEffect } from 'react';
import { driftHistory, type DriftSnapshot } from '~/lib/intelligence/drift-history';

/**
 * Hook to access drift history for a conversation.
 * Automatically loads snapshots from IndexedDB.
 */
export function useDriftHistory(conversationId: string | null) {
    const [snapshots, setSnapshots] = useState<DriftSnapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!conversationId) {
            setSnapshots([]);
            return;
        }

        const loadSnapshots = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await driftHistory.getSnapshots(conversationId);
                setSnapshots(data.sort((a, b) => a.timestamp - b.timestamp));
            } catch (err) {
                setError(err as Error);
                console.error('Failed to load drift snapshots:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSnapshots();
    }, [conversationId]);

    const saveSnapshot = async (snapshot: Omit<DriftSnapshot, 'id'>) => {
        try {
            await driftHistory.saveSnapshot(snapshot);
            // Reload snapshots
            const data = await driftHistory.getSnapshots(conversationId!);
            setSnapshots(data.sort((a, b) => a.timestamp - b.timestamp));
        } catch (err) {
            console.error('Failed to save drift snapshot:', err);
            throw err;
        }
    };

    return {
        snapshots,
        loading,
        error,
        saveSnapshot,
    };
}
