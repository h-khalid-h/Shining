import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { graphStore } from '~/lib/stores/graph';
import { useUnderstanding } from '~/lib/hooks/useUnderstanding';
import { useVectors } from '~/lib/hooks/useVectors';
import { useDebounce } from '~/lib/hooks/useDebounce';
import { useDriftHistory } from '~/lib/hooks/useDriftHistory';
import { useIntelligenceShortcuts } from '~/lib/hooks/useIntelligenceShortcuts';
import { IntelligenceLoadingState } from '~/components/intelligence/IntelligenceLoadingState';
import { ContextRibbon } from '~/components/intelligence/ContextRibbon';
import { detectDrift, shouldShowDriftAlert } from '~/lib/intelligence/drift-detector';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';

// Lazy load Intelligence components for better performance
const Understanding = lazy(() => import('~/components/intelligence/Understanding').then(m => ({ default: m.Understanding })));
const VectorOptions = lazy(() => import('~/components/intelligence/VectorOptions').then(m => ({ default: m.VectorOptions })));
const DriftNudge = lazy(() => import('~/components/intelligence/DriftNudge').then(m => ({ default: m.DriftNudge })));
const NorthEditor = lazy(() => import('~/components/intelligence/NorthEditor').then(m => ({ default: m.NorthEditor })));
const GraphVisualization = lazy(() => import('~/components/intelligence/GraphVisualization').then(m => ({ default: m.GraphVisualization })));
const DriftTimelineModal = lazy(() => import('~/components/intelligence/DriftTimelineModal').then(m => ({ default: m.DriftTimelineModal })));
const IntelligenceDashboard = lazy(() => import('~/components/intelligence/IntelligenceDashboard').then(m => ({ default: m.IntelligenceDashboard })));

export interface IntelligenceLayerProps {
    userId: string | null;
    messageCount: number;
}

export function IntelligenceLayer({ userId, messageCount }: IntelligenceLayerProps) {
    const graph = useStore(graphStore);
    const understanding = useUnderstanding(messageCount, userId);
    const vectors = useVectors(userId);
    const { saveSnapshot } = useDriftHistory(userId);

    const [lastDriftAlert, setLastDriftAlert] = useState<number | null>(null);
    const [showGraph, setShowGraph] = useState(false);
    const [isUnderstandingExpanded, setIsUnderstandingExpanded] = useState(false);
    const [intelligenceError, setIntelligenceError] = useState(false);
    const [showNorthEditor, setShowNorthEditor] = useState(false);
    const [showDriftTimeline, setShowDriftTimeline] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);

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

    // Track drift history - save snapshot when drift changes
    useEffect(() => {
        if (graph.north && graph.signal && graph.signal.drift !== undefined && messageCount > 0 && userId) {
            saveSnapshot({
                conversationId: userId,
                messageIndex: messageCount,
                driftScore: graph.signal.drift,
                driftType: driftAlert?.type || 'none',
                contextSnapshot: {
                    north: graph.north,
                    bounds: graph.bounds,
                    signal: graph.signal,
                },
                timestamp: Date.now(),
            }).catch(err => console.error('Failed to save drift snapshot:', err));
        }
    }, [graph.signal?.drift, messageCount]);

    // Handle North update
    const handleUpdateNorth = async (updatedDescription: string) => {
        if (!graph.north || !userId) return;

        try {
            const response = await fetch('/api/graph/update-north', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    northId: graph.north.id,
                    description: updatedDescription,
                    userId,
                    confidence: graph.north.confidence,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update North');
            }

            const data = await response.json();
            console.log('✓ North updated successfully:', data);

            // Update local graph store
            graphStore.set({
                ...graph,
                north: {
                    ...graph.north,
                    description: updatedDescription,
                },
            });
        } catch (error) {
            console.error('Error updating North:', error);
            throw error;
        }
    };

    // Register keyboard shortcuts
    useIntelligenceShortcuts({
        toggleDashboard: () => setShowDashboard(prev => !prev),
        toggleGraph: () => setShowGraph(prev => !prev),
    });

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
                    onViewHistory={() => setShowDriftTimeline(true)}
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
                        <Suspense fallback={<LoadingSpinner size="sm" />}>
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
                        </Suspense>
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
                <Suspense fallback={<LoadingSpinner size="sm" />}>
                    <VectorOptions
                        vectors={vectors.vectors}
                        onSelect={vectors.selectVector}
                        onDismiss={vectors.clearVectors}
                    />
                </Suspense>
            )}

            {/* Drift Nudge - shows when drifting */}
            {showDrift && driftAlert && (
                <Suspense fallback={null}>
                    <DriftNudge
                        alert={driftAlert}
                        onAcknowledge={() => setLastDriftAlert(Date.now())}
                        onAdjustGoal={() => setShowNorthEditor(true)}
                        onCreateVector={() => {
                            if (graph.north && graph.bounds.length > 0) {
                                vectors.generateVectors(graph.north, graph.bounds);
                            }
                        }}
                    />
                </Suspense>
            )}

            {/* North Editor Modal */}
            {graph.north && (
                <Suspense fallback={null}>
                    <NorthEditor
                        north={graph.north}
                        onSave={handleUpdateNorth}
                        onClose={() => setShowNorthEditor(false)}
                        visible={showNorthEditor}
                    />
                </Suspense>
            )}

            {/* Graph Visualization - toggle button */}
            {graph.north && (
                <div className="fixed bottom-6 left-6 flex gap-3 z-999">
                    <button
                        onClick={() => setShowDashboard(!showDashboard)}
                        style={{
                            padding: '12px 20px',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        📊 {showDashboard ? 'Hide' : 'View'} Dashboard
                    </button>
                    <button
                        onClick={() => setShowGraph(!showGraph)}
                        style={{
                            padding: '12px 20px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        🗺️ {showGraph ? 'Hide' : 'View'} Decision Map
                    </button>
                </div>
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

            {/* Drift Timeline Modal */}
            <Suspense fallback={null}>
                <DriftTimelineModal
                    conversationId={userId}
                    onClose={() => setShowDriftTimeline(false)}
                    visible={showDriftTimeline}
                />
            </Suspense>

            {/* Intelligence Dashboard Modal */}
            {showDashboard && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-bolt-elements-background-depth-1 rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden border border-bolt-elements-borderColor"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-bolt-elements-borderColor">
                            <h2 className="text-xl font-bold text-bolt-elements-textPrimary">Intelligence Dashboard</h2>
                            <button
                                onClick={() => setShowDashboard(false)}
                                className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                            >
                                <div className="i-ph:x text-2xl" />
                            </button>
                        </div>
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner size="lg" />
                            </div>
                        }>
                            <IntelligenceDashboard userId={userId} />
                        </Suspense>
                    </motion.div>
                </div>
            )}
        </>
    );
}
