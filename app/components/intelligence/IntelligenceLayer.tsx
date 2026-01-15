/**
 * IntelligenceLayer Component
 * Wraps chat with intelligence features (Understanding, Vectors, Drift, Graph)
 * Non-invasive overlay that doesn't modify chat code
 */

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { graphStore } from '~/lib/stores/graph';
import { useUnderstanding } from '~/lib/hooks/useUnderstanding';
import { useVectors } from '~/lib/hooks/useVectors';
import { Understanding } from '~/components/intelligence/Understanding';
import { VectorOptions } from '~/components/intelligence/VectorOptions';
import { DriftNudge } from '~/components/intelligence/DriftNudge';
import { GraphVisualization } from '~/components/intelligence/GraphVisualization';
import { detectDrift, shouldShowDriftAlert } from '~/lib/intelligence/drift-detector';

export interface IntelligenceLayerProps {
    userId: string | null;
    messageCount: number;
}

export function IntelligenceLayer({ userId, messageCount }: IntelligenceLayerProps) {
    const graph = useStore(graphStore);
    const understanding = useUnderstanding(messageCount, userId);
    const vectors = useVectors(userId);

    const [lastDriftAlert, setLastDriftAlert] = useState<number | null>(null);
    const [showGraph, setShowGraph] = useState(false);

    // Auto-generate vectors after Understanding is confirmed
    useEffect(() => {
        if (understanding.confirmed && graph.north && graph.bounds.length > 0 && !vectors.vectors.length) {
            vectors.generateVectors(graph.north, graph.bounds);
        }
    }, [understanding.confirmed, graph.north, graph.bounds]);

    // Detect drift
    const driftAlert = detectDrift(graph.signal);
    const showDrift = driftAlert && shouldShowDriftAlert(lastDriftAlert, graph.signal.drift);

    return (
        <>
            {/* Understanding Card - shows after 3+ messages */}
            {understanding.shouldShow && (
                <Understanding
                    north={understanding.north}
                    bounds={understanding.bounds}
                    onConfirm={understanding.onConfirm}
                    onDismiss={understanding.onDismiss}
                />
            )}

            {/* Vector Options - shows after North confirmed */}
            {vectors.vectors.length > 0 && !vectors.selectedVector && (
                <VectorOptions
                    vectors={vectors.vectors}
                    onSelect={vectors.selectVector}
                    onDismiss={vectors.clearVectors}
                />
            )}

            {/* Drift Nudge - shows when drifting */}
            {showDrift && driftAlert && (
                <DriftNudge
                    alert={driftAlert}
                    onAcknowledge={() => setLastDriftAlert(Date.now())}
                    onAdjustGoal={() => {
                        // TODO: Open North editor
                        console.log('Adjust goal clicked');
                    }}
                    onCreateVector={() => {
                        if (graph.north && graph.bounds.length > 0) {
                            vectors.generateVectors(graph.north, graph.bounds);
                        }
                    }}
                />
            )}

            {/* Graph Visualization - toggle button */}
            {graph.north && (
                <button
                    onClick={() => setShowGraph(!showGraph)}
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '20px',
                        padding: '12px 20px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        zIndex: 999,
                    }}
                >
                    {showGraph ? 'Hide' : 'View'} Decision Map
                </button>
            )}

            {/* Graph Visualization Modal */}
            {showGraph && graph.north && (
                <GraphVisualization
                    data={{
                        nodes: [
                            {
                                id: graph.north.id || 'north-1',
                                type: 'north',
                                label: 'Goal',
                                description: graph.north.description,
                                confidence: graph.north.confidence,
                                createdAt: new Date().toISOString(),
                                x: 400,
                                y: 200,
                            },
                            ...graph.bounds.map((bound, i) => ({
                                id: `bound-${i}`,
                                type: 'bound' as const,
                                label: bound.type,
                                description: bound.description,
                                createdAt: new Date().toISOString(),
                                x: 200 + i * 150,
                                y: 350,
                            })),
                        ],
                        edges: graph.bounds.map((_, i) => ({
                            from: graph.north?.id || 'north-1',
                            to: `bound-${i}`,
                            type: 'constrains' as const,
                        })),
                    }}
                    onNodeClick={(node) => console.log('Node clicked:', node)}
                    onClose={() => setShowGraph(false)}
                />
            )}
        </>
    );
}
