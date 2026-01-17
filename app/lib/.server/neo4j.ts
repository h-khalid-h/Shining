import neo4j, { Driver } from 'neo4j-driver';

/**
 * Neo4j Database Connection Utility
 * Creates and manages Neo4j driver instances
 */

export interface Neo4jConfig {
    uri: string;
    username: string;
    password: string;
}

/**
 * Create Neo4j driver instance
 * @param env - Environment variables (Cloudflare or Node.js)
 * @returns Neo4j Driver instance
 */
export function createNeo4jDriver(env: any): Driver {
    const config: Neo4jConfig = {
        uri: env.NEO4J_URI || 'neo4j://localhost:7687',
        username: env.NEO4J_USERNAME || 'neo4j',
        password: env.NEO4J_PASSWORD || '',
    };

    if (!config.password) {
        throw new Error('NEO4J_PASSWORD is required');
    }

    return neo4j.driver(
        config.uri,
        neo4j.auth.basic(config.username, config.password)
    );
}

/**
 * Test Neo4j connection
 * @param driver - Neo4j driver instance
 * @returns True if connection successful
 */
export async function testNeo4jConnection(driver: Driver): Promise<boolean> {
    const session = driver.session();
    try {
        const result = await session.run('RETURN 1 as test');
        return result.records[0].get('test') === 1;
    } catch (error) {
        console.error('Neo4j connection test failed:', error);
        return false;
    } finally {
        await session.close();
    }
}
