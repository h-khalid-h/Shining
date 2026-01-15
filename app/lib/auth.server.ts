import { getAuth } from '@clerk/react-router/server';

/**
 * Require authentication for a route
 * Throws 401 if not authenticated
 */
export async function requireAuth(args: any) {
    const { userId } = await getAuth(args);

    if (!userId) {
        throw new Response('Unauthorized', { status: 401 });
    }

    return userId;
}

/**
 * Get optional authentication
 * Returns userId or null
 */
export async function getOptionalAuth(args: any) {
    const { userId } = await getAuth(args);
    return userId || null;
}
