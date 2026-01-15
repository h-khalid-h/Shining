import type { Route } from './+types/api.chat';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import { createScopedLogger } from '~/utils/logger';
import { getOptionalAuth } from '~/lib/auth.server';
import { IntegrationService } from '~/lib/intelligence/integration.server';
import { shouldExtract, logExtraction } from '~/lib/intelligence/extraction-logger';

const logger = createScopedLogger('ChatAPI');

export async function action(args: Route.ActionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: Route.ActionArgs) {
  // Get user ID (optional - works without auth for now)
  const userId = await getOptionalAuth({ context, request });

  const { messages } = await request.json<{ messages: Messages }>();

  // Run background extraction if user is authenticated and should extract
  const messageCount = messages.length;
  const shouldRunExtraction = shouldExtract(messageCount);

  if (
    userId &&
    shouldRunExtraction &&
    context.cloudflare.env.ANTHROPIC_API_KEY &&
    context.cloudflare.env.NEO4J_URI
  ) {
    const integration = new IntegrationService({
      anthropicApiKey: context.cloudflare.env.ANTHROPIC_API_KEY,
      neo4jUri: context.cloudflare.env.NEO4J_URI,
      neo4jUsername: context.cloudflare.env.NEO4J_USERNAME || 'neo4j',
      neo4jPassword: context.cloudflare.env.NEO4J_PASSWORD,
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

  const stream = new SwitchableStream();

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason }) => {
        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        logger.warn(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText(messages, context.cloudflare.env, options);

        return stream.switchSource(result.toAIStream());
      },
    };

    const result = await streamText(messages, context.cloudflare.env, options);

    stream.switchSource(result.toAIStream());

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    logger.error('Chat API error:', error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
