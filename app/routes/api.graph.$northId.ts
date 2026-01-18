import type { Route } from './+types/api.graph.$northId';
import { getOptionalAuth } from '~/lib/auth.server';
import { GraphService } from '~/lib/intelligence/graph.server';
import { graphCache } from '~/lib/intelligence/graph-cache';
import { createScopedLogger } from '~/utils/logger';
import { createNeo4jDriver } from '~/lib/.server/neo4j';

const logger = createScopedLogger('GraphAPI');

/**
 * GET /api/graph/:northId - Returns graph state for a specific North
 * POST /api/graph/:northId - Create or update a North node
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
    const env = context.cloudflare?.env || process.env;

    if (!env.NEO4J_URI) {
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
        uri: env.NEO4J_URI,
        username: env.NEO4J_USERNAME || 'neo4j',
        password: env.NEO4J_PASSWORD,
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

/**
 * POST /api/graph/:northId
 * Create or update North node
 */
export async function action({ request, params, context }: Route.ActionArgs) {
    const { northId } = params;

    if (!northId) {
        return Response.json({ error: 'North ID required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { description, userId, confidence } = body;

        if (!description || !userId) {
            return Response.json(
                { error: 'Missing required fields: description, userId' },
                { status: 400 }
            );
        }

        const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
        const session = driver.session();

        try {
            // Use MERGE to create or update
            const result = await session.run(
                `
                MERGE (n:North {id: $northId})
                ON CREATE SET
                    n.description = $description,
                    n.createdAt = datetime(),
                    n.updatedAt = datetime(),
                    n.userId = $userId,
                    n.confidence = COALESCE($confidence, 0.8)
                ON MATCH SET
                    n.description = $description,
                    n.updatedAt = datetime(),
                    n.updatedBy = $userId,
                    n.confidence = COALESCE($confidence, n.confidence)
                RETURN n
                `,
                { northId, description, userId, confidence: confidence || null }
            );

            const record = result.records[0];
            if (!record) {
                return Response.json(
                    { error: 'Failed to create/update North' },
                    { status: 500 }
                );
            }

            const north = record.get('n').properties;

            // Invalidate cache
            graphCache.delete(`graph:${northId}`);

            logger.info('North created/updated', { northId, userId });

            return Response.json({
                success: true,
                north: {
                    id: north.id,
                    description: north.description,
                    confidence: north.confidence,
                    createdAt: north.createdAt,
                    updatedAt: north.updatedAt,
                },
            });
        } finally {
            await session.close();
            await driver.close();
        }
    } catch (error) {
        logger.error('North create/update failed', { northId, error });
        return Response.json(
            { error: 'Failed to create/update North' },
            { status: 500 }
        );
    }
}
