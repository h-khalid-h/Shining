import { env } from 'node:process';
import { config } from 'dotenv';

// Load .env file in development
config();

export function getAPIKey(cloudflareEnv?: Env) {
  /**
   * The `cloudflareEnv` is only used when deployed or when previewing locally.
   * In development the environment variables are available through `env`.
   */
  return env.ANTHROPIC_API_KEY || cloudflareEnv?.ANTHROPIC_API_KEY || '';
}

