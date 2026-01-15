import { getAuth } from '@clerk/remix/ssr.server';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';

/**
 * Require authentication for a route
 * Throws 401 if user is not authenticated
 */
export async function requireAuth(args: LoaderFunctionArgs | ActionFunctionArgs): Promise<string> {
    const { userId } = await getAuth(args);

    if (!userId) {
        throw new Response('Unauthorized', {
            status: 401,
            statusText: 'Authentication required',
        });
    }

    return userId;
}

/**
 * Get optional authentication
 * Returns userId or null if not authenticated
 */
export async function getOptionalAuth(args: LoaderFunctionArgs | ActionFunctionArgs): Promise<string | null> {
    const { userId } = await getAuth(args);
    return userId || null;
}

/**
 * Get user session data
 */
export async function getUserSession(args: LoaderFunctionArgs | ActionFunctionArgs) {
    const auth = await getAuth(args);
    return {
        userId: auth.userId,
        sessionId: auth.sessionId,
        orgId: auth.orgId,
    };
}
