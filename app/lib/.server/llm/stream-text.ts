import { streamText as _streamText } from 'ai';
import type { CoreMessage } from 'ai';
import { getAPIKey } from '~/lib/.server/llm/api-key';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';
import { getProviderManager } from './provider-manager';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

/**
 * Stream text with automatic provider failover
 * Attempts providers in priority order: Anthropic → Google Gemini → OpenAI
 * Seamlessly rotates to next provider on error
 */
export async function streamText(messages: Messages, env: Env, options?: StreamingOptions) {
  const manager = getProviderManager();

  const { result } = await manager.executeWithFailover(
    async (provider, model) => {
      // Convert to CoreMessage format that streamText accepts directly
      const coreMessages: CoreMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      return _streamText({
        model,
        system: getSystemPrompt(),
        messages: coreMessages,
        ...options,
      });
    },
    env
  );

  return result;
}




