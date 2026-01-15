/**
 * API Route: Generate Vectors
 * POST /api/vectors/generate
 */

import type { Route } from './+types/api.vectors.generate';
import { getOptionalAuth } from '~/lib/auth.server';
import { generateVectors } from '~/lib/intelligence/vector-generator';

export async function action({ request, context }: Route.ActionArgs) {
    const userId = await getOptionalAuth({ request, context });

    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { north, bounds, context } = await request.json();

    if (!north || !bounds) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const anthropicApiKey = context.cloudflare?.env?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
        return Response.json({ error: 'AI service not configured' }, { status: 500 });
    }

    try {
        const vectors = await generateVectors(
            {
                north,
                bounds,
                context,
            },
            anthropicApiKey,
        );

        return Response.json({ vectors });
    } catch (error) {
        console.error('Vector generation failed:', error);
        return Response.json({ error: 'Failed to generate vectors' }, { status: 500 });
    }
}
