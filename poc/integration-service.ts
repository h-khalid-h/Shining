import { extractIntent, type Message, type ExtractedIntent } from './intent-extraction';
import { GraphService } from './graph-service';

/**
 * Integration Service
 * Connects message extraction to graph storage
 */

export interface IntegrationConfig {
    anthropicApiKey: string;
    neo4jUri: string;
    neo4jUsername: string;
    neo4jPassword: string;
}

export class IntegrationService {
    private graphService: GraphService;
    private anthropicApiKey: string;

    constructor(config: IntegrationConfig) {
        this.graphService = new GraphService({
            uri: config.neo4jUri,
            username: config.neo4jUsername,
            password: config.neo4jPassword,
        });
        this.anthropicApiKey = config.anthropicApiKey;
    }

    async close() {
        await this.graphService.close();
    }

    /**
     * Process messages and update graph
     * This is the main integration point
     */
    async processMessages(userId: string, messages: Message[]): Promise<{
        extracted: ExtractedIntent;
        graphUpdated: boolean;
        northId?: string;
    }> {
        // Step 1: Extract intent from messages
        const extracted = await extractIntent(messages, this.anthropicApiKey);

        console.log('\n📊 Extraction Results:');
        console.log(`  Phase: ${extracted.phase}`);
        console.log(`  Confidence: ${extracted.overallConfidence}%`);
        console.log(`  North: ${extracted.north ? '✓' : '✗'}`);
        console.log(`  Bounds: ${extracted.bounds.length}`);
        console.log(`  Decisions: ${extracted.decisions.length}`);

        // Step 2: Update graph if confidence is high enough
        let graphUpdated = false;
        let northId: string | undefined;

        if (extracted.north && extracted.north.confidence > 70) {
            console.log('\n💾 Updating graph...');

            // Create or update North
            northId = await this.graphService.upsertNorth(userId, {
                statement: extracted.north.statement,
                confidence: extracted.north.confidence,
            });

            console.log(`  ✓ North created: ${northId}`);

            // Add bounds
            for (const bound of extracted.bounds) {
                if (bound.confidence > 60) {
                    await this.graphService.addBound(northId, bound);
                    console.log(`  ✓ Bound added: ${bound.metric}`);
                }
            }

            graphUpdated = true;
        } else {
            console.log('\n⏭️  Skipping graph update (confidence too low)');
        }

        return {
            extracted,
            graphUpdated,
            northId,
        };
    }

    /**
     * Get current state from graph
     */
    async getCurrentState(northId: string) {
        return await this.graphService.getNorth(northId);
    }
}

/**
 * Test the integration
 */
export async function testIntegration() {
    const config: IntegrationConfig = {
        anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
        neo4jUri: process.env.NEO4J_URI!,
        neo4jUsername: process.env.NEO4J_USERNAME || 'neo4j',
        neo4jPassword: process.env.NEO4J_PASSWORD!,
    };

    const integration = new IntegrationService(config);

    try {
        console.log('🧪 Testing Full Integration\n');
        console.log('='.repeat(60));

        // Test conversation
        const messages: Message[] = [
            { role: 'user', content: 'I want to build a mobile app for tracking workouts' },
            { role: 'assistant', content: "Great! I'd be happy to help. What's your timeline?" },
            { role: 'user', content: 'I need it in 3 months' },
            { role: 'assistant', content: 'Got it. What about budget?' },
            { role: 'user', content: 'Around $5000' },
            { role: 'assistant', content: 'Perfect. Should we use React Native or native development?' },
            { role: 'user', content: "Let's go with React Native for cross-platform" },
        ];

        // Process messages
        const result = await integration.processMessages('user_integration_test', messages);

        console.log('\n' + '='.repeat(60));
        console.log('📈 Integration Results:');
        console.log('='.repeat(60));
        console.log(`\nGraph Updated: ${result.graphUpdated ? '✅ Yes' : '❌ No'}`);

        if (result.northId) {
            console.log(`North ID: ${result.northId}`);

            // Retrieve and display
            console.log('\n📊 Retrieved from Graph:');
            const state = await integration.getCurrentState(result.northId);
            console.log(JSON.stringify(state, null, 2));
        }

        console.log('\n✅ Integration test complete!');
    } catch (error) {
        console.error('\n❌ Integration test failed:', error);
    } finally {
        await integration.close();
    }
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testIntegration().catch(console.error);
}
