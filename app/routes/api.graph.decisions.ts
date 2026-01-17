import type { Route } from './+types/api.graph.decisions';
import { createNeo4jDriver } from '~/lib/.server/neo4j';
import { graphLogger } from '~/lib/.server/logger';
import { createErrorResponse, createSuccessResponse, ErrorCodes } from '~/lib/.server/api-response';

/**
 * Decision & Option Management API
 * 
 * Manages Decision nodes and Option nodes for decision history tracking:
 * - Decision: A decision point encountered (question, type, recommended)
 * - Option: A choice presented (label, description, pros, cons, effort)
 * - Tracks which option was selected and when
 */

export async function action({ request, context, params }: Route.ActionArgs) {
    const { id } = params;

    // PATCH - Record option selection
    if (request.method === 'PATCH' && id) {
        try {
            const body = await request.json();
            const { optionId, reasoning } = body;

            if (!optionId) {
                return createErrorResponse(
                    'Validation Error',
                    'optionId is required',
                    { code: ErrorCodes.VALIDATION_ERROR, status: 400 }
                );
            }

            const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
            const session = driver.session();

            try {
                const result = await session.run(
                    `
                    MATCH (d:Decision {id: $decisionId})
                    MATCH (o:Option {id: $optionId})
                    WHERE (d)-[:HAS_OPTION]->(o)
                    SET 
                        d.selectedOption = $optionId,
                        d.selectedAt = datetime(),
                        d.reasoning = $reasoning,
                        o.selected = true
                    CREATE (d)-[:SELECTED]->(o)
                    RETURN d, o
                    `,
                    {
                        decisionId: id,
                        optionId,
                        reasoning: reasoning || null,
                    }
                );

                if (result.records.length === 0) {
                    return createErrorResponse(
                        'Not Found',
                        'Decision or option not found',
                        { code: ErrorCodes.NOT_FOUND, status: 404 }
                    );
                }

                const decision = result.records[0].get('d').properties;
                const option = result.records[0].get('o').properties;

                graphLogger.info('Option selected', { decisionId: id, optionId });

                return createSuccessResponse({
                    decision,
                    selectedOption: option,
                    message: 'Selection recorded successfully',
                });
            } finally {
                await session.close();
                await driver.close();
            }
        } catch (error) {
            graphLogger.error('Selection recording failed', error, { id });

            return createErrorResponse(
                'Selection Error',
                error instanceof Error ? error.message : 'Failed to record selection',
                { code: ErrorCodes.DATABASE_ERROR, status: 500 }
            );
        }
    }

    // POST - Create decision with options
    if (request.method === 'POST') {
        try {
            const body = await request.json();
            const { northId, userId, decision, options } = body;

            // Validation
            if (!northId || !userId || !decision || !options || !Array.isArray(options)) {
                return createErrorResponse(
                    'Validation Error',
                    'Missing required fields: northId, userId, decision, options',
                    { code: ErrorCodes.VALIDATION_ERROR, status: 400 }
                );
            }

            const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
            const session = driver.session();

            try {
                const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Create decision node
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
                        type: decision.type || 'general',
                        recommended: decision.recommended || null,
                        userId,
                    }
                );

                // Create option nodes and relationships
                const optionResults = [];
                for (const option of options) {
                    const optionId = option.id || `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                    const result = await session.run(
                        `
                        MATCH (d:Decision {id: $decisionId})
                        CREATE (o:Option {
                            id: $optionId,
                            label: $label,
                            description: $description,
                            pros: $pros,
                            cons: $cons,
                            effort: $effort,
                            selected: false,
                            createdAt: datetime()
                        })
                        CREATE (d)-[:HAS_OPTION]->(o)
                        RETURN o
                        `,
                        {
                            decisionId,
                            optionId,
                            label: option.label,
                            description: option.description || null,
                            pros: option.pros || [],
                            cons: option.cons || [],
                            effort: option.effort || 'medium',
                        }
                    );

                    if (result.records.length > 0) {
                        optionResults.push(result.records[0].get('o').properties);
                    }
                }

                graphLogger.info('Decision created with options', {
                    northId,
                    decisionId,
                    optionCount: optionResults.length,
                });

                return createSuccessResponse({
                    decisionId,
                    options: optionResults,
                    message: `Decision created with ${optionResults.length} option(s)`,
                });
            } finally {
                await session.close();
                await driver.close();
            }
        } catch (error) {
            graphLogger.error('Decision creation failed', error);

            return createErrorResponse(
                'Decision Creation Error',
                error instanceof Error ? error.message : 'Failed to create decision',
                { code: ErrorCodes.DATABASE_ERROR, status: 500 }
            );
        }
    }

    return createErrorResponse(
        'Method Not Allowed',
        'Only POST and PATCH requests are supported',
        { code: ErrorCodes.VALIDATION_ERROR, status: 405 }
    );
}

/**
 * GET /api/graph/decisions/:northId
 * Retrieve all decisions for a North
 */
export async function loader({ params, context }: Route.LoaderArgs) {
    const { northId } = params;

    if (!northId) {
        return createErrorResponse(
            'Validation Error',
            'northId is required',
            { code: ErrorCodes.VALIDATION_ERROR, status: 400 }
        );
    }

    try {
        const driver = createNeo4jDriver(context.cloudflare?.env || process.env);
        const session = driver.session();

        try {
            // Get all decisions with their options and selections
            const result = await session.run(
                `
                MATCH (n:North {id: $northId})-[:HAS_DECISION]->(d:Decision)
                OPTIONAL MATCH (d)-[:SELECTED]->(selected:Option)
                OPTIONAL MATCH (d)-[:HAS_OPTION]->(o:Option)
                RETURN d, selected, collect(DISTINCT o) as options
                ORDER BY d.createdAt DESC
                `,
                { northId }
            );

            const decisions = result.records.map(record => {
                const decision = record.get('d').properties;
                const selected = record.get('selected')?.properties || null;
                const options = record.get('options').map((o: any) => o.properties);

                return {
                    ...decision,
                    selectedOption: selected,
                    options,
                };
            });

            // Calculate stats
            const total = decisions.length;
            const withSelection = decisions.filter(d => d.selectedOption).length;
            const followedRecommendation = decisions.filter(
                d => d.selectedOption && d.recommended === d.selectedOption.id
            ).length;

            return createSuccessResponse({
                decisions,
                stats: {
                    total,
                    withSelection,
                    followedRecommendation,
                    customChoices: withSelection - followedRecommendation,
                },
            });
        } finally {
            await session.close();
            await driver.close();
        }
    } catch (error) {
        graphLogger.error('Decision retrieval failed', error, { northId });

        return createErrorResponse(
            'Decision Retrieval Error',
            error instanceof Error ? error.message : 'Failed to retrieve decisions',
            { code: ErrorCodes.DATABASE_ERROR, status: 500 }
        );
    }
}
