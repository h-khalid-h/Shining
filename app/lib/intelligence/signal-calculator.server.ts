import { createNeo4jDriver } from '~/lib/.server/neo4j';
import type { SignalMetrics } from './signals';

/**
 * Calculate signal metrics from Kinetic nodes in the graph
 * More accurate than manual signal updates
 */
export async function calculateSignalFromKinetics(
    northId: string,
    env: any
): Promise<SignalMetrics | null> {
    const driver = createNeo4jDriver(env);
    const session = driver.session();

    try {
        // Query all kinetics for this North
        const result = await session.run(
            `
      MATCH (n:North {id: $northId})-[:HAS_KINETIC]->(k:Kinetic)
      RETURN k
      ORDER BY k.createdAt ASC
      `,
            { northId }
        );

        const kinetics = result.records.map(r => r.get('k').properties);

        if (kinetics.length === 0) {
            return null; // No data to calculate from
        }

        // Calculate metrics
        const total = kinetics.length;
        const complete = kinetics.filter(k => k.status === 'complete').length;

        // Average alignment score
        const avgAlignment =
            kinetics.reduce((sum, k) => sum + (Number(k.alignmentScore) || 50), 0) / total;

        // Calculate time span
        const firstKinetic = kinetics[0];
        const lastKinetic = kinetics[kinetics.length - 1];

        const firstDate = new Date(firstKinetic.createdAt);
        const lastDate = new Date(lastKinetic.createdAt);
        const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
        const daysElapsed = Math.max(1, daysDiff); // Minimum 1 day

        // Drift: inverse of alignment
        const drift = 100 - avgAlignment;

        // Strength: completion rate weighted by alignment
        const completionRate = (complete / total) * 100;
        const strength = completionRate * (avgAlignment / 100);

        // Velocity: kinetics per day
        const velocity = complete / daysElapsed;

        return {
            strength: Math.round(strength),
            drift: Math.round(drift),
            alignment: Math.round(avgAlignment),
            velocity: Math.round(velocity * 10) / 10, // One decimal place
        };
    } finally {
        await session.close();
        await driver.close();
    }
}

/**
 * Store calculated signal in the graph
 */
export async function storeSignal(
    northId: string,
    signal: SignalMetrics,
    userId: string,
    env: any
): Promise<void> {
    const driver = createNeo4jDriver(env);
    const session = driver.session();

    try {
        await session.run(
            `
      MATCH (n:North {id: $northId})
      MERGE (n)-[:TRACKS]->(s:Signal {id: $signalId})
      SET s = {
        id: $signalId,
        drift: $drift,
        strength: $strength,
        alignment: $alignment,
        velocity: $velocity,
        updatedAt: datetime(),
        createdBy: $userId
      }
      RETURN s
      `,
            {
                northId,
                signalId: `signal_${northId}`,
                drift: signal.drift,
                strength: signal.strength,
                alignment: signal.alignment,
                velocity: signal.velocity,
                userId,
            }
        );
    } finally {
        await session.close();
        await driver.close();
    }
}
