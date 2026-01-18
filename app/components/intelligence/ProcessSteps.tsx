import React from 'react';
import { motion } from 'framer-motion';

interface ProcessStep {
    name: string;
    icon: string;
    description: string;
}

interface ProcessStepsProps {
    current: 'discovery' | 'planning' | 'building' | 'refining';
    className?: string;
}

const steps: Record<string, ProcessStep> = {
    discovery: {
        name: 'Discovery',
        icon: 'i-ph:magnifying-glass',
        description: 'Understanding your needs',
    },
    planning: {
        name: 'Planning',
        icon: 'i-ph:map-trifold',
        description: 'Exploring approaches',
    },
    building: {
        name: 'Building',
        icon: 'i-ph:hammer',
        description: 'Creating your solution',
    },
    refining: {
        name: 'Refining',
        icon: 'i-ph:sparkle',
        description: 'Polishing and improving',
    },
};

const stepOrder = ['discovery', 'planning', 'building', 'refining'];

export function ProcessSteps({ current, className = '' }: ProcessStepsProps) {
    const currentIndex = stepOrder.indexOf(current);

    return (
        <div className={`flex items-center justify-between max-w-2xl mx-auto ${className}`}>
            {stepOrder.map((stepKey, index) => {
                const step = steps[stepKey];
                const isActive = index === currentIndex;
                const isComplete = index < currentIndex;
                const isFuture = index > currentIndex;

                return (
                    <React.Fragment key={stepKey}>
                        {/* Step Circle */}
                        <div className="flex flex-col items-center flex-1">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative"
                            >
                                {/* Circle */}
                                <div
                                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all
                    ${isActive
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-110'
                                            : isComplete
                                                ? 'bg-green-500 text-white'
                                                : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textTertiary border-2 border-bolt-elements-borderColor'
                                        }
                  `}
                                >
                                    <div className={`${step.icon} text-xl`} />
                                </div>

                                {/* Checkmark for completed */}
                                {isComplete && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                                        <div className="i-ph:check text-sm text-green-500" />
                                    </div>
                                )}

                                {/* Pulse animation for active */}
                                {isActive && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-blue-500 opacity-30"
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </motion.div>

                            {/* Label */}
                            <div className="mt-2 text-center">
                                <div
                                    className={`
                    text-sm font-medium
                    ${isActive
                                            ? 'text-bolt-elements-textPrimary'
                                            : isFuture
                                                ? 'text-bolt-elements-textTertiary'
                                                : 'text-bolt-elements-textSecondary'
                                        }
                  `}
                                >
                                    {step.name}
                                </div>
                                {isActive && (
                                    <div className="text-xs text-bolt-elements-textSecondary mt-0.5">
                                        {step.description}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connector Line */}
                        {index < stepOrder.length - 1 && (
                            <div className="flex-1 h-0.5 mb-8 mx-2 relative">
                                {/* Background line */}
                                <div className="absolute inset-0 bg-bolt-elements-borderColor" />
                                {/* Progress line */}
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: isComplete ? 1 : 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="absolute inset-0 bg-green-500 origin-left"
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
