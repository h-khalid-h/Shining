import type { Route } from './+types/api.enhancer';
import { streamText } from '~/lib/.server/llm/stream-text';
import { stripIndents } from '~/utils/stripIndent';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Enhancer');

// Helper to get env vars from either cloudflare context or process.env
function getEnv(context: Route.ActionArgs['context']) {
  return context.cloudflare?.env || process.env;
}

export async function action(args: Route.ActionArgs) {
  return enhancerAction(args);
}

async function enhancerAction({ context, request }: Route.ActionArgs) {
  const { message } = await request.json<{ message: string }>();

  // Get environment variables
  const env = getEnv(context);

  try {
    const result = await streamText(
      [
        {
          role: 'user',
          content: stripIndents`
          I want you to improve the user prompt that is wrapped in \`<original_prompt>\` tags.

          IMPORTANT: Only respond with the improved prompt and nothing else!

          <original_prompt>
            ${message}
          </original_prompt>
        `,
        },
      ],
      env,
    );

    // v6 API: Use toDataStreamResponse directly
    return result.toDataStreamResponse();
  } catch (error) {
    logger.error('Failed to enhance prompt:', error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
