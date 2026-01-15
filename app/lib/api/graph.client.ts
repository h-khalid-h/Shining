import type { GraphState } from '../stores/graph';

/**
 * Graph API Client
 * Handles communication with backend graph API
 */

export class GraphClient {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Get current graph state for a North
     */
    async getGraphState(northId: string): Promise<GraphState> {
        const response = await fetch(`${this.baseUrl}/graph/${northId}`);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch graph state: ${error}`);
        }

        return response.json();
    }

    /**
     * Get user's active North
     */
    async getActiveNorth(): Promise<{ northId: string } | null> {
        const response = await fetch(`${this.baseUrl}/graph/active`);

        if (response.status === 404) {
            return null; // No active North
        }

        if (!response.ok) {
            throw new Error('Failed to fetch active North');
        }

        return response.json();
    }

    /**
     * Subscribe to graph updates via polling
     * Returns unsubscribe function
     */
    subscribeToUpdates(
        northId: string,
        callback: (state: GraphState) => void,
        options: {
            interval?: number;
            onError?: (error: Error) => void;
        } = {},
    ): () => void {
        const { interval = 5000, onError } = options;

        const intervalId = setInterval(async () => {
            try {
                const state = await this.getGraphState(northId);
                callback(state);
            } catch (error) {
                if (onError) {
                    onError(error as Error);
                } else {
                    console.error('Graph update failed:', error);
                }
            }
        }, interval);

        // Return cleanup function
        return () => clearInterval(intervalId);
    }

    /**
     * Manually trigger signal recalculation
     */
    async recalculateSignal(northId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/graph/${northId}/signal`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to recalculate signal');
        }
    }
}

// Singleton instance
export const graphClient = new GraphClient();
