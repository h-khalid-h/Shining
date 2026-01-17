import { motion } from 'framer-motion';

export interface DecisionOption {
    id: string;
    label: string;
    description: string;
    pros: string[];
    cons: string[];
    effort: 'low' | 'medium' | 'high';
}

export interface DecisionPoint {
    type: 'architecture' | 'library' | 'approach' | 'design' | 'general';
    question: string;
    options: DecisionOption[];
    recommended?: string;
}

interface DecisionCardsProps {
    decision: DecisionPoint;
    onSelectOption: (optionId: string) => void;
}

/**
 * Decision Cards component.
 * Shows clickable option cards when the user needs to make a decision.
 * Prevents auto-code generation until user chooses an option.
 */
export function DecisionCards({ decision, onSelectOption }: DecisionCardsProps) {
    const effortColors = {
        low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
        high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };

    return (
        <div className="p-6 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor my-4">
            {/* Question */}
            <div className="flex items-start gap-3 mb-4">
                <div className="i-ph:question text-2xl text-blue-500 mt-1" />
                <div>
                    <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                        {decision.question}
                    </h3>
                    <p className="text-sm text-bolt-elements-textSecondary mt-1">
                        Choose an option to continue
                    </p>
                </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {decision.options.map((option, index) => (
                    <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => onSelectOption(option.id)}
                        className={`relative p-4 border-2 rounded-lg text-left transition-all hover:border-bolt-elements-borderColorActive hover:shadow-lg ${decision.recommended === option.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-1'
                            }`}
                    >
                        {/* Recommended badge */}
                        {decision.recommended === option.id && (
                            <span className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                                ⭐ Recommended
                            </span>
                        )}

                        {/* Option label */}
                        <h4 className="font-semibold text-bolt-elements-textPrimary mb-2 pr-20">
                            {option.label}
                        </h4>

                        {/* Description */}
                        <p className="text-sm text-bolt-elements-textSecondary mb-3">
                            {option.description}
                        </p>

                        {/* Pros/Cons */}
                        <div className="space-y-2 text-xs mb-3">
                            {option.pros.length > 0 && (
                                <div className="flex items-start gap-1">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span className="text-bolt-elements-textSecondary">
                                        {option.pros.join(', ')}
                                    </span>
                                </div>
                            )}
                            {option.cons.length > 0 && (
                                <div className="flex items-start gap-1">
                                    <span className="text-red-600 dark:text-red-400 mt-0.5">✗</span>
                                    <span className="text-bolt-elements-textSecondary">
                                        {option.cons.join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Effort badge */}
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${effortColors[option.effort]}`}>
                                {option.effort} effort
                            </span>
                        </div>
                    </motion.button>
                ))}

                {/* Special option: I don't know */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: decision.options.length * 0.1 }}
                    onClick={() => onSelectOption('idk')}
                    className="p-4 border-2 border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 rounded-lg text-left hover:border-bolt-elements-borderColorActive hover:shadow-lg transition-all"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="i-ph:sparkle text-lg text-bolt-elements-textTertiary" />
                        <h4 className="font-semibold text-bolt-elements-textPrimary">
                            I don't know
                        </h4>
                    </div>
                    <p className="text-sm text-bolt-elements-textSecondary">
                        Let Meldon decide based on best practices and your context
                    </p>
                </motion.button>

                {/* Special option: More Options */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (decision.options.length + 1) * 0.1 }}
                    onClick={() => onSelectOption('more')}
                    className="p-4 border-2 border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 rounded-lg text-left hover:border-bolt-elements-borderColorActive hover:shadow-lg transition-all"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="i-ph:plus-circle text-lg text-bolt-elements-textTertiary" />
                        <h4 className="font-semibold text-bolt-elements-textPrimary">
                            More Options
                        </h4>
                    </div>
                    <p className="text-sm text-bolt-elements-textSecondary">
                        Generate additional alternatives to consider
                    </p>
                </motion.button>
            </div>

            {/* Type response alternative */}
            <div className="text-xs text-bolt-elements-textTertiary text-center pt-2 border-t border-bolt-elements-borderColor">
                Or type your preference in the chat below
            </div>
        </div>
    );
}
