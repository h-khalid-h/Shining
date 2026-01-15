import Anthropic from '@anthropic-ai/sdk';

/**
 * Intent Extraction Service
 * Extracts structured intent from conversational messages
 */

export interface ExtractedIntent {
    north?: {
        statement: string;
        confidence: number;
    };
    bounds: Array<{
        metric: 'time' | 'cost' | 'quality' | 'scope';
        value: string;
        threshold?: number;
        unit?: string;
        confidence: number;
    }>;
    decisions: Array<{
        question: string;
        answer: string;
        confidence: number;
    }>;
    phase: 'exploring' | 'clarifying' | 'deciding' | 'executing';
    overallConfidence: number;
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Extract structured intent from conversation messages
 */
export async function extractIntent(messages: Message[], apiKey: string): Promise<ExtractedIntent> {
    const anthropic = new Anthropic({ apiKey });

    const conversationText = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

    const extractionPrompt = `You are analyzing a conversation to extract structured intent and decisions.

Conversation (${messages.length} messages):
${conversationText}

Extract the following information in JSON format:

1. **north** (core goal/intent):
   - statement: A clear, specific, actionable statement of what the user wants to achieve
   - confidence: 0-100 (only include if confidence > 70)
   - Include implicit goals (e.g., "help me" → specific help needed)
   - Be specific: "build a mobile app" → "build a mobile workout tracking app"

2. **bounds** (constraints mentioned):
   - Explicit constraints: "3 months", "$5000", "high quality"
   - Implicit constraints:
     * "quickly" / "fast" / "ASAP" = time bound (urgent)
     * "cheap" / "budget-friendly" = cost bound (low budget)
     * "simple" / "basic" = scope bound (minimal features)
     * "professional" / "polished" = quality bound (high quality)
   - Include soft constraints with lower confidence
   - metric: "time" | "cost" | "quality" | "scope"
   - value: The constraint as mentioned
   - threshold: Numeric value if applicable
   - unit: Unit of measurement if applicable
   - confidence: 0-100

3. **decisions** (choices made):
   - Technology choices (React, Python, etc.)
   - Approach decisions (MVP first, full build, etc.)
   - Trade-off selections (speed vs quality, etc.)
   - question: What was being decided
   - answer: What was chosen
   - confidence: 0-100

4. **phase**: Current conversation phase
   - "exploring": < 3 messages OR vague/unclear intent
   - "clarifying": 3-5 messages AND intent emerging but needs details
   - "deciding": 5-8 messages AND making specific choices
   - "executing": 8+ messages OR explicit "let's build" / "start coding"

5. **overallConfidence**: 0-100 overall confidence in extraction
   - High (80-100): Clear, specific, actionable, ready to proceed
   - Medium (60-80): Good understanding but needs minor refinement
   - Low (< 60): Too vague, conflicting, or insufficient information

Rules:
- Only include north if confidence > 70
- Be conservative with confidence scores
- Extract ALL implicit constraints
- Phase should match message count AND conversation quality
- Return valid JSON only, no explanation

Return format:
{
  "north": { "statement": "...", "confidence": 85 },
  "bounds": [...],
  "decisions": [...],
  "phase": "clarifying",
  "overallConfidence": 75
}`;

    const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: extractionPrompt,
            },
        ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
        throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON found in response');
    }

    const extracted = JSON.parse(jsonMatch[0]) as ExtractedIntent;

    // Validate and clean up
    if (!extracted.north || extracted.north.confidence < 70) {
        delete extracted.north;
    }

    return extracted;
}
