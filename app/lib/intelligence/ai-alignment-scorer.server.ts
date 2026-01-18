import { generateText } from 'ai';
import { getProviderManager } from '~/lib/.server/llm/provider-manager';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AIAlignmentScorer');

export interface AlignmentAnalysis {
    score: number; // 0-100
    reasoning: string;
    confidence: 'high' | 'medium' | 'low';
    suggestions?: string[];
}

/**
 * Analyze alignment between code changes and project goal using AI
 * Uses existing provider manager for automatic failover between providers
 * 
 * @param fileDiff - The code changes (diff or full content)
 * @param northGoal - The project's North (main goal)
 * @param env - Environment variables (for API keys)
 * @returns Alignment analysis with score and reasoning
 */
export async function analyzeAlignment(
    fileDiff: string,
    northGoal: string,
    env: any
): Promise<AlignmentAnalysis> {
    const manager = getProviderManager();

    const prompt = `Analyze how well this code change aligns with the stated project goal.

PROJECT GOAL: ${northGoal}

CODE CHANGES:
\`\`\`
${fileDiff.slice(0, 2000)} ${fileDiff.length > 2000 ? '... (truncated)' : ''}
\`\`\`

Rate alignment 0-100 where:
- 90-100: Directly advances the goal, core functionality
- 70-89: Clearly supports the goal, important feature
- 50-69: Tangentially related, supporting infrastructure  
- 30-49: Loosely related,  peripheral utility
- 0-29: Unrelated or potentially counterproductive

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "score": <number 0-100>,
  "reasoning": "<brief 1-sentence explanation>",
  "confidence": "<high|medium|low>"
}`;

    try {
        const { result: response } = await manager.executeWithFailover(
            async (provider, model) => {
                logger.debug(`Using ${provider.name} for alignment scoring`);

                return await generateText({
                    model,
                    prompt,
                    maxTokens: 300,
                    temperature: 0.3, // Lower temperature for more consistent scoring
                });
            },
            env
        );

        // Parse JSON response
        const text = response.text.trim();

        // Remove markdown code fences if present
        const jsonText = text
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

        const analysis: AlignmentAnalysis = JSON.parse(jsonText);

        // Validate score range
        if (analysis.score < 0 || analysis.score > 100) {
            logger.warn('Invalid score from AI, clamping to 0-100');
            analysis.score = Math.max(0, Math.min(100, analysis.score));
        }

        logger.info('Alignment analysis complete', {
            score: analysis.score,
            confidence: analysis.confidence
        });

        return analysis;
    } catch (error: any) {
        logger.error('Alignment scoring failed', { error: error.message });

        // Fallback to default score
        return {
            score: 70, // Default neutral score
            reasoning: 'AI scoring failed: ' + error.message,
            confidence: 'low',
        };
    }
}

/**
 * Quick alignment check for terminal commands
 * Uses simpler heuristics + optional AI enhancement
 */
export async function analyzeCommandAlignment(
    command: string,
    northGoal: string,
    exitCode: number,
    env: any
): Promise<number> {
    // Quick heuristic scoring
    const baseScore = exitCode === 0 ? 75 : 40;

    // Simple keyword matching
    const goalKeywords = northGoal.toLowerCase().split(/\s+/);
    const commandLower = command.toLowerCase();

    const matchCount = goalKeywords.filter(keyword =>
        keyword.length > 3 && commandLower.includes(keyword)
    ).length;

    // Boost score if keywords match
    const keywordBoost = Math.min(15, matchCount * 5);

    return Math.min(100, baseScore + keywordBoost);
}
