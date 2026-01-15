import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ExtractionLogger');

/**
 * Extraction Log Entry
 */
export interface ExtractionLog {
    userId: string;
    messageCount: number;
    phase: string;
    confidence: number;
    northIdentified: boolean;
    boundsCount: number;
    decisionsCount: number;
    timestamp: string;
    extractionTimeMs: number;
}

/**
 * Log extraction for analysis
 */
export function logExtraction(
    userId: string,
    messages: any[],
    extracted: any,
    extractionTimeMs: number,
): void {
    const log: ExtractionLog = {
        userId,
        messageCount: messages.length,
        phase: extracted.phase,
        confidence: extracted.overallConfidence,
        northIdentified: !!extracted.north,
        boundsCount: extracted.bounds.length,
        decisionsCount: extracted.decisions.length,
        timestamp: new Date().toISOString(),
        extractionTimeMs,
    };

    logger.info('Extraction completed', log);

    // Log patterns for analysis
    if (log.confidence < 60) {
        logger.warn('Low confidence extraction', {
            userId: log.userId,
            messageCount: log.messageCount,
            confidence: log.confidence,
        });
    }

    if (log.messageCount > 10 && !log.northIdentified) {
        logger.warn('Long conversation without North', {
            userId: log.userId,
            messageCount: log.messageCount,
        });
    }
}

/**
 * Determine if extraction should run based on message count
 */
export function shouldExtract(messageCount: number): boolean {
    // Extract on message 3, then every 3 messages, or always after 8
    if (messageCount === 3) return true;
    if (messageCount > 8) return true;
    if (messageCount % 3 === 0) return true;
    return false;
}

/**
 * Get extraction statistics summary
 */
export function getExtractionStats(logs: ExtractionLog[]) {
    if (logs.length === 0) {
        return {
            totalExtractions: 0,
            avgConfidence: 0,
            avgTime: 0,
            northIdentificationRate: 0,
        };
    }

    const totalConfidence = logs.reduce((sum, log) => sum + log.confidence, 0);
    const totalTime = logs.reduce((sum, log) => sum + log.extractionTimeMs, 0);
    const northCount = logs.filter((log) => log.northIdentified).length;

    return {
        totalExtractions: logs.length,
        avgConfidence: Math.round(totalConfidence / logs.length),
        avgTime: Math.round(totalTime / logs.length),
        northIdentificationRate: Math.round((northCount / logs.length) * 100),
    };
}
