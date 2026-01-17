import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDriftHistory } from '~/lib/hooks/useDriftHistory';
import { detectDriftPatterns, calculateDriftStats } from '~/lib/intelligence/drift-patterns';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';

interface DriftTimelineProps {
    conversationId: string | null;
}

/**
 * Drift Timeline visualization component.
 * Shows drift history, patterns, and statistics for a conversation.
 */
export function DriftTimeline({ conversationId }: DriftTimelineProps) {
    const { snapshots, loading } = useDriftHistory(conversationId);

    const patterns = useMemo(() => {
        return detectDriftPatterns(snapshots);
    }, [snapshots]);

    const stats = useMemo(() => {
        return calculateDriftStats(snapshots);
    }, [snapshots]);

    if (!conversationId) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="i-ph:chart-line text-4xl text-bolt-elements-text Tertiary mb-3" />
                <p className="text-sm text-bolt-elements-textSecondary">
                    No conversation selected
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <LoadingSpinner size="md" />
                <span className="ml-3 text-sm text-bolt-elements-textSecondary">Loading drift history...</span>
            </div>
        );
    }

    if (snapshots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="i-ph:chart-line text-4xl text-bolt-elements-textTertiary mb-3" />
                <h3 className="text-base font-semibold text-bolt-elements-textPrimary mb-1">
                    No drift history yet
                </h3>
                <p className="text-sm text-bolt-elements-textSecondary max-w-sm">
                    Continue the conversation and drift data will be tracked here automatically.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 space-y-6"
        >
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Current"
                    value={stats.current}
                    trend={stats.trend}
                    icon="i-ph:arrow-right"
                />
                <StatCard
                    label="Average"
                    value={stats.average}
                    icon="i-ph:chart-bar"
                />
                <StatCard
                    label="Maximum"
                    value={stats.max}
                    severity={stats.max > 50 ? 'warning' : 'normal'}
                    icon="i-ph:arrow-up"
                />
                <StatCard
                    label="Minimum"
                    value={stats.min}
                    severity="success"
                    icon="i-ph:arrow-down"
                />
            </div>

            {/* Patterns Detected */}
            {patterns.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">
                        Patterns Detected
                    </h3>
                    {patterns.map((pattern, i) => (
                        <PatternCard key={i} pattern={pattern} />
                    ))}
                </div>
            )}

            {/* Timeline Chart */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">
                    Drift Over Time
                </h3>
                <div className="relative h-48 bg-bolt-elements-background-depth-2 rounded-lg p-4">
                    <DriftChart snapshots={snapshots} />
                </div>
            </div>

            {/* Message List */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">
                    Message History ({snapshots.length} messages)
                </h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                    {snapshots.slice().reverse().map((snapshot) => (
                        <DriftSnapshotCard key={snapshot.id} snapshot={snapshot} />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// Stat Card Component
function StatCard({ label, value, trend, severity, icon }: {
    label: string;
    value: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
    severity?: 'normal' | 'success' | 'warning';
    icon: string;
}) {
    const severityColors = {
        normal: 'text-bolt-elements-textPrimary',
        success: 'text-green-500',
        warning: 'text-yellow-500',
    };

    const trendIcons = {
        increasing: 'i-ph:trend-up text-red-500',
        decreasing: 'i-ph:trend-down text-green-500',
        stable: 'i-ph:minus text-gray-500',
    };

    return (
        <div className="bg-bolt-elements-background-depth-1 rounded-lg p-4 border border-bolt-elements-borderColor">
            <div className="flex items-start justify-between mb-2">
                <div className={`${icon} text-xl text-bolt-elements-textTertiary`} />
                {trend && <div className={`${trendIcons[trend]} text-sm`} />}
            </div>
            <div className={`text-2xl font-bold ${severityColors[severity || 'normal']}`}>
                {value}
            </div>
            <div className="text-xs text-bolt-elements-textSecondary mt-1">{label}</div>
        </div>
    );
}

// Pattern Card Component
function PatternCard({ pattern }: { pattern: any }) {
    const severityStyles = {
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
        critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    };

    const icons = {
        upward_trend: 'i-ph:trend-up',
        downward_trend: 'i-ph:trend-down',
        spike: 'i-ph:lightning',
        stability: 'i-ph:check-circle',
        oscillation: 'i-ph:wave-sine',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg border ${severityStyles[pattern.severity]} text-sm`}
        >
            <div className="flex items-start gap-2">
                <div className={`${icons[pattern.type]} text-lg flex-shrink-0 mt-0.5`} />
                <div>
                    <p className="font-medium">{pattern.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                        Confidence: {pattern.confidence}%
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

// Simple Chart Component
function DriftChart({ snapshots }: { snapshots: any[] }) {
    const maxDrift = Math.max(...snapshots.map(s => s.driftScore), 100);

    return (
        <div className="relative w-full h-full">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-bolt-elements-textTertiary">
                <span>{maxDrift}</span>
                <span>{Math.round(maxDrift / 2)}</span>
                <span>0</span>
            </div>

            {/* Chart area */}
            <div className="absolute left-10 right-0 top-0 bottom-6">
                <svg className="w-full h-full" viewBox={`0 0 ${snapshots.length * 20} 100`} preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="0" x2={snapshots.length * 20} y2="0" stroke="currentColor" strokeOpacity="0.1" />
                    <line x1="0" y1="50" x2={snapshots.length * 20} y2="50" stroke="currentColor" strokeOpacity="0.1" />
                    <line x1="0" y1="100" x2={snapshots.length * 20} y2="100" stroke="currentColor" strokeOpacity="0.1" />

                    {/* Drift line */}
                    <polyline
                        points={snapshots.map((s, i) => {
                            const x = i * 20 + 10;
                            const y = 100 - (s.driftScore / maxDrift * 100);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                    />

                    {/* Dots */}
                    {snapshots.map((s, i) => {
                        const x = i * 20 + 10;
                        const y = 100 - (s.driftScore / maxDrift * 100);
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="3"
                                fill="#ef4444"
                            />
                        );
                    })}
                </svg>
            </div>

            {/* X-axis label */}
            <div className="absolute bottom-0 left-10 right-0 text-xs text-bolt-elements-textTertiary text-center">
                Message Timeline
            </div>
        </div>
    );
}

// Snapshot Card Component
function DriftSnapshotCard({ snapshot }: { snapshot: any }) {
    const driftColor = snapshot.driftScore > 50 ? 'text-red-500' : snapshot.driftScore > 25 ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="bg-bolt-elements-background-depth-1 rounded p-2 border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-bolt-elements-textTertiary">
                        Message #{snapshot.messageIndex}
                    </span>
                    {snapshot.driftType !== 'none' && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                            {snapshot.driftType}
                        </span>
                    )}
                </div>
                <span className={`text-sm font-semibold ${driftColor}`}>
                    {snapshot.driftScore}
                </span>
            </div>
        </div>
    );
}
