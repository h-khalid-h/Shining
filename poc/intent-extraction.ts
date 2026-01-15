import Anthropic from '@anthropic-ai/sdk';

/**
 * Intent Extraction Service - POC
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
export async function extractIntent(
    messages: Message[],
    apiKey: string,
): Promise<ExtractedIntent> {
    const anthropic = new Anthropic({ apiKey });

    const conversationText = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

    const extractionPrompt = `You are analyzing a conversation to extract structured intent and decisions.

Conversation:
${conversationText}

Extract the following information in JSON format:

1. **north** (core goal/intent):
   - statement: A clear, concise statement of what the user wants to achieve
   - confidence: 0-100 (only include if confidence > 70)

2. **bounds** (constraints mentioned):
   - Array of constraints with:
     - metric: "time" | "cost" | "quality" | "scope"
     - value: The constraint as mentioned
     - threshold: Numeric value if applicable
     - unit: Unit of measurement if applicable
     - confidence: 0-100

3. **decisions** (choices made):
   - Array of decisions with:
     - question: What was being decided
     - answer: What was chosen
     - confidence: 0-100

4. **phase**: Current conversation phase
   - "exploring": User is still figuring out what they want
   - "clarifying": Intent is emerging, refining details
   - "deciding": Making choices about approach
   - "executing": Ready to implement

5. **overallConfidence**: 0-100 overall confidence in extraction

Rules:
- Only include north if confidence > 70
- Be conservative with confidence scores
- Extract implicit constraints (e.g., "quickly" = time bound)
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

/**
 * Test the extraction with sample conversations
 */
export async function testExtraction() {
    const testCases: Array<{ name: string; messages: Message[] }> = [
        {
            name: 'Mobile App - Clear Intent',
            messages: [
                { role: 'user', content: 'I want to build a mobile app for tracking workouts' },
                { role: 'assistant', content: "Great! I'd be happy to help. What's your timeline?" },
                { role: 'user', content: 'I need it in 3 months' },
                { role: 'assistant', content: 'Got it. What about budget?' },
                { role: 'user', content: 'Around $5000' },
            ],
        },
        {
            name: 'Website - Exploring',
            messages: [
                { role: 'user', content: 'I need a website' },
                { role: 'assistant', content: 'What kind of website are you thinking about?' },
                { role: 'user', content: "I'm not sure yet, maybe for my business" },
            ],
        },
        {
            name: 'Landing Page - Deciding',
            messages: [
                { role: 'user', content: 'Build me a landing page for my SaaS product' },
                { role: 'assistant', content: 'Should we use React or plain HTML?' },
                { role: 'user', content: "Let's go with React" },
                { role: 'assistant', content: 'Would you like Tailwind for styling?' },
                { role: 'user', content: 'Yes, Tailwind sounds good' },
            ],
        },
    ];

    console.log('🧪 Testing Intent Extraction\n');

    for (const testCase of testCases) {
        console.log(`\n📝 Test: ${testCase.name}`);
        console.log('─'.repeat(50));

        try {
            const result = await extractIntent(testCase.messages, process.env.ANTHROPIC_API_KEY!);

            console.log('\n✅ Extraction Result:');
            console.log(JSON.stringify(result, null, 2));

            // Validate
            console.log('\n📊 Validation:');
            console.log(`  Overall Confidence: ${result.overallConfidence}%`);
            console.log(`  Phase: ${result.phase}`);
            console.log(`  North Identified: ${result.north ? '✓' : '✗'}`);
            console.log(`  Bounds Found: ${result.bounds.length}`);
            console.log(`  Decisions Found: ${result.decisions.length}`);
        } catch (error) {
            console.error('❌ Extraction failed:', error);
        }
    }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testExtraction().catch(console.error);
}
