/**
 * Gence Tier System
 * Defines subscription tiers and feature access
 */

export type TierName = 'free' | 'pro' | 'enterprise';

export interface TierFeatures {
    // Usage limits
    messagesPerDay: number;
    projects: number;

    // Feature access
    features: string[];

    // Pricing
    price: number; // USD per month
    priceYearly?: number; // USD per year (optional discount)

    // Display
    name: string;
    description: string;
    popular?: boolean;
}

export const TIERS: Record<TierName, TierFeatures> = {
    free: {
        name: 'Free',
        description: 'Perfect for trying out Gence',
        messagesPerDay: 10,
        projects: 1,
        features: [
            'basic_intent_extraction',
            'understanding_card_view',
            'community_support',
            'single_project',
        ],
        price: 0,
    },
    pro: {
        name: 'Pro',
        description: 'For serious developers building strategically',
        messagesPerDay: Infinity,
        projects: Infinity,
        features: [
            'unlimited_messages',
            'unlimited_projects',
            'advanced_vector_options',
            'full_graph_visualization',
            'pdf_export',
            'priority_support',
            'claude_3_5_sonnet',
            'drift_detection',
        ],
        price: 15,
        priceYearly: 144, // $12/month if paid yearly
        popular: true,
    },
    enterprise: {
        name: 'Enterprise',
        description: 'For teams building at scale',
        messagesPerDay: Infinity,
        projects: Infinity,
        features: [
            'everything_in_pro',
            'team_collaboration',
            'custom_ai_models',
            'sso_integration',
            'dedicated_support',
            'sla_guarantees',
            'custom_integrations',
            'priority_features',
        ],
        price: 50,
        priceYearly: 480, // $40/month if paid yearly
    },
};

/**
 * Check if a user's tier allows access to a specific feature
 */
export function canUseFeature(userTier: TierName, feature: string): boolean {
    const tier = TIERS[userTier];

    // Check if feature is explicitly listed
    if (tier.features.includes(feature)) {
        return true;
    }

    // Handle "everything_in_pro" for enterprise
    if (userTier === 'enterprise' && tier.features.includes('everything_in_pro')) {
        return TIERS.pro.features.includes(feature);
    }

    return false;
}

/**
 * Check if user has reached their daily message limit
 */
export function hasReachedMessageLimit(
    userTier: TierName,
    messagesUsedToday: number
): boolean {
    const limit = TIERS[userTier].messagesPerDay;
    return limit !== Infinity && messagesUsedToday >= limit;
}

/**
 * Check if user has reached their project limit
 */
export function hasReachedProjectLimit(
    userTier: TierName,
    currentProjects: number
): boolean {
    const limit = TIERS[userTier].projects;
    return limit !== Infinity && currentProjects >= limit;
}

/**
 * Get remaining messages for today
 */
export function getRemainingMessages(
    userTier: TierName,
    messagesUsedToday: number
): number | 'unlimited' {
    const limit = TIERS[userTier].messagesPerDay;
    if (limit === Infinity) {
        return 'unlimited';
    }
    return Math.max(0, limit - messagesUsedToday);
}

/**
 * Feature flags for easy checking
 */
export const FEATURES = {
    BASIC_INTENT: 'basic_intent_extraction',
    ADVANCED_VECTORS: 'advanced_vector_options',
    GRAPH_VIZ: 'full_graph_visualization',
    PDF_EXPORT: 'pdf_export',
    DRIFT_DETECTION: 'drift_detection',
    TEAM_COLLAB: 'team_collaboration',
    CUSTOM_MODELS: 'custom_ai_models',
    SSO: 'sso_integration',
} as const;
