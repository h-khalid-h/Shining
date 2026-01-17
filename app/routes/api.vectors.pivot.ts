import type { Route } from './+types/api.vectors.pivot';
import { createNeo4jDriver } from '~/lib/.server/neo4j';
import { graphLogger } from '~/lib/.server/logger';
import { createErrorResponse, createSuccessResponse, ErrorCodes } from '~/lib/.server/api-response';

/**
 * Store Vector Selection as Pivot in Graph Database
 * 
 * This endpoint persists user's strategic vector choices as PIVOT relationships
 * in the Neo4j graph, enabling:
 * - Strategic decision history tracking
 * - Pattern analysis of user preferences
 * - Recommendation improvements over time
 */

interface PivotRequest {
    vectorId: string;
    northId: string;
    userId: string;
    approach: string;
    confidence?: number;
    metadata?: Record<string, any>;
}

export async function action({ request, context }: Route.ActionArgs) {
    try {
        const body: PivotRequest = await request.json();
        const { vectorId, northId, userId, approach, confidence, metadata } = body;

        // Validate required fields
        if (!vectorId || !northId || !userId || !approach) {
            return Response.json(
                { error: 'Missing required fields: vectorId, northId, userId, approach' },
                { status: 400 }
            );
        }

        // Get Neo4j driver
        const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
        const session = driver.session();

        try {
            // Store pivot as relationship in graph
            const result = await session.run(
                `
                MATCH (n:North {id: $northId})
                MERGE (v:Vector {id: $vectorId})
                ON CREATE SET 
                    v.approach = $approach,
                    v.confidence = $confidence,
                    v.createdAt = datetime(),
                    v.metadata = $metadata
                MERGE (n)-[p:PIVOT]->(v)
                ON CREATE SET 
                    p.selectedAt = datetime(),
                    p.selectedBy = $userId
                ON MATCH SET
                    p.lastSelectedAt = datetime()
                RETURN v, p
                `,
                {
                    northId,
                    vectorId,
                    approach,
                    confidence: confidence || 0.8,
                    userId,
                    metadata: metadata || {},
                }
            );

            const record = result.records[0];
            if (!record) {
                throw new Error('Failed to create pivot relationship');
            }

            return Response.json({
                success: true,
                pivot: {
                    vectorId,
                    northId,
                    selectedAt: new Date().toISOString(),
                },
            });
        } finally {
            await session.close();
            await driver.close();
        }
    } catch (error) {
        graphLogger.error('Pivot storage failed', error, {
            vectorId: body.vectorId,
            northId: body.northId,
        });

        return createErrorResponse(
            'Pivot Storage Error',
            error instanceof Error ? error.message : 'Failed to store pivot',
            {
                code: ErrorCodes.DATABASE_ERROR,
                status: 500,
            }
        );
    }
}
