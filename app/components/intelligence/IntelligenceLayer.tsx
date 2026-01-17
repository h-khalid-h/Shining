import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { graphStore } from '~/lib/stores/graph';
import { useUnderstanding } from '~/lib/hooks/useUnderstanding';
import { useVectors } from '~/lib/hooks/useVectors';
import { useDebounce } from '~/lib/hooks/useDebounce';
import { Understanding } from '~/components/intelligence/Understanding';
import { VectorOptions } from '~/components/intelligence/VectorOptions';
import { DriftNudge } from '~/components/intelligence/DriftNudge';
import { IntelligenceLoadingState } from '~/components/intelligence/IntelligenceLoadingState';
import { ContextRibbon } from '~/components/intelligence/ContextRibbon';
import { detectDrift, shouldShowDriftAlert } from '~/lib/intelligence/drift-detector';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';

// Lazy load GraphVisualization for better performance
const GraphVisualization = lazy(() => import('~/components/intelligence/GraphVisualization').then(m => ({ default: m.GraphVisualization })));

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
    const [isUnderstandingExpanded, setIsUnderstandingExpanded] = useState(false);
    const [intelligenceError, setIntelligenceError] = useState(false);

    // Auto-generate vectors after Understanding is confirmed
    useEffect(() => {
        try {
            if (understanding.confirmed && graph.north && graph.bounds.length > 0 && !vectors.vectors.length) {
                vectors.generateVectors(graph.north, graph.bounds);
            }
        } catch (error) {
            console.error('Error generating vectors:', error);
            setIntelligenceError(true);
        }
    }, [understanding.confirmed, graph.north, graph.bounds]);

    // Debounce signal to reduce drift detection calculations
    const debouncedSignal = useDebounce(graph.signal, 300);

    // Detect drift with debounced signal
    const driftAlert = useMemo(() => {
        try {
            return detectDrift(debouncedSignal);
        } catch (error) {
            console.error('Error detecting drift:', error);
            setIntelligenceError(true);
            return null;
        }
    }, [debouncedSignal]);

    const showDrift = driftAlert && shouldShowDriftAlert(lastDriftAlert, graph.signal.drift);

    return (
        <>
            {/* Graceful Degradation - Intelligence Error Fallback */}
            {intelligenceError && (
                <div className="fixed top-16 right-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg shadow-lg z-50 max-w-sm">
                    <div className="flex items-start gap-2">
                        <div className="i-ph:warning text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                                Intelligence features temporarily unavailable
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                Core chat functionality continues to work. Intelligence features will restore automatically.
                            </p>
                        </div>
                        <button
                            onClick={() => setIntelligenceError(false)}
                            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                            aria-label="Dismiss"
                        >
                            <div className="i-ph:x text-lg" />
                        </button>
                    </div>
                </div>
            )}

            {/* Context Ribbon - Always visible when understanding exists */}
            {graph.north && (
                <ContextRibbon
                    north={graph.north}
                    drift={graph.signal.drift}
                    confidence={graph.north.confidence}
                    onClickUnderstanding={() => setIsUnderstandingExpanded(!isUnderstandingExpanded)}
                    isUnderstandingExpanded={isUnderstandingExpanded}
                />
            )}

            {/* Understanding Card - Expandable from Context Ribbon */}
            {understanding.shouldShow && isUnderstandingExpanded && (
                understanding.loading ? (
                    <div className="fixed top-16 right-6 bg-bolt-elements-background-depth-1 p-4 rounded-lg shadow-lg border border-bolt-elements-borderColor z-40">
                        <IntelligenceLoadingState
                            stage="understanding"
                            customMessage="Analyzing conversation context..."
                            size="sm"
                        />
                    </div>
                ) : (
                    <div className="fixed top-16 right-6 z-40">
                        <Understanding
                            north={understanding.north}
                            bounds={understanding.bounds}
                            onConfirm={() => {
                                understanding.onConfirm();
                                setIsUnderstandingExpanded(false);
                            }}
                            onDismiss={() => setIsUnderstandingExpanded(false)}
                            visible={true}
                        />
                    </div>
                )
            )}

            {/* Vector Options - shows after North confirmed */}
            {vectors.loading ? (
                <div className="fixed bottom-20 right-6 bg-bolt-elements-background-depth-1 p-4 rounded-lg shadow-lg border border-bolt-elements-borderColor">
                    <IntelligenceLoadingState
                        stage="analyzing"
                        customMessage="Identifying strategic options..."
                        size="sm"
                    />
                </div>
            ) : vectors.vectors.length > 0 && !vectors.selectedVector && (
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
                <Suspense fallback={
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                        <LoadingSpinner size="lg" />
                    </div>
                }>
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
                </Suspense>
            )}
        </>
    );
}
