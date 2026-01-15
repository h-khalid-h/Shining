import type { Route } from './+types/api.graph.$northId.signal';
import { requireAuth } from '~/lib/auth.server';
import { GraphService } from '~/lib/intelligence/graph.server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GraphAPI');

/**
 * POST /api/graph/:northId/signal
 * Recalculates signal for a North
 */
export async function action({ context, params, request }: Route.ActionArgs) {
    const userId = await requireAuth({ context, request });
    const { northId } = params;

    if (!northId) {
        return Response.json({ error: 'North ID required' }, { status: 400 });
    }

    if (!context.cloudflare.env.NEO4J_URI) {
        return Response.json({ error: 'Graph database not configured' }, { status: 503 });
    }

    const graph = new GraphService({
        uri: context.cloudflare.env.NEO4J_URI,
        username: context.cloudflare.env.NEO4J_USERNAME || 'neo4j',
        password: context.cloudflare.env.NEO4J_PASSWORD,
    });

    try {
        const signal = await graph.updateSignal(northId);

        logger.info('Signal recalculated', { northId, userId, signal });

        return Response.json({
            signal,
            success: true,
        });
    } catch (error) {
        logger.error('Failed to recalculate signal', { northId, error });

        return Response.json(
            {
                error: 'Failed to recalculate signal',
                success: false,
            },
            { status: 500 },
        );
    } finally {
        await graph.close();
    }
}
