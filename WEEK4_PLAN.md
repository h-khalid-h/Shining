# Week 4 Implementation Plan
## Refinement & Optimization

## Overview

Week 4 focuses on analyzing real data, refining extraction accuracy, and optimizing performance before adding UI features in Week 5.

---

## Goals

1. ✅ Analyze extraction patterns from real usage
2. ✅ Refine AI prompts for better accuracy
3. ✅ Optimize performance and reduce latency
4. ✅ Document learnings and patterns
5. ✅ Prepare for Week 5 UI features

---

## Day 1-2: Data Analysis

### Collect Extraction Data
```typescript
// Add logging to track extraction quality
export async function logExtraction(
  userId: string,
  messages: Message[],
  extracted: ExtractedIntent,
) {
  const log = {
    userId,
    messageCount: messages.length,
    phase: extracted.phase,
    confidence: extracted.overallConfidence,
    northIdentified: !!extracted.north,
    boundsCount: extracted.bounds.length,
    decisionsCount: extracted.decisions.length,
    timestamp: new Date().toISOString(),
  };

  // Store in database or file for analysis
  await storeExtractionLog(log);
}
```

### Analyze Patterns
- What conversation lengths produce best results?
- Which phases are most accurate?
- Common failure patterns?
- Optimal confidence thresholds?

---

## Day 2-3: Prompt Refinement

### Current Extraction Prompt Issues
1. Sometimes misses implicit constraints
2. Confidence scores can be too conservative
3. Phase detection needs tuning

### Improved Extraction Prompt
```typescript
const enhancedPrompt = `You are analyzing a conversation to extract structured intent.

Conversation (${messages.length} messages):
${conversationText}

Extract in JSON format:

1. **north** (core goal):
   - Only if confidence > 70
   - Be specific and actionable
   - Include implicit goals

2. **bounds** (constraints):
   - Explicit: "3 months", "$5000"
   - Implicit: "quickly" = time bound, "cheap" = cost bound
   - Include soft constraints

3. **decisions** (choices made):
   - Technology choices
   - Approach decisions
   - Trade-off selections

4. **phase**:
   - "exploring": < 3 messages, vague intent
   - "clarifying": 3-5 messages, intent emerging
   - "deciding": 5-8 messages, making choices
   - "executing": 8+ messages, ready to build

5. **overallConfidence**: 0-100
   - High (80-100): Clear, specific, actionable
   - Medium (60-80): Good but needs refinement
   - Low (< 60): Too vague or conflicting

Return only valid JSON.`;
```

---

## Day 3-4: Performance Optimization

### Current Bottlenecks
1. Extraction takes 2-3 seconds
2. Graph queries can be slow
3. Frontend polling every 10 seconds

### Optimizations

**1. Batch Extraction**
```typescript
// Only extract every N messages instead of every message
const shouldExtract = (messageCount: number) => {
  return messageCount % 3 === 0 || messageCount > 8;
};
```

**2. Cache Graph Queries**
```typescript
const graphCache = new Map<string, { data: any; timestamp: number }>();

async function getCachedGraph(northId: string) {
  const cached = graphCache.get(northId);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < 30000) {
    return cached.data; // Use cache if < 30 seconds old
  }
  
  const data = await graph.getNorth(northId);
  graphCache.set(northId, { data, timestamp: now });
  return data;
}
```

**3. Optimize Polling**
```typescript
// Adaptive polling: faster when active, slower when idle
const getPollingInterval = (lastUpdate: Date) => {
  const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / 60000;
  
  if (minutesSinceUpdate < 5) return 5000;  // 5 seconds
  if (minutesSinceUpdate < 15) return 15000; // 15 seconds
  return 30000; // 30 seconds
};
```

---

## Day 4-5: Testing & Documentation

### Create Test Suite
```typescript
describe('Extraction Quality', () => {
  it('identifies clear intent', async () => {
    const messages = [
      { role: 'user', content: 'Build a todo app' },
      { role: 'assistant', content: 'Timeline?' },
      { role: 'user', content: '2 weeks' },
    ];
    
    const result = await extractIntent(messages, apiKey);
    
    expect(result.north).toBeDefined();
    expect(result.north.confidence).toBeGreaterThan(70);
    expect(result.bounds.length).toBeGreaterThan(0);
  });

  it('handles vague requests', async () => {
    const messages = [
      { role: 'user', content: 'I need help' },
    ];
    
    const result = await extractIntent(messages, apiKey);
    
    expect(result.phase).toBe('exploring');
    expect(result.overallConfidence).toBeLessThan(60);
  });
});
```

### Document Patterns
```markdown
# Extraction Patterns Learned

## High Accuracy Scenarios
- 5-8 message conversations
- Specific technical requirements
- Clear constraints mentioned
- Decision points discussed

## Low Accuracy Scenarios
- < 3 messages
- Very vague requests
- Conflicting information
- Exploratory conversations

## Recommendations
- Wait for 3+ messages before extracting
- Re-extract when confidence < 70
- Prompt user for clarification when phase = "exploring"
```

---

## Success Criteria

- ✅ Extraction accuracy improved to >85%
- ✅ Average extraction time < 1.5 seconds
- ✅ Graph query latency < 200ms
- ✅ Patterns documented
- ✅ Test suite created
- ✅ Ready for Week 5 UI

---

## Deliverables

1. Enhanced extraction prompt
2. Performance optimizations
3. Test suite
4. Pattern documentation
5. Week 5 preparation

---

## Next: Week 5

First UI features:
1. Understanding card component
2. Show North + Bounds
3. Dismissable interface
4. Confidence indicator

---

**Timeline:** 5 days  
**Status:** Ready to start Week 4!
