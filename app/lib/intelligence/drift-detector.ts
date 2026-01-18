/**
 * Drift Detection System
 * Detects when user is drifting from their North (goal)
 */

import type { Signal } from '~/lib/stores/graph';

export interface DriftAlert {
    severity: 'low' | 'medium' | 'high';
    message: string;
    recommendation: string;
    driftPercentage: number;
    suggestedActions: string[];
}

/**
 * Detect drift and generate appropriate alert
 */
export function detectDrift(signal: Signal | null | undefined): DriftAlert | null {
    // SSR safety check
    if (typeof window === 'undefined' || !signal) {
        return null;
    }

    const drift = signal.drift;

    // Additional null check for drift value
    if (drift === null || drift === undefined) {
        return null;
    }

    // No alert if drift is low
    if (drift < 20) {
        return null;
    }

    // Medium drift (20-40%)
    if (drift < 40) {
        return {
            severity: 'medium',
            message: "I notice we're drifting slightly from your original goal",
            recommendation: 'Review recent decisions to ensure alignment with your North',
            driftPercentage: drift,
            suggestedActions: [
                'Review your North and Bounds',
                'Check if recent actions align with your goal',
                'Consider adjusting your approach',
            ],
        };
    }

    // High drift (40%+)
    return {
        severity: 'high',
        message: "We've drifted significantly from your original goal",
        recommendation: 'Consider revisiting your approach or adjusting your North',
        driftPercentage: drift,
        suggestedActions: [
            'Reassess your current North',
            'Review what caused the drift',
            'Create a new Vector to get back on track',
            'Or update your North if goals have changed',
        ],
    };
}

/**
 * Check if we should show drift alert
 * Don't show too frequently to avoid alert fatigue
 */
export function shouldShowDriftAlert(
    lastShownTimestamp: number | null,
    currentDrift: number | undefined,
): boolean {
    // SSR safety check
    if (typeof window === 'undefined' || currentDrift === undefined || currentDrift === null) {
        return false;
    }

    // Don't show if drift is low
    if (currentDrift < 20) {
        return false;
    }

    // Always show if never shown before and drift is high
    if (!lastShownTimestamp && currentDrift >= 40) {
        return true;
    }

    // Don't show more than once per hour
    if (lastShownTimestamp) {
        const hourInMs = 60 * 60 * 1000;
        const timeSinceLastAlert = Date.now() - lastShownTimestamp;

        if (timeSinceLastAlert < hourInMs) {
            return false;
        }
    }

    // Show if drift is medium or high
    return currentDrift >= 20;
}

/**
 * Generate course correction suggestion
 */
export function generateCourseCorrection(
    north: any,
    currentDrift: number,
): string {
    if (currentDrift < 20) {
        return "You're on track! Keep going.";
    }

    if (currentDrift < 40) {
        return `Your goal is "${north.description}". Recent actions seem to be taking you off course. Consider refocusing on your original objective.`;
    }

    return `Your goal was "${north.description}", but we've drifted significantly. It might be time to either create a new plan to get back on track, or update your goal if priorities have changed.`;
}
