import type { Route } from './+types/api.graph.kinetics.update-alignment';
import { requireAuth } from '~/lib/auth.server';
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '~/lib/.server/api-response';
import neo4j from 'neo4j-driver';

/**
 * POST /api/graph/kinetics/update-alignment
 * Updates the alignment score of a Kinetic node with AI-generated score
 */
export async function action({ context, request }: Route.ActionArgs) {
    const userId = await requireAuth({ context, request });
    const { kineticId, alignmentScore, reasoning } = await request.json<{
        kineticId: string;
        alignmentScore: number;
        reasoning: string;
    }>();

    if (!context.cloudflare?.env.NEO4J_URI) {
        return createErrorResponse('Graph database not configured', ErrorCodes.SERVICE_UNAVAILABLE);
    }

    const driver = neo4j.driver(
        context.cloudflare.env.NEO4J_URI,
        neo4j.auth.basic(
            context.cloudflare.env.NEO4J_USERNAME || 'neo4j',
            context.cloudflare.env.NEO4J_PASSWORD
        )
    );

    const session = driver.session();

    try {
        const result = await session.run(
            `
      MATCH (k:Kinetic {id: $kineticId})
      SET k.alignmentScore = $alignmentScore,
          k.aiReasoning = $reasoning,
          k.aiScored = true,
          k.updatedAt = datetime()
      RETURN k
      `,
            {
                kineticId,
                alignmentScore,
                reasoning,
            }
        );

        if (result.records.length === 0) {
            return createErrorResponse('Kinetic not found', ErrorCodes.NOT_FOUND);
        }

        return createSuccessResponse({
            kineticId,
            alignmentScore,
            updated: true,
        });
    } catch (error: any) {
        console.error('Failed to update alignment:', error);
        return createErrorResponse(
            'Failed to update alignment score',
            ErrorCodes.INTERNAL_ERROR
        );
    } finally {
        await session.close();
        await driver.close();
    }
}
