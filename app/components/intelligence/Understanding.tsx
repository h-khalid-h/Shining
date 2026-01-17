import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';

/**
 * Understanding Card Component
 * Shows extracted intent and constraints to user
 */

export interface UnderstandingProps {
    north: {
        statement: string;
        confidence: number;
    };
    bounds: Array<{
        metric: 'time' | 'cost' | 'quality' | 'scope';
        value: string;
        confidence: number;
    }>;
    onConfirm?: () => void;
    onDismiss?: () => void;
    visible?: boolean;
}

const metricIcons = {
    time: 'i-ph:clock',
    cost: 'i-ph:currency-dollar',
    quality: 'i-ph:star',
    scope: 'i-ph:list-bullets',
};

const metricLabels = {
    time: 'Timeline',
    cost: 'Budget',
    quality: 'Quality',
    scope: 'Scope',
};

export function Understanding({ north, bounds, onConfirm, onDismiss, visible = true }: UnderstandingProps) {
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-400';
        if (confidence >= 70) return 'text-yellow-400';
        return 'text-orange-400';
    };

    const getConfidenceLabel = (confidence: number) => {
        if (confidence >= 80) return 'High confidence';
        if (confidence >= 70) return 'Medium confidence';
        return 'Low confidence';
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="understanding-card bg-bolt-elements-background-depth-1 rounded-lg shadow-lg border border-bolt-elements-borderColor p-4 max-w-md"
                >
                    <div className="flex items-start gap-3 mb-4">
                        <motion.div
                            className="i-ph:lightbulb text-2xl text-blue-500"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-bolt-elements-textSecondary mb-1">
                                I understand you want to:
                            </h3>
                            <p className="text-base font-semibold text-bolt-elements-textPrimary mb-3">{north.statement}</p>

                            {/* Confidence Progress Bar */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className={classNames('font-medium', getConfidenceColor(north.confidence))}>
                                        {getConfidenceLabel(north.confidence)}
                                    </span>
                                    <span className={classNames('font-bold', getConfidenceColor(north.confidence))}>
                                        {north.confidence}%
                                    </span>
                                </div>
                                <div className="h-2 bg-bolt-elements-background-depth-3 rounded-full overflow-hidden">
                                    <motion.div
                                        className={classNames('h-full rounded-full', {
                                            'bg-green-500': north.confidence >= 80,
                                            'bg-yellow-500': north.confidence >= 70 && north.confidence < 80,
                                            'bg-orange-500': north.confidence < 70
                                        })}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${north.confidence}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {bounds.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-medium text-bolt-elements-textSecondary mb-2">Constraints:</h4>
                            <div className="space-y-2">
                                {bounds.map((bound, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className={classNames(metricIcons[bound.metric], 'text-sm text-bolt-elements-textTertiary')} />
                                        <span className="text-sm text-bolt-elements-textSecondary">{metricLabels[bound.metric]}:</span>
                                        <span className="text-sm text-bolt-elements-textPrimary font-medium">{bound.value}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {onConfirm && (
                            <motion.button
                                onClick={onConfirm}
                                className="flex-1 px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-lg text-sm font-medium transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <div className="i-ph:check text-base" />
                                    <span>Looks good</span>
                                </div>
                            </motion.button>
                        )}
                        {onDismiss && (
                            <motion.button
                                onClick={onDismiss}
                                className="flex-1 px-4 py-2 bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary rounded-lg text-sm font-medium transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <div className="i-ph:x text-base" />
                                    <span>Not quite</span>
                                </div>
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
