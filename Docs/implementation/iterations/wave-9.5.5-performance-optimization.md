# Wave 9.5.5: Performance Optimization

## Wave Overview
- **Wave ID:** Wave-9.5.5
- **Feature:** Feature 9.5 - UX Polish & Templates
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Not Started
- **Scope:** Optimize workflow canvas performance for 1000+ node workflows
- **Wave Goal:** Achieve <100ms render time for large workflows using virtualization and lazy loading
- **Estimated Hours:** 24 hours

## Wave Goals

1. Implement React Flow virtualization (render only visible nodes)
2. Add lazy loading for node components
3. Optimize YAML parsing (streaming parser for large files)
4. Reduce memory footprint for large workflows
5. Create performance benchmarks and validate improvements

## User Stories

### User Story 1: React Flow Virtualization

**As a** workflow user
**I want** large workflows (1000+ nodes) to render smoothly
**So that** I can work with complex workflows without performance degradation

**Acceptance Criteria:**
- [ ] React Flow virtualization enabled (render only visible nodes)
- [ ] Viewport-based culling (nodes outside viewport not rendered)
- [ ] Smooth panning and zooming for 1000+ node workflows
- [ ] Canvas render time <100ms for 1000-node workflows
- [ ] Memory usage <500MB for 1000-node workflows
- [ ] Unit test coverage ≥90%
- [ ] Performance benchmarks validate improvements

**Priority:** High

**Estimated Hours:** 12 hours

**Objective UCP:** 15 UUCW (Average complexity: 6 transactions - virtualization implementation, viewport culling, render optimization, memory profiling, benchmarking, testing)

---

### User Story 2: Lazy Component Loading

**As a** workflow engine
**I want** to load node components only when needed
**So that** initial load time is fast and memory usage is minimal

**Acceptance Criteria:**
- [ ] Node components lazy loaded (React.lazy + Suspense)
- [ ] Code splitting for node types (Python, Claude, FileOperation, etc.)
- [ ] Loading indicators for lazy-loaded components
- [ ] Preload visible nodes, defer hidden nodes
- [ ] Initial load time <2s for 100-node workflows
- [ ] Memory reduction: 30-50% compared to eager loading
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 10 hours

**Objective UCP:** 15 UUCW (Average complexity: 6 transactions - lazy loading setup, code splitting, preloading strategy, loading indicators, performance measurement, testing)

---

### User Story 3: YAML Parsing Optimization

**As a** workflow user
**I want** large workflow files to load quickly
**So that** I can open workflows without waiting

**Acceptance Criteria:**
- [ ] Streaming YAML parser for large files (>1MB)
- [ ] Incremental parsing (show partial results while parsing)
- [ ] YAML parse time <500ms for 1000-node workflows
- [ ] Error recovery (continue parsing after errors)
- [ ] Performance comparison: streaming vs. non-streaming
- [ ] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - streaming parser, incremental display, performance benchmarking)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] Performance benchmarks meet NFR targets
- [ ] No TypeScript/linter errors
- [ ] Canvas handles 1000+ nodes smoothly (<100ms render)
- [ ] Memory usage <500MB for large workflows
- [ ] Code reviewed and approved
- [ ] Documentation updated (performance optimization guide)
- [ ] Benchmark report: `Docs/reports/workflow-performance-benchmarks.md`
- [ ] Demo: Load 1000-node workflow, pan/zoom smoothly

## Notes

**Architecture References:**
- React Flow virtualization documentation
- React.lazy and code splitting patterns
- YAML streaming parsers (js-yaml alternatives)

**Performance Targets:**

| Metric | Baseline (Before) | Target (After) | Actual |
|--------|-------------------|----------------|--------|
| Canvas render time (100 nodes) | 300ms | <50ms | _TBD_ |
| Canvas render time (1000 nodes) | 3000ms | <100ms | _TBD_ |
| Initial load time (100 nodes) | 5s | <2s | _TBD_ |
| Memory usage (1000 nodes) | 800MB | <500MB | _TBD_ |
| YAML parse time (1MB file) | 2s | <500ms | _TBD_ |

**React Flow Virtualization:**

```typescript
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';

// Enable virtualization
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  // Enable virtualization (React Flow v12+)
  viewport={{ x: 0, y: 0, zoom: 1 }}
  nodesDraggable={true}
  nodesConnectable={true}
  // Performance settings
  panOnScroll={true}
  zoomOnScroll={true}
  minZoom={0.1}
  maxZoom={4}
  // Virtualization config
  nodeExtent={[
    [0, 0],
    [10000, 10000]
  ]}
  // Only render nodes in viewport + buffer
  fitView={false}
/>
```

**Viewport Culling:**

```typescript
// Calculate visible nodes based on viewport
function getVisibleNodes(
  nodes: Node[],
  viewport: { x: number; y: number; zoom: number },
  canvasSize: { width: number; height: number }
): Node[] {
  const visibleBounds = {
    minX: -viewport.x / viewport.zoom,
    maxX: (-viewport.x + canvasSize.width) / viewport.zoom,
    minY: -viewport.y / viewport.zoom,
    maxY: (-viewport.y + canvasSize.height) / viewport.zoom
  };

  // Add buffer (render nodes slightly outside viewport)
  const buffer = 200;

  return nodes.filter(node => {
    const nodeX = node.position.x;
    const nodeY = node.position.y;
    const nodeWidth = node.width || 200;
    const nodeHeight = node.height || 100;

    return (
      nodeX + nodeWidth >= visibleBounds.minX - buffer &&
      nodeX <= visibleBounds.maxX + buffer &&
      nodeY + nodeHeight >= visibleBounds.minY - buffer &&
      nodeY <= visibleBounds.maxY + buffer
    );
  });
}
```

**Lazy Component Loading:**

```typescript
// Lazy load node components
const PythonNode = React.lazy(() => import('./nodes/PythonNode'));
const ClaudeNode = React.lazy(() => import('./nodes/ClaudeNode'));
const FileOperationNode = React.lazy(() => import('./nodes/FileOperationNode'));
const ConditionalNode = React.lazy(() => import('./nodes/ConditionalNode'));
const LoopNode = React.lazy(() => import('./nodes/LoopNode'));

// Node type mapping with lazy loading
const nodeTypes = {
  python: (props) => (
    <Suspense fallback={<NodeSkeleton />}>
      <PythonNode {...props} />
    </Suspense>
  ),
  claude: (props) => (
    <Suspense fallback={<NodeSkeleton />}>
      <ClaudeNode {...props} />
    </Suspense>
  ),
  // ... other node types
};

// Skeleton component (loading state)
function NodeSkeleton() {
  return (
    <div className="node-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-body" />
    </div>
  );
}
```

**Streaming YAML Parser:**

```typescript
import * as yaml from 'js-yaml';
import { createReadStream } from 'fs';

// Non-streaming (baseline)
async function loadWorkflowBaseline(filePath: string): Promise<Workflow> {
  const content = await fs.readFile(filePath, 'utf-8');
  const workflow = yaml.load(content);
  return workflow;
}

// Streaming (optimized)
async function loadWorkflowStreaming(filePath: string): Promise<Workflow> {
  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  let buffer = '';
  const chunks: string[] = [];

  for await (const chunk of stream) {
    buffer += chunk;

    // Try to parse incrementally
    try {
      const partial = yaml.load(buffer);
      // Emit partial results to UI
      onPartialLoad(partial);
    } catch (error) {
      // Continue buffering until valid YAML
    }
  }

  // Final parse
  const workflow = yaml.load(buffer);
  return workflow;
}
```

**Memory Optimization:**

**Before (Eager Loading):**
```typescript
// All nodes loaded into memory
const nodes = workflow.steps.map(step => ({
  id: step.id,
  type: step.type,
  data: {
    ...step,
    component: loadNodeComponent(step.type) // All components loaded
  },
  position: step.ui_metadata?.position || { x: 0, y: 0 }
}));
```

**After (Lazy Loading + Virtualization):**
```typescript
// Only visible nodes loaded
const visibleNodes = getVisibleNodes(nodes, viewport, canvasSize);

const renderedNodes = visibleNodes.map(node => ({
  id: node.id,
  type: node.type,
  data: {
    ...node.data,
    component: React.lazy(() => import(`./nodes/${node.type}Node`))
  },
  position: node.position
}));
```

**Performance Benchmarking:**

```typescript
// Benchmark suite
const benchmarks = [
  {
    name: 'Canvas Render (100 nodes)',
    test: () => measureRenderTime(100)
  },
  {
    name: 'Canvas Render (1000 nodes)',
    test: () => measureRenderTime(1000)
  },
  {
    name: 'YAML Parse (100KB)',
    test: () => measureParseTime('100kb.yaml')
  },
  {
    name: 'YAML Parse (1MB)',
    test: () => measureParseTime('1mb.yaml')
  },
  {
    name: 'Memory Usage (1000 nodes)',
    test: () => measureMemoryUsage(1000)
  }
];

// Run benchmarks
const results = await runBenchmarks(benchmarks);

// Generate report
await generateBenchmarkReport(results, 'Docs/reports/workflow-performance-benchmarks.md');
```

**Benchmark Report Format:**

```markdown
# Workflow Performance Benchmarks

**Date:** 2026-01-21
**Environment:** MacBook Pro M2, 16GB RAM, macOS 14.2

## Results

| Benchmark | Baseline | Optimized | Improvement |
|-----------|----------|-----------|-------------|
| Canvas Render (100 nodes) | 300ms | 45ms | **85% faster** |
| Canvas Render (1000 nodes) | 3000ms | 98ms | **97% faster** |
| YAML Parse (100KB) | 150ms | 120ms | **20% faster** |
| YAML Parse (1MB) | 2000ms | 480ms | **76% faster** |
| Memory Usage (1000 nodes) | 800MB | 420MB | **48% reduction** |

## Analysis

**Virtualization Impact:**
- Rendering only visible nodes (viewport culling) reduced render time by 97% for large workflows
- Memory usage reduced by 48% by not instantiating off-screen components

**Lazy Loading Impact:**
- Initial load time reduced by 60% (5s → 2s)
- Code splitting reduced bundle size by 40%

**YAML Parsing Impact:**
- Streaming parser improved large file parsing by 76%
- Incremental display improved perceived performance

## Recommendations

1. Continue monitoring performance with larger workflows (5000+ nodes)
2. Consider GPU acceleration for very large graphs
3. Implement node caching for frequently accessed workflows
```

---

**Total Stories:** 3
**Total Hours:** 24 hours
**Total Objective UCP:** 35 UUCW
**Wave Status:** Planning
