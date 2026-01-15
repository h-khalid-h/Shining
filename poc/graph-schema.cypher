/**
 * Graph Schema Design for Shining Platform
 * Neo4j Cypher schema definitions
 */

// ============================================
// NODE TYPES
// ============================================

/**
 * User Node
 * Represents authenticated users
 */
CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

// Example User node
(:User {
  id: "user_123",
  email: "user@example.com",
  name: "John Doe",
  createdAt: datetime(),
  lastActive: datetime()
})

/**
 * North Node (Root Intent)
 * The core goal/outcome the user wants to achieve
 */
CREATE CONSTRAINT north_id IF NOT EXISTS
FOR (n:North) REQUIRE n.id IS UNIQUE;

// Example North node
(:North {
  id: "north_abc123",
  statement: "Launch mobile workout tracking app in 3 months",
  version: 1,
  locked: true,
  confidence: 85,
  createdAt: datetime(),
  updatedAt: datetime()
})

/**
 * Bound Node (Constraint)
 * Constraints on the North (time, cost, quality, scope)
 */
CREATE CONSTRAINT bound_id IF NOT EXISTS
FOR (b:Bound) REQUIRE b.id IS UNIQUE;

// Example Bound nodes
(:Bound {
  id: "bound_time_001",
  metric: "time",
  value: "3 months",
  threshold: 90,
  unit: "days",
  hard: true,
  confidence: 90
})

(:Bound {
  id: "bound_cost_001",
  metric: "cost",
  value: "$5000",
  threshold: 5000,
  unit: "USD",
  hard: false,
  confidence: 80
})

/**
 * Vector Node (Strategic Path)
 * One of multiple approaches to achieve the North
 */
CREATE CONSTRAINT vector_id IF NOT EXISTS
FOR (v:Vector) REQUIRE v.id IS UNIQUE;

// Example Vector nodes
(:Vector {
  id: "vector_001",
  name: "React Native - Fast & Cross-platform",
  description: "Build with React Native for iOS and Android simultaneously",
  selected: true,
  tradeoffSpeed: 85,
  tradeoffCost: 70,
  tradeoffQuality: 75,
  estimatedEffort: 60,
  createdAt: datetime()
})

(:Vector {
  id: "vector_002",
  name: "Native iOS - Premium Quality",
  description: "Build native iOS app first, Android later",
  selected: false,
  tradeoffSpeed: 50,
  tradeoffCost: 40,
  tradeoffQuality: 95,
  estimatedEffort: 90,
  createdAt: datetime()
})

/**
 * Pivot Node (Decision Point)
 * A decision that needs to be made along the Vector
 */
CREATE CONSTRAINT pivot_id IF NOT EXISTS
FOR (p:Pivot) REQUIRE p.id IS UNIQUE;

// Example Pivot node
(:Pivot {
  id: "pivot_001",
  question: "Which UI framework should we use?",
  context: "Need to choose between component libraries",
  status: "decided",
  selectedOption: "option_002",
  decidedAt: datetime(),
  createdAt: datetime()
})

/**
 * Option Node (Pivot Choice)
 * One possible answer to a Pivot
 */
CREATE CONSTRAINT option_id IF NOT EXISTS
FOR (o:Option) REQUIRE o.id IS UNIQUE;

// Example Option nodes
(:Option {
  id: "option_001",
  description: "React Native Paper",
  pros: ["Material Design", "Well documented"],
  cons: ["Heavier bundle", "Less customizable"],
  selected: false
})

(:Option {
  id: "option_002",
  description: "NativeBase",
  pros: ["Lightweight", "Highly customizable"],
  cons: ["Smaller community"],
  selected: true
})

/**
 * Kinetic Node (Action/Task)
 * Concrete action to be executed
 */
CREATE CONSTRAINT kinetic_id IF NOT EXISTS
FOR (k:Kinetic) REQUIRE k.id IS UNIQUE;

// Example Kinetic nodes
(:Kinetic {
  id: "kinetic_001",
  type: "digital",
  description: "Set up React Native project with TypeScript",
  status: "complete",
  alignmentScore: 95,
  effort: 2,
  outcome: "Project initialized successfully",
  startedAt: datetime(),
  completedAt: datetime(),
  createdAt: datetime()
})

(:Kinetic {
  id: "kinetic_002",
  type: "digital",
  description: "Install and configure NativeBase",
  status: "running",
  alignmentScore: 90,
  effort: 1,
  startedAt: datetime(),
  createdAt: datetime()
})

/**
 * Signal Node (Real-time Metrics)
 * Tracks alignment and progress
 */
CREATE CONSTRAINT signal_id IF NOT EXISTS
FOR (s:Signal) REQUIRE s.id IS UNIQUE;

// Example Signal node
(:Signal {
  id: "signal_001",
  strength: 78,
  drift: 12,
  velocity: 8.5,
  kineticComplete: 5,
  kineticTotal: 12,
  lastUpdate: datetime(),
  createdAt: datetime()
})

// ============================================
// RELATIONSHIP TYPES
// ============================================

/**
 * User owns North
 */
(:User)-[:OWNS]->(:North)

/**
 * North has Bounds
 */
(:North)-[:HAS_BOUND]->(:Bound)

/**
 * North generates Vectors
 */
(:North)-[:GENERATES]->(:Vector)

/**
 * Vector contains Pivots
 */
(:Vector)-[:CONTAINS]->(:Pivot)

/**
 * Pivot has Options
 */
(:Pivot)-[:HAS_OPTION]->(:Option)

/**
 * Pivot leads to Kinetics
 */
(:Pivot)-[:LEADS_TO]->(:Kinetic)

/**
 * Kinetic follows Kinetic (sequence)
 */
(:Kinetic)-[:FOLLOWS]->(:Kinetic)

/**
 * North tracks Signal
 */
(:North)-[:TRACKS]->(:Signal)

/**
 * Alignment Edge (with weight)
 * Measures how well a Vector aligns with North
 */
(:Vector)-[:ALIGNS_WITH {score: 85, calculatedAt: datetime()}]->(:North)

/**
 * Constraint Edge
 * Validates Kinetic against Bounds
 */
(:Bound)-[:VALIDATES {withinBounds: true, checkedAt: datetime()}]->(:Kinetic)

// ============================================
// EXAMPLE FULL GRAPH
// ============================================

// Create a complete example project
CREATE
  // User
  (user:User {
    id: "user_001",
    email: "john@example.com",
    name: "John Doe",
    createdAt: datetime()
  }),
  
  // North
  (north:North {
    id: "north_001",
    statement: "Launch mobile workout tracking app in 3 months",
    version: 1,
    locked: true,
    confidence: 85,
    createdAt: datetime()
  }),
  
  // Bounds
  (boundTime:Bound {
    id: "bound_time_001",
    metric: "time",
    value: "3 months",
    threshold: 90,
    unit: "days",
    hard: true,
    confidence: 90
  }),
  
  (boundCost:Bound {
    id: "bound_cost_001",
    metric: "cost",
    value: "$5000",
    threshold: 5000,
    unit: "USD",
    hard: false,
    confidence: 80
  }),
  
  // Vector (selected)
  (vector:Vector {
    id: "vector_001",
    name: "React Native - Fast & Cross-platform",
    selected: true,
    tradeoffSpeed: 85,
    tradeoffCost: 70,
    tradeoffQuality: 75,
    createdAt: datetime()
  }),
  
  // Pivot
  (pivot:Pivot {
    id: "pivot_001",
    question: "Which UI framework?",
    status: "decided",
    selectedOption: "option_002",
    decidedAt: datetime()
  }),
  
  // Options
  (option1:Option {
    id: "option_001",
    description: "React Native Paper",
    selected: false
  }),
  
  (option2:Option {
    id: "option_002",
    description: "NativeBase",
    selected: true
  }),
  
  // Kinetics
  (kinetic1:Kinetic {
    id: "kinetic_001",
    type: "digital",
    description: "Set up React Native project",
    status: "complete",
    alignmentScore: 95,
    completedAt: datetime()
  }),
  
  (kinetic2:Kinetic {
    id: "kinetic_002",
    type: "digital",
    description: "Install NativeBase",
    status: "running",
    alignmentScore: 90
  }),
  
  // Signal
  (signal:Signal {
    id: "signal_001",
    strength: 78,
    drift: 12,
    velocity: 8.5,
    lastUpdate: datetime()
  }),
  
  // Relationships
  (user)-[:OWNS]->(north),
  (north)-[:HAS_BOUND]->(boundTime),
  (north)-[:HAS_BOUND]->(boundCost),
  (north)-[:GENERATES]->(vector),
  (vector)-[:CONTAINS]->(pivot),
  (pivot)-[:HAS_OPTION]->(option1),
  (pivot)-[:HAS_OPTION]->(option2),
  (pivot)-[:LEADS_TO]->(kinetic1),
  (pivot)-[:LEADS_TO]->(kinetic2),
  (kinetic1)-[:FOLLOWS]->(kinetic2),
  (north)-[:TRACKS]->(signal),
  (vector)-[:ALIGNS_WITH {score: 85}]->(north),
  (boundTime)-[:VALIDATES {withinBounds: true}]->(kinetic1),
  (boundCost)-[:VALIDATES {withinBounds: true}]->(kinetic1)

// ============================================
// USEFUL QUERIES
// ============================================

// Get user's active North with all details
MATCH (u:User {id: $userId})-[:OWNS]->(n:North)
OPTIONAL MATCH (n)-[:HAS_BOUND]->(b:Bound)
OPTIONAL MATCH (n)-[:GENERATES]->(v:Vector {selected: true})
OPTIONAL MATCH (n)-[:TRACKS]->(s:Signal)
RETURN n, collect(DISTINCT b) as bounds, v as selectedVector, s as signal

// Get all Kinetics for a Vector with status
MATCH (v:Vector {id: $vectorId})-[:CONTAINS]->(p:Pivot)-[:LEADS_TO]->(k:Kinetic)
RETURN k
ORDER BY k.createdAt

// Calculate Signal strength
MATCH (n:North {id: $northId})-[:GENERATES]->(v:Vector {selected: true})-[:CONTAINS]->(p:Pivot)-[:LEADS_TO]->(k:Kinetic)
WITH n, count(k) as total, count(CASE WHEN k.status = 'complete' THEN 1 END) as complete, avg(k.alignmentScore) as avgAlignment
RETURN {
  strength: (complete * 100.0 / total) * (avgAlignment / 100.0),
  progress: complete * 100.0 / total,
  alignment: avgAlignment
}

// Find Kinetics violating Bounds
MATCH (n:North {id: $northId})-[:HAS_BOUND]->(b:Bound)-[v:VALIDATES]->(k:Kinetic)
WHERE v.withinBounds = false
RETURN b, k

// Get decision history
MATCH (n:North {id: $northId})-[:GENERATES]->(v:Vector)-[:CONTAINS]->(p:Pivot)
WHERE p.status = 'decided'
OPTIONAL MATCH (p)-[:HAS_OPTION {selected: true}]->(o:Option)
RETURN p, o
ORDER BY p.decidedAt DESC
