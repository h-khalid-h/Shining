'use client';

import { useState, useEffect } from 'react';
import { IntelligenceLayer, type IntelligenceLayerProps } from './IntelligenceLayer';

export function IntelligenceLayerClient(props: IntelligenceLayerProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    return <IntelligenceLayer {...props} />;
}
