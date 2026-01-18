import type { Route } from './+types/api.graph.active';
import { requireAuth } from '~/lib/auth.server';
import { createScopedLogger } from '~/utils/logger';
import { createNeo4jDriver } from '~/lib/.server/neo4j';

const logger = createScopedLogger('GraphAPI');

/**
 * GET /api/graph/active
 * Returns the user's active North ID (most recent North for the user)
 */
export async function loader({ context, request }: Route.LoaderArgs) {
    const userId = await requireAuth({ context, request });

    const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
    const session = driver.session();

    try {
        logger.info('Querying active North', { userId });

        // Query for the user's most recent North
        const result = await session.run(
            `
            MATCH (n:North {userId: $userId})
            RETURN n.id as northId, n.createdAt as createdAt, n.userId as storedUserId
            ORDER BY n.createdAt DESC
            LIMIT 1
            `,
            { userId }
        );

        logger.info('Query result', {
            userId,
            recordCount: result.records.length,
            summary: result.summary
        });

        const record = result.records[0];
        if (!record) {
            logger.warn('No North found for user', { userId });
            return Response.json({
                northId: null,
                message: 'No active North found',
            });
        }

        const northId = record.get('northId');
        const storedUserId = record.get('storedUserId');
        logger.info('Active North found', { userId, northId, storedUserId });

        return Response.json({
            northId,
            message: 'Active North found',
        });
    } catch (error) {
        logger.error('Failed to fetch active North', { userId, error });
        return Response.json(
            { northId: null, message: 'Error fetching active North' },
            { status: 500 }
        );
    } finally {
        await session.close();
        await driver.close();
    }
}
