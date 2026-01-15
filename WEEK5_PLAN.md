# Week 5 Implementation Plan
## First UI Feature - Understanding Card

## Overview

Week 5 introduces the first user-visible intelligence feature: an Understanding Card that shows extracted intent and constraints.

---

## Goals

1. ✅ Create Understanding Card component
2. ✅ Show after 3-4 messages
3. ✅ Display North + Bounds
4. ✅ Add confidence indicator
5. ✅ Make dismissable
6. ✅ Add smooth animations

---

## Design Principles

### Subtle & Non-Intrusive
- Appears naturally in conversation
- Doesn't block chat flow
- Easy to dismiss
- Minimal visual weight

### Informative
- Shows what AI understood
- Displays confidence level
- Clear, concise language
- Actionable information

### Delightful
- Smooth animations
- Polished design
- Micro-interactions
- Premium feel

---

## Component Design

### Visual Structure
```
┌─────────────────────────────────────────┐
│ 🎯 I understand you want to:            │
│                                         │
│ Build a mobile workout tracking app     │
│ Confidence: 85%                         │
│                                         │
│ Constraints:                            │
│ ⏰ Time: 3 months                       │
│ 💰 Budget: $5,000                       │
│                                         │
│ [Looks good ✓] [Not quite ✗]           │
└─────────────────────────────────────────┘
```

### States
1. **Hidden** - Not shown yet
2. **Appearing** - Fade in animation
3. **Visible** - Fully displayed
4. **Dismissed** - Fade out animation
5. **Confirmed** - User confirmed understanding

---

## Implementation Steps

### Day 1: Component Structure

**File: `app/components/intelligence/Understanding.tsx`**

```tsx
interface UnderstandingProps {
  north: {
    statement: string;
    confidence: number;
  };
  bounds: Array<{
    metric: string;
    value: string;
    confidence: number;
  }>;
  onConfirm?: () => void;
  onDismiss?: () => void;
}

export function Understanding({
  north,
  bounds,
  onConfirm,
  onDismiss,
}: UnderstandingProps) {
  // Component implementation
}
```

### Day 2: Styling & Animation

**Features:**
- Glassmorphism effect
- Smooth fade-in animation
- Hover states
- Responsive design

**CSS:**
```css
.understanding-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}
```

### Day 3: Integration

**File: `app/components/chat/Chat.client.tsx`**

```tsx
// Show Understanding Card when:
// 1. North is identified (confidence > 70)
// 2. Message count >= 3
// 3. User hasn't dismissed it
// 4. Not already confirmed

const shouldShowUnderstanding = 
  graph.north &&
  messages.length >= 3 &&
  !dismissed &&
  !confirmed;
```

### Day 4: User Interactions

**Actions:**
1. **Confirm** - User agrees with understanding
   - Lock North in database
   - Hide card
   - Log confirmation

2. **Dismiss** - User disagrees
   - Hide card
   - Don't lock North
   - Log dismissal for analysis

3. **Auto-dismiss** - After 30 seconds
   - Fade out automatically
   - Log timeout

### Day 5: Testing & Polish

**Tests:**
- Component renders correctly
- Animations work smoothly
- User interactions tracked
- Responsive on all sizes

---

## Technical Specifications

### Trigger Conditions
```typescript
interface TriggerConditions {
  minMessages: 3;
  minConfidence: 70;
  maxShownPerSession: 1;
  autoDismissSeconds: 30;
}
```

### Analytics Events
```typescript
// Track user interactions
trackEvent('understanding_shown', {
  northId,
  confidence,
  messageCount,
});

trackEvent('understanding_confirmed', {
  northId,
  timeToConfirm,
});

trackEvent('understanding_dismissed', {
  northId,
  reason: 'user_action' | 'timeout',
});
```

---

## Success Criteria

- ✅ Card appears after 3-4 messages
- ✅ Shows North + Bounds clearly
- ✅ Confidence indicator visible
- ✅ Smooth animations
- ✅ User can confirm/dismiss
- ✅ Analytics tracking works
- ✅ No performance impact

---

## Deliverables

1. Understanding.tsx component
2. Integration in Chat.client.tsx
3. Styling with animations
4. Analytics tracking
5. User testing feedback

---

## Next: Week 6

A/B Testing:
1. Deploy to 50% users
2. Track engagement metrics
3. Gather feedback
4. Refine based on data

---

**Timeline:** 5 days  
**Status:** Ready to start Week 5!
