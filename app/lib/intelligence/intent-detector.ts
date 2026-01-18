import type { Message } from '~/types/message';

/**
 * Detect user intent from their message to determine conversation approach
 */
export function detectUserIntent(message: string, context?: {
    messageCount?: number;
    hasNorth?: boolean;
    recentMessages?: Message[];
}): {
    intent: 'discovery' | 'build' | 'modify' | 'question' | 'planning';
    confidence: number;
    reasoning: string;
} {
    const lower = message.toLowerCase().trim();

    // Planning/non-digital intent
    const planningKeywords = ['plan', 'organize', 'strategy', 'workflow', 'process', 'event', 'wedding', 'business'];
    const digitalKeywords = ['app', 'website', 'code', 'build', 'create', 'api', 'tool', 'automation'];

    const hasPlanningWord = planningKeywords.some(k => lower.includes(k));
    const hasDigitalWord = digitalKeywords.some(k => lower.includes(k));

    if (hasPlanningWord && !hasDigitalWord) {
        return {
            intent: 'planning',
            confidence: 0.8,
            reasoning: 'Contains planning keywords without digital/code mentions',
        };
    }

    // Discovery: User stating a goal without specifics
    if (/^(i want|i need|help me|how (do|can) i)/i.test(lower)) {
        return {
            intent: 'discovery',
            confidence: 0.9,
            reasoning: 'User is stating a goal or asking for guidance',
        };
    }

    // Modify: User wants to change existing code
    if (/^(change|update|fix|modify|refactor|improve)/i.test(lower)) {
        return {
            intent: 'modify',
            confidence: 0.85,
            reasoning: 'User wants to modify existing implementation',
        };
    }

    // Build: Direct request to create something
    if (/^(create|build|make|generate|add|implement)/i.test(lower)) {
        // But still might need discovery if vague
        const isVague = lower.split(' ').length < 8; // Very short request

        if (isVague && !context?.hasNorth) {
            return {
                intent: 'discovery',
                confidence: 0.7,
                reasoning: 'Build request but too vague, needs clarification',
            };
        }

        return {
            intent: 'build',
            confidence: 0.85,
            reasoning: 'Clear build request with sufficient detail',
        };
    }

    // Question: "What", "Which", "Should I"
    if (/^(what|which|should i|is it better)/i.test(lower)) {
        return {
            intent: 'question',
            confidence: 0.8,
            reasoning: 'User asking a question, needs guidance',
        };
    }

    // Default to discovery for first message
    if (!context?.messageCount || context.messageCount <= 1) {
        return {
            intent: 'discovery',
            confidence: 0.6,
            reasoning: 'First message, starting with discovery',
        };
    }

    // Conversational follow-up
    return {
        intent: context.hasNorth ? 'build' : 'discovery',
        confidence: 0.5,
        reasoning: 'Conversational follow-up, using context',
    };
}

/**
 * Get appropriate system prompt based on intent
 */
export function getPromptForIntent(intent: string): string {
    switch (intent) {
        case 'discovery':
            return 'Focus on understanding the user\'s needs through clarifying questions.';

        case 'planning':
            return 'Provide structured planning guidance without code. Use Decision Cards for options.';

        case 'build':
            return 'The user is ready to build. Confirm understanding, then proceed with implementation.';

        case 'modify':
            return 'Help user modify existing code. Ask what specifically they want to change.';

        case 'question':
            return 'Answer the user\'s question clearly. Use Decision Cards if presenting multiple options.';

        default:
            return '';
    }
}
