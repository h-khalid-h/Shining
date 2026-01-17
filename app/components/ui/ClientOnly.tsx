/**
 * ClientOnly Component
 * 
 * Prevents SSR rendering of child components to avoid hydration mismatches.
 * Children are only rendered after the component has mounted on the client.
 * 
 * Use this for components that:
 * - Use browser-only APIs
 * - Have complex lazy loading
 * - Cause hydration mismatches
 */
import { useState, useEffect, type ReactNode } from 'react';

interface ClientOnlyProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted ? <>{children}</> : <>{fallback}</>;
}
