import type { Route } from './+types/api.graph.update-north';
import { createNeo4jDriver } from '~/lib/.server/neo4j';
import { graphLogger } from '~/lib/.server/logger';
import { createErrorResponse, createSuccessResponse, ErrorCodes } from '~/lib/.server/api-response';

/**
 * Update North (Goal) in Graph Database
 * 
 * Allows users to adjust their goal when drift is detected or
 * when they want to refine their strategic direction
 */

interface UpdateNorthRequest {
    northId: string;
    description: string;
    userId: string;
    confidence?: number;
}

export async function action({ request, context }: Route.ActionArgs) {
    try {
        const body: UpdateNorthRequest = await request.json();
        const { northId, description, userId, confidence } = body;

        // Validate required fields
        if (!northId || !description || !userId) {
            return Response.json(
                { error: 'Missing required fields: northId, description, userId' },
                { status: 400 }
            );
        }

        // Get Neo4j driver
        const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
        const session = driver.session();

        try {
            // Update North node in graph
            const result = await session.run(
                `
                MATCH (n:North {id: $northId})
                SET 
                    n.description = $description,
                    n.updatedAt = datetime(),
                    n.updatedBy = $userId,
                    n.confidence = COALESCE($confidence, n.confidence)
                RETURN n
                `,
                {
                    northId,
                    description,
                    userId,
                    confidence: confidence || null,
                }
            );

            const record = result.records[0];
            if (!record) {
                return Response.json(
                    { error: 'North not found' },
                    { status: 404 }
                );
            }

            const updatedNorth = record.get('n').properties;

            return Response.json({
                success: true,
                north: {
                    id: updatedNorth.id,
                    description: updatedNorth.description,
                    confidence: updatedNorth.confidence,
                    updatedAt: updatedNorth.updatedAt,
                },
            });
        } finally {
            await session.close();
            await driver.close();
        }
    } catch (error) {
        graphLogger.error('North update failed', error, {
            northId: body.northId,
            userId: body.userId,
        });

        return createErrorResponse(
            'North Update Error',
            error instanceof Error ? error.message : 'Failed to update North',
            {
                code: ErrorCodes.DATABASE_ERROR,
                status: 500,
            }
        );
    }
}
