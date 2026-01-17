import type { Route } from './+types/api.graph.bounds';
import { createNeo4jDriver } from '~/lib/.server/neo4j';
import { graphLogger } from '~/lib/.server/logger';
import { createErrorResponse, createSuccessResponse, ErrorCodes } from '~/lib/.server/api-response';

/**
 * Bound Management API
 * 
 * Manages constraints (Bound nodes) for North (goals)
 * Bounds represent constraints on achieving the goal:
 * - time: Deadline constraints
 * - cost: Budget constraints
 * - quality: Quality requirements
 * - scope: Scope limitations
 */

export async function action({ request, context }: Route.ActionArgs) {
    if (request.method !== 'POST') {
        return createErrorResponse(
            'Method Not Allowed',
            'Only POST requests are supported',
            { code: ErrorCodes.VALIDATION_ERROR, status: 405 }
        );
    }

    try {
        const body = await request.json();
        const { northId, userId, bounds } = body;

        // Validation
        if (!northId || !userId || !Array.isArray(bounds)) {
            return createErrorResponse(
                'Validation Error',
                'Missing required fields: northId, userId, bounds',
                { code: ErrorCodes.VALIDATION_ERROR, status: 400 }
            );
        }

        const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
        const session = driver.session();

        try {
            // Store each bound
            const results = [];
            for (const bound of bounds) {
                const result = await session.run(
                    `
                    MATCH (n:North {id: $northId})
                    CREATE (b:Bound {
                        id: $boundId,
                        metric: $metric,
                        value: $value,
                        threshold: $threshold,
                        unit: $unit,
                        hard: $hard,
                        confidence: $confidence,
                        createdAt: datetime(),
                        createdBy: $userId
                    })
                    CREATE (n)-[:HAS_BOUND]->(b)
                    RETURN b
                    `,
                    {
                        northId,
                        boundId: `bound_${bound.metric}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        metric: bound.metric,
                        value: bound.value,
                        threshold: bound.threshold || null,
                        unit: bound.unit || null,
                        hard: bound.confidence > 85,
                        confidence: bound.confidence,
                        userId,
                    }
                );

                if (result.records.length > 0) {
                    results.push(result.records[0].get('b').properties);
                }
            }

            graphLogger.info('Bounds stored successfully', {
                northId,
                userId,
                boundCount: results.length,
            });

            return createSuccessResponse({
                bounds: results,
                message: `Successfully stored ${results.length} bound(s)`,
            });
        } finally {
            await session.close();
            await driver.close();
        }
    } catch (error) {
        graphLogger.error('Bound storage failed', error);

        return createErrorResponse(
            'Bound Storage Error',
            error instanceof Error ? error.message : 'Failed to store bounds',
            {
                code: ErrorCodes.DATABASE_ERROR,
                status: 500,
            }
        );
    }
}

/**
 * GET /api/graph/bounds/:northId
 * Retrieve all bounds for a North
 */
export async function loader({ params, context }: Route.LoaderArgs) {
    const { northId } = params;

    if (!northId) {
        return createErrorResponse(
            'Validation Error',
            'northId is required',
            { code: ErrorCodes.VALIDATION_ERROR, status: 400 }
        );
    }

    try {
        const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
        const session = driver.session();

        try {
            const result = await session.run(
                `
                MATCH (n:North {id: $northId})-[:HAS_BOUND]->(b:Bound)
                RETURN b
                ORDER BY b.createdAt DESC
                `,
                { northId }
            );

            const bounds = result.records.map(record => record.get('b').properties);

            return createSuccessResponse({
                bounds,
                count: bounds.length,
            });
        } finally {
            await session.close();
            await driver.close();
        }
    } catch (error) {
        graphLogger.error('Bound retrieval failed', error, { northId });

        return createErrorResponse(
            'Bound Retrieval Error',
            error instanceof Error ? error.message : 'Failed to retrieve bounds',
            {
                code: ErrorCodes.DATABASE_ERROR,
                status: 500,
            }
        );
    }
}
