import type { Route } from './+types/api.chat';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import { createScopedLogger } from '~/utils/logger';
import { getOptionalAuth } from '~/lib/auth.server';
import { IntegrationService } from '~/lib/intelligence/integration.server';
import { shouldExtract, logExtraction } from '~/lib/intelligence/extraction-logger';

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
      // Create North in background (don't await to avoid blocking chat)
      fetch(new URL('/api/north/create', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: firstMessage.trim(),
          userId,
          confidence: 0.75,
        }),
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
        messages.map((m) => ({ role: m.role, content: m.content })),
      )
      .then((result) => {
        const extractionTime = Date.now() - startTime;

        // Log extraction for analysis
        logExtraction(
          userId,
          messages,
          result.extracted,
          extractionTime,
        );

        logger.info('Background extraction complete', {
          userId,
          messageCount,
          confidence: result.extracted.overallConfidence,
          graphUpdated: result.graphUpdated,
          northId: result.northId,
          extractionTimeMs: extractionTime,
        });
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
