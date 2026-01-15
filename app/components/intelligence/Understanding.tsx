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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="understanding-card"
                >
                    <div className="flex items-start gap-3 mb-4">
                        <div className="i-ph:lightbulb text-2xl text-bolt-elements-textSecondary" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-bolt-elements-textSecondary mb-1">
                                I understand you want to:
                            </h3>
                            <p className="text-base font-semibold text-bolt-elements-textPrimary mb-2">{north.statement}</p>
                            <div className="flex items-center gap-2">
                                <div
                                    className={classNames(
                                        'i-ph:check-circle text-sm',
                                        getConfidenceColor(north.confidence),
                                    )}
                                />
                                <span className={classNames('text-xs', getConfidenceColor(north.confidence))}>
                                    {getConfidenceLabel(north.confidence)} ({north.confidence}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    {bounds.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-medium text-bolt-elements-textSecondary mb-2">Constraints:</h4>
                            <div className="space-y-2">
                                {bounds.map((bound, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className={classNames(metricIcons[bound.metric], 'text-sm text-bolt-elements-textTertiary')} />
                                        <span className="text-sm text-bolt-elements-textSecondary">{metricLabels[bound.metric]}:</span>
                                        <span className="text-sm text-bolt-elements-textPrimary font-medium">{bound.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {onConfirm && (
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-lg text-sm font-medium transition-colors"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <div className="i-ph:check text-base" />
                                    <span>Looks good</span>
                                </div>
                            </button>
                        )}
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="flex-1 px-4 py-2 bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary rounded-lg text-sm font-medium transition-colors"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <div className="i-ph:x text-base" />
                                    <span>Not quite</span>
                                </div>
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
