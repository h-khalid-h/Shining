# Week 1 Setup Checklist

## Infrastructure Setup

### 1. Neo4j Database
- [ ] Create Neo4j Aura account (https://neo4j.com/cloud/aura/)
- [ ] Create free instance
- [ ] Save connection URI
- [ ] Save username/password
- [ ] Test connection

### 2. Authentication
- [ ] Create Clerk account (https://clerk.com)
- [ ] Create application
- [ ] Get publishable key
- [ ] Get secret key
- [ ] Configure allowed domains

### 3. API Keys
- [ ] Get Anthropic API key (https://console.anthropic.com)
- [ ] Test with POC extraction
- [ ] Set up billing alerts
- [ ] Configure rate limits

### 4. Environment Variables
Create `.env` file:
```
# Neo4j
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# App
NODE_ENV=development
```

## POC Testing

### Run Intent Extraction Test
```bash
cd poc
npm install
npm run test:extraction
```

### Expected Results
- ✅ North extracted with >70% confidence
- ✅ Bounds identified correctly
- ✅ Decisions captured
- ✅ Phase detection accurate
- ✅ Overall confidence >80%

### If Tests Pass
- [ ] Document accuracy metrics
- [ ] Identify edge cases
- [ ] Refine extraction prompts
- [ ] Plan integration approach

### If Tests Fail
- [ ] Analyze failure patterns
- [ ] Adjust extraction prompt
- [ ] Add more test cases
- [ ] Iterate until >80% accuracy

## Next Steps (Week 2)
Once POC is validated:
1. Design graph schema
2. Set up Neo4j database
3. Create API endpoints
4. Build graph store
5. Integrate with messages
