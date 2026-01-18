import type { Route } from './+types/api.predict-intent';
import { generateText } from 'ai';
import { getProviderManager } from '~/lib/.server/llm/provider-manager';

// Helper to get env vars from either cloudflare context or process.env
function getEnv(context: Route.ActionArgs['context']) {
    return context.cloudflare?.env || process.env;
}

export async function action({ context, request }: Route.ActionArgs) {
    const { input, north, bounds, recentMessages } = await request.json();

    const env = getEnv(context);

    try {
        const manager = getProviderManager();

        const predictionPrompt = buildPredictionPrompt(input, north, bounds, recentMessages);

        // Use provider manager for automatic failover
        const { result } = await manager.executeWithFailover(
            async (provider, model) => {
                return generateText({
                    model,
                    system: 'You are an intent prediction assistant for Gence, an intelligent development partner.',
                    prompt: predictionPrompt,
                    maxTokens: 500,
                });
            },
            env
        );

        // Get the text response
        const fullText = result.text;

        try {
            const prediction = JSON.parse(fullText);
            return Response.json(prediction);
        } catch {
            // If parsing fails, return a safe fallback
            return Response.json({
                intent: 'general_query',
                suggestions: [],
                confidence: 0,
            });
        }
    } catch (error) {
        console.error('Intent prediction error:', error);
        return Response.json(
            { error: 'Failed to predict intent' },
            { status: 500 }
        );
    }
}

function buildPredictionPrompt(
    input: string,
    north: any,
    bounds: any[],
    recentMessages: string[]
): string {
    const northDesc = north ? `Goal: ${north.description}` : 'No goal set yet';
    const boundsDesc = bounds.length > 0
        ? `Constraints:\n${bounds.map((b, i) => `${i + 1}. ${b.type}: ${b.description}`).join('\n')}`
        : 'No constraints set';

    const recentContext = recentMessages.length > 0
        ? `Recent conversation:\n${recentMessages.slice(-3).join('\n')}`
        : 'No recent messages';

    return `Given the user's current context and input, predict their intent and suggest helpful actions.

${northDesc}

${boundsDesc}

${recentContext}

Current input: "${input}"

Analyze the input and predict:
1. Primary intent category (choose one):
   - "add_feature" - Adding new functionality
   - "fix_issue" - Debugging or fixing problems
   - "refine_goal" - Clarifying or adjusting the goal
   - "add_constraint" - Adding new bounds/constraints
   - "ask_question" - General inquiry
   - "change_direction" - Significant pivot in approach

2. Suggested actions (up to 3) that would help the user accomplish their intent

3. Confidence score (0-100) in the prediction

Respond ONLY with valid JSON in this exact format:
{
  "intent": "intent_category",
  "suggestions": [
    {
      "action": "Brief action description",
      "reasoning": "Why this helps",
      "autoComplete": "Optional text to insert"
    }
  ],
  "confidence": 85
}`;
}
