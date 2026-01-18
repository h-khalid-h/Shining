import { generateText } from 'ai';
import { getProviderManager } from '~/lib/.server/llm/provider-manager';
import { getAPIKey } from '~/lib/.server/llm/api-key';

/**
 * Detect if a message contains a project goal/intent
 * Returns the extracted goal description and confidence score
 */
export async function detectNorthIntent(message: string, env: Env): Promise<{
    isGoal: boolean;
    description: string | null;
    confidence: number;
}> {
    // Quick pattern matching for common goal indicators
    const goalPatterns = [
        /^i want to (build|create|make|develop)/i,
        /^my goal is to/i,
        /^i'm (building|creating|making|developing)/i,
        /^the goal is to/i,
        /^i need to (build|create|make|develop)/i,
        /^help me (build|create|make|develop)/i,
    ];

    const hasGoalPattern = goalPatterns.some(pattern => pattern.test(message.trim()));

    // If no obvious pattern, likely not a goal
    if (!hasGoalPattern) {
        return { isGoal: false, description: null, confidence: 0 };
    }

    // Use AI to extract and refine the goal description
    try {
        const manager = getProviderManager();

        const { result } = await manager.executeWithFailover(
            async (provider, model) => {
                return generateText({
                    model,
                    prompt: `Analyze this message and determine if it expresses a project goal or intent.
If it does, extract a clear, concise goal description (1-2 sentences max).
If it doesn't, respond with "NOT_A_GOAL".

Message: "${message}"

Response format:
GOAL: [extracted goal description]
or
NOT_A_GOAL`,
                    maxTokens: 150,
                });
            },
            env
        );

        const response = result.text.trim();

        if (response.startsWith('NOT_A_GOAL')) {
            return { isGoal: false, description: null, confidence: 0 };
        }

        const goalMatch = response.match(/GOAL:\s*(.+)/i);
        if (goalMatch) {
            return {
                isGoal: true,
                description: goalMatch[1].trim(),
                confidence: 0.85,
            };
        }

        // Fallback: use the original message
        return {
            isGoal: true,
            description: message.trim(),
            confidence: 0.7,
        };
    } catch (error) {
        console.error('Error detecting North intent:', error);

        // Fallback: if pattern matched, use original message
        if (hasGoalPattern) {
            return {
                isGoal: true,
                description: message.trim(),
                confidence: 0.6,
            };
        }

        return { isGoal: false, description: null, confidence: 0 };
    }
}
