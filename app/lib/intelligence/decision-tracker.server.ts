import { createNeo4jDriver } from '~/lib/.server/neo4j';
import { createScopedLogger } from '~/utils/logger';
import type { DecisionPoint } from '~/components/intelligence/DecisionCards';

const logger = createScopedLogger('DecisionTracker');

/**
 * Server-side utility to create decisions directly in Neo4j
 * Bypasses API authentication issues
 */
export async function trackDecisionServer(
    northId: string,
    userId: string,
    decision: DecisionPoint,
    env: any
): Promise<boolean> {
    const driver = createNeo4jDriver(env);
    const session = driver.session();

    try {
        const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create Decision node
        await session.run(
            `
            MATCH (n:North {id: $northId})
            CREATE (d:Decision {
                id: $decisionId,
                question: $question,
                type: $type,
                recommended: $recommended,
                createdAt: datetime(),
                createdBy: $userId
            })
            CREATE (n)-[:HAS_DECISION]->(d)
            RETURN d
            `,
            {
                northId,
                decisionId,
                question: decision.question,
                type: decision.type,
                recommended: decision.recommended || null,
                userId,
            }
        );

        // Create Option nodes
        for (const option of decision.options) {
            await session.run(
                `
                MATCH (d:Decision {id: $decisionId})
                CREATE (o:Option {
                    id: $optionId,
                    label: $label,
                    description: $description,
                    pros: $pros,
                    cons: $cons,
                    effort: $effort
                })
                CREATE (d)-[:HAS_OPTION]->(o)
                RETURN o
                `,
                {
                    decisionId,
                    optionId: `option_${option.id}_${Date.now()}`,
                    label: option.label,
                    description: option.description || null,
                    pros: option.pros || [],
                    cons: option.cons || [],
                    effort: option.effort || 'medium',
                }
            );
        }

        logger.info('Decision tracked successfully', { northId, decisionId });
        return true;
    } catch (error) {
        logger.error('Failed to track decision', { northId, error });
        return false;
    } finally {
        await session.close();
        await driver.close();
    }
}
