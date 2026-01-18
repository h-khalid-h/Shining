import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Decision {
    id: string;
    question: string;
    type: string;
    selectedOption: string;
    selectedOptionLabel: string;
    createdAt: string;
    confidence?: number;
}

export interface DecisionHistoryProps {
    northId: string;
    className?: string;
}

/**
 * Decision History Timeline Component
 * 
 * Displays a chronological timeline of all decisions made during the project.
 * Shows decision type, question, selected option, and timestamp.
 */
export function DecisionHistory({ northId, className }: DecisionHistoryProps) {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDecisions = async () => {
            try {
                const response = await fetch(`/api/graph/decisions/${northId}`);
                const data = await response.json();

                if (data.success) {
                    setDecisions(data.data.decisions || []);
                } else {
                    setError('Failed to load decisions');
                }
            } catch (err) {
                setError('Error loading decision history');
                console.error('Decision history error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (northId) {
            fetchDecisions();
        }
    }, [northId]);

    const handleExportPDF = async () => {
        if (!graph.north || decisions.length === 0) return;

        setExporting(true);
        try {
            const summary: ProjectSummary = {
                northGoal: graph.north.description,
                totalDecisions: decisions.length,
                dateRange: {
                    start: decisions[decisions.length - 1]?.createdAt || new Date().toISOString(),
                    end: decisions[0]?.createdAt || new Date().toISOString(),
                },
            };

            const pdf = await exportDecisionsToPDF(decisions, summary);
            const filename = generatePDFFilename(graph.north.description.substring(0, 30));
            pdf.save(filename);
        } catch (error) {
            console.error('PDF export failed:', error);
            setError('Failed to export PDF');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-2xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-bolt-elements-textSecondary">
                {error}
            </div>
        );
    }

    if (decisions.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="i-ph:signpost text-4xl text-bolt-elements-textTertiary mb-2 mx-auto" />
                <p className="text-bolt-elements-textSecondary">
                    No decisions recorded yet
                </p>
                <p className="text-sm text-bolt-elements-textTertiary mt-1">
                    Decisions will appear here as you make them
                </p>
            </div>
        );
    }

    return (
        <div className={`decision-history p-4 ${className || ''}`}>
            <h2 className="text-xl font-bold text-bolt-elements-textPrimary mb-6 flex items-center gap-2">
                <div className="i-ph:path text-2xl" />
                Decision History
            </h2>

            <div className="timeline relative">
                {/* Vertical timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-bolt-elements-borderColor" />

                {decisions.map((decision, idx) => (
                    <motion.div
                        key={decision.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        className="mb-6 pl-10 relative"
                    >
                        {/* Timeline dot */}
                        <div
                            className="absolute left-3 top-2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-bolt-elements-background-depth-1 shadow-sm"
                        />

                        {/* Decision card */}
                        <div className="bg-bolt-elements-background-depth-2 p-4 rounded-lg border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary">
                                            {decision.type}
                                        </span>
                                        {decision.confidence && (
                                            <span className="text-xs text-bolt-elements-textTertiary">
                                                {decision.confidence}% confidence
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-bolt-elements-textPrimary mt-1 mb-2">
                                        {decision.question}
                                    </h3>
                                    <p className="text-sm text-bolt-elements-textSecondary flex items-center gap-1.5">
                                        <div className="i-ph:check-circle text-green-500" />
                                        <span className="font-medium text-blue-500">
                                            {decision.selectedOptionLabel}
                                        </span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-bolt-elements-textTertiary whitespace-nowrap">
                                        {new Date(decision.createdAt).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {decisions.length > 10 && (
                <div className="mt-4 text-center text-xs text-bolt-elements-textTertiary">
                    Showing {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
