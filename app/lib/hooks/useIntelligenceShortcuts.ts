import { useEffect } from 'react';

export interface IntelligenceShortcutHandlers {
    toggleDashboard: () => void;
    toggleGraph: () => void;
    toggleDecisionHistory?: () => void;
}

/**
 * Hook to add keyboard shortcuts for intelligence features
 * 
 * Shortcuts:
 * - Cmd/Ctrl + D: Toggle Intelligence Dashboard
 * - Cmd/Ctrl + M: Toggle Decision Map (Graph Visualization)
 * 
 * @example
 * ```tsx
 * useIntelligenceShortcuts({
 *   toggleDashboard: () => setShowDashboard(prev => !prev),
 *   toggleGraph: () => setShowGraph(prev => !prev)
 * });
 * ```
 */
export function useIntelligenceShortcuts(handlers: IntelligenceShortcutHandlers) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only trigger if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
            if (!event.metaKey && !event.ctrlKey) {
                return;
            }

            // Cmd/Ctrl + D = Toggle Dashboard
            if (event.key === 'd' || event.key === 'D') {
                event.preventDefault();
                handlers.toggleDashboard();
                return;
            }

            // Cmd/Ctrl + M = Toggle Map (Graph)
            if (event.key === 'm' || event.key === 'M') {
                event.preventDefault();
                handlers.toggleGraph();
                return;
            }

            // Cmd/Ctrl + H = Toggle Decision History
            if ((event.key === 'h' || event.key === 'H') && handlers.toggleDecisionHistory) {
                event.preventDefault();
                handlers.toggleDecisionHistory();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers.toggleDashboard, handlers.toggleGraph, handlers.toggleDecisionHistory]);
}
