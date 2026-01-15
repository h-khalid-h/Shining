import type { Route } from './+types/api.graph.$northId';
import { getOptionalAuth } from '~/lib/auth.server';
import { GraphService } from '~/lib/intelligence/graph.server';
import { graphCache } from '~/lib/intelligence/graph-cache';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GraphAPI');

/**
 * GET /api/graph/:northId
 * Returns graph state for a specific North
 */
export async function loader({ context, params, request }: Route.LoaderArgs) {
    const userId = await getOptionalAuth({ context, request });
    const { northId } = params;

    if (!northId) {
        return Response.json({ error: 'North ID required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `graph:${northId}`;
    const cached = graphCache.get(cacheKey);

    if (cached) {
        logger.debug('Cache hit', { northId });
        return Response.json(cached);
    }

    // Check environment
    if (!context.cloudflare.env.NEO4J_URI) {
        logger.warn('Neo4j not configured');
        return Response.json(
            {
                north: null,
                bounds: [],
                signal: null,
                loading: false,
                error: 'Graph database not configured',
            },
            { status: 200 },
        );
    }

    const graph = new GraphService({
        uri: context.cloudflare.env.NEO4J_URI,
        username: context.cloudflare.env.NEO4J_USERNAME || 'neo4j',
        password: context.cloudflare.env.NEO4J_PASSWORD,
    });

    try {
        const state = await graph.getNorth(northId);

        if (!state) {
            return Response.json({ error: 'North not found' }, { status: 404 });
        }

        const response = {
            north: state.north,
            bounds: state.bounds,
            signal: state.signal,
            loading: false,
            error: null,
        };

        // Cache the response
        graphCache.set(cacheKey, response);

        logger.info('Graph state retrieved', { northId, userId });

        return Response.json(response);
    } catch (error) {
        logger.error('Failed to fetch graph state', { northId, error });

        return Response.json(
            {
                north: null,
                bounds: [],
                signal: null,
                loading: false,
                error: 'Failed to fetch graph state',
            },
            { status: 500 },
        );
    } finally {
        await graph.close();
    }
}
