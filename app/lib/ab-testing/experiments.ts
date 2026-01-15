/**
 * A/B Testing Framework
 * Deterministic user assignment to experiment variants
 */

export interface Experiment {
    id: string;
    name: string;
    enabled: boolean;
    variants: {
        control: number; // Percentage (0-100)
        treatment: number; // Percentage (0-100)
    };
}

export const experiments: Record<string, Experiment> = {
    understandingCard: {
        id: 'understanding-card-v1',
        name: 'Understanding Card Feature',
        enabled: true,
        variants: {
            control: 0,
            treatment: 100,
        },
    },
};

/**
 * Simple hash function for deterministic assignment
 */
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Get variant for a user in an experiment
 * Returns 'control' or 'treatment' deterministically based on userId
 */
export function getVariant(
    experimentId: string,
    userId: string,
): 'control' | 'treatment' {
    const experiment = experiments[experimentId];

    if (!experiment || !experiment.enabled) {
        return 'control';
    }

    // Create deterministic hash from userId + experimentId
    const hash = simpleHash(userId + experimentId);
    const percentage = hash % 100;

    // Assign based on percentage
    return percentage < experiment.variants.treatment ? 'treatment' : 'control';
}

/**
 * Check if user is in treatment group
 */
export function isInTreatment(experimentId: string, userId: string): boolean {
    return getVariant(experimentId, userId) === 'treatment';
}

/**
 * Get all active experiments
 */
export function getActiveExperiments(): Experiment[] {
    return Object.values(experiments).filter((exp) => exp.enabled);
}

/**
 * Get experiment by ID
 */
export function getExperiment(experimentId: string): Experiment | null {
    return experiments[experimentId] || null;
}
