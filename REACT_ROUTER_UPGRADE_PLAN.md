# React Router v7 Upgrade Plan
## From Remix to React Router v7

## Overview

Upgrade Shining from Remix to React Router v7 (the framework Remix is built on) while preserving all intelligence work.

**Why This is Better:**
- ✅ Simpler migration (Remix → React Router is natural evolution)
- ✅ Preserves all work (minimal changes needed)
- ✅ Correct Clerk integration with `clerkMiddleware()`
- ✅ Modern framework (React Router v7 is latest)
- ✅ Less risky than Next.js migration

---

## What Changes

### Minimal Changes Required
- Update dependencies (Remix → React Router v7)
- Update Clerk integration (`@clerk/remix` → `@clerk/react-router`)
- Add `clerkMiddleware()` to root
- Update environment variable names (optional)

### What Stays the Same (100%)
- ✅ All intelligence layer code
- ✅ All routes and components
- ✅ All business logic
- ✅ File structure
- ✅ Deployment (still Cloudflare Workers)

---

## Migration Steps

### Step 1: Update Dependencies

**Remove Remix packages:**
```bash
npm uninstall @remix-run/cloudflare @remix-run/react @remix-run/dev
npm uninstall @clerk/remix
```

**Install React Router v7:**
```bash
npm install react-router@latest
npm install @react-router/dev@latest
npm install @react-router/cloudflare@latest
npm install @clerk/react-router@latest
```

### Step 2: Update Configuration

**Update `package.json` scripts:**
```json
{
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "start": "wrangler pages dev ./build/client",
    "typecheck": "tsc"
  }
}
```

**Create `react-router.config.ts`:**
```typescript
import type { Config } from '@react-router/dev/config'

export default {
  future: {
    v8_middleware: true,
  },
} satisfies Config
```

### Step 3: Update Clerk Integration

**Update `app/root.tsx`:**
```typescript
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/react-router';
import { clerkMiddleware, rootAuthLoader } from '@clerk/react-router/server';
import type { Route } from './+types/root';

// Add middleware
export const middleware: Route.MiddlewareFunction[] = [clerkMiddleware()];

// Add loader
export const loader = (args: Route.LoaderArgs) => rootAuthLoader(args);

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ClerkProvider loaderData={loaderData}>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body>
          <header>
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### Step 4: Update Auth Utilities

**Update `app/lib/auth.server.ts`:**
```typescript
import { getAuth } from '@clerk/react-router/server';

export async function requireAuth(args: any) {
  const { userId } = await getAuth(args);
  
  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }
  
  return userId;
}

export async function getOptionalAuth(args: any) {
  const { userId } = await getAuth(args);
  return userId || null;
}
```

### Step 5: Update Environment Variables

**Update `.env` (optional - Clerk keys stay the same):**
```bash
# Clerk keys (same as before)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Other keys (unchanged)
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Step 6: Update Import Paths

**Change all Remix imports to React Router:**
```typescript
// Before
import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';

// After
import { json } from 'react-router';
import { useLoaderData } from 'react-router';
import type { Route } from './+types/route-name';
```

---

## Intelligence Layer (No Changes)

All these files work as-is:
- ✅ `app/lib/intelligence/` - All services
- ✅ `app/lib/stores/` - Nanostores
- ✅ `app/lib/hooks/` - React hooks
- ✅ `app/components/intelligence/` - Components
- ✅ All API routes (just update imports)

---

## Timeline

**Day 1: Dependencies & Configuration**
- Update package.json
- Install React Router v7
- Create react-router.config.ts
- Update environment variables

**Day 2: Clerk Integration**
- Update root.tsx
- Add clerkMiddleware()
- Update auth utilities
- Test authentication

**Day 3: Update Imports**
- Update all route imports
- Update component imports
- Fix any type issues

**Day 4: Testing**
- Test all features
- Verify intelligence layer works
- Check API routes
- Performance testing

**Total: 4 days** (vs 5+ for Next.js)

---

## Benefits

1. **Simpler Migration** - Remix is built on React Router
2. **Less Risk** - Minimal code changes
3. **Preserves Work** - All intelligence code unchanged
4. **Modern Framework** - React Router v7 is latest
5. **Correct Clerk** - Using `clerkMiddleware()`
6. **Same Deployment** - Still Cloudflare Workers

---

## Comparison

### React Router Upgrade (Recommended)
- ⏱️ 4 days
- 🔄 Minimal changes
- ✅ Preserves all work
- ✅ Natural evolution

### Next.js Migration (Alternative)
- ⏱️ 5+ days
- 🔄 Major rewrite
- ⚠️ Higher risk
- 🔄 Different deployment

---

## Next Steps

1. Review this plan
2. Approve migration
3. Start with Day 1 (dependencies)
4. Systematic upgrade over 4 days

---

**Ready to start React Router v7 upgrade!**
