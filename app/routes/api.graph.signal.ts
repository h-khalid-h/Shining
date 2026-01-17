import type { Route } from './+types/api.graph.signal';
import { createNeo4jDriver } from '~/lib/.server/neo4j';
import { graphLogger } from '~/lib/.server/logger';
import { createErrorResponse, createSuccessResponse, ErrorCodes } from '~/lib/.server/api-response';

/**
 * Signal Management API
 * 
 * Manages Signal nodes for real-time metrics tracking:
 * - strength: Overall progress (0-100)
 * - drift: Misalignment from North (0-100)
 * - velocity: Actions per day
 * - kineticComplete: Completed actions
 * - kineticTotal: Total actions
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
        const { northId, userId, signal } = body;

        // Validation
        if (!northId || !userId || !signal) {
            return createErrorResponse(
                'Validation Error',
                'Missing required fields: northId, userId, signal',
                { code: ErrorCodes.VALIDATION_ERROR, status: 400 }
            );
        }

        const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
        const session = driver.session();

        try {
            // Update or create Signal node
            const result = await session.run(
                `
                MATCH (n:North {id: $northId})
                MERGE (n)-[r:TRACKS]->(s:Signal)
                ON CREATE SET
                    s.id = $signalId,
                    s.createdAt = datetime(),
                    s.createdBy = $userId
                SET
                    s.strength = $strength,
                    s.drift = $drift,
                    s.velocity = $velocity,
                    s.kineticComplete = $kineticComplete,
                    s.kineticTotal = $kineticTotal,
                    s.lastUpdate = datetime()
                RETURN s
                `,
                {
                    northId,
                    signalId: `signal_${northId}_${Date.now()}`,
                    userId,
                    strength: signal.strength || 0,
                    drift: signal.drift || 0,
                    velocity: signal.velocity || 0,
                    kineticComplete: signal.kineticComplete || 0,
                    kineticTotal: signal.kineticTotal || 0,
                }
            );

            if (result.records.length === 0) {
                return createErrorResponse(
                    'Signal Update Error',
                    'North node not found',
                    { code: ErrorCodes.NOT_FOUND, status: 404 }
                );
            }

            const signalNode = result.records[0].get('s').properties;

            graphLogger.info('Signal updated successfully', {
                northId,
                userId,
                drift: signal.drift,
                strength: signal.strength,
            });

            return createSuccessResponse({
                signal: signalNode,
                message: 'Signal updated successfully',
            });
        } finally {
            await session.close();
            await driver.close();
        }
    } catch (error) {
        graphLogger.error('Signal update failed', error);

        return createErrorResponse(
            'Signal Update Error',
            error instanceof Error ? error.message : 'Failed to update signal',
            {
                code: ErrorCodes.DATABASE_ERROR,
                status: 500,
            }
        );
    }
}

/**
 * GET /api/graph/signal/:northId
 * Retrieve current signal for a North
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
                MATCH (n:North {id: $northId})-[:TRACKS]->(s:Signal)
                RETURN s
                ORDER BY s.lastUpdate DESC
                LIMIT 1
                `,
                { northId }
            );

            if (result.records.length === 0) {
                return createSuccessResponse({
                    signal: null,
                    message: 'No signal found for this North',
                });
            }

            const signal = result.records[0].get('s').properties;

            return createSuccessResponse({
                signal,
            });
        } finally {
            await session.close();
            await driver.close();
        }
    } catch (error) {
        graphLogger.error('Signal retrieval failed', error, { northId });

        return createErrorResponse(
            'Signal Retrieval Error',
            error instanceof Error ? error.message : 'Failed to retrieve signal',
            {
                code: ErrorCodes.DATABASE_ERROR,
                status: 500,
            }
        );
    }
}
