# Next.js Migration Plan
## From Remix to Next.js App Router

## Overview

Migrate Shining from Remix to Next.js App Router while preserving all intelligence layer work (Weeks 1-5).

---

## Migration Strategy

### What to Preserve (No Changes Needed)
✅ **Intelligence Layer (100% compatible)**
- `app/lib/intelligence/` - All services work as-is
- `app/lib/stores/` - Nanostores work in Next.js
- `app/lib/hooks/` - React hooks are framework-agnostic
- `app/components/intelligence/` - React components work as-is
- Graph database, AI extraction, signals - All backend-agnostic

### What to Migrate (Framework-Specific)
🔄 **Remix → Next.js Conversions**
- `app/routes/` → `app/` (route structure)
- `loader` functions → `async` Server Components or Route Handlers
- `action` functions → Server Actions or Route Handlers
- `app/root.tsx` → `app/layout.tsx`
- Remix `<Form>` → Next.js forms
- Clerk integration: `@clerk/remix` → `@clerk/nextjs`

---

## Phase 1: Setup Next.js (Day 1)

### 1.1 Create New Next.js App
```bash
# Create new Next.js app with App Router
npx create-next-app@latest shining-nextjs --typescript --tailwind --app --src-dir

# Or use existing directory
cd /Users/hkhalid/Codebases/Shining
# Backup current work
git checkout -b remix-backup
git checkout -b nextjs-migration
```

### 1.2 Install Dependencies
```bash
# Core Next.js already installed
npm install @clerk/nextjs@latest
npm install neo4j-driver @anthropic-ai/sdk
npm install nanostores @nanostores/react
npm install framer-motion
npm install @xterm/xterm
npm install ai
```

### 1.3 Project Structure
```
shining-nextjs/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (ClerkProvider)
│   │   ├── page.tsx            # Home page
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts    # Chat API route
│   │   │   └── graph/
│   │   │       ├── [northId]/
│   │   │       │   ├── route.ts
│   │   │       │   └── signal/
│   │   │       │       └── route.ts
│   │   │       └── active/
│   │   │           └── route.ts
│   │   └── components/
│   │       ├── chat/           # Chat components
│   │       └── intelligence/   # Intelligence components (COPY AS-IS)
│   ├── lib/
│   │   ├── intelligence/       # COPY AS-IS from Remix
│   │   ├── stores/             # COPY AS-IS from Remix
│   │   ├── hooks/              # COPY AS-IS from Remix
│   │   └── auth.ts             # New: Next.js auth utilities
│   └── middleware.ts           # Clerk middleware
├── .env.local
└── package.json
```

---

## Phase 2: Clerk Integration (Day 1-2)

### 2.1 Install Clerk
```bash
npm install @clerk/nextjs
```

### 2.2 Environment Variables
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 2.3 Create Middleware
```typescript
// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### 2.4 Update Root Layout
```typescript
// src/app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shining - Intelligent Outcome Platform",
  description: "AI-powered development with outcome tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### 2.5 Auth Utilities
```typescript
// src/lib/auth.ts
import { auth } from "@clerk/nextjs/server";

export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  return userId;
}

export async function getOptionalAuth() {
  const { userId } = await auth();
  return userId || null;
}
```

---

## Phase 3: Migrate Intelligence Layer (Day 2-3)

### 3.1 Copy Intelligence Files (No Changes Needed)
```bash
# These files work as-is in Next.js
cp -r app/lib/intelligence src/lib/
cp -r app/lib/stores src/lib/
cp -r app/lib/hooks src/lib/
cp -r app/components/intelligence src/app/components/
```

### 3.2 Update Import Paths
Change Remix-style imports to Next.js:
```typescript
// Before (Remix)
import { something } from '~/lib/intelligence/signals';

// After (Next.js)
import { something } from '@/lib/intelligence/signals';
```

---

## Phase 4: Migrate API Routes (Day 3-4)

### 4.1 Chat API Route
```typescript
// src/app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { getOptionalAuth } from '@/lib/auth';
import { IntegrationService } from '@/lib/intelligence/integration.server';
import { streamText } from '@/lib/llm/stream-text';

export async function POST(request: NextRequest) {
  const userId = await getOptionalAuth();
  const { messages } = await request.json();

  // Background extraction (same logic as Remix)
  if (userId && process.env.ANTHROPIC_API_KEY && process.env.NEO4J_URI) {
    const integration = new IntegrationService({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      neo4jUri: process.env.NEO4J_URI,
      neo4jUsername: process.env.NEO4J_USERNAME || 'neo4j',
      neo4jPassword: process.env.NEO4J_PASSWORD!,
    });

    // Process in background
    integration
      .processMessages(userId, messages)
      .then((result) => {
        console.log('Extraction complete', result);
      })
      .catch((error) => {
        console.error('Extraction failed', error);
      })
      .finally(() => {
        integration.close();
      });
  }

  // Stream chat response
  return streamText(messages);
}
```

### 4.2 Graph API Routes
```typescript
// src/app/api/graph/[northId]/route.ts
import { NextRequest } from 'next/server';
import { getOptionalAuth } from '@/lib/auth';
import { GraphService } from '@/lib/intelligence/graph.server';
import { graphCache } from '@/lib/intelligence/graph-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { northId: string } }
) {
  const userId = await getOptionalAuth();
  const { northId } = params;

  // Check cache
  const cached = graphCache.get(`graph:${northId}`);
  if (cached) {
    return Response.json(cached);
  }

  // Fetch from database
  const graph = new GraphService({
    uri: process.env.NEO4J_URI!,
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD!,
  });

  try {
    const state = await graph.getNorth(northId);
    
    if (!state) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const response = {
      north: state.north,
      bounds: state.bounds,
      signal: state.signal,
      loading: false,
      error: null,
    };

    graphCache.set(`graph:${northId}`, response);
    return Response.json(response);
  } finally {
    await graph.close();
  }
}
```

---

## Phase 5: Migrate UI Components (Day 4-5)

### 5.1 Chat Component
```typescript
// src/app/components/chat/Chat.tsx
'use client';

import { useChat } from 'ai/react';
import { useUnderstanding } from '@/lib/hooks/useUnderstanding';
import { Understanding } from '@/app/components/intelligence/Understanding';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  const understanding = useUnderstanding(messages.length);

  return (
    <div className="chat-container">
      {understanding.shouldShow && understanding.north && (
        <Understanding
          north={understanding.north}
          bounds={understanding.bounds}
          onConfirm={understanding.onConfirm}
          onDismiss={understanding.onDismiss}
        />
      )}
      
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### 5.2 Main Page
```typescript
// src/app/page.tsx
import { Chat } from '@/app/components/chat/Chat';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Chat />
    </main>
  );
}
```

---

## Migration Checklist

### Day 1: Setup
- [ ] Create Next.js app with App Router
- [ ] Install dependencies
- [ ] Set up Clerk with middleware
- [ ] Configure environment variables

### Day 2-3: Intelligence Layer
- [ ] Copy intelligence services (no changes)
- [ ] Copy stores and hooks (no changes)
- [ ] Copy intelligence components (no changes)
- [ ] Update import paths (~ to @)

### Day 4: API Routes
- [ ] Migrate chat API route
- [ ] Migrate graph API routes
- [ ] Test background extraction
- [ ] Verify caching works

### Day 5: UI & Testing
- [ ] Migrate chat components
- [ ] Test Understanding Card
- [ ] Verify all features work
- [ ] Performance check

---

## What Stays the Same

✅ **All Intelligence Work (100%)**
- Intent extraction logic
- Graph database schema
- Signal calculation
- Drift detection
- Understanding Card component
- All hooks and stores

**Total preserved:** 39 files, 5,800+ lines

---

## Benefits of Next.js

1. **Better Performance** - Server Components, automatic optimization
2. **Simpler Deployment** - Vercel, easier than Cloudflare Workers
3. **Better DX** - File-based routing, built-in API routes
4. **Larger Ecosystem** - More resources, examples, libraries
5. **Correct Clerk Integration** - Using latest `clerkMiddleware()`

---

## Timeline

- **Day 1:** Next.js setup + Clerk integration
- **Day 2-3:** Migrate intelligence layer
- **Day 4:** Migrate API routes
- **Day 5:** Migrate UI + testing

**Total:** 5 days for complete migration

---

## Next Steps

After migration complete:
1. Test all features
2. Deploy to Vercel
3. Continue with Week 6+ (A/B testing, etc.)

---

**Ready to start migration?**
