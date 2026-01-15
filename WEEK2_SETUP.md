# Week 2 Integration - Complete Setup Guide

## Overview
This guide walks you through completing the Week 2 integration, which adds background intelligence extraction to the Shining platform without any UI changes.

---

## What's Already Done ✅

1. **Dependencies Installed**
   - @clerk/remix
   - neo4j-driver
   - @anthropic-ai/sdk

2. **Services Created**
   - `app/lib/auth.server.ts` - Authentication utilities
   - `app/lib/intelligence/extraction.server.ts` - Intent extraction
   - `app/lib/intelligence/graph.server.ts` - Graph database operations
   - `app/lib/intelligence/integration.server.ts` - Integration layer

3. **API Integration**
   - `app/routes/api.chat.ts` - Background extraction added

4. **Configuration**
   - `.env.example` - Environment template
   - `wrangler.toml` - Updated with vars

---

## Remaining Steps

### Step 1: Set Up Accounts (15 minutes)

**Clerk (Authentication):**
```bash
# 1. Visit https://clerk.com
# 2. Sign up for free account
# 3. Create new application
# 4. Get publishable key (pk_test_...)
# 5. Get secret key (sk_test_...)
```

**Neo4j Aura (Graph Database):**
```bash
# 1. Visit https://neo4j.com/cloud/aura/
# 2. Sign up for free account
# 3. Create new instance (Free tier)
# 4. Copy connection URI
# 5. Copy username (usually 'neo4j')
# 6. Copy password
```

**Anthropic (AI):**
```bash
# 1. Visit https://console.anthropic.com
# 2. Sign up
# 3. Create API key
# 4. Copy key (sk-ant-...)
```

---

### Step 2: Configure Environment (5 minutes)

**Local Development (.env):**
```bash
# Create .env file
cp .env.example .env

# Edit .env with your credentials
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**Production (Cloudflare):**
```bash
# Update wrangler.toml with public values
# Then set secrets:
wrangler secret put CLERK_SECRET_KEY
wrangler secret put NEO4J_PASSWORD
wrangler secret put ANTHROPIC_API_KEY
```

---

### Step 3: Update Root Component (5 minutes)

**File: `app/root.tsx`**

Add Clerk integration:

```typescript
import { ClerkApp } from '@clerk/remix';
import { rootAuthLoader } from '@clerk/remix/ssr.server';

// Add loader
export const loader = (args) => rootAuthLoader(args);

// Wrap App with ClerkApp
function App() {
  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default ClerkApp(App);
```

---

### Step 4: Test Locally (10 minutes)

```bash
# Start dev server
npm run dev

# Visit http://localhost:5173
# Send a message in chat
# Check console for extraction logs
```

**Expected Logs:**
```
[Intelligence] Extraction completed {
  userId: "user_xxxxx",
  phase: "exploring",
  confidence: 75,
  northIdentified: false
}
```

---

### Step 5: Verify Graph Storage (5 minutes)

**Option A: Neo4j Browser**
```bash
# 1. Open Neo4j Aura console
# 2. Click "Open" on your instance
# 3. Run query:
MATCH (n:North) RETURN n LIMIT 10
```

**Option B: Check Logs**
```bash
# Look for in console:
[Intelligence] North created { userId: "...", northId: "..." }
[Intelligence] Bound added { metric: "time" }
```

---

## How It Works

### User Flow (No Changes)
1. User sends message
2. AI responds normally
3. **Background:** Intent extracted
4. **Background:** Stored in graph
5. User continues chatting

### Behind the Scenes
```
Message → API Route
    ↓
Get User ID (optional)
    ↓
Normal Chat Response ← User sees this
    ↓
Background Process:
  - Extract intent
  - Store in graph
  - Log results
```

---

## Verification Checklist

- [ ] Clerk account created
- [ ] Neo4j instance running
- [ ] Anthropic API key obtained
- [ ] Environment variables set
- [ ] root.tsx updated with ClerkApp
- [ ] Dev server starts without errors
- [ ] Messages send successfully
- [ ] Extraction logs appear in console
- [ ] Graph database receives data

---

## Troubleshooting

### "Clerk is not defined"
- Ensure @clerk/remix is installed
- Check root.tsx has ClerkApp wrapper
- Verify CLERK_PUBLISHABLE_KEY is set

### "Neo4j connection failed"
- Check NEO4J_URI is correct
- Verify instance is running in Aura console
- Confirm password is correct

### "Anthropic API error"
- Verify API key is valid
- Check you have credits
- Ensure key starts with sk-ant-

### "No extraction logs"
- User must be authenticated (sign in)
- Check environment variables are set
- Verify api.chat.ts has integration code

---

## Success Criteria

✅ **Week 2 Complete When:**
- Authentication working
- Background extraction running
- Graph storing data
- Logs showing results
- No UI changes visible
- No errors in console

---

## Next Steps (Week 3)

Once Week 2 is complete:
1. Create graphStore (frontend state)
2. Add signal calculation
3. Implement drift detection
4. Analyze extraction patterns
5. Prepare for UI features

---

## Support

**Documentation:**
- Clerk: https://clerk.com/docs/quickstarts/remix
- Neo4j: https://neo4j.com/docs/aura/
- Anthropic: https://docs.anthropic.com/

**Files to Reference:**
- `poc/README.md` - POC testing guide
- `poc/WEEK2_PLAN.md` - Detailed integration plan
- `poc/auth-setup.ts` - Authentication examples

---

## Estimated Time

- Account setup: 15 minutes
- Configuration: 5 minutes
- Code updates: 5 minutes
- Testing: 10 minutes
- **Total: ~35 minutes**

---

**Status:** Ready to complete Week 2! 🚀
