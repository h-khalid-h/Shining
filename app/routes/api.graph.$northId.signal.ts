import type { Route } from './+types/api.graph.$northId.signal';
import { requireAuth } from '~/lib/auth.server';
import { GraphService } from '~/lib/intelligence/graph.server';
import { calculateSignalFromKinetics, storeSignal } from '~/lib/intelligence/signal-calculator.server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GraphAPI');

/**
 * POST /api/graph/:northId/signal
 * Auto-calculates signal from Kinetic data and stores it
 */
export async function action({ context, params, request }: Route.ActionArgs) {
    const userId = await requireAuth({ context, request });
    const { northId } = params;

    if (!northId) {
        return Response.json({ error: 'North ID required' }, { status: 400 });
    }

    if (!context.cloudflare.env.NEO4J_URI) {
        return Response.json({ error: 'Graph database not configured' }, { status: 503 });
    }

    try {
        // Calculate signal from Kinetics
        const signal = await calculateSignalFromKinetics(northId, context.cloudflare.env);

        if (!signal) {
            return Response.json(
                {
                    error: 'No Kinetic data available to calculate signal',
                    success: false,
                },
                { status: 404 },
            );
        }

        // Store signal in graph
        await storeSignal(northId, signal, userId, context.cloudflare.env);

        logger.info('Signal auto-calculated and stored', { northId, userId, signal });

        return Response.json({
            signal,
            success: true,
            message: 'Signal calculated from Kinetic data',
        });
    } catch (error) {
        logger.error('Failed to calculate signal', { northId, error });

        return Response.json(
            {
                error: 'Failed to calculate signal',
                success: false,
            },
            { status: 500 },
        );
    }
}
