import neo4j, { Driver } from 'neo4j-driver';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GraphService');

/**
 * Neo4j Graph Database Service
 * Handles all graph operations for Shining platform
 */

export interface GraphConfig {
    uri: string;
    username: string;
    password: string;
}

export class GraphService {
    private driver: Driver;

    constructor(config: GraphConfig) {
        this.driver = neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));
    }

    async close() {
        await this.driver.close();
    }

    /**
     * Test database connection
     */
    async testConnection(): Promise<boolean> {
        const session = this.driver.session();
        try {
            const result = await session.run('RETURN 1 as test');
            return result.records[0].get('test') === 1;
        } catch (error) {
            logger.error('Connection test failed:', error);
            return false;
        } finally {
            await session.close();
        }
    }

    /**
     * Initialize schema (constraints and indexes)
     */
    async initializeSchema(): Promise<void> {
        const session = this.driver.session();
        try {
            // Create constraints
            await session.run('CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE');
            await session.run('CREATE CONSTRAINT north_id IF NOT EXISTS FOR (n:North) REQUIRE n.id IS UNIQUE');
            await session.run('CREATE CONSTRAINT bound_id IF NOT EXISTS FOR (b:Bound) REQUIRE b.id IS UNIQUE');
            await session.run('CREATE CONSTRAINT vector_id IF NOT EXISTS FOR (v:Vector) REQUIRE v.id IS UNIQUE');
            await session.run('CREATE CONSTRAINT pivot_id IF NOT EXISTS FOR (p:Pivot) REQUIRE p.id IS UNIQUE');
            await session.run('CREATE CONSTRAINT option_id IF NOT EXISTS FOR (o:Option) REQUIRE o.id IS UNIQUE');
            await session.run('CREATE CONSTRAINT kinetic_id IF NOT EXISTS FOR (k:Kinetic) REQUIRE k.id IS UNIQUE');
            await session.run('CREATE CONSTRAINT signal_id IF NOT EXISTS FOR (s:Signal) REQUIRE s.id IS UNIQUE');

            logger.info('Schema initialized');
        } finally {
            await session.close();
        }
    }

    /**
     * Create or update North node
     */
    async upsertNorth(userId: string, north: { statement: string; confidence: number }): Promise<string> {
        const session = this.driver.session();
        try {
            const northId = `north_${userId}_${Date.now()}`;
            const result = await session.run(
                `
        MERGE (u:User {id: $userId})
        MERGE (u)-[:OWNS]->(n:North {id: $northId})
        SET n.statement = $statement,
            n.confidence = $confidence,
            n.updatedAt = datetime(),
            n.locked = $locked
        ON CREATE SET n.createdAt = datetime(), n.version = 1
        RETURN n.id as id
        `,
                {
                    userId,
                    northId,
                    statement: north.statement,
                    confidence: north.confidence,
                    locked: north.confidence > 80,
                },
            );

            return result.records[0].get('id');
        } finally {
            await session.close();
        }
    }

    /**
     * Add Bound to North
     */
    async addBound(
        northId: string,
        bound: {
            metric: 'time' | 'cost' | 'quality' | 'scope';
            value: string;
            threshold?: number;
            unit?: string;
            confidence: number;
        },
    ): Promise<string> {
        const session = this.driver.session();
        try {
            const result = await session.run(
                `
        MATCH (n:North {id: $northId})
        CREATE (b:Bound {
          id: $boundId,
          metric: $metric,
          value: $value,
          threshold: $threshold,
          unit: $unit,
          confidence: $confidence,
          hard: $hard,
          createdAt: datetime()
        })
        CREATE (n)-[:HAS_BOUND]->(b)
        RETURN b.id as id
        `,
                {
                    northId,
                    boundId: `bound_${bound.metric}_${Date.now()}`,
                    metric: bound.metric,
                    value: bound.value,
                    threshold: bound.threshold || null,
                    unit: bound.unit || null,
                    confidence: bound.confidence,
                    hard: bound.confidence > 85,
                },
            );

            return result.records[0].get('id');
        } finally {
            await session.close();
        }
    }

    /**
     * Get North with all related data
     */
    async getNorth(northId: string): Promise<any> {
        const session = this.driver.session();
        try {
            const result = await session.run(
                `
        MATCH (n:North {id: $northId})
        OPTIONAL MATCH (n)-[:HAS_BOUND]->(b:Bound)
        OPTIONAL MATCH (n)-[:GENERATES]->(v:Vector {selected: true})
        OPTIONAL MATCH (n)-[:TRACKS]->(s:Signal)
        RETURN n, collect(DISTINCT b) as bounds, v as selectedVector, s as signal
        `,
                { northId },
            );

            if (result.records.length === 0) {
                return null;
            }

            const record = result.records[0];
            return {
                north: record.get('n').properties,
                bounds: record.get('bounds').map((b: any) => b.properties),
                selectedVector: record.get('selectedVector')?.properties || null,
                signal: record.get('signal')?.properties || null,
            };
        } finally {
            await session.close();
        }
    }

    /**
     * Calculate and update Signal
     */
    async updateSignal(northId: string): Promise<any> {
        const session = this.driver.session();
        try {
            const result = await session.run(
                `
        MATCH (n:North {id: $northId})-[:GENERATES]->(v:Vector {selected: true})-[:CONTAINS]->(p:Pivot)-[:LEADS_TO]->(k:Kinetic)
        WITH n, count(k) as total, 
             count(CASE WHEN k.status = 'complete' THEN 1 END) as complete,
             avg(k.alignmentScore) as avgAlignment
        WITH n, total, complete, avgAlignment,
             (complete * 100.0 / total) * (avgAlignment / 100.0) as strength
        MERGE (n)-[:TRACKS]->(s:Signal {id: $signalId})
        SET s.strength = strength,
            s.kineticComplete = complete,
            s.kineticTotal = total,
            s.lastUpdate = datetime()
        RETURN s
        `,
                {
                    northId,
                    signalId: `signal_${northId}`,
                },
            );

            return result.records[0]?.get('s').properties || null;
        } finally {
            await session.close();
        }
    }
}
