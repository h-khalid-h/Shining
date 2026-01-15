# Weeks 7-8 Implementation Plan
## Guided Suggestions & Course Correction

## Overview

Weeks 7-8 focus on proactive intelligence: generating strategic paths (Vectors) and providing helpful nudges when users drift from their goals.

---

## Week 7: Vector Generation

### Goal
Generate and present strategic path options naturally in conversation.

### Implementation

**1. Vector Generation Service**
```typescript
// app/lib/intelligence/vector-generator.ts
export interface Vector {
  id: string;
  northId: string;
  description: string;
  approach: string;
  tradeoffs: {
    speed: number;    // 1-10
    cost: number;     // 1-10
    quality: number;  // 1-10
  };
  confidence: number;
}

export async function generateVectors(
  north: North,
  bounds: Bound[],
): Promise<Vector[]> {
  // Use AI to generate 2-3 strategic paths
  // Consider bounds and constraints
  // Return ranked options
}
```

**2. Vector Presentation Component**
```typescript
// app/components/intelligence/VectorOptions.tsx
export function VectorOptions({ vectors, onSelect }) {
  return (
    <div className="vector-options">
      <h3>I see a few ways to approach this:</h3>
      {vectors.map(vector => (
        <VectorCard
          key={vector.id}
          vector={vector}
          onSelect={() => onSelect(vector)}
        />
      ))}
    </div>
  );
}
```

**3. Integration**
- Show after North is confirmed
- Present 2-3 strategic paths
- Track user selection
- Store as Pivot in graph

---

## Week 8: Course Correction

### Goal
Detect drift and provide helpful nudges to get back on track.

### Implementation

**1. Drift Detection**
```typescript
// app/lib/intelligence/drift-detector.ts
export interface DriftAlert {
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
  driftPercentage: number;
}

export function detectDrift(signal: SignalState): DriftAlert | null {
  if (signal.drift < 20) return null;
  
  if (signal.drift < 40) {
    return {
      severity: 'medium',
      message: 'I notice we\'re drifting slightly from your goal',
      recommendation: 'Review recent decisions to ensure alignment',
      driftPercentage: signal.drift,
    };
  }
  
  return {
    severity: 'high',
    message: 'We\'ve drifted significantly from your original goal',
    recommendation: 'Consider revisiting your approach or adjusting your goal',
    driftPercentage: signal.drift,
  };
}
```

**2. Nudge Component**
```typescript
// app/components/intelligence/DriftNudge.tsx
export function DriftNudge({ alert, onAcknowledge, onAdjustGoal }) {
  return (
    <Alert severity={alert.severity}>
      <AlertIcon />
      <AlertTitle>{alert.message}</AlertTitle>
      <AlertDescription>{alert.recommendation}</AlertDescription>
      <AlertActions>
        <Button onClick={onAcknowledge}>Got it</Button>
        <Button onClick={onAdjustGoal}>Adjust goal</Button>
      </AlertActions>
    </Alert>
  );
}
```

**3. Timing**
- Check drift after every 5 Kinetics
- Show nudge if drift > 30%
- Don't show more than once per session
- Track acknowledgment

---

## Deliverables

**Week 7:**
- Vector generation service
- Vector presentation component
- Selection tracking
- Graph integration

**Week 8:**
- Drift detection logic
- Nudge component
- Timing optimization
- Analytics tracking

---

## Success Criteria

- Vectors generated with >70% relevance
- User selects a vector >50% of the time
- Drift nudges reduce drift by >20%
- Positive user feedback on helpfulness

---

**Timeline:** 10 days total
