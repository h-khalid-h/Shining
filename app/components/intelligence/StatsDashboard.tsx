import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ProjectStats {
    totalKinetics: number;
    completionRate: number;
    currentDrift: number;
    coherenceScore: number;
    decisionsCount: number;
    velocity: number;
}

export interface StatsDashboardProps {
    northId: string;
    className?: string;
}

/**
 * Stats Dashboard Component
 * 
 * High-level view of project health metrics including:
 * - Total actions (kinetics)
 * - Completion rate
 * - Coherence score  
 * - Decisions made
 * - Velocity (actions per day)
 */
export function StatsDashboard({ northId, className }: StatsDashboardProps) {
    const [stats, setStats] = useState<ProjectStats>({
        totalKinetics: 0,
        completionRate: 0,
        currentDrift: 0,
        coherenceScore: 0,
        decisionsCount: 0,
        velocity: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [kineticsRes, signalRes, decisionsRes] = await Promise.all([
                    fetch(`/api/graph/kinetics/${northId}`),
                    fetch(`/api/graph/${northId}/signal`),
                    fetch(`/api/graph/decisions/${northId}`),
                ]);

                const [kineticsData, signalData, decisionsData] = await Promise.all([
                    kineticsRes.json(),
                    signalRes.json(),
                    decisionsRes.json(),
                ]);

                const kineticStats = kineticsData.data?.stats || {};
                const signal = signalData.data?.signal || {};

                setStats({
                    totalKinetics: kineticStats.total || 0,
                    completionRate:
                        kineticStats.total > 0
                            ? ((kineticStats.complete || 0) / kineticStats.total) * 100
                            : 0,
                    currentDrift: signal.drift || 0,
                    coherenceScore: signal.drift ? 100 - signal.drift : 100,
                    decisionsCount: decisionsData.data?.decisions?.length || 0,
                    velocity: signal.velocity || 0,
                });
            } catch (error) {
                console.error('Stats dashboard error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (northId) {
            fetchStats();
        }
    }, [northId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-2xl" />
            </div>
        );
    }

    return (
        <div className={`stats-dashboard ${className || ''}`}>
            <h2 className="text-xl font-bold text-bolt-elements-textPrimary mb-4 flex items-center gap-2">
                <div className="i-ph:chart-line text-2xl" />
                Project Health
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard
                    label="Total Actions"
                    value={stats.totalKinetics}
                    icon="i-ph:activity"
                    color="text-blue-500"
                />
                <StatCard
                    label="Completion"
                    value={`${Math.round(stats.completionRate)}%`}
                    icon="i-ph:check-circle"
                    color="text-green-500"
                />
                <StatCard
                    label="Coherence"
                    value={`${Math.round(stats.coherenceScore)}%`}
                    icon="i-ph:target"
                    color={stats.coherenceScore >= 70 ? 'text-green-500' : 'text-yellow-500'}
                />
                <StatCard
                    label="Decisions"
                    value={stats.decisionsCount}
                    icon="i-ph:signpost"
                    color="text-purple-500"
                />
                <StatCard
                    label="Velocity"
                    value={`${stats.velocity.toFixed(1)}/day`}
                    icon="i-ph:gauge"
                    color="text-orange-500"
                />
                <StatCard
                    label="Drift"
                    value={`${Math.round(stats.currentDrift)}%`}
                    icon="i-ph:warning"
                    color={stats.currentDrift < 30 ? 'text-green-500' : 'text-red-500'}
                />
            </div>
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    color?: string;
}

function StatCard({ label, value, icon, color = 'text-bolt-elements-textSecondary' }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="p-4 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive transition-all"
        >
            <div className={`${icon} text-2xl ${color} mb-2`} />
            <div className="text-2xl font-bold text-bolt-elements-textPrimary mb-1">{value}</div>
            <div className="text-sm text-bolt-elements-textSecondary">{label}</div>
        </motion.div>
    );
}
