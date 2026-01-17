# Shining POC - Complete Guide

## Overview
This POC validates the core intelligence layer for Shining platform:
- **Intent Extraction**: Extract structured data from conversations
- **Graph Storage**: Store decisions in Neo4j graph database
- **Integration**: Connect extraction → graph → application

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd poc
npm install
```

### 2. Get API Keys

**Anthropic (for AI extraction):**
1. Visit https://console.anthropic.com
2. Create account
3. Generate API key
4. Copy key

**Neo4j (for graph database):**
1. Visit https://neo4j.com/cloud/aura/
2. Create free account
3. Create new instance (Free tier)
4. Save connection URI, username, password

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

Example `.env`:
```
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## Running Tests

### Test 1: Intent Extraction
```bash
npm run test:extraction
```

**What it tests:**
- Extracts North (core intent) from conversations
- Identifies Bounds (constraints)
- Detects Decisions made
- Determines conversation phase

**Expected output:**
```
✅ Extraction Result:
{
  "north": {
    "statement": "Build mobile workout tracking app",
    "confidence": 85
  },
  "bounds": [
    { "metric": "time", "value": "3 months", "confidence": 90 },
    { "metric": "cost", "value": "$5000", "confidence": 80 }
  ],
  "decisions": [
    { "question": "Platform choice", "answer": "React Native", "confidence": 85 }
  ],
  "phase": "deciding",
  "overallConfidence": 82
}
```

**Success criteria:** Confidence >80%, North identified correctly

---

### Test 2: Graph Service
```bash
npm run test:graph
```

**What it tests:**
- Neo4j connection
- Schema initialization
- CRUD operations (Create, Read, Update, Delete)
- Node relationships

**Expected output:**
```
✅ Connected
✅ Schema initialized
✅ Created North: north_user_test_001_xxxxx
✅ Added 2 bounds
✅ Retrieved: {
  "north": { "statement": "...", "confidence": 85 },
  "bounds": [...],
  "selectedVector": null,
  "signal": null
}
```

**Success criteria:** All operations complete without errors

---

### Test 3: Full Integration
```bash
npm run test:integration
```

**What it tests:**
- End-to-end flow: messages → extraction → graph
- Data persistence
- State retrieval

**Expected output:**
```
📊 Extraction Results:
  Phase: deciding
  Confidence: 82%
  North: ✓
  Bounds: 2
  Decisions: 1

💾 Updating graph...
  ✓ North created: north_xxxxx
  ✓ Bound added: time
  ✓ Bound added: cost

Graph Updated: ✅ Yes
```

**Success criteria:** Graph updated successfully, data retrievable

---

### Test All
```bash
npm run test:all
```

Runs all three tests in sequence.

---

## File Structure

```
poc/
├── intent-extraction.ts    # AI extraction service
├── graph-service.ts         # Neo4j CRUD operations
├── integration-service.ts   # Connects extraction → graph
├── graph-schema.cypher      # Database schema definition
├── package.json             # Dependencies & scripts
├── .env.example             # Environment template
├── .env                     # Your credentials (gitignored)
├── README.md                # This file
└── SETUP.md                 # Week 1 checklist
```

---

## Understanding the Flow

### 1. User sends messages
```typescript
const messages = [
  { role: 'user', content: 'I want to build a mobile app' },
  { role: 'assistant', content: 'What's your timeline?' },
  { role: 'user', content: '3 months' }
];
```

### 2. AI extracts intent
```typescript
const extracted = await extractIntent(messages, apiKey);
// Returns: { north, bounds, decisions, phase, confidence }
```

### 3. Graph stores structure
```typescript
const northId = await graph.upsertNorth(userId, extracted.north);
await graph.addBound(northId, extracted.bounds[0]);
```

### 4. Application retrieves state
```typescript
const state = await graph.getNorth(northId);
// Returns: { north, bounds, selectedVector, signal }
```

---

## Troubleshooting

### "Connection test failed"
- Check Neo4j URI is correct
- Verify username/password
- Ensure instance is running (check Neo4j Aura console)

### "No JSON found in response"
- Check Anthropic API key is valid
- Verify you have API credits
- Check network connection

### "Constraint already exists"
- Normal on repeated runs
- Schema is idempotent (safe to run multiple times)

---

## Next Steps

### If Tests Pass ✅
1. Document accuracy metrics
2. Identify edge cases
3. Proceed to Week 2 (integrate into main app)

### If Tests Fail ❌
1. Check error messages
2. Verify credentials
3. Review extraction prompt
4. Adjust confidence thresholds
5. Re-run tests

---

## Success Metrics

**Extraction Quality:**
- North identified: >90% when clear
- Bounds captured: >80% accuracy
- Phase detection: >85% correct
- Overall confidence: >80%

**Graph Operations:**
- All CRUD operations working
- Relationships created correctly
- Queries return expected data
- No data loss

**Integration:**
- End-to-end flow functional
- Data persists correctly
- State retrievable
- No errors

---

## Support

If you encounter issues:
1. Check `.env` configuration
2. Verify API keys are valid
3. Review error messages
4. Check Neo4j Aura console
5. Ensure dependencies installed

---

## What's Next?

After POC validation:
1. **Week 2**: Integrate into main Shining app
2. **Week 3-4**: Add background tracking
3. **Week 5-6**: Build UI indicators
4. **Week 7+**: Advanced features

The POC proves the concept works. Now we integrate it seamlessly into the existing chat interface.
