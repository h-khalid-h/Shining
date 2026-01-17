import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';

export interface IntentAlignmentProps {
    intent: string;
    coherence?: number;
    stage: 'understanding' | 'generating' | 'complete';
    showReasoning?: boolean;
    onShowReasoning?: () => void;
}

export function IntentAlignment({
    intent,
    coherence = 0,
    stage,
    showReasoning = false,
    onShowReasoning
}: IntentAlignmentProps) {
    const getStageConfig = () => {
        switch (stage) {
            case 'understanding':
                return {
                    icon: 'i-ph:lightbulb-duotone',
                    color: 'text-blue-500',
                    bg: 'bg-blue-50',
                    text: 'Understanding your goal',
                };
            case 'generating':
                return {
                    icon: 'i-ph:gear-duotone',
                    color: 'text-purple-500',
                    bg: 'bg-purple-50',
                    text: 'Aligning with',
                };
            case 'complete':
                return {
                    icon: 'i-ph:check-circle-duotone',
                    color: coherence >= 80 ? 'text-green-500' : coherence >= 70 ? 'text-yellow-500' : 'text-orange-500',
                    bg: coherence >= 80 ? 'bg-green-50' : coherence >= 70 ? 'bg-yellow-50' : 'bg-orange-50',
                    text: 'Coherence',
                };
        }
    };

    const config = getStageConfig();

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={classNames(
                'px-3 py-2 rounded-lg border my-2',
                config.bg,
                'border-bolt-elements-borderColor'
            )}
        >
            <div className="flex items-start gap-2">
                <div className={classNames(config.icon, 'text-xl', config.color)} />
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={classNames('text-sm font-medium', config.color)}>
                            {config.text}:
                        </span>
                        {stage === 'complete' && (
                            <span className={classNames('text-sm font-bold', config.color)}>
                                {coherence}%
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-bolt-elements-textPrimary font-medium">
                        {intent}
                    </p>
                    {stage === 'complete' && onShowReasoning && (
                        <button
                            onClick={onShowReasoning}
                            className="text-xs text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary mt-1 flex items-center gap-1"
                        >
                            <div className="i-ph:info text-sm" />
                            {showReasoning ? 'Hide' : 'Show'} reasoning
                        </button>
                    )}
                </div>
            </div>
            {showReasoning && stage === 'complete' && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-2 pt-2 border-t border-bolt-elements-borderColor"
                >
                    <p className="text-xs text-bolt-elements-textSecondary">
                        This implementation directly addresses your stated goal by focusing on the core outcome you specified.
                        All technical decisions were made to optimize for this result.
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
