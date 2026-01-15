# Week 3 - Background Tracking

## Overview

Week 3 adds frontend intelligence tracking without any UI changes. The system now tracks user progress, calculates signals, and detects drift in the background.

---

## What Was Added

### 1. Graph Store (`app/lib/stores/graph.ts`)
Frontend state management for:
- North (user's intent)
- Bounds (constraints)
- Signal (progress metrics)

### 2. Signal Calculator (`app/lib/intelligence/signals.ts`)
Calculates:
- **Strength:** Progress weighted by alignment (0-100)
- **Drift:** Misalignment from goal (0-100)
- **Velocity:** Actions per day
- **Health:** Overall status (excellent/good/warning/critical)

### 3. API Client (`app/lib/api/graph.client.ts`)
Handles:
- Fetching graph state
- Subscribing to updates (polling)
- Triggering recalculation

### 4. API Routes
- `api.graph.$northId.ts` - Get graph state
- `api.graph.active.ts` - Get active North
- `api.graph.$northId.signal.ts` - Recalculate signal

### 5. React Hook (`app/lib/hooks/useGraph.ts`)
Easy integration:
```typescript
const graph = useGraph(northId);
// graph.north, graph.signal, graph.loading
```

---

## How It Works

### Background Process
```
1. User sends messages
2. Backend extracts intent
3. Stores in graph database
4. Frontend polls for updates
5. Calculates signals
6. Detects drift
```

### Signal Calculation
```typescript
// Example
const signal = calculateSignal({
  kineticComplete: 5,
  kineticTotal: 10,
  avgAlignment: 80,
  daysElapsed: 2,
});

// Returns:
{
  strength: 40,  // 50% progress * 80% alignment
  drift: 20,     // 100 - 80
  velocity: 2.5, // 5 actions / 2 days
  alignment: 80
}
```

### Drift Detection
- **Low (<20%):** On track
- **Medium (20-40%):** Minor drift
- **High (>40%):** Course correction needed

---

## Usage Example

```typescript
import { useGraph } from '~/lib/hooks/useGraph';

function MyComponent() {
  const { north, signal, loading } = useGraph(northId);

  if (loading) return <div>Loading...</div>;
  if (!north) return <div>No active goal</div>;

  return (
    <div>
      <h2>{north.statement}</h2>
      <p>Progress: {signal?.strength}%</p>
      <p>Drift: {signal?.drift}%</p>
    </div>
  );
}
```

---

## Testing

### Manual Test
```bash
# 1. Start dev server
npm run dev

# 2. Send messages to create North
# 3. Check graph store in React DevTools
# 4. Verify signal updates
```

### Unit Tests (Future)
```typescript
describe('calculateSignal', () => {
  it('calculates strength correctly', () => {
    const signal = calculateSignal({
      kineticComplete: 5,
      kineticTotal: 10,
      avgAlignment: 80,
      daysElapsed: 2,
    });
    
    expect(signal.strength).toBe(40);
  });
});
```

---

## Files Created (7)

1. `app/lib/stores/graph.ts` - Graph store
2. `app/lib/intelligence/signals.ts` - Signal calculator
3. `app/lib/api/graph.client.ts` - API client
4. `app/routes/api.graph.$northId.ts` - Graph API
5. `app/routes/api.graph.active.ts` - Active North API
6. `app/routes/api.graph.$northId.signal.ts` - Signal recalc
7. `app/lib/hooks/useGraph.ts` - React hook

---

## Next: Week 4

Refine and optimize:
1. Analyze extraction patterns
2. Improve accuracy
3. Optimize performance
4. Document learnings

Then Week 5: First UI features!

---

**Status:** Week 3 complete! Background tracking ready.
