import type { Route } from './+types/api.drift.calculate';
import { requireAuth } from '~/lib/auth.server';
import { createScopedLogger } from '~/utils/logger';
import { calculateDrift } from '~/lib/intelligence/drift-engine.server';
import { createNeo4jDriver } from '~/lib/.server/neo4j';

const logger = createScopedLogger('DriftAPI');

/**
 * POST /api/drift/calculate
 * Triggers a manual calculation of strategic drift.
 * 
 * Usage:
 * - Call this periodically (e.g. every 10 messages)
 * - Call this after significant file changes
 * - Call this manually from the Debug UI
 */
export async function action({ context, request }: Route.ActionArgs) {
  const userId = await requireAuth({ context, request });
  const env = context.cloudflare?.env || process.env;

  try {
    // get active north
     const driver = createNeo4jDriver(env);
     const session = driver.session();
     
     const northResult = await session.run(
       `MATCH (n:North {userId: $userId}) RETURN n.id as id ORDER BY n.createdAt DESC LIMIT 1`,
       { userId }
     );
     
     await session.close();
     await driver.close();
     
     if (northResult.records.length === 0) {
       return Response.json({ error: 'No active North Star found' }, { status: 404 });
     }
     
     const northId = northResult.records[0].get('id');

    // Calculate Drift
    const analysis = await calculateDrift(userId, northId, env);

    if (!analysis) {
        return Response.json({ error: 'Failed to calculate drift' }, { status: 500 });
    }

    return Response.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Drift API failed', error);
    return Response.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
