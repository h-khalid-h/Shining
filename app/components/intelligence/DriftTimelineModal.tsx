import { motion, AnimatePresence } from 'framer-motion';
import { DriftTimeline } from './DriftTimeline';

interface DriftTimelineModalProps {
    conversationId: string | null;
    onClose: () => void;
    visible: boolean;
}

/**
 * Modal wrapper for DriftTimeline component
 * Shows drift history, patterns, and analytics
 */
export function DriftTimelineModal({ conversationId, onClose, visible }: DriftTimelineModalProps) {
    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[80vh] overflow-hidden"
                    >
                        <div className="bg-bolt-elements-background-depth-1 rounded-lg shadow-2xl border border-bolt-elements-borderColor">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-bolt-elements-borderColor">
                                <div className="flex items-center gap-2">
                                    <div className="i-ph:chart-line text-2xl text-bolt-elements-textPrimary" />
                                    <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">
                                        Drift History & Analytics
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                                    aria-label="Close"
                                >
                                    <div className="i-ph:x text-xl" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
                                <DriftTimeline conversationId={conversationId} />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
