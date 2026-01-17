import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { graphStore } from '~/lib/stores/graph';
import { useDebounce } from './useDebounce';

export interface IntentSuggestion {
    action: string;
    reasoning: string;
    autoComplete?: string;
}

export interface IntentPrediction {
    intent: string;
    suggestions: IntentSuggestion[];
    confidence: number;
}

/**
 * Hook to predict user intent based on their input.
 * Uses debounced API calls to avoid overwhelming the backend.
 */
export function useIntentPrediction(recentMessages: string[] = []) {
    const graph = useStore(graphStore);
    const [prediction, setPrediction] = useState<IntentPrediction | null>(null);
    const [loading, setLoading] = useState(false);

    const predictIntent = async (input: string) => {
        if (input.length < 10) {
            setPrediction(null);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/predict-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input,
                    north: graph.north,
                    bounds: graph.bounds,
                    recentMessages,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to predict intent');
            }

            const data = await response.json();
            setPrediction(data);
        } catch (error) {
            console.error('Intent prediction error:', error);
            setPrediction(null);
        } finally {
            setLoading(false);
        }
    };

    const clearPrediction = () => {
        setPrediction(null);
    };

    return {
        prediction,
        loading,
        predictIntent,
        clearPrediction,
    };
}
