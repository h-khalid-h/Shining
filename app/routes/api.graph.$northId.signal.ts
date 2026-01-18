import type { Route } from './+types/api.graph.$northId.signal';
import { requireAuth } from '~/lib/auth.server';
import { calculateSignalFromKinetics, storeSignal } from '~/lib/intelligence/signal-calculator.server';
import { createScopedLogger } from '~/utils/logger';
import { createSuccessResponse } from '~/lib/.server/api-response';

const logger = createScopedLogger('GraphAPI');

/**
 * GET /api/graph/:northId/signal
 * Retrieve the current signal for a North
 */
export async function loader({ context, params, request }: Route.LoaderArgs) {
    const userId = await requireAuth({ context, request });
    const { northId } = params;

    if (!northId) {
        return Response.json({ error: 'North ID required' }, { status: 400 });
    }

    const env = context.cloudflare?.env || process.env;

    if (!env.NEO4J_URI) {
        return Response.json({ error: 'Graph database not configured' }, { status: 503 });
    }

    try {
        // Calculate signal from Kinetics
        const signal = await calculateSignalFromKinetics(northId, env);

        if (!signal) {
            return createSuccessResponse({
                signal: null,
                message: 'No kinetic data available to calculate signal',
            });
        }

        return createSuccessResponse({
            signal,
            message: 'Signal calculated from kinetic data',
        });
    } catch (error) {
        logger.error('Failed to retrieve signal', { northId, error });

        return Response.json(
            {
                error: 'Failed to retrieve signal',
                success: false,
            },
            { status: 500 },
        );
    }
}

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

    const env = context.cloudflare?.env || process.env;

    if (!env.NEO4J_URI) {
        return Response.json({ error: 'Graph database not configured' }, { status: 503 });
    }

    try {
        // Calculate signal from Kinetics
        const signal = await calculateSignalFromKinetics(northId, env);

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
        await storeSignal(northId, signal, userId, env);

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
