import { createSuccessResponse, createErrorResponse, ErrorCodes } from '~/lib/.server/api-response';

// Track kinetic count for auto-recalculation
let kineticCounter = 0;
const RECALC_THRESHOLD = 5; // Recalculate signal every 5 kinetics

export interface KineticData {
    northId: string;
    userId: string;
    description: string;
    type?: 'digital' | 'physical';
    status?: 'pending' | 'running' | 'complete' | 'failed';
    alignmentScore?: number;
    effort?: number;
    metadata?: Record<string, any>;
}

/**
 * Server-side utility to track Kinetic events
 * Used by action-runner and other server-side components
 */
export async function trackKineticServer(data: KineticData, env: any) {
    try {
        // Call the kinetics API internally with northId in path
        const response = await fetch(`${env.API_BASE_URL || 'http://localhost:5173'}/api/graph/kinetics/${data.northId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                northId: data.northId,
                userId: data.userId,
                kinetic: {
                    type: data.type || 'digital',
                    description: data.description,
                    status: data.status || 'complete',
                    alignmentScore: data.alignmentScore || 70,
                    effort: data.effort || 1,
                    metadata: data.metadata,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to track kinetic: ${response.statusText}`);
        }

        // Auto-trigger signal recalculation every N kinetics
        kineticCounter++;
        if (kineticCounter >= RECALC_THRESHOLD) {
            kineticCounter = 0;

            // Trigger background recalculation (don't await)
            fetch(`${env.API_BASE_URL || 'http://localhost:5173'}/api/graph/${data.northId}/signal`, {
                method: 'POST',
            }).catch(err => {
                console.error('Background signal recalculation failed:', err);
            });
        }

        return true;
    } catch (error) {
        console.error('Server kinetic tracking failed:', error);
        return false;
    }
}

/**
 * Calculate effort for a shell command
 */
export function calculateShellEffort(command: string): number {
    // Package installations are high effort
    if (/npm install|yarn add|pnpm install/.test(command)) return 3;

    // Build/compile commands
    if (/build|compile|bundle/.test(command)) return 4;

    // Test runs
    if (/test|jest|vitest/.test(command)) return 2;

    // Default
    return 1;
}

/**
 * Calculate alignment score for shell commands
 */
export function calculateShellAlignment(command: string, exitCode: number): number {
    // Failed commands have low alignment
    if (exitCode !== 0) return 30;

    // Successful dependency installs are well-aligned
    if (/npm install|yarn add|pnpm install/.test(command)) return 85;

    // Successful builds/tests
    if (/build|test/.test(command)) return 90;

    // Default for successful commands
    return 75;
}
