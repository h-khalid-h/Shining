import type { Route } from './+types/api.graph.kinetics';
import { createNeo4jDriver } from '~/lib/.server/neo4j';
import { graphLogger } from '~/lib/.server/logger';
import { createErrorResponse, createSuccessResponse, ErrorCodes } from '~/lib/.server/api-response';

/**
 * Kinetic Management API
 * 
 * Manages Kinetic nodes for action/task tracking:
 * - type: "digital" | "physical"
 * - description: What action was taken
 * - status: "pending" | "running" | "complete" | "failed"
 * - alignmentScore: How well aligned with North (0-100)
 * - effort: Effort points (1-5)
 */

export async function action({ request, context, params }: Route.ActionArgs) {
    const { id } = params;

    // PATCH - Update kinetic status
    if (request.method === 'PATCH' && id) {
        try {
            const body = await request.json();
            const { status, outcome, completedAt } = body;

            if (!status) {
                return createErrorResponse(
                    'Validation Error',
                    'status is required',
                    { code: ErrorCodes.VALIDATION_ERROR, status: 400 }
                );
            }

            const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
            const session = driver.session();

            try {
                const result = await session.run(
                    `
                    MATCH (k:Kinetic {id: $id})
                    SET 
                        k.status = $status,
                        k.outcome = $outcome,
                        k.completedAt = $completedAt
                    RETURN k
                    `,
                    {
                        id,
                        status,
                        outcome: outcome || null,
                        completedAt: completedAt ? new Date(completedAt) : null,
                    }
                );

                if (result.records.length === 0) {
                    return createErrorResponse(
                        'Not Found',
                        'Kinetic not found',
                        { code: ErrorCodes.NOT_FOUND, status: 404 }
                    );
                }

                const kinetic = result.records[0].get('k').properties;

                graphLogger.info('Kinetic updated', { id, status });

                return createSuccessResponse({
                    kinetic,
                    message: 'Kinetic updated successfully',
                });
            } finally {
                await session.close();
                await driver.close();
            }
        } catch (error) {
            graphLogger.error('Kinetic update failed', error, { id });

            return createErrorResponse(
                'Kinetic Update Error',
                error instanceof Error ? error.message : 'Failed to update kinetic',
                { code: ErrorCodes.DATABASE_ERROR, status: 500 }
            );
        }
    }

    // POST - Create kinetic
    if (request.method === 'POST') {
        try {
            const body = await request.json();
            const { northId, pivotId, userId, kinetic } = body;

            // Validation
            if (!northId || !userId || !kinetic) {
                return createErrorResponse(
                    'Validation Error',
                    'Missing required fields: northId, userId, kinetic',
                    { code: ErrorCodes.VALIDATION_ERROR, status: 400 }
                );
            }

            const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
            const session = driver.session();

            try {
                const kineticId = `kinetic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Create kinetic and relationships
                const query = pivotId
                    ? `
                    MATCH (n:North {id: $northId})
                    MATCH (p:Pivot {id: $pivotId})
                    CREATE (k:Kinetic {
                        id: $kineticId,
                        type: $type,
                        description: $description,
                        status: $status,
                        alignmentScore: $alignmentScore,
                        effort: $effort,
                        outcome: $outcome,
                        startedAt: datetime(),
                        createdAt: datetime(),
                        createdBy: $userId
                    })
                    CREATE (n)-[:HAS_KINETIC]->(k)
                    CREATE (p)-[:LEADS_TO]->(k)
                    RETURN k
                    `
                    : `
                    MATCH (n:North {id: $northId})
                    CREATE (k:Kinetic {
                        id: $kineticId,
                        type: $type,
                        description: $description,
                        status: $status,
                        alignmentScore: $alignmentScore,
                        effort: $effort,
                        outcome: $outcome,
                        startedAt: datetime(),
                        createdAt: datetime(),
                        createdBy: $userId
                    })
                    CREATE (n)-[:HAS_KINETIC]->(k)
                    RETURN k
                    `;

                const result = await session.run(query, {
                    northId,
                    pivotId: pivotId || null,
                    kineticId,
                    type: kinetic.type || 'digital',
                    description: kinetic.description,
                    status: kinetic.status || 'complete',
                    alignmentScore: kinetic.alignmentScore || 50,
                    effort: kinetic.effort || 1,
                    outcome: kinetic.outcome || null,
                    userId,
                });

                if (result.records.length === 0) {
                    return createErrorResponse(
                        'Kinetic Creation Error',
                        'North node not found',
                        { code: ErrorCodes.NOT_FOUND, status: 404 }
                    );
                }

                const kineticNode = result.records[0].get('k').properties;

                graphLogger.info('Kinetic created', {
                    northId,
                    kineticId,
                    description: kinetic.description,
                });

                return createSuccessResponse({
                    kinetic: kineticNode,
                    message: 'Kinetic created successfully',
                });
            } finally {
                await session.close();
                await driver.close();
            }
        } catch (error) {
            graphLogger.error('Kinetic creation failed', error);

            return createErrorResponse(
                'Kinetic Creation Error',
                error instanceof Error ? error.message : 'Failed to create kinetic',
                { code: ErrorCodes.DATABASE_ERROR, status: 500 }
            );
        }
    }

    return createErrorResponse(
        'Method Not Allowed',
        'Only POST and PATCH requests are supported',
        { code: ErrorCodes.VALIDATION_ERROR, status: 405 }
    );
}

/**
 * GET /api/graph/kinetics/:northId
 * Retrieve all kinetics for a North
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
            // Get all kinetics
            const result = await session.run(
                `
                MATCH (n:North {id: $northId})-[:HAS_KINETIC]->(k:Kinetic)
                RETURN k
                ORDER BY k.createdAt DESC
                `,
                { northId }
            );

            const kinetics = result.records.map(record => record.get('k').properties);

            // Calculate stats
            const total = kinetics.length;
            const complete = kinetics.filter(k => k.status === 'complete').length;
            const pending = kinetics.filter(k => k.status === 'pending').length;
            const running = kinetics.filter(k => k.status === 'running').length;
            const failed = kinetics.filter(k => k.status === 'failed').length;
            const totalEffort = kinetics.reduce((sum, k) => sum + (k.effort || 0), 0);

            return createSuccessResponse({
                kinetics,
                stats: {
                    total,
                    complete,
                    pending,
                    running,
                    failed,
                    totalEffort,
                },
            });
        } finally {
            await session.close();
            await driver.close();
        }
    } catch (error) {
        graphLogger.error('Kinetic retrieval failed', error, { northId });

        return createErrorResponse(
            'Kinetic Retrieval Error',
            error instanceof Error ? error.message : 'Failed to retrieve kinetics',
            { code: ErrorCodes.DATABASE_ERROR, status: 500 }
        );
    }
}
