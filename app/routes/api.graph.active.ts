import type { Route } from './+types/api.graph.active';
import { requireAuth } from '~/lib/auth.server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GraphAPI');

/**
 * GET /api/graph/active
 * Returns the user's active North ID
 */
export async function loader({ context, request }: LoaderFunctionArgs) {
    const userId = await requireAuth({ context, request });

    // For now, return null - will be implemented when we track active North
    // In the future, this will query the graph for the user's most recent North
    logger.info('Active North requested', { userId });

    return json({
        northId: null,
        message: 'No active North found',
    });
}
