import { createNeo4jDriver } from '~/lib/.server/neo4j';
import { createScopedLogger } from '~/utils/logger';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const logger = createScopedLogger('DriftEngine');

/**
 * Calculates the Drift Score by comparing the North Star against the actual Codebase state.
 */
export async function calculateDrift(userId: string, northId: string, env: any) {
  logger.info('Starting drift calculation', { userId, northId });
  
  const driver = createNeo4jDriver(env);
  const session = driver.session();

  try {
    // 1. Fetch North Star
    const northResult = await session.run(
      `MATCH (n:North {id: $northId}) RETURN n.description as description`,
      { northId }
    );
    
    if (northResult.records.length === 0) {
      throw new Error('North Star not found');
    }
    
    const northDescription = northResult.records[0].get('description');

    // 2. Fetch recent file modifications (Kinetic Events) as a proxy for "Current State"
    // In a full implementation, we would scan the file system. 
    // For now, we use the graph's knowledge of what has been worked on.
    const kineticResult = await session.run(
      `
      MATCH (k:KineticEvent {userId: $userId})
      WHERE k.createdAt > datetime() - duration('P5D') // Last 5 days
      RETURN k.description as description, k.metadata as metadata
      ORDER BY k.createdAt DESC
      LIMIT 20
      `,
      { userId: userId }
    );

    const recentActivity = kineticResult.records.map((r: any) => 
      `- ${r.get('description')} (${JSON.stringify(r.get('metadata') || {})})`
    ).join('\n');

    // 3. Ask LLM to judge alignment
    const google = createGoogleGenerativeAI({
      apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    
    // Using gemini-2.0-flash-exp as configured elsewhere
    const model = google('gemini-2.0-flash-exp');

    const prompt = `You are the "Strategic Observer" AI. 
      Your ONLY job is to measure the distance between the User's Goal (North Star) and their Actual Work (Activity).

      NORTH STAR: "${northDescription}"

      RECENT ACTIVITY (The code/work they are actually doing):
      ${recentActivity || "(No recent activity recorded)"}

      TASK:
      1. Analyze if the activity is moving TOWARDS or AWAY from the North Star.
      2. Calculate a "Drift Score" from 0 to 100.
         - 0 = Perfectly Aligned (Moving directly towards goal)
         - 100 = Total Chaos (Doing unrelated work)
      3. Calculate a "Velocity/Strength" score from 0 to 100.
         - 0 = Stalled
         - 100 = Shipping fast
      4. Provide a 1-sentence analysis.

      OUTPUT JSON ONLY:
      {
        "drift": number,
        "strength": number,
        "analysis": "string"
      }`;

    const { text } = await generateText({
      model,
      prompt,
    });
    
    // Simple JSON extraction
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(jsonString);

    logger.info('Drift calculated', analysis);

    // 4. Update Signal in Graph
    await session.run(
      `
      MATCH (n:North {id: $northId})
      MERGE (n)-[:TRACKS]->(s:Signal)
      SET 
        s.drift = $drift,
        s.strength = $strength,
        s.analysis = $analysis,
        s.lastUpdate = datetime()
      RETURN s
      `,
      {
        northId,
        drift: analysis.drift,
        strength: analysis.strength,
        analysis: analysis.analysis
      }
    );

    return analysis;

  } catch (error) {
    logger.error('Drift calculation failed', error);
    // Don't throw, just return null so UI doesn't break
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
}
