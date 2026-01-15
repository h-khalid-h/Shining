/**
 * useVectors Hook
 * Manages Vector generation and selection
 */

import { useState } from 'react';
import type { Vector } from '~/lib/intelligence/vector-generator';

export function useVectors(userId: string | null) {
    const [vectors, setVectors] = useState<Vector[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVector, setSelectedVector] = useState<Vector | null>(null);

    const generateVectors = async (north: any, bounds: any[], context?: string) => {
        if (!userId) {
            setError('User not authenticated');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/vectors/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ north, bounds, context }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate vectors');
            }

            const data = await response.json();
            setVectors(data.vectors);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Vector generation failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectVector = (vector: Vector) => {
        setSelectedVector(vector);

        // Track selection
        console.log('Vector selected:', {
            vectorId: vector.id,
            northId: vector.northId,
            approach: vector.description,
        });

        // TODO: Store as Pivot in graph database
    };

    const clearVectors = () => {
        setVectors([]);
        setSelectedVector(null);
        setError(null);
    };

    return {
        vectors,
        loading,
        error,
        selectedVector,
        generateVectors,
        selectVector,
        clearVectors,
    };
}
