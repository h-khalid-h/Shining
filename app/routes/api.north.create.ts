import type { Route } from './+types/api.north.create';
import { getGraphClient } from '~/lib/.server/graph/client';
import { logger as graphLogger } from '~/lib/.server/graph/logger';

/**
 * Create North (Goal) in Graph Database
 * POST /api/north/create
 */
export async function action({ request }: Route.ActionArgs) {
    if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { description, userId, confidence = 0.8 } = body;

        if (!description || !userId) {
            return Response.json(
                { error: 'Description and userId are required' },
                { status: 400 }
            );
        }

        const graph = getGraphClient();

        try {
            // Create North node in graph
            const northId = `north-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const result = await graph.executeWrite(
                `
                CREATE (n:North {
                    id: $northId,
                    description: $description,
                    confidence: $confidence,
                    userId: $userId,
                    createdAt: datetime(),
                    updatedAt: datetime()
                })
                RETURN n
                `,
                {
                    northId,
                    description,
                    confidence,
                    userId,
                }
            );

            if (!result.records.length) {
                throw new Error('Failed to create North node');
            }

            const north = result.records[0].get('n').properties;

            graphLogger.info('North created successfully', {
                northId,
                userId,
                description: description.substring(0, 50),
            });

            return Response.json(
                {
                    success: true,
                    north: {
                        id: north.id,
                        description: north.description,
                        confidence: north.confidence,
                        createdAt: north.createdAt,
                        updatedAt: north.updatedAt,
                    },
                },
                { status: 201 }
            );
        } finally {
            await graph.close();
        }
    } catch (error) {
        graphLogger.error('North creation failed', error, {
            endpoint: '/api/graph/create-north',
        });

        return Response.json(
            {
                error: 'North Creation Error',
                message: error instanceof Error ? error.message : 'Failed to create North',
            },
            { status: 500 }
        );
    }
}
