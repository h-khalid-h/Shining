import { motion, AnimatePresence } from 'framer-motion';
import type { IntentPrediction } from '~/lib/hooks/useIntentPrediction';

interface IntentSuggestionsProps {
    prediction: IntentPrediction | null;
    loading: boolean;
    onApplySuggestion: (autoCompleteText: string) => void;
    onDismiss: () => void;
}

/**
 * Intent Suggestions component.
 * Shows AI-powered suggestions based on what the user is typing.
 */
export function IntentSuggestions({
    prediction,
    loading,
    onApplySuggestion,
    onDismiss,
}: IntentSuggestionsProps) {
    if (!prediction && !loading) {
        return null;
    }

    const intentLabels: Record<string, string> = {
        add_feature: '✨ Adding Feature',
        fix_issue: '🔧 Fixing Issue',
        refine_goal: '🎯 Refining Goal',
        add_constraint: '📋 Adding Constraint',
        ask_question: '❓ Asking Question',
        change_direction: '🔄 Changing Direction',
    };

    const intentColors: Record<string, string> = {
        add_feature: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        fix_issue: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        refine_goal: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        add_constraint: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        ask_question: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        change_direction: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-bolt-elements-background-depth-2 rounded-lg shadow-lg border border-bolt-elements-borderColor p-3 z-50"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="i-ph:lightbulb text-yellow-500 text-lg" />
                        <span className="text-xs font-semibold text-bolt-elements-textPrimary">
                            {loading ? 'Analyzing intent...' : 'Suggestions'}
                        </span>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-colors"
                        aria-label="Dismiss suggestions"
                    >
                        <div className="i-ph:x text-sm" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary py-2">
                        <div className="i-svg-spinners:90-ring-with-bg text-lg" />
                        <span>Predicting your intent...</span>
                    </div>
                ) : prediction ? (
                    <>
                        {/* Intent Badge */}
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium mb-3 border ${intentColors[prediction.intent] || 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'}`}>
                            <span>{intentLabels[prediction.intent] || prediction.intent}</span>
                            <span className="text-xs opacity-75">({prediction.confidence}%)</span>
                        </div>

                        {/* Suggestions */}
                        {prediction.suggestions.length > 0 ? (
                            <div className="space-y-1.5">
                                {prediction.suggestions.map((suggestion, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => {
                                            if (suggestion.autoComplete) {
                                                onApplySuggestion(suggestion.autoComplete);
                                            }
                                        }}
                                        disabled={!suggestion.autoComplete}
                                        className={`w-full text-left p-2 rounded transition-colors ${suggestion.autoComplete
                                                ? 'hover:bg-bolt-elements-background-depth-3 cursor-pointer'
                                                : 'opacity-75 cursor-default'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className={`i-ph:arrow-right text-bolt-elements-textTertiary mt-0.5 ${suggestion.autoComplete ? '' : 'opacity-50'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-bolt-elements-textPrimary">
                                                    {suggestion.action}
                                                </div>
                                                <div className="text-xs text-bolt-elements-textSecondary mt-0.5">
                                                    {suggestion.reasoning}
                                                </div>
                                                {suggestion.autoComplete && (
                                                    <div className="text-xs text-bolt-elements-textTertiary mt-1 font-mono bg-bolt-elements-background-depth-1 px-2 py-1 rounded">
                                                        "{suggestion.autoComplete}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-bolt-elements-textSecondary">
                                No specific suggestions available.
                            </p>
                        )}
                    </>
                ) : null}
            </motion.div>
        </AnimatePresence>
    );
}
