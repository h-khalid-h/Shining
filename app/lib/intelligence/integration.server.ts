import { extractIntent, type Message, type ExtractedIntent } from './extraction.server';
import { GraphService } from './graph.server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Intelligence');

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
    async processMessages(
        userId: string,
        messages: Message[],
    ): Promise<{
        extracted: ExtractedIntent;
        graphUpdated: boolean;
        northId?: string;
    }> {
        // Step 1: Extract intent from messages
        const extracted = await extractIntent(messages, this.anthropicApiKey);

        logger.info('Extraction completed', {
            userId,
            phase: extracted.phase,
            confidence: extracted.overallConfidence,
            northIdentified: !!extracted.north,
            boundsCount: extracted.bounds.length,
            decisionsCount: extracted.decisions.length,
        });

        // Step 2: Update graph if confidence is high enough
        let graphUpdated = false;
        let northId: string | undefined;

        if (extracted.north && extracted.north.confidence > 70) {
            logger.info('Updating graph', { userId, confidence: extracted.north.confidence });

            // Create or update North
            northId = await this.graphService.upsertNorth(userId, {
                statement: extracted.north.statement,
                confidence: extracted.north.confidence,
            });

            logger.info('North created', { userId, northId });

            // Add bounds
            for (const bound of extracted.bounds) {
                if (bound.confidence > 60) {
                    await this.graphService.addBound(northId, bound);
                    logger.info('Bound added', { userId, northId, metric: bound.metric });
                }
            }

            graphUpdated = true;
        } else {
            logger.info('Skipping graph update', { userId, reason: 'confidence too low' });
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
