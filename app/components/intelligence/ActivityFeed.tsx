import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Kinetic {
    id: string;
    type: 'digital' | 'physical';
    description: string;
    status: 'pending' | 'running' | 'complete' | 'failed';
    createdAt: string;
    alignmentScore?: number;
    aiScored?: boolean;
    aiReasoning?: string;
    metadata?: {
        filePath?: string;
        command?: string;
        exitCode?: number;
    };
}

export interface ActivityFeedProps {
    northId: string;
    className?: string;
    maxItems?: number;
    pollInterval?: number; // milliseconds
}

/**
 * Activity Feed Component
 * 
 * Real-time feed of all Kinetic activities (file operations, terminal commands).
 * Automatically polls for updates.
 */
export function ActivityFeed({
    northId,
    className,
    maxItems = 20,
    pollInterval = 5000,
}: ActivityFeedProps) {
    const [kinetics, setKinetics] = useState<Kinetic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKinetics = async () => {
            try {
                const response = await fetch(`/api/graph/kinetics/${northId}`);
                const data = await response.json();

                if (data.success) {
                    setKinetics((data.data.kinetics || []).slice(0, maxItems));
                }
            } catch (error) {
                console.error('Activity feed error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (northId) {
            fetchKinetics();

            // Poll for updates
            const interval = setInterval(fetchKinetics, pollInterval);
            return () => clearInterval(interval);
        }
    }, [northId, maxItems, pollInterval]);

    const getIcon = (kinetic: Kinetic): string => {
        if (kinetic.description.includes('Created') || kinetic.description.includes('Updated')) {
            return 'i-ph:file-plus';
        }
        if (kinetic.description.includes('Deleted')) {
            return 'i-ph:trash';
        }
        if (kinetic.description.includes('Ran:')) {
            return 'i-ph:terminal';
        }
        return 'i-ph:circle';
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'complete':
                return 'text-green-500';
            case 'failed':
                return 'text-red-500';
            case 'running':
                return 'text-yellow-500';
            default:
                return 'text-bolt-elements-textSecondary';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-2xl" />
            </div>
        );
    }

    if (kinetics.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="i-ph:activity text-4xl text-bolt-elements-textTertiary mb-2 mx-auto" />
                <p className="text-bolt-elements-textSecondary">
                    No activity yet
                </p>
                <p className="text-sm text-bolt-elements-textTertiary mt-1">
                    Actions will appear here as you work
                </p>
            </div>
        );
    }

    return (
        <div className={`activity-feed ${className || ''}`}>
            <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-3 flex items-center gap-2">
                <div className="i-ph:activity text-xl" />
                Recent Activity
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {kinetics.map((kinetic, idx) => (
                    <motion.div
                        key={kinetic.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                        className="flex items-start gap-3 p-3 bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive transition-colors"
                    >
                        <div
                            className={`${getIcon(kinetic)} text-lg mt-0.5 ${getStatusColor(kinetic.status)}`}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-bolt-elements-textPrimary truncate">
                                {kinetic.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-bolt-elements-textTertiary">
                                    {new Date(kinetic.createdAt).toLocaleTimeString(undefined, {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </span>
                                {kinetic.metadata?.exitCode !== undefined && kinetic.metadata.exitCode !== 0 && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                                        Exit code: {kinetic.metadata.exitCode}
                                    </span>
                                )}
                                {kinetic.aiScored && kinetic.alignmentScore !== undefined && (
                                    <div
                                        className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500"
                                        title={`AI Score: ${kinetic.alignmentScore}%${kinetic.aiReasoning ? ' - ' + kinetic.aiReasoning : ''}`}
                                    >
                                        <div className="i-ph:sparkle" />
                                        {kinetic.alignmentScore}%
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-3 text-xs text-bolt-elements-textTertiary text-right">
                Auto-updates every {pollInterval / 1000}s
            </div>
        </div>
    );
}
