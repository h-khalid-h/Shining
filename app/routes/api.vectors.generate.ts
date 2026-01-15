/**
 * API Route: Generate Vectors
 * POST /api/vectors/generate
 */

import { json } from 'react-router';
import type { Route } from './+types/generate';
import { getOptionalAuth } from '~/lib/auth.server';
import { generateVectors } from '~/lib/intelligence/vector-generator';

export async function action({ request }: Route.ActionArgs) {
    const userId = await getOptionalAuth(request);

    if (!userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { north, bounds, context } = await request.json();

    if (!north || !bounds) {
        return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
        return json({ error: 'AI service not configured' }, { status: 500 });
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

        return json({ vectors });
    } catch (error) {
        console.error('Vector generation failed:', error);
        return json({ error: 'Failed to generate vectors' }, { status: 500 });
    }
}
