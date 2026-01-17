import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import type { North } from '~/lib/stores/graph';

export interface ContextRibbonProps {
    north: North | null;
    drift: number;
    confidence?: number;
    onClickUnderstanding: () => void;
    isUnderstandingExpanded: boolean;
    onViewHistory?: () => void;
}

export function ContextRibbon({
    north,
    drift,
    confidence = 0,
    onClickUnderstanding,
    isUnderstandingExpanded,
    onViewHistory
}: ContextRibbonProps) {
    const getDriftColor = (driftValue: number) => {
        if (driftValue < 10) return 'text-green-500';
        if (driftValue < 30) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getDriftBg = (driftValue: number) => {
        if (driftValue < 10) return 'bg-green-50';
        if (driftValue < 30) return 'bg-yellow-50';
        return 'bg-red-50';
    };

    const getConfidenceColor = (conf: number) => {
        if (conf >= 80) return 'text-green-500';
        if (conf >= 70) return 'text-yellow-500';
        return 'text-orange-500';
    };

    // High drift gets pulse animation
    const shouldPulse = drift >= 30;

    if (!north) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="fixed top-0 left-0 right-0 z-50 bg-bolt-elements-background-depth-2/95 backdrop-blur-sm border-b border-bolt-elements-borderColor shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-4 py-2.5">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Understanding Status */}
                        <motion.button
                            onClick={onClickUnderstanding}
                            className="flex items-center gap-2.5 hover:bg-bolt-elements-background-depth-3 rounded-lg px-3 py-2 transition-all duration-200 group"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <motion.div
                                className="i-ph:lightbulb-duotone text-xl text-blue-500"
                                animate={{ rotate: isUnderstandingExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            />
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-bolt-elements-textTertiary">Understanding:</span>
                                <span className="text-sm font-medium text-bolt-elements-textPrimary truncate max-w-md group-hover:text-blue-500 transition-colors">
                                    {north.description}
                                </span>
                            </div>
                            <motion.div
                                className={classNames('i-ph:caret-down text-sm text-bolt-elements-textSecondary')}
                                animate={{ rotate: isUnderstandingExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            />
                        </motion.button>

                        {/* Right: Metrics */}
                        <div className="flex items-center gap-4">
                            {/* Confidence with progress bar */}
                            {confidence > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <svg className="w-10 h-10 transform -rotate-90">
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="16"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                fill="none"
                                                className="text-bolt-elements-background-depth-3"
                                            />
                                            <motion.circle
                                                cx="20"
                                                cy="20"
                                                r="16"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                fill="none"
                                                strokeDasharray={`${2 * Math.PI * 16}`}
                                                strokeDashoffset={`${2 * Math.PI * 16 * (1 - confidence / 100)}`}
                                                className={getConfidenceColor(confidence)}
                                                initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                                                animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - confidence / 100) }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </svg>
                                        <div className={classNames('absolute inset-0 flex items-center justify-center text-xs font-bold', getConfidenceColor(confidence))}>
                                            {confidence}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Drift with pulse animation */}
                            <motion.div
                                className={classNames('flex items-center gap-2 px-3 py-1.5 rounded-full', getDriftBg(drift))}
                                animate={shouldPulse ? {
                                    scale: [1, 1.05, 1],
                                    opacity: [1, 0.9, 1]
                                } : {}}
                                transition={shouldPulse ? {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                } : {}}
                            >
                                <div className="i-ph:target-duotone text-base"
                                    style={{ color: getDriftColor(drift) }} />
                                <span className={classNames('text-sm font-medium', getDriftColor(drift))}>
                                    Drift: {drift}%
                                </span>
                            </motion.div>

                            {/* View History Button */}
                            {onViewHistory && (
                                <motion.button
                                    onClick={onViewHistory}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 transition-colors border border-bolt-elements-borderColor"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    title="View drift history and analytics"
                                >
                                    <div className="i-ph:chart-line text-base text-bolt-elements-textSecondary" />
                                    <span className="text-xs font-medium text-bolt-elements-textSecondary">
                                        History
                                    </span>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
