import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { graphStore } from '~/lib/stores/graph';

export interface QuestionOption {
    id: string;
    label: string;
    description?: string;
    icon?: string;
}

export interface QuestionCard {
    type: 'question';
    question: string;
    selectionMode: 'single' | 'multiple';
    options: QuestionOption[];
    context?: string;  // Why we're asking this
    allowOther?: boolean;  // Allow "Other" with text input
}

export interface DecisionOption {
    id: string;
    label: string;
    description: string;
    pros: string[];
    cons: string[];
    effort: 'low' | 'medium' | 'high';
}

export interface DecisionPoint {
    type: 'architecture' | 'library' | 'approach' | 'design' | 'general' | 'question';
    question: string;
    options: DecisionOption[] | QuestionOption[];
    recommended?: string;
    // Question card specific fields
    selectionMode?: 'single' | 'multiple';
    context?: string;
    allowOther?: boolean;
}

interface DecisionCardsProps {
    decision: DecisionPoint;
    onSelectOption: (optionId: string) => void;
    userId?: string | null;
}

/**
 * Decision Cards component.
 * Shows clickable option cards when the user needs to make a decision.
 * Prevents auto-code generation until user chooses an option.
 * Automatically stores decisions and selections in Neo4j.
 */
export function DecisionCards({ decision, onSelectOption, userId }: DecisionCardsProps) {
    const graph = useStore(graphStore);
    const [decisionId, setDecisionId] = useState<string | null>(null);
    const [storing, setStoring] = useState(false);

    // Store decision when component mounts
    useEffect(() => {
        if (decision && !decisionId && !storing && graph.north && userId) {
            setStoring(true);

            fetch('/api/graph/decisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    northId: graph.north.id,
                    userId,
                    decision: {
                        question: decision.question,
                        type: decision.type,
                        recommended: decision.recommended,
                    },
                    options: decision.options,
                }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setDecisionId(data.data.decisionId);
                    }
                })
                .catch(err => console.error('Failed to store decision:', err))
                .finally(() => setStoring(false));
        }
    }, [decision, decisionId, storing, graph.north, userId]);

    const handleSelect = async (optionId: string) => {
        // Record selection in Neo4j
        if (decisionId && userId) {
            try {
                await fetch(`/api/graph/decisions/${decisionId}/select`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ optionId }),
                });
            } catch (err) {
                console.error('Failed to record selection:', err);
            }
        }

        // Continue with original handler
        onSelectOption(optionId);
    };


    // State for question cards
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [otherText, setOtherText] = useState('');

    const isQuestionCard = decision.type === 'question';
    const isMultiSelect = decision.selectionMode === 'multiple';

    const handleQuestionSelect = (optionId: string) => {
        if (isMultiSelect) {
            setSelectedAnswers(prev =>
                prev.includes(optionId)
                    ? prev.filter(id => id !== optionId)
                    : [...prev, optionId]
            );
        } else {
            setSelectedAnswers([optionId]);
        }
    };

    const handleSubmitAnswers = () => {
        const answers = selectedAnswers.map(id => {
            const option = decision.options.find(opt => opt.id === id);
            return option ? option.label : id;
        }).join(', ');

        if (otherText) {
            onSelectOption(`Other: ${otherText}`);
        } else {
            onSelectOption(answers);
        }
    };

    // Type guard to check if option is DecisionOption
    const isDecisionOption = (option: DecisionOption | QuestionOption): option is DecisionOption => {
        return 'pros' in option && 'cons' in option && 'effort' in option;
    };

    const effortColors = {
        low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
        high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };

    // Question Card Mode
    if (isQuestionCard) {
        return (
            <div className="p-6 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor my-4">
                {/* Question Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="i-ph:question text-2xl text-blue-500 mt-1" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                            {decision.question}
                        </h3>
                        {decision.context && (
                            <p className="text-sm text-bolt-elements-textSecondary mt-1">
                                {decision.context}
                            </p>
                        )}
                        <p className="text-xs text-bolt-elements-textTertiary mt-2">
                            {isMultiSelect ? 'Select all that apply' : 'Choose one option'}
                        </p>
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-2 mb-4">
                    {decision.options.map((option) => {
                        const questionOption = option as QuestionOption;
                        const isSelected = selectedAnswers.includes(option.id);

                        return (
                            <motion.button
                                key={option.id}
                                onClick={() => handleQuestionSelect(option.id)}
                                className={`
                                    w-full text-left p-4 rounded-lg border-2 transition-all
                                    ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-bolt-elements-borderColor hover:border-blue-300 bg-bolt-elements-background-depth-1'
                                    }
                                `}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox or Radio */}
                                    <div className={`
                                        flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                                        ${isMultiSelect ? 'rounded' : 'rounded-full'}
                                        ${isSelected
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-bolt-elements-borderColor'
                                        }
                                    `}>
                                        {isSelected && (
                                            <div className={`
                                                ${isMultiSelect ? 'i-ph:check text-white text-sm' : 'w-2 h-2 rounded-full bg-white'}
                                            `} />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="flex-1">
                                        <div className="font-medium text-bolt-elements-textPrimary">
                                            {questionOption.icon && <span className={`${questionOption.icon} mr-2`} />}
                                            {option.label}
                                        </div>
                                        {questionOption.description && (
                                            <div className="text-sm text-bolt-elements-textSecondary mt-1">
                                                {questionOption.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}

                    {/* "Other" option */}
                    {decision.allowOther && (
                        <div className="p-4 border-2 border-dashed border-bolt-elements-borderColor rounded-lg">
                            <input
                                type="text"
                                value={otherText}
                                onChange={(e) => setOtherText(e.target.value)}
                                placeholder="Other (please specify)..."
                                className="w-full bg-transparent border-none outline-none text-bolt-elements-textPrimary"
                            />
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                {isMultiSelect && (
                    <motion.button
                        onClick={handleSubmitAnswers}
                        disabled={selectedAnswers.length === 0 && !otherText}
                        className={`
                            w-full py-3 px-4 rounded-lg font-medium transition-all
                            ${selectedAnswers.length > 0 || otherText
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-bolt-elements-background-depth-1 text-bolt-elements-textTertiary cursor-not-allowed'
                            }
                        `}
                        whileHover={selectedAnswers.length > 0 || otherText ? { scale: 1.02 } : {}}
                        whileTap={selectedAnswers.length > 0 || otherText ? { scale: 0.98 } : {}}
                    >
                        Submit Answers →
                    </motion.button>
                )}

                {/* For single-select, auto-proceed when selected */}
                {!isMultiSelect && selectedAnswers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-blue-500 text-center"
                    >
                        ✓ Selected. Click again to change or continue.
                    </motion.div>
                )}
            </div>
        );
    }

    // Decision Card Mode (original)
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
                        onClick={() => handleSelect(option.id)}
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
                            {isDecisionOption(option) && option.pros.length > 0 && (
                                <div className="flex items-start gap-1">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span className="text-bolt-elements-textSecondary">
                                        {isDecisionOption(option) && option.pros.join(', ')}
                                    </span>
                                </div>
                            )}
                            {isDecisionOption(option) && option.cons.length > 0 && (
                                <div className="flex items-start gap-1">
                                    <span className="text-red-600 dark:text-red-400 mt-0.5">✗</span>
                                    <span className="text-bolt-elements-textSecondary">
                                        {isDecisionOption(option) && option.cons.join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Effort badge */}
                        {isDecisionOption(option) && (
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded font-medium ${effortColors[option.effort]}`}>
                                    {option.effort} effort
                                </span>
                            </div>
                        )}
                    </motion.button>
                ))}

                {/* Special option: I don't know */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: decision.options.length * 0.1 }}
                    onClick={() => handleSelect('idk')}
                    className="p-4 border-2 border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 rounded-lg text-left hover:border-bolt-elements-borderColorActive hover:shadow-lg transition-all"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="i-ph:sparkle text-lg text-bolt-elements-textTertiary" />
                        <h4 className="font-semibold text-bolt-elements-textPrimary">
                            I don't know
                        </h4>
                    </div>
                    <p className="text-sm text-bolt-elements-textSecondary">
                        Let Gence decide based on best practices and your context
                    </p>
                </motion.button>

                {/* Special option: More Options */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (decision.options.length + 1) * 0.1 }}
                    onClick={() => handleSelect('more')}
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
