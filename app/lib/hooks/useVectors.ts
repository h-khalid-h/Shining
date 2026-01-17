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

    const selectVector = async (vector: Vector) => {
        setSelectedVector(vector);

        // Track selection
        console.log('Vector selected:', {
            vectorId: vector.id,
            northId: vector.northId,
            approach: vector.description,
        });

        // Store as Pivot in graph database
        try {
            const response = await fetch('/api/vectors/pivot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vectorId: vector.id,
                    northId: vector.northId,
                    userId,
                    approach: vector.description,
                    confidence: vector.confidence,
                    metadata: {
                        selectedAt: new Date().toISOString(),
                        vectorType: vector.type || 'strategic',
                    },
                }),
            });

            if (!response.ok) {
                console.error('Failed to store pivot:', await response.text());
            } else {
                console.log('✓ Pivot stored successfully');
            }
        } catch (err) {
            console.error('Error storing pivot:', err);
            // Non-blocking - selection still works even if storage fails
        }
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
