import { createNeo4jDriver } from '~/lib/.server/neo4j';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ContextInjector');

export interface StrategicContext {
  north: string | null;
  northId: string | null;
  drift: number | null;
  strength: number | null;
  vector: {
    description: string;
    approach: string;
    selectedAt: string;
  } | null;
}

/**
 * Fetches the current strategic context for a user
 * - Latest North Star
 * - Current Signal (Drift/Strength)
 * - Selected Strategic Vector
 */
export async function getStrategicContext(userId: string, env: any): Promise<StrategicContext> {
  const driver = createNeo4jDriver(env);
  const session = driver.session();

  try {
    // Comprehensive query to get the full "Brain State" of the user
    const result = await session.run(
      `
      MATCH (n:North {userId: $userId})
      WITH n ORDER BY n.createdAt DESC LIMIT 1
      
      // Get latest signal
      OPTIONAL MATCH (n)-[:TRACKS]->(s:Signal)
      WITH n, s ORDER BY s.lastUpdate DESC LIMIT 1
      
      // Get latest selected pivot (Vector)
      OPTIONAL MATCH (n)-[p:PIVOT]->(v:Vector)
      WITH n, s, v, p ORDER BY p.selectedAt DESC LIMIT 1
      
      RETURN 
        n.id as northId,
        n.description as north,
        s.drift as drift,
        s.strength as strength,
        v.description as vectorDescription,
        v.approach as vectorApproach,
        p.selectedAt as vectorSelectedAt
      `,
      { userId }
    );

    if (result.records.length === 0) {
      return {
        north: null,
        northId: null,
        drift: null,
        strength: null,
        vector: null
      };
    }

    const record = result.records[0];

    return {
      north: record.get('north'),
      northId: record.get('northId'),
      drift: record.get('drift'),
      strength: record.get('strength'),
      vector: record.get('vectorDescription') ? {
        description: record.get('vectorDescription'),
        approach: record.get('vectorApproach'),
        selectedAt: record.get('vectorSelectedAt')
      } : null
    };

  } catch (error) {
    logger.error('Failed to fetch strategic context', error);
    return {
      north: null,
      northId: null,
      drift: null,
      strength: null,
      vector: null
    };
  } finally {
    await session.close();
    await driver.close();
  }
}

/**
 * Formats the strategic context into a System Message
 */
export function formatContextMessage(context: StrategicContext): string {
  if (!context.north) return '';

  const parts = [
    `🚨 **CRITICAL CONTEXT INJECTION**`,
    `You are NOT a fresh instance. You are continuing an existing strategic mission.`,
    `---`,
    `**🌟 NORTH STAR (User's Ultimate Goal):**`,
    `"${context.north}"`,
  ];

  if (context.vector) {
    parts.push(
      `\n**🚀 SELECTED STRATEGY (Vector):**`,
      `"${context.vector.description}"`,
      `Approach: ${context.vector.approach}`,
      `(Selected: ${new Date(context.vector.selectedAt).toLocaleString()})`
    );
  }

  if (context.drift !== null) {
    parts.push(
      `\n**📡 DRIFT STATUS:**`,
      `Drift: ${context.drift}% | Strength: ${context.strength}%`,
      context.drift > 20 ? `⚠️ WARNING: User is drifting from the North Star. Gently nudge them back.` : `✅ ALIGNMENT: User is on track.`
    );
  }

  parts.push(
    `---`,
    `INSTRUCTIONS:`,
    `1. COMPARE every user request against the North Star.`,
    `2. IF the request deviates, WARN them (Drift Detection).`,
    `3. EXECUTE the specific steps in the Selected Vector.`
  );

  return parts.join('\n');
}
