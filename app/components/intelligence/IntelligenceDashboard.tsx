import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { graphStore } from '~/lib/stores/graph';
import { DecisionHistory } from '~/components/intelligence/DecisionHistory';
import { ActivityFeed } from '~/components/intelligence/ActivityFeed';
import { StatsDashboard } from '~/components/intelligence/StatsDashboard';
import { Button } from '~/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

export interface IntelligenceDashboardProps {
    userId: string | null;
    className?: string;
}

/**
 * Intelligence Dashboard
 * 
 * Comprehensive view of project intelligence including:
 * - Project health metrics (Stats Dashboard)
 * - Decision history timeline
 * - Real-time activity feed
 * 
 * Accessible via the intelligence layer sidebar
 */
export function IntelligenceDashboard({ userId, className }: IntelligenceDashboardProps) {
    const graph = useStore(graphStore);
    const [activeTab, setActiveTab] = useState<'overview' | 'decisions' | 'activity'>('overview');
    const [loading, setLoading] = useState(true);

    // Fetch active North and populate graphStore on mount
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        async function loadActiveNorth() {
            try {
                // First, get the active North ID
                const activeRes = await fetch('/api/graph/active');
                const activeData = await activeRes.json() as { northId?: string };

                if (!activeData.northId) {
                    console.log('No active North found');
                    setLoading(false);
                    return;
                }

                // Then, fetch the full graph data for that North
                const graphRes = await fetch(`/api/graph/${activeData.northId}`);
                const graphData = await graphRes.json() as { north?: any; bounds?: any[]; signal?: any };

                if (graphData.north) {
                    // Update the graphStore
                    graphStore.set({
                        north: graphData.north,
                        bounds: graphData.bounds || [],
                        signal: graphData.signal || { drift: 0, magnitude: 0 },
                        loading: false,
                        error: null,
                    });
                }
            } catch (error) {
                console.error('Failed to load active North:', error);
            } finally {
                setLoading(false);
            }
        }

        loadActiveNorth();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="i-ph:spinner text-4xl text-bolt-elements-textTertiary animate-spin" />
            </div>
        );
    }

    if (!graph.north || !userId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="i-ph:compass text-6xl text-bolt-elements-textTertiary mb-4" />
                <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-2">
                    No Active Project
                </h2>
                <p className="text-sm text-bolt-elements-textSecondary max-w-md">
                    Start a conversation to establish a North (goal) and begin tracking your project's intelligence.
                </p>
            </div>
        );
    }

    return (
        <div className={`intelligence-dashboard h-full flex flex-col ${className || ''}`}>
            {/* Header with Tabs */}
            <div className="flex-shrink-0 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                <div className="px-6 pt-6 pb-0">
                    <h1 className="text-2xl font-bold text-bolt-elements-textPrimary mb-4 flex items-center gap-2">
                        <div className="i-ph:brain text-3xl" />
                        Intelligence Dashboard
                    </h1>

                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                            <TabButton
                                active={activeTab === 'overview'}
                                onClick={() => setActiveTab('overview')}
                                icon="i-ph:chart-line"
                            >
                                Overview
                            </TabButton>
                            <TabButton
                                active={activeTab === 'decisions'}
                                onClick={() => setActiveTab('decisions')}
                                icon="i-ph:path"
                            >
                                Decisions
                            </TabButton>
                            <TabButton
                                active={activeTab === 'activity'}
                                onClick={() => setActiveTab('activity')}
                                icon="i-ph:activity"
                            >
                                Activity
                            </TabButton>
                        </div>
                        <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/drift/calculate', { method: 'POST' });
                                    if (res.ok) {
                                        // Reload the page or re-fetch data to show new signal
                                        window.location.reload(); 
                                    }
                                } catch (e) {
                                    console.error('Failed to refresh drift', e);
                                }
                            }}
                        >
                           <div className="i-ph:arrows-clockwise mr-2" />
                           Refresh Intelligence
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Stats Dashboard */}
                            <StatsDashboard northId={graph.north.id} />

                            {/* Two-column layout for History and Activity */}
                            <div className="grid grid-cols- 1 lg:grid-cols-2 gap-6">
                                <div className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                                            Recent Decisions
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTab('decisions')}
                                        >
                                            View All
                                        </Button>
                                    </div>
                                    <DecisionHistory northId={graph.north.id} className="max-h-96 overflow-y-auto" />
                                </div>

                                <div className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-4">
                                    <ActivityFeed northId={graph.north.id} maxItems={10} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'decisions' && (
                        <motion.div
                            key="decisions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DecisionHistory northId={graph.north.id} />
                        </motion.div>
                    )}

                    {activeTab === 'activity' && (
                        <motion.div
                            key="activity"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ActivityFeed northId={graph.north.id} maxItems={50} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: string;
    children: React.ReactNode;
}

function TabButton({ active, onClick, icon, children }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
        flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-colors
        ${active
                    ? 'bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary border-t border-x border-bolt-elements-borderColor'
                    : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-1'}
      `}
        >
            <div className={`${icon} text-lg`} />
            {children}
        </button>
    );
}
