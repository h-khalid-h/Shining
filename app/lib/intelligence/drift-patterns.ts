import type { DriftSnapshot } from './drift-history';

export interface DriftPattern {
    type: 'upward_trend' | 'downward_trend' | 'spike' | 'stability' | 'oscillation';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    messageIndex?: number;
    confidence: number;
}

/**
 * Analyzes drift snapshots to detect patterns and trends.
 */
export function detectDriftPatterns(snapshots: DriftSnapshot[]): DriftPattern[] {
    if (snapshots.length < 3) {
        return [];
    }

    const patterns: DriftPattern[] = [];

    // Sort by timestamp
    const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);

    // 1. Detect upward trends (consistent increase over 3+ messages)
    let upwardStreak = 0;
    let upwardSum = 0;

    for (let i = 1; i < sorted.length; i++) {
        const delta = sorted[i].driftScore - sorted[i - 1].driftScore;
        if (delta > 5) { // Threshold for "increasing"
            upwardStreak++;
            upwardSum += delta;
        } else {
            upwardStreak = 0;
            upwardSum = 0;
        }

        if (upwardStreak >= 3) {
            patterns.push({
                type: 'upward_trend',
                severity: upwardSum > 30 ? 'critical' : 'warning',
                message: `Drift has been consistently increasing over the last ${upwardStreak + 1} messages. Consider refining your goal or constraints.`,
                confidence: Math.min(upwardStreak * 25, 95),
            });
            break; // Only report once
        }
    }

    // 2. Detect downward trends (consistent decrease)
    let downwardStreak = 0;
    for (let i = 1; i < sorted.length; i++) {
        const delta = sorted[i].driftScore - sorted[i - 1].driftScore;
        if (delta < -5) {
            downwardStreak++;
        } else {
            downwardStreak = 0;
        }

        if (downwardStreak >= 3) {
            patterns.push({
                type: 'downward_trend',
                severity: 'info',
                message: `Project coherence is improving! Drift has decreased over ${downwardStreak + 1} messages.`,
                confidence: Math.min(downwardStreak * 25, 90),
            });
            break;
        }
    }

    // 3. Detect spikes (sudden large increase)
    for (let i = 1; i < sorted.length; i++) {
        const delta = sorted[i].driftScore - sorted[i - 1].driftScore;
        if (delta > 20) {
            patterns.push({
                type: 'spike',
                severity: 'critical',
                message: `Sudden drift spike detected at message #${sorted[i].messageIndex}. The conversation may have shifted significantly.`,
                messageIndex: sorted[i].messageIndex,
                confidence: 85,
            });
        }
    }

    // 4. Detect stability (low drift for extended period)
    const recentSnapshots = sorted.slice(-5);
    const avgDrift = recentSnapshots.reduce((sum, s) => sum + s.driftScore, 0) / recentSnapshots.length;
    const variance = recentSnapshots.reduce((sum, s) => sum + Math.pow(s.driftScore - avgDrift, 2), 0) / recentSnapshots.length;

    if (avgDrift < 15 && variance < 25 && recentSnapshots.length >= 5) {
        patterns.push({
            type: 'stability',
            severity: 'info',
            message: 'Excellent coherence! The conversation has remained well-aligned with your goal.',
            confidence: 90,
        });
    }

    // 5. Detect oscillation (alternating high/low drift)
    if (sorted.length >= 6) {
        let oscillations = 0;
        for (let i = 2; i < sorted.length; i++) {
            const prev2 = sorted[i - 2].driftScore;
            const prev1 = sorted[i - 1].driftScore;
            const current = sorted[i].driftScore;

            // Check if middle value is significantly different from neighbors
            if ((prev1 > prev2 + 10 && prev1 > current + 10) ||
                (prev1 < prev2 - 10 && prev1 < current - 10)) {
                oscillations++;
            }
        }

        if (oscillations >= 3) {
            patterns.push({
                type: 'oscillation',
                severity: 'warning',
                message: 'Drift is oscillating. The conversation may be jumping between different topics or approaches.',
                confidence: Math.min(oscillations * 20, 80),
            });
        }
    }

    return patterns;
}

/**
 * Calculate drift statistics for a set of snapshots.
 */
export function calculateDriftStats(snapshots: DriftSnapshot[]) {
    if (snapshots.length === 0) {
        return {
            average: 0,
            max: 0,
            min: 0,
            current: 0,
            trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
        };
    }

    const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
    const scores = sorted.map(s => s.driftScore);

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const current = scores[scores.length - 1];

    // Calculate trend from last 5 messages
    const recent = scores.slice(-5);
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

    if (recent.length >= 3) {
        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));
        const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

        if (secondAvg > firstAvg + 5) {
            trend = 'increasing';
        } else if (secondAvg < firstAvg - 5) {
            trend = 'decreasing';
        }
    }

    return {
        average: Math.round(average),
        max: Math.round(max),
        min: Math.round(min),
        current: Math.round(current),
        trend,
    };
}
