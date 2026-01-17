import type { Message } from 'ai';
import type { DecisionPoint } from '~/components/intelligence/DecisionCards';

/**
 * Detects if user's message requires a decision before proceeding.
 * Returns a DecisionPoint if a decision is needed, otherwise null.
 */
export function detectDecisionPoint(userMessage: string, context?: {
    recentMessages?: Message[];
    north?: any;
    bounds?: any[];
}): DecisionPoint | null {
    const lowerMessage = userMessage.toLowerCase();

    // Decision indicators in user's message
    const indicators = [
        /how (should|can|do|would) (i|we)/i,
        /which (is|would be|should i use) better/i,
        /what('s| is) the best (way|approach|method)/i,
        /(compare|versus|vs|or)\s/i,
        /should i use/i,
        /(options|alternatives|choices) (for|to)/i,
    ];

    const needsDecision = indicators.some(pattern => pattern.test(userMessage));

    if (!needsDecision) return null;

    // Common decision types with default options
    const decisionTypes = detectDecisionType(lowerMessage);

    if (!decisionTypes) return null;

    return decisionTypes;
}

/**
 * Determines the type of decision needed and generates appropriate options.
 */
function detectDecisionType(message: string): DecisionPoint | null {
    // Architecture decisions
    if (message.includes('architecture') || message.includes('structure')) {
        return {
            type: 'architecture',
            question: 'Which architectural pattern would you like to use?',
            options: [
                {
                    id: 'monolithic',
                    label: 'Monolithic',
                    description: 'Single codebase with all features together',
                    pros: ['Simple deployment', 'Easy to develop initially'],
                    cons: ['Harder to scale', 'Tight coupling'],
                    effort: 'low',
                },
                {
                    id: 'microservices',
                    label: 'Microservices',
                    description: 'Distributed services with independent deployment',
                    pros: ['Scalable', 'Technology flexibility'],
                    cons: ['Complex infrastructure', 'Network overhead'],
                    effort: 'high',
                },
            ],
            recommended: 'monolithic',
        };
    }

    // Library/Framework decisions
    if (message.includes('library') || message.includes('framework')) {
        return {
            type: 'library',
            question: 'Which library or framework would you prefer?',
            options: [
                {
                    id: 'popular',
                    label: 'Popular Choice',
                    description: 'Use the most widely adopted solution',
                    pros: ['Large community', 'Lots of resources'],
                    cons: ['May be opinionated'],
                    effort: 'low',
                },
                {
                    id: 'lightweight',
                    label: 'Lightweight',
                    description: 'Minimal dependencies, smaller bundle',
                    pros: ['Fast performance', 'Less complexity'],
                    cons: ['Fewer features', 'Less support'],
                    effort: 'medium',
                },
            ],
            recommended: 'popular',
        };
    }

    // Database decisions
    if (message.includes('database') || message.includes('storage')) {
        return {
            type: 'architecture',
            question: 'What type of database fits your needs?',
            options: [
                {
                    id: 'sql',
                    label: 'SQL Database',
                    description: 'Relational database (PostgreSQL, MySQL)',
                    pros: ['ACID compliance', 'Strong consistency', 'Complex queries'],
                    cons: ['Schema rigidity', 'Scaling challenges'],
                    effort: 'medium',
                },
                {
                    id: 'nosql',
                    label: 'NoSQL Database',
                    description: 'Document or key-value store (MongoDB, Redis)',
                    pros: ['Flexible schema', 'Horizontal scaling', 'Fast reads'],
                    cons: ['Eventual consistency', 'Limited joins'],
                    effort: 'medium',
                },
            ],
            recommended: 'sql',
        };
    }

    // UI/Design decisions
    if (message.includes('ui') || message.includes('design') || message.includes('styling')) {
        return {
            type: 'design',
            question: 'How would you like to handle styling?',
            options: [
                {
                    id: 'tailwind',
                    label: 'Tailwind CSS',
                    description: 'Utility-first CSS framework',
                    pros: ['Rapid development', 'Consistent design', 'Small bundle'],
                    cons: ['Learning curve', 'HTML clutter'],
                    effort: 'low',
                },
                {
                    id: 'css-modules',
                    label: 'CSS Modules',
                    description: 'Scoped CSS with traditional styling',
                    pros: ['Full CSS power', 'No build step', 'Familiar'],
                    cons: ['More manual work', 'No auto-completion'],
                    effort: 'medium',
                },
            ],
            recommended: 'tailwind',
        };
    }

    // General choice - provide context-aware options
    return {
        type: 'general',
        question: 'I need your input to proceed. Which approach do you prefer?',
        options: [
            {
                id: 'simple',
                label: 'Simple & Fast',
                description: 'Get something working quickly with minimal setup',
                pros: ['Quick to implement', 'Easy to understand'],
                cons: ['May need refactoring later'],
                effort: 'low',
            },
            {
                id: 'robust',
                label: 'Robust & Scalable',
                description: 'Build with best practices and future growth in mind',
                pros: ['Production-ready', 'Easier to maintain'],
                cons: ['More upfront work'],
                effort: 'high',
            },
        ],
        recommended: 'simple',
    };
}

/**
 * Validates if a user's response matches a decision option.
 */
export function matchDecisionResponse(
    userResponse: string,
    decision: DecisionPoint
): string | null {
    const lower = userResponse.toLowerCase();

    // Check if user typed an option label
    for (const option of decision.options) {
        if (lower.includes(option.label.toLowerCase())) {
            return option.id;
        }
    }

    // Check for special responses
    if (lower.includes("don't know") || lower.includes('decide for me')) {
        return 'idk';
    }

    if (lower.includes('more option') || lower.includes('other option')) {
        return 'more';
    }

    return null;
}
