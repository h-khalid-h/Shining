import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { useAuth } from '@clerk/react-router';
import { graphStore } from '~/lib/stores/graph';
import { workbenchStore } from '~/lib/stores/workbench';

/**
 * Hook to automatically configure Kinetic tracking when conditions are met
 * 
 * Sets up tracking context in workbench store when:
 * - User is authenticated (has userId)
 * - North exists (user has established a goal)
 * - Environment is available
 * 
 * This enables automatic Kinetic node creation for all file operations
 * and terminal commands executed through the action runner.
 * 
 * @example
 * ```tsx
 * // In Chat.client.tsx or main app component
 * function App() {
 *   useAutoKineticTracking();
 *   // ... rest of component
 * }
 * ```
 */
export function useAutoKineticTracking() {
    const { userId } = useAuth();
    const graph = useStore(graphStore);

    useEffect(() => {
        // Only set tracking context when all conditions are met
        if (userId && graph.north) {
            workbenchStore.setTrackingContext({
                northId: graph.north.id,
                userId,
                // Note: env is not available in client-side
                // The server-side tracking will use context.cloudflare.env
                env: undefined,
            });
        } else {
            // Clear tracking context when conditions aren't met
            workbenchStore.setTrackingContext({});
        }
    }, [userId, graph.north?.id]);
}
