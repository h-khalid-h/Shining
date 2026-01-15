/**
 * Authentication Setup Guide for Shining Platform
 * Using Clerk for user authentication
 */

// ============================================
// CLERK SETUP STEPS
// ============================================

/**
 * 1. Create Clerk Account
 * - Visit https://clerk.com
 * - Sign up for free account
 * - Create new application
 * - Name it "Shining" or "Shining Dev"
 */

/**
 * 2. Get API Keys
 * - Go to API Keys section
 * - Copy Publishable Key (starts with pk_)
 * - Copy Secret Key (starts with sk_)
 * - Add to .env file
 */

/**
 * 3. Configure Allowed Domains
 * - Go to Settings > Domains
 * - Add localhost:5173 (development)
 * - Add your production domain later
 */

/**
 * 4. Enable Sign-up Options
 * - Go to User & Authentication > Email, Phone, Username
 * - Enable Email
 * - Enable Username (optional)
 * - Configure password requirements
 */

// ============================================
// INSTALLATION
// ============================================

/**
 * Install Clerk SDK
 * npm install @clerk/remix
 */

// ============================================
// REMIX INTEGRATION
// ============================================

/**
 * 1. Update root.tsx
 */
// app/root.tsx
import { ClerkApp } from '@clerk/remix';
import { rootAuthLoader } from '@clerk/remix/ssr.server';

export const loader = (args) => rootAuthLoader(args);

function App() {
    return (
        <html>
        <head>
        <Meta />
        < Links />
        </head>
        < body >
        <Outlet />
        < ScrollRestoration />
        <Scripts />
        </body>
        </html>
    );
}

export default ClerkApp(App);

/**
 * 2. Create auth utilities
 */
// app/lib/auth.server.ts
import { getAuth } from '@clerk/remix/ssr.server';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function requireAuth(args: LoaderFunctionArgs) {
    const { userId } = await getAuth(args);

    if (!userId) {
        throw new Response('Unauthorized', { status: 401 });
    }

    return userId;
}

export async function getOptionalAuth(args: LoaderFunctionArgs) {
    const { userId } = await getAuth(args);
    return userId || null;
}

/**
 * 3. Protect API routes
 */
// app/routes/api.chat.ts
import { requireAuth } from '~/lib/auth.server';

export async function action(args: ActionFunctionArgs) {
    const userId = await requireAuth(args);

    // Now you have authenticated userId
    const { messages } = await request.json();

    // Process with userId
    return chatAction(userId, messages);
}

/**
 * 4. Add user context to components
 */
// app/components/header/Header.tsx
import { useUser } from '@clerk/remix';

export function Header() {
    const { user, isSignedIn } = useUser();

    return (
        <header>
        {
            isSignedIn?(
        <div> Welcome, { user.firstName } </div>
    ) : (
        <SignInButton />
    )
}
</header>
  );
}

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

/**
 * Add to .env
 */
CLERK_PUBLISHABLE_KEY = pk_test_xxxxx
CLERK_SECRET_KEY = sk_test_xxxxx

/**
 * Add to wrangler.toml (for Cloudflare)
 */
[vars]
CLERK_PUBLISHABLE_KEY = "pk_test_xxxxx"

[secrets]
# Set via: wrangler secret put CLERK_SECRET_KEY
# CLERK_SECRET_KEY

// ============================================
// USER FLOW
// ============================================

/**
 * 1. User visits app (not signed in)
 * - Show landing page
 * - Offer "Sign In" or "Try Demo"
 * 
 * 2. User clicks "Sign In"
 * - Clerk modal appears
 * - User signs in with email/password
 * - Redirected to chat
 * 
 * 3. User starts chatting
 * - Messages saved to their account
 * - Graph data tied to their userId
 * - Can access from any device
 * 
 * 4. User signs out
 * - Data persists in database
 * - Can sign back in anytime
 */

// ============================================
// GRAPH INTEGRATION
// ============================================

/**
 * Connect authenticated user to graph
 */
// When creating North
const userId = await requireAuth(args);
const northId = await graphService.upsertNorth(userId, {
    statement: extracted.north.statement,
    confidence: extracted.north.confidence
});

/**
 * Query user's data
 */
// Get all user's Norths
MATCH(u: User { id: $userId }) - [: OWNS] -> (n:North)
RETURN n
ORDER BY n.createdAt DESC

// ============================================
// RATE LIMITING
// ============================================

/**
 * Add rate limiting per user
 */
// app/lib/rate-limit.server.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
});

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function checkRateLimit(userId: string) {
    const { success, remaining } = await ratelimit.limit(userId);

    if (!success) {
        throw new Response('Rate limit exceeded', { status: 429 });
    }

    return remaining;
}

/**
 * Use in API routes
 */
export async function action(args: ActionFunctionArgs) {
    const userId = await requireAuth(args);
    await checkRateLimit(userId);

    // Process request
}

// ============================================
// TESTING
// ============================================

/**
 * Test authentication locally
 */
// 1. Start dev server
npm run dev

// 2. Visit http://localhost:5173
// 3. Click "Sign In"
// 4. Create test account
// 5. Verify userId in console
// 6. Test API calls with auth

/**
 * Test in POC
 */
// Add mock auth for testing
export async function testWithAuth() {
    const mockUserId = 'user_test_123';

    // Test extraction with user context
    const result = await integration.processMessages(mockUserId, messages);

    // Verify data is tied to user
    const userNorths = await graph.getUserNorths(mockUserId);
}

// ============================================
// DEPLOYMENT
// ============================================

/**
 * Production setup
 */
// 1. Add production domain to Clerk
// 2. Update environment variables in Cloudflare
// 3. Test sign-in flow
// 4. Monitor auth errors
// 5. Set up user analytics

/**
 * Cloudflare secrets
 */
wrangler secret put CLERK_SECRET_KEY
wrangler secret put NEO4J_PASSWORD
wrangler secret put ANTHROPIC_API_KEY

// ============================================
// SECURITY CHECKLIST
// ============================================

/**
 * ✅ Authentication required for all API routes
 * ✅ User data isolated by userId
 * ✅ Rate limiting per user
 * ✅ Secrets not in code
 * ✅ HTTPS only in production
 * ✅ Session management via Clerk
 * ✅ CSRF protection enabled
 * ✅ Input validation on all endpoints
 */

// ============================================
// NEXT STEPS
// ============================================

/**
 * After auth is set up:
 * 1. Update all API routes to require auth
 * 2. Add userId to graph operations
 * 3. Implement user-specific queries
 * 4. Add rate limiting
 * 5. Test end-to-end flow
 * 6. Deploy to production
 */
