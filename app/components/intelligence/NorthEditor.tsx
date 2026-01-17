import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NorthEditorProps {
    north: {
        id: string;
        description: string;
        confidence?: number;
    };
    onSave: (updatedDescription: string) => void;
    onClose: () => void;
    visible: boolean;
}

/**
 * North Editor Modal
 * Allows users to adjust their goal (North) when drift is detected
 */
export function NorthEditor({ north, onSave, onClose, visible }: NorthEditorProps) {
    const [description, setDescription] = useState(north.description);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!description.trim()) {
            return;
        }

        setIsSaving(true);
        try {
            await onSave(description);
            onClose();
        } catch (error) {
            console.error('Failed to save North:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSave();
        }
    };

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
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
                    >
                        <div className="bg-bolt-elements-background-depth-1 rounded-lg shadow-2xl border border-bolt-elements-borderColor p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-1">
                                        Adjust Your Goal
                                    </h2>
                                    <p className="text-sm text-bolt-elements-textSecondary">
                                        Refine your North to better align with your current direction
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                                    aria-label="Close"
                                >
                                    <div className="i-ph:x text-xl" />
                                </button>
                            </div>

                            {/* Editor */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                                    Goal Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe what you want to achieve..."
                                    className="w-full h-32 px-4 py-3 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    autoFocus
                                />
                                <p className="text-xs text-bolt-elements-textTertiary mt-2">
                                    Press <kbd className="px-1.5 py-0.5 bg-bolt-elements-background-depth-3 rounded text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-bolt-elements-background-depth-3 rounded text-xs">Enter</kbd> to save
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !description.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="i-svg-spinners:90-ring-with-bg text-base" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Goal'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
