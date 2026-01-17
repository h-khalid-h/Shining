import { motion } from 'framer-motion';
import { memo } from 'react';
import { classNames } from '~/utils/classNames';

export type LoadingStage = 'understanding' | 'extracting' | 'analyzing' | 'generating' | 'processing';

interface IntelligenceLoadingStateProps {
    stage?: LoadingStage;
    customMessage?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const STAGE_CONFIG = {
    understanding: {
        message: 'Understanding your context...',
        icon: 'i-ph:brain-duotone',
        color: 'text-blue-400',
    },
    extracting: {
        message: 'Extracting core intent...',
        icon: 'i-ph:target-duotone',
        color: 'text-purple-400',
    },
    analyzing: {
        message: 'Analyzing constraints...',
        icon: 'i-ph:graph-duotone',
        color: 'text-indigo-400',
    },
    generating: {
        message: 'Generating response...',
        icon: 'i-ph:sparkle-duotone',
        color: 'text-green-400',
    },
    processing: {
        message: 'Processing...',
        icon: 'i-ph:spinner-gap-duotone',
        color: 'text-gray-400',
    },
} as const;

/**
 * Intelligence-aware loading state component.
 * Displays contextual messages based on the current AI processing stage.
 */
export const IntelligenceLoadingState = memo(
    ({ stage = 'processing', customMessage, size = 'md', className }: IntelligenceLoadingStateProps) => {
        const config = STAGE_CONFIG[stage];
        const message = customMessage || config.message;

        const sizeClasses = {
            sm: {
                container: 'gap-2',
                icon: 'text-xl',
                text: 'text-sm',
                spinner: 'w-4 h-4 border-2',
            },
            md: {
                container: 'gap-3',
                icon: 'text-2xl',
                text: 'text-base',
                spinner: 'w-6 h-6 border-2',
            },
            lg: {
                container: 'gap-4',
                icon: 'text-3xl',
                text: 'text-lg',
                spinner: 'w-8 h-8 border-3',
            },
        };

        const sizes = sizeClasses[size];

        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={classNames('flex items-center', sizes.container, className)}
            >
                {/* Animated Icon */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className={classNames(config.icon, config.color, sizes.icon)}
                    aria-hidden="true"
                />

                {/* Loading Spinner */}
                <div
                    className={classNames(
                        'inline-block rounded-full border-bolt-elements-borderColor border-t-bolt-elements-loader-progress animate-spin',
                        sizes.spinner,
                    )}
                    role="status"
                    aria-label="Loading"
                >
                    <span className="sr-only">Loading...</span>
                </div>

                {/* Message with fade animation */}
                <motion.span
                    key={message}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={classNames('text-bolt-elements-textSecondary font-medium', sizes.text)}
                >
                    {message}
                </motion.span>
            </motion.div>
        );
    },
);

IntelligenceLoadingState.displayName = 'IntelligenceLoadingState';
