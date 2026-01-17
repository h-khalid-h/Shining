import { useState, useEffect } from 'react';

/**
 * Hook to monitor online/offline connection status.
 * Listens to browser online/offline events.
 */
export function useConnectionStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => {
            console.log('Connection restored');
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log('Connection lost');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
