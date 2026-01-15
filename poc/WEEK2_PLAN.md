# Week 2 Integration Plan
## Connecting POC to Main Shining App

## Overview
Integrate the validated POC (extraction + graph) into the main Shining application without changing the UI.

---

## Goals

1. ✅ Add authentication (Clerk)
2. ✅ Protect API routes
3. ✅ Integrate extraction service
4. ✅ Connect to graph database
5. ✅ Add background processing
6. ✅ Start logging data
7. ❌ NO UI changes

---

## Step 1: Add Dependencies

### Install Packages
```bash
npm install @clerk/remix neo4j-driver @anthropic-ai/sdk
```

### Update package.json
```json
{
  "dependencies": {
    "@clerk/remix": "^4.0.0",
    "neo4j-driver": "^5.15.0",
    "@anthropic-ai/sdk": "^0.27.3"
  }
}
```

---

## Step 2: Environment Setup

### Add to .env
```
# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Neo4j
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=xxxxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Add to wrangler.toml
```toml
[vars]
CLERK_PUBLISHABLE_KEY = "pk_test_xxxxx"
NEO4J_URI = "neo4j+s://xxxxx.databases.neo4j.io"
NEO4J_USERNAME = "neo4j"

# Secrets (set via wrangler secret put)
# CLERK_SECRET_KEY
# NEO4J_PASSWORD
# ANTHROPIC_API_KEY
```

---

## Step 3: Add Authentication

### File: app/root.tsx
```typescript
import { ClerkApp } from '@clerk/remix';
import { rootAuthLoader } from '@clerk/remix/ssr.server';

export const loader = (args) => rootAuthLoader(args);

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

### File: app/lib/auth.server.ts (NEW)
```typescript
import { getAuth } from '@clerk/remix/ssr.server';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';

export async function requireAuth(args: LoaderFunctionArgs | ActionFunctionArgs) {
  const { userId } = await getAuth(args);
  
  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }
  
  return userId;
}

export async function getOptionalAuth(args: LoaderFunctionArgs | ActionFunctionArgs) {
  const { userId } = await getAuth(args);
  return userId || null;
}
```

---

## Step 4: Copy POC Services

### File: app/lib/intelligence/extraction.server.ts (NEW)
```typescript
// Copy from poc/intent-extraction.ts
// Add .server.ts suffix (Remix convention)
// Update imports for main app structure
```

### File: app/lib/intelligence/graph.server.ts (NEW)
```typescript
// Copy from poc/graph-service.ts
// Add .server.ts suffix
// Update imports
```

### File: app/lib/intelligence/integration.server.ts (NEW)
```typescript
// Copy from poc/integration-service.ts
// Add .server.ts suffix
// Update imports
```

---

## Step 5: Update API Routes

### File: app/routes/api.chat.ts
```typescript
import { requireAuth } from '~/lib/auth.server';
import { IntegrationService } from '~/lib/intelligence/integration.server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ChatAPI');

export async function action(args: ActionFunctionArgs) {
  // 1. Require authentication
  const userId = await requireAuth(args);
  
  // 2. Get messages
  const { messages } = await request.json<{ messages: Messages }>();
  
  // 3. Process with extraction (background)
  const integration = new IntegrationService({
    anthropicApiKey: context.cloudflare.env.ANTHROPIC_API_KEY,
    neo4jUri: context.cloudflare.env.NEO4J_URI,
    neo4jUsername: context.cloudflare.env.NEO4J_USERNAME,
    neo4jPassword: context.cloudflare.env.NEO4J_PASSWORD,
  });
  
  // Run extraction in background (don't await)
  integration.processMessages(userId, messages)
    .then(result => {
      logger.info('Extraction complete', { 
        userId, 
        confidence: result.extracted.overallConfidence,
        graphUpdated: result.graphUpdated 
      });
    })
    .catch(error => {
      logger.error('Extraction failed', { userId, error });
    })
    .finally(() => {
      integration.close();
    });
  
  // 4. Continue with normal chat response
  const stream = new SwitchableStream();
  // ... existing chat logic
}
```

---

## Step 6: Add Message Metadata

### Update Message Type
```typescript
// app/types/message.ts (or wherever Message is defined)
export interface EnhancedMessage extends Message {
  metadata?: {
    extractedIntent?: string;
    northId?: string;
    confidence?: number;
    phase?: 'exploring' | 'clarifying' | 'deciding' | 'executing';
  };
}
```

### Store Metadata
```typescript
// When extraction completes, update message
if (result.graphUpdated && result.northId) {
  // Store metadata for this conversation
  // Could use KV store or add to IndexedDB
}
```

---

## Step 7: Add Logging

### File: app/lib/intelligence/logger.server.ts (NEW)
```typescript
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Intelligence');

export function logExtraction(userId: string, result: any) {
  logger.info('Extraction completed', {
    userId,
    phase: result.extracted.phase,
    confidence: result.extracted.overallConfidence,
    northIdentified: !!result.extracted.north,
    boundsCount: result.extracted.bounds.length,
    decisionsCount: result.extracted.decisions.length,
    graphUpdated: result.graphUpdated,
  });
}

export function logExtractionError(userId: string, error: any) {
  logger.error('Extraction failed', {
    userId,
    error: error.message,
    stack: error.stack,
  });
}
```

---

## Step 8: Testing

### Test Authentication
```bash
# Start dev server
npm run dev

# Visit http://localhost:5173
# Sign in with test account
# Verify userId in logs
```

### Test Extraction
```bash
# Send a message
# Check logs for extraction results
# Verify graph updated in Neo4j browser
```

### Test End-to-End
```bash
# Full conversation
# Check extraction accuracy
# Verify data in graph
# Confirm no UI changes
```

---

## Verification Checklist

- [ ] Clerk authentication working
- [ ] API routes protected
- [ ] Extraction running on messages
- [ ] Graph storing data
- [ ] Logs showing results
- [ ] No errors in console
- [ ] UI unchanged
- [ ] Data tied to userId

---

## Success Criteria

1. ✅ Authentication required
2. ✅ Extraction runs automatically
3. ✅ Graph updates correctly
4. ✅ Logs show accuracy
5. ✅ No user-facing changes
6. ✅ Data persists

---

## Rollback Plan

If issues arise:
1. Remove Clerk integration
2. Disable extraction calls
3. Keep existing chat working
4. Debug in isolation
5. Re-integrate when fixed

---

## Week 2 Deliverables

- Authentication integrated
- Extraction running in background
- Graph storing data
- Logs tracking accuracy
- No UI changes
- Ready for Phase 2

---

## Next: Week 3-4

Once Week 2 is complete:
- Analyze extraction patterns
- Refine prompts
- Build graph store (frontend)
- Add signal calculation
- Prepare for UI features
