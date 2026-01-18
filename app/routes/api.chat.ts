import type { Route } from './+types/api.chat';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import { createScopedLogger } from '~/utils/logger';
import { getOptionalAuth } from '~/lib/auth.server';
import { IntegrationService } from '~/lib/intelligence/integration.server';
import { shouldExtract, logExtraction } from '~/lib/intelligence/extraction-logger';
import { trackKineticServer } from '~/lib/intelligence/kinetic-tracker.server';
import { detectDecisionPoint } from '~/lib/intelligence/decision-detector';
import { trackDecisionServer } from '~/lib/intelligence/decision-tracker.server';

const logger = createScopedLogger('ChatAPI');

// Helper to get env vars from either cloudflare context or process.env
function getEnv(context: Route.ActionArgs['context']) {
  return context.cloudflare?.env || process.env;
}

export async function action(args: Route.ActionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: Route.ActionArgs) {
  // Get user ID (optional - works without auth for now)
  const userId = await getOptionalAuth({ context, request });

  const { messages } = await request.json<{ messages: Messages }>();

  const messageCount = messages.length;

  // Get environment variables
  const env = getEnv(context);

  // Auto-detect and create North from first user message (simplified pattern matching)
  if (userId && messageCount === 1 && messages[0]?.role === 'user') {
    const firstMessage = messages[0].content;

    // Simple pattern matching for goal indicators
    const goalPatterns = [
      /^i want to (build|create|make|develop)/i,
      /^my goal is to/i,
      /^i'm (building|creating|making|developing)/i,
      /^help me (build|create|make|develop)/i,
    ];

    const hasGoalPattern = goalPatterns.some(pattern => pattern.test(firstMessage.trim()));

    if (hasGoalPattern) {
      // Create North using dynamic route
      const northId = `north-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      fetch(new URL(`/api/graph/${northId}`, request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: firstMessage.trim(),
          userId,
          confidence: 0.75,
        }),
      }).then(res => {
        if (res.ok) {
          logger.info('North created successfully', { northId });

          // Track North creation as a kinetic event
          trackKineticServer({
            northId,
            userId,
            description: 'Established project goal',
            type: 'digital',
            status: 'complete',
            alignmentScore: 100, // Perfect alignment - this IS the north
            effort: 1,
          }, env).catch(err => logger.warn('Failed to track North creation kinetic', err));
        } else {
          logger.warn('North creation failed', { status: res.status });
        }
      }).catch(err => {
        logger.warn('Background North creation failed', err);
      });
    }
  }

  // Run background extraction if user is authenticated and should extract
  const shouldRunExtraction = shouldExtract(messageCount);

  if (
    userId &&
    shouldRunExtraction &&
    env.ANTHROPIC_API_KEY &&
    env.NEO4J_URI
  ) {
    const integration = new IntegrationService({
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      neo4jUri: env.NEO4J_URI,
      neo4jUsername: env.NEO4J_USERNAME || 'neo4j',
      neo4jPassword: env.NEO4J_PASSWORD,
    });

    const startTime = Date.now();

    // Process in background (don't await)
    integration
      .processMessages(
        userId,
        messages.map((m: any) => ({ role: m.role, content: m.content })),
      )
      .then((result) => {
        const extractionTime = Date.now() - startTime;

        // Log extraction for analysis
        logExtraction(
          userId,
          messages as any,
          result,
          extractionTime,
        );

        if (result.extracted) {
          logger.info('Background intelligence extraction successful', {
            messageCount,
            extractionTime,
            result,
          });

          // Track understanding extraction as a kinetic event
          if (result.northId) {
            trackKineticServer({
              northId: result.northId,
              userId,
              description: `Analyzed conversation context (${messageCount} messages)`,
              type: 'digital',
              status: 'complete',
              alignmentScore: (result as any).confidence || 80,
              effort: 2,
            }, env).catch(err => logger.warn('Failed to track extraction kinetic', err));
          }
        } else {
          logger.debug('Skipping extraction', {
            messageCount,
            reason: (result as any).reason || 'Not time yet',
          });
        }
      })
      .catch((error) => {
        logger.error('Background extraction failed', { userId, error: error.message });
      })
      .finally(() => {
        integration.close();
      });
  } else if (userId && !shouldRunExtraction) {
    logger.debug('Skipping extraction', { userId, messageCount, reason: 'not enough messages' });
  }

  // Detect if user message requires a decision (only if North exists)
  if (userId && messageCount > 1) {
    const userMessage = messages[messages.length - 1]?.content;

    if (userMessage && messages[messages.length - 1]?.role === 'user') {
      const decisionPoint = detectDecisionPoint(userMessage);

      if (decisionPoint) {
        logger.info('Decision point detected', { decisionPoint });

        // Query for active North and create decision (don't await - background)
        fetch(new URL('/api/graph/active', request.url).toString(), {
          headers: { 'Content-Type': 'application/json' },
        })
          .then(res => res.json())
          .then(async (data: any) => {
            if (data.success && data.data && data.data.north) {
              const northId = data.data.north.id;

              // Track decision directly in Neo4j (bypasses auth)
              const success = await trackDecisionServer(northId, userId, decisionPoint, env);

              if (success) {
                logger.info('Decision tracked successfully', { northId });

                // Track as kinetic event
                await trackKineticServer({
                  northId,
                  userId,
                  description: `Decision required: ${decisionPoint.question}`,
                  type: 'digital',
                  status: 'pending',
                  alignmentScore: 70,
                  effort: 2,
                  metadata: { decisionType: decisionPoint.type },
                }, env);
              }
            }
          })
          .catch(err => {
            logger.warn('Failed to track decision', err);
          });
      }
    }
  }

  try {
    // Provider manager handles failover automatically
    // Will try: Google Gemini → OpenAI (Anthropic temporarily disabled)
    const result = await streamText(messages, env);

    // AI SDK v6: use toTextStreamResponse() directly
    return result.toTextStreamResponse();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    logger.error('Chat API error (all providers failed):', {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    // Log to console for debugging
    console.error('Chat API Error Details:', {
      message: errorMessage,
      stack: errorStack,
      env: {
        hasAnthropicKey: !!env.ANTHROPIC_API_KEY,
        anthropicKeyLength: env.ANTHROPIC_API_KEY?.length,
      },
    });

    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
