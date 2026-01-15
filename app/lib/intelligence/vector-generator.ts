/**
 * Vector Generation System
 * Generates strategic paths (Vectors) for achieving a North (goal)
 */

export interface Vector {
    id: string;
    northId: string;
    description: string;
    approach: string;
    tradeoffs: {
        speed: number; // 1-10 (how fast to achieve)
        cost: number; // 1-10 (resource intensity)
        quality: number; // 1-10 (outcome quality)
        risk: number; // 1-10 (risk level)
    };
    steps: string[]; // High-level steps
    confidence: number; // 0-100
    estimatedDuration: string; // e.g., "2 weeks", "1 month"
}

export interface VectorGenerationInput {
    north: {
        id: string;
        description: string;
        confidence: number;
    };
    bounds: Array<{
        type: string;
        description: string;
    }>;
    context?: string; // Additional context from conversation
}

/**
 * Generate strategic paths using AI
 */
export async function generateVectors(
    input: VectorGenerationInput,
    anthropicApiKey: string,
): Promise<Vector[]> {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: anthropicApiKey });

    const prompt = `You are a strategic planning assistant. Given a goal (North) and constraints (Bounds), generate 2-3 different strategic approaches to achieve the goal.

North (Goal): ${input.north.description}

Bounds (Constraints):
${input.bounds.map((b) => `- ${b.type}: ${b.description}`).join('\n')}

${input.context ? `Additional Context:\n${input.context}` : ''}

Generate 2-3 distinct strategic approaches. For each approach, provide:
1. A clear description of the approach
2. The key strategy/methodology
3. Tradeoffs (speed, cost, quality, risk - rate 1-10)
4. 3-5 high-level steps
5. Estimated duration
6. Confidence level (0-100)

Format as JSON array with this structure:
[
  {
    "description": "Brief description",
    "approach": "Detailed approach explanation",
    "tradeoffs": {
      "speed": 7,
      "cost": 5,
      "quality": 8,
      "risk": 4
    },
    "steps": ["Step 1", "Step 2", "Step 3"],
    "estimatedDuration": "2 weeks",
    "confidence": 85
  }
]`;

    const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
        throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Failed to extract JSON from response');
    }

    const vectorsData = JSON.parse(jsonMatch[0]);

    // Convert to Vector objects
    return vectorsData.map((v: any, index: number) => ({
        id: `vector_${Date.now()}_${index}`,
        northId: input.north.id,
        description: v.description,
        approach: v.approach,
        tradeoffs: v.tradeoffs,
        steps: v.steps,
        confidence: v.confidence,
        estimatedDuration: v.estimatedDuration,
    }));
}

/**
 * Rank vectors by a specific criterion
 */
export function rankVectors(
    vectors: Vector[],
    criterion: 'speed' | 'cost' | 'quality' | 'risk' | 'balanced',
): Vector[] {
    const sorted = [...vectors];

    if (criterion === 'balanced') {
        // Balanced: optimize for quality while minimizing risk and cost
        sorted.sort((a, b) => {
            const scoreA = a.tradeoffs.quality - (a.tradeoffs.risk + a.tradeoffs.cost) / 2;
            const scoreB = b.tradeoffs.quality - (b.tradeoffs.risk + b.tradeoffs.cost) / 2;
            return scoreB - scoreA;
        });
    } else {
        // Sort by specific criterion (higher is better for quality/speed, lower for cost/risk)
        sorted.sort((a, b) => {
            if (criterion === 'cost' || criterion === 'risk') {
                return a.tradeoffs[criterion] - b.tradeoffs[criterion];
            }
            return b.tradeoffs[criterion] - a.tradeoffs[criterion];
        });
    }

    return sorted;
}
