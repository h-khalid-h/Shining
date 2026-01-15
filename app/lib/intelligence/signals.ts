/**
 * Signal Calculator
 * Calculates alignment, drift, and progress metrics
 */

export interface SignalMetrics {
    strength: number; // 0-100: Overall progress weighted by alignment
    drift: number; // 0-100: Misalignment from North
    velocity: number; // Actions per day
    alignment: number; // 0-100: How well aligned with North
}

export interface SignalInput {
    kineticComplete: number;
    kineticTotal: number;
    avgAlignment: number;
    daysElapsed: number;
}

/**
 * Calculate signal metrics from kinetic data
 */
export function calculateSignal(data: SignalInput): SignalMetrics {
    const { kineticComplete, kineticTotal, avgAlignment, daysElapsed } = data;

    // Progress: Percentage of kinetics completed
    const progress = kineticTotal > 0 ? (kineticComplete / kineticTotal) * 100 : 0;

    // Strength: Progress weighted by alignment quality
    const strength = progress * (avgAlignment / 100);

    // Drift: Inverse of alignment (higher = more misaligned)
    const drift = 100 - avgAlignment;

    // Velocity: Actions completed per day
    const velocity = daysElapsed > 0 ? kineticComplete / daysElapsed : 0;

    return {
        strength: Math.round(strength),
        drift: Math.round(drift),
        velocity: Math.round(velocity * 10) / 10, // One decimal
        alignment: Math.round(avgAlignment),
    };
}

/**
 * Detect drift and determine severity
 */
export function detectDrift(signal: SignalMetrics): {
    isDrifting: boolean;
    severity: 'low' | 'medium' | 'high';
    message: string;
    recommendation?: string;
} {
    const { drift, alignment } = signal;

    // Low drift: < 20%
    if (drift < 20) {
        return {
            isDrifting: false,
            severity: 'low',
            message: 'On track - excellent alignment',
        };
    }

    // Medium drift: 20-40%
    if (drift < 40) {
        return {
            isDrifting: true,
            severity: 'medium',
            message: 'Minor drift detected',
            recommendation: 'Review recent decisions to ensure alignment with your goal',
        };
    }

    // High drift: > 40%
    return {
        isDrifting: true,
        severity: 'high',
        message: 'Significant drift - course correction needed',
        recommendation: 'Consider revisiting your approach or adjusting your goal',
    };
}

/**
 * Calculate velocity trend
 */
export function calculateVelocityTrend(
    currentVelocity: number,
    previousVelocity: number,
): 'increasing' | 'stable' | 'decreasing' {
    const change = currentVelocity - previousVelocity;
    const threshold = 0.5; // 0.5 actions per day

    if (change > threshold) return 'increasing';
    if (change < -threshold) return 'decreasing';
    return 'stable';
}

/**
 * Predict completion based on current velocity
 */
export function predictCompletion(data: {
    kineticComplete: number;
    kineticTotal: number;
    velocity: number;
}): {
    daysRemaining: number;
    estimatedCompletionDate: Date;
} {
    const { kineticComplete, kineticTotal, velocity } = data;

    const remaining = kineticTotal - kineticComplete;
    const daysRemaining = velocity > 0 ? Math.ceil(remaining / velocity) : Infinity;

    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + daysRemaining);

    return {
        daysRemaining,
        estimatedCompletionDate,
    };
}

/**
 * Get signal health status
 */
export function getSignalHealth(signal: SignalMetrics): {
    status: 'excellent' | 'good' | 'warning' | 'critical';
    color: string;
    icon: string;
} {
    const { strength, drift } = signal;

    if (strength > 70 && drift < 20) {
        return {
            status: 'excellent',
            color: 'green',
            icon: 'i-ph:check-circle',
        };
    }

    if (strength > 50 && drift < 30) {
        return {
            status: 'good',
            color: 'blue',
            icon: 'i-ph:info',
        };
    }

    if (strength > 30 || drift < 50) {
        return {
            status: 'warning',
            color: 'yellow',
            icon: 'i-ph:warning',
        };
    }

    return {
        status: 'critical',
        color: 'red',
        icon: 'i-ph:x-circle',
    };
}
