# Weeks 9-10 Implementation Plan
## Graph Visualization

## Overview

Weeks 9-10 add an optional interactive graph visualization for power users who want to see their decision map.

---

## Goal

Create an interactive graph canvas showing North, Vectors, Pivots, and Kinetics.

---

## Implementation

### Week 9: Graph Canvas

**1. Graph Visualization Library**
```typescript
// Use React Flow or D3.js
import ReactFlow, { Node, Edge } from 'reactflow';

export function DecisionGraph({ northId }) {
  const { nodes, edges } = useGraphData(northId);
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={handleNodeClick}
      fitView
    />
  );
}
```

**2. Node Types**
- North (goal) - Large, central node
- Bounds (constraints) - Connected to North
- Vectors (paths) - Branching from North
- Pivots (decisions) - On selected Vector
- Kinetics (actions) - Connected to Pivots

**3. Styling**
- Color-coded by type
- Size based on importance
- Animated connections
- Hover for details

### Week 10: Interactivity

**1. Node Details**
```typescript
export function NodeDetails({ node }) {
  return (
    <Popover>
      <h3>{node.label}</h3>
      <p>{node.description}</p>
      <Metadata>
        <Item>Created: {node.createdAt}</Item>
        <Item>Confidence: {node.confidence}%</Item>
        <Item>Status: {node.status}</Item>
      </Metadata>
    </Popover>
  );
}
```

**2. Features**
- Click node to see details
- Zoom and pan
- Filter by type
- Export as image
- Share link

**3. Access**
- "View Decision Map" button in chat
- Optional power feature
- Not shown by default
- Requires North to exist

---

## Deliverables

**Week 9:**
- Graph canvas component
- Node rendering
- Edge connections
- Basic styling

**Week 10:**
- Interactive features
- Node details
- Export functionality
- Polish and animations

---

## Success Criteria

- Graph renders correctly
- Performance: <100ms render
- Intuitive navigation
- Positive power user feedback

---

**Timeline:** 10 days total
