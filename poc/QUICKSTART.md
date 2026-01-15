# 🚀 Quick Start Guide

## Get Running in 5 Minutes

### Step 1: Get API Keys (2 min)

**Anthropic:**
1. Go to https://console.anthropic.com
2. Sign up → Create API key
3. Copy key (starts with `sk-ant-`)

**Neo4j:**
1. Go to https://neo4j.com/cloud/aura/
2. Sign up → Create Free instance
3. Copy URI, username, password

### Step 2: Configure (1 min)

```bash
cd poc
cp .env.example .env
```

Edit `.env`:
```
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Step 3: Test (2 min)

```bash
npm run test:all
```

**Expected output:**
```
✅ Extraction accuracy: 85%
✅ Graph operations: Working
✅ Integration: Functional
```

---

## If Tests Pass ✅

**You're ready for Week 2!**

Next: Integrate into main Shining app
- Add auth
- Connect extraction
- Start collecting data

---

## If Tests Fail ❌

**Check:**
1. API keys correct?
2. Neo4j instance running?
3. Network connection?

**Get help:**
- Review `README.md` for troubleshooting
- Check error messages
- Verify credentials

---

## What You Just Built

**Intelligence Layer:**
- AI extracts intent from conversations
- Graph stores decision structure
- Integration connects everything

**No UI changes yet** - this runs in background

**Next phase:** Surface insights to users

---

## Quick Commands

```bash
# Test extraction only
npm run test:extraction

# Test graph only  
npm run test:graph

# Test integration
npm run test:integration

# Test everything
npm run test:all
```

---

## Success = Ready for Week 2! 🎉
