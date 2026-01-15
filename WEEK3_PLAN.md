# Week 3 Implementation Plan
## Background Tracking - Graph Store & Signals

## Overview

Week 3 focuses on building the frontend intelligence layer that connects to the backend graph database. This creates real-time tracking of user progress without any UI changes yet.

---

## Goals

1. ✅ Create frontend graph store (nanostores)
2. ✅ Connect to backend graph API
3. ✅ Build signal calculator
4. ✅ Implement drift detection
5. ✅ Add real-time updates
6. ❌ NO UI changes (Week 5)

---

## Architecture

### Current State (Week 2)
```
User Message → API → Background Extraction → Graph DB
```

### Week 3 Addition
```
User Message → API → Background Extraction → Graph DB
                                                  ↓
                                            Graph Store (Frontend)
                                                  ↓
                                            Signal Calculator
                                                  ↓
                                            Drift Detector
```

---

## Step 1: Create Graph Store (Day 1-2)

### File: `app/lib/stores/graph.ts`

```typescript
import { atom, map } from 'nanostores';

export interface NorthState {
  id: string;
  statement: string;
  confidence: number;
  locked: boolean;
}

export interface BoundState {
  id: string;
  metric: 'time' | 'cost' | 'quality' | 'scope';
  value: string;
  confidence: number;
}

export interface SignalState {
  strength: number;
  drift: number;
  velocity: number;
  kineticComplete: number;
  kineticTotal: number;
  lastUpdate: string;
}

export interface GraphState {
  north: NorthState | null;
  bounds: BoundState[];
  signal: SignalState | null;
  loading: boolean;
  error: string | null;
}

// Graph store
export const graphStore = map<GraphState>({
  north: null,
  bounds: [],
  signal: null,
  loading: false,
  error: null,
});

// Actions
export function setNorth(north: NorthState) {
  graphStore.setKey('north', north);
}

export function addBound(bound: BoundState) {
  const current = graphStore.get();
  graphStore.setKey('bounds', [...current.bounds, bound]);
}

export function updateSignal(signal: SignalState) {
  graphStore.setKey('signal', signal);
}

export function setLoading(loading: boolean) {
  graphStore.setKey('loading', loading);
}

export function setError(error: string | null) {
  graphStore.setKey('error', error);
}

export function resetGraph() {
  graphStore.set({
    north: null,
    bounds: [],
    signal: null,
    loading: false,
    error: null,
  });
}
```

---

## Step 2: Create Graph API Client (Day 2)

### File: `app/lib/api/graph.client.ts`

```typescript
import type { GraphState } from '../stores/graph';

export class GraphClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get current graph state for user
   */
  async getGraphState(northId: string): Promise<GraphState> {
    const response = await fetch(`${this.baseUrl}/graph/${northId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch graph state');
    }

    return response.json();
  }

  /**
   * Subscribe to graph updates (polling for now)
   */
  subscribeToUpdates(
    northId: string,
    callback: (state: GraphState) => void,
    interval: number = 5000,
  ): () => void {
    const intervalId = setInterval(async () => {
      try {
        const state = await this.getGraphState(northId);
        callback(state);
      } catch (error) {
        console.error('Graph update failed:', error);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }
}

export const graphClient = new GraphClient();
```

---

## Step 3: Create Graph API Route (Day 2-3)

### File: `app/routes/api.graph.$northId.ts`

```typescript
import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { requireAuth } from '~/lib/auth.server';
import { GraphService } from '~/lib/intelligence/graph.server';

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const userId = await requireAuth({ context, request });
  const { northId } = params;

  if (!northId) {
    throw new Response('North ID required', { status: 400 });
  }

  const graph = new GraphService({
    uri: context.cloudflare.env.NEO4J_URI,
    username: context.cloudflare.env.NEO4J_USERNAME,
    password: context.cloudflare.env.NEO4J_PASSWORD,
  });

  try {
    const state = await graph.getNorth(northId);
    
    if (!state) {
      throw new Response('North not found', { status: 404 });
    }

    return json({
      north: state.north,
      bounds: state.bounds,
      signal: state.signal,
      loading: false,
      error: null,
    });
  } catch (error) {
    return json(
      { error: 'Failed to fetch graph state' },
      { status: 500 },
    );
  } finally {
    await graph.close();
  }
}
```

---

## Step 4: Signal Calculator (Day 3-4)

### File: `app/lib/intelligence/signals.ts`

```typescript
export interface SignalMetrics {
  strength: number;      // 0-100: Overall progress
  drift: number;         // 0-100: Misalignment from North
  velocity: number;      // Actions per day
  alignment: number;     // 0-100: How well aligned
}

export function calculateSignal(data: {
  kineticComplete: number;
  kineticTotal: number;
  avgAlignment: number;
  daysElapsed: number;
}): SignalMetrics {
  const { kineticComplete, kineticTotal, avgAlignment, daysElapsed } = data;

  // Strength: Progress weighted by alignment
  const progress = kineticTotal > 0 ? (kineticComplete / kineticTotal) * 100 : 0;
  const strength = (progress * (avgAlignment / 100));

  // Drift: Inverse of alignment
  const drift = 100 - avgAlignment;

  // Velocity: Actions per day
  const velocity = daysElapsed > 0 ? kineticComplete / daysElapsed : 0;

  return {
    strength: Math.round(strength),
    drift: Math.round(drift),
    velocity: Math.round(velocity * 10) / 10,
    alignment: Math.round(avgAlignment),
  };
}

export function detectDrift(signal: SignalMetrics): {
  isDrifting: boolean;
  severity: 'low' | 'medium' | 'high';
  message: string;
} {
  if (signal.drift < 20) {
    return {
      isDrifting: false,
      severity: 'low',
      message: 'On track',
    };
  }

  if (signal.drift < 40) {
    return {
      isDrifting: true,
      severity: 'medium',
      message: 'Minor drift detected',
    };
  }

  return {
    isDrifting: true,
    severity: 'high',
    message: 'Significant drift - course correction needed',
  };
}
```

---

## Step 5: Integration Hook (Day 4-5)

### File: `app/lib/hooks/useGraph.ts`

```typescript
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { graphStore, setNorth, updateSignal, setLoading, setError } from '../stores/graph';
import { graphClient } from '../api/graph.client';

export function useGraph(northId: string | null) {
  const state = useStore(graphStore);

  useEffect(() => {
    if (!northId) return;

    setLoading(true);

    // Initial fetch
    graphClient
      .getGraphState(northId)
      .then((data) => {
        if (data.north) setNorth(data.north);
        if (data.signal) updateSignal(data.signal);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });

    // Subscribe to updates
    const unsubscribe = graphClient.subscribeToUpdates(northId, (data) => {
      if (data.north) setNorth(data.north);
      if (data.signal) updateSignal(data.signal);
    });

    return unsubscribe;
  }, [northId]);

  return state;
}
```

---

## Testing Plan

### Unit Tests
```typescript
// Test signal calculation
describe('calculateSignal', () => {
  it('calculates strength correctly', () => {
    const signal = calculateSignal({
      kineticComplete: 5,
      kineticTotal: 10,
      avgAlignment: 80,
      daysElapsed: 2,
    });
    
    expect(signal.strength).toBe(40); // 50% * 80%
    expect(signal.drift).toBe(20);
    expect(signal.velocity).toBe(2.5);
  });
});
```

### Integration Tests
```bash
# Start dev server
npm run dev

# Send messages to create North
# Check graph store updates
# Verify signal calculation
```

---

## Success Criteria

- ✅ Graph store created and working
- ✅ API route returns graph data
- ✅ Signal calculation accurate
- ✅ Drift detection working
- ✅ Real-time updates functional
- ✅ No UI changes
- ✅ Tests passing

---

## Timeline

- **Day 1-2:** Graph store + types
- **Day 3:** API routes
- **Day 4:** Signal calculator
- **Day 5:** Integration + testing

**Total:** 5 days

---

## Next: Week 4

Once Week 3 is complete:
1. Analyze extraction patterns
2. Refine prompts
3. Optimize accuracy
4. Document learnings
5. Prepare for Week 5 UI

---

**Ready to start Week 3!**
