import { useStore } from '@nanostores/react';
import { useAuth } from '@clerk/react-router';
import { graphStore } from '~/lib/stores/graph';

export interface KineticEvent {
    type: 'file_create' | 'file_edit' | 'file_delete' | 'terminal_command';
    description: string;
    metadata?: {
        filePath?: string;
        command?: string;
        linesAdded?: number;
        linesRemoved?: number;
        exitCode?: number;
    };
}

export interface UseKineticTrackerReturn {
    trackKinetic: (event: KineticEvent) => Promise<void>;
    isTracking: boolean;
}

/**
 * Hook for tracking Kinetic events (file operations, terminal commands, etc.)
 * Automatically associates events with the active North and authenticated user.
 * 
 * @example
 * ```tsx
 * const { trackKinetic } = useKineticTracker();
 * 
 * // Track file edit
 * await trackKinetic({
 *   type: 'file_edit',
 *   description: 'Edited app.tsx',
 *   metadata: { filePath: '/src/app.tsx', linesAdded: 10, linesRemoved: 3 }
 * });
 * 
 * // Track terminal command
 * await trackKinetic({
 *   type: 'terminal_command',
 *   description: 'Ran: npm install',
 *   metadata: { command: 'npm install', exitCode: 0 }
 * });
 * ```
 */
export function useKineticTracker(): UseKineticTrackerReturn {
    const graph = useStore(graphStore);
    const { userId } = useAuth();

    const trackKinetic = async (event: KineticEvent): Promise<void> => {
        // Silently fail if no North is active or user not authenticated
        if (!graph.north || !userId) {
            return;
        }

        const { type, description, metadata } = event;

        try {
            const response = await fetch('/api/graph/kinetics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    northId: graph.north.id,
                    userId,
                    type: 'digital',
                    description,
                    status: 'complete',
                    alignmentScore: calculateAlignmentScore(event, graph.north.statement),
                    effort: estimateEffort(event),
                    metadata,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to track kinetic: ${response.statusText}`);
            }
        } catch (error) {
            // Log error but don't throw to avoid interrupting user workflow
            console.error('Failed to track kinetic:', error);
        }
    };

    return {
        trackKinetic,
        isTracking: !!(graph.north && userId),
    };
}

/**
 * Calculate alignment score for a kinetic event
 * Future enhancement: Use AI to analyze file content against North goal
 */
function calculateAlignmentScore(event: KineticEvent, northDescription: string): number {
    // Default alignment score
    let score = 70;

    // Boost for file operations (more aligned than random commands)
    if (event.type !== 'terminal_command') {
        score += 10;
    }

    // Boost for significant changes
    if (event.metadata?.linesAdded && event.metadata.linesAdded > 10) {
        score += 5;
    }

    // Penalize for failed commands
    if (event.metadata?.exitCode && event.metadata.exitCode !== 0) {
        score -= 20;
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Estimate effort points for a kinetic event
 */
function estimateEffort(event: KineticEvent): number {
    if (event.type === 'file_delete') return 1;
    if (event.type === 'file_create') return 2;

    // For file edits, estimate based on lines changed
    const linesChanged =
        (event.metadata?.linesAdded || 0) + (event.metadata?.linesRemoved || 0);

    if (linesChanged < 10) return 1;
    if (linesChanged < 50) return 2;
    if (linesChanged < 200) return 3;
    if (linesChanged < 500) return 4;
    return 5;
}

/**
 * Trigger signal recalculation (optional, call after N kinetics)
 */
async function triggerSignalRecalculation(northId: string): Promise<void> {
    try {
        await fetch(`/api/graph/${northId}/signal/calculate`, {
            method: 'GET',
        });
    } catch (error) {
        console.error('Failed to recalculate signal:', error);
    }
}
