# Week 6 Implementation Plan
## A/B Testing & Analytics

## Overview

Week 6 focuses on deploying the Understanding Card to 50% of users and gathering data to validate its value.

---

## Goals

1. ✅ Implement A/B testing framework
2. ✅ Deploy Understanding Card to 50% users
3. ✅ Track engagement metrics
4. ✅ Gather user feedback
5. ✅ Analyze results
6. ✅ Make data-driven decisions

---

## A/B Testing Strategy

### Test Groups
- **Group A (50%):** See Understanding Card
- **Group B (50%):** Control (no card)

### Assignment Logic
```typescript
// Deterministic based on user ID
const getUserGroup = (userId: string): 'A' | 'B' => {
  const hash = hashUserId(userId);
  return hash % 2 === 0 ? 'A' : 'B';
};
```

### Success Metrics
- **Primary:** Confirmation rate (% who click "Looks good")
- **Secondary:** 
  - Dismissal rate
  - Time to interaction
  - Session engagement
  - Retention impact

---

## Implementation Steps

### Day 1: A/B Testing Framework

**File: `app/lib/ab-testing/experiments.ts`**

```typescript
export interface Experiment {
  id: string;
  name: string;
  enabled: boolean;
  variants: {
    control: number; // 50
    treatment: number; // 50
  };
}

export const experiments = {
  understandingCard: {
    id: 'understanding-card-v1',
    name: 'Understanding Card Feature',
    enabled: true,
    variants: {
      control: 50,
      treatment: 50,
    },
  },
};

export function getVariant(
  experimentId: string,
  userId: string,
): 'control' | 'treatment' {
  // Deterministic assignment
  const hash = simpleHash(userId + experimentId);
  const percentage = hash % 100;
  
  const experiment = experiments[experimentId];
  if (!experiment || !experiment.enabled) {
    return 'control';
  }
  
  return percentage < experiment.variants.treatment 
    ? 'treatment' 
    : 'control';
}
```

### Day 2: Analytics Implementation

**File: `app/lib/analytics/events.ts`**

```typescript
export interface AnalyticsEvent {
  event: string;
  userId: string;
  timestamp: string;
  properties: Record<string, any>;
}

// Understanding Card Events
export const trackUnderstandingShown = (
  userId: string,
  northId: string,
  confidence: number,
  messageCount: number,
) => {
  trackEvent({
    event: 'understanding_shown',
    userId,
    timestamp: new Date().toISOString(),
    properties: {
      northId,
      confidence,
      messageCount,
      variant: getVariant('understandingCard', userId),
    },
  });
};

export const trackUnderstandingConfirmed = (
  userId: string,
  northId: string,
  timeToConfirm: number,
) => {
  trackEvent({
    event: 'understanding_confirmed',
    userId,
    timestamp: new Date().toISOString(),
    properties: {
      northId,
      timeToConfirm,
      variant: getVariant('understandingCard', userId),
    },
  });
};

export const trackUnderstandingDismissed = (
  userId: string,
  northId: string,
  reason: 'user_action' | 'timeout',
  timeShown: number,
) => {
  trackEvent({
    event: 'understanding_dismissed',
    userId,
    timestamp: new Date().toISOString(),
    properties: {
      northId,
      reason,
      timeShown,
      variant: getVariant('understandingCard', userId),
    },
  });
};
```

### Day 3: Integration

**Update `useUnderstanding.ts`:**

```typescript
import { getVariant } from '~/lib/ab-testing/experiments';
import { 
  trackUnderstandingShown,
  trackUnderstandingConfirmed,
  trackUnderstandingDismissed,
} from '~/lib/analytics/events';

export function useUnderstanding(messageCount: number, userId: string) {
  // Check A/B test variant
  const variant = getVariant('understandingCard', userId);
  const isEnabled = variant === 'treatment';
  
  // Only show if in treatment group
  if (!isEnabled) {
    return {
      shouldShow: false,
      north: null,
      bounds: [],
      onConfirm: () => {},
      onDismiss: () => {},
    };
  }
  
  // Rest of existing logic...
  // Add analytics tracking
}
```

### Day 4: Feedback Collection

**File: `app/components/intelligence/FeedbackDialog.tsx`**

```typescript
// Optional feedback dialog after dismissal
export function FeedbackDialog({ onSubmit, onSkip }) {
  return (
    <Dialog>
      <h3>Help us improve</h3>
      <p>Why wasn't this helpful?</p>
      <RadioGroup>
        <Radio value="inaccurate">The information was inaccurate</Radio>
        <Radio value="too-early">Showed too early</Radio>
        <Radio value="distracting">It was distracting</Radio>
        <Radio value="other">Other</Radio>
      </RadioGroup>
      <TextArea placeholder="Additional feedback (optional)" />
      <Button onClick={onSubmit}>Submit</Button>
      <Button onClick={onSkip}>Skip</Button>
    </Dialog>
  );
}
```

### Day 5: Analytics Dashboard

**File: `app/routes/admin.analytics.tsx`**

```typescript
// Simple analytics dashboard
export default function AnalyticsDashboard() {
  const metrics = useAnalytics('understanding-card-v1');
  
  return (
    <div>
      <h1>Understanding Card A/B Test</h1>
      
      <MetricCard
        title="Show Rate"
        value={`${metrics.showRate}%`}
        description="% of sessions where card was shown"
      />
      
      <MetricCard
        title="Confirmation Rate"
        value={`${metrics.confirmRate}%`}
        description="% of shows that were confirmed"
      />
      
      <MetricCard
        title="Dismissal Rate"
        value={`${metrics.dismissRate}%`}
        description="% of shows that were dismissed"
      />
      
      <MetricCard
        title="Avg Time to Interact"
        value={`${metrics.avgTimeToInteract}s`}
        description="Average time before user action"
      />
    </div>
  );
}
```

---

## Metrics to Track

### Primary Metrics
- **Show Rate:** % of eligible sessions where card shown
- **Confirmation Rate:** % of shows confirmed
- **Dismissal Rate:** % of shows dismissed
- **Timeout Rate:** % of shows that auto-dismissed

### Secondary Metrics
- **Time to Interaction:** How long before user acts
- **Session Engagement:** Messages after card shown
- **Retention:** Do users return?
- **Extraction Accuracy:** Correlation with confidence

### Qualitative Feedback
- Why dismissed?
- What was inaccurate?
- Suggestions for improvement

---

## Success Criteria

### Minimum Viable Success
- Show rate > 30% (card appears frequently enough)
- Confirmation rate > 40% (users find it accurate)
- Dismissal rate < 40% (not too annoying)
- Positive qualitative feedback

### Ideal Success
- Show rate > 50%
- Confirmation rate > 60%
- Dismissal rate < 20%
- Strong positive feedback

---

## Decision Framework

### If Successful (meets minimum criteria)
- ✅ Roll out to 100% users
- ✅ Iterate on design based on feedback
- ✅ Proceed to Week 7

### If Mixed Results
- 🔄 Refine based on feedback
- 🔄 Run another A/B test
- 🔄 Adjust trigger conditions

### If Unsuccessful (below minimum)
- ❌ Analyze why (timing, accuracy, UX)
- ❌ Major redesign needed
- ❌ Consider alternative approaches

---

## Timeline

- **Day 1:** A/B testing framework
- **Day 2:** Analytics implementation
- **Day 3:** Integration & deployment
- **Day 4:** Feedback collection
- **Day 5:** Analysis & decisions

**Total:** 5 days

---

## Deliverables

1. A/B testing framework
2. Analytics tracking
3. Feedback collection
4. Analytics dashboard
5. Results analysis
6. Go/no-go decision

---

## Next: Week 7

If successful:
- Guided suggestions (Vectors)
- Course correction nudges
- Drift alerts

---

**Status:** Ready to start Week 6!
