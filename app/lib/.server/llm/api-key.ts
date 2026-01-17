/**
 * Get Anthropic API key from environment
 * Vite automatically loads .env files in development
 */
export function getAPIKey(cloudflareEnv?: Env) {
  // In development, Vite loads .env into process.env
  // In production (Cloudflare), use cloudflareEnv
  return process.env.ANTHROPIC_API_KEY || cloudflareEnv?.ANTHROPIC_API_KEY || '';
}
