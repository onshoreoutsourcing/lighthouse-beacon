# ADR-015: React Flow for Visual Workflow Canvas

**Status**: Accepted
**Date**: 2026-01-21
**Deciders**: Lighthouse Development Team
**Related**: Epic 9 (Workflow Generator), ADR-002 (React/TypeScript), ADR-003 (Zustand)

---

## Context

Epic 9 introduces visual workflow generation to Lighthouse Chat IDE, requiring a node-based visual editor where users can:
- Drag and drop workflow nodes (Python scripts, Claude AI, conditionals, loops)
- Connect nodes with edges to define execution order
- Visualize workflow execution in real-time
- Handle complex workflows with 100+ nodes efficiently
- Maintain visual layout (node positions, zoom level) in YAML format

**Requirements:**
- Visual node-based canvas with drag-and-drop
- Custom node types (Python, Claude AI, conditional, loop, file operations)
- Edge connections with validation
- Minimap for navigation
- Zoom/pan controls
- Virtualized rendering for large workflows (1000+ nodes)
- Real-time status indicators during execution
- TypeScript-first with excellent type safety
- React integration (existing Lighthouse stack)
- Active maintenance and community support

**Constraints:**
- Must integrate with existing Electron architecture
- Must work with Zustand state management (ADR-003)
- Must support Monaco editor integration for YAML editing
- Bundle size should be reasonable for desktop application
- Cannot introduce conflicting dependencies

**Research Validation:**
- **n8n** ($2.5B valuation workflow automation): Uses visual editor extensively, proven pattern
- **Langflow/Flowise** (AI workflow builders): Demonstrates node-based UI for AI workflows
- **Industry standard**: Node-based editors common in automation tools, data pipelines, CI/CD

---

## Considered Options

- **Option 1: React Flow (@xyflow/react)** - Industry standard node-based UI library
- **Option 2: Custom Canvas Implementation** - Build from scratch with HTML5 Canvas
- **Option 3: Mermaid.js** - Markdown-based diagram library
- **Option 4: D3.js** - Data visualization library with graph capabilities
- **Option 5: Cytoscape.js** - Graph theory library for network visualization
- **Option 6: Do Nothing** - Text-only workflow definition (YAML editing only)

---

## Decision

**We have decided to use React Flow (@xyflow/react) as the foundation for Lighthouse's visual workflow canvas.**

### Why This Choice

React Flow provides the best balance of functionality, performance, maintainability, and ecosystem fit for Lighthouse's workflow requirements.

**Key factors:**

1. **Industry Standard**: React Flow is the de facto standard for node-based UIs in React applications
   - 10,000+ GitHub stars
   - Used by major companies (Stripe, Typeform, Retool)
   - Proven at scale in production workflows
   - n8n validation: Visual workflow editors drive user engagement

2. **Built-in Virtualization**: Handles 1000+ nodes efficiently
   - Renders only visible nodes (viewport culling)
   - Smooth performance even with complex workflows
   - No manual optimization needed
   - Critical for scaling beyond MVP

3. **TypeScript-First Design**: Excellent type safety (matches Lighthouse standards)
   - Full TypeScript definitions included
   - Type inference for custom nodes
   - Compile-time error checking
   - Aligns with ADR-002 (React/TypeScript)

4. **React Integration**: Natural fit with Lighthouse architecture
   - React components for custom nodes
   - Hooks API for state management
   - Zustand integration straightforward (ADR-003)
   - No architectural changes needed

5. **Comprehensive Features**: Everything needed out-of-box
   - Drag-and-drop API
   - Edge validation and routing
   - Minimap, controls, background
   - Node selection, multi-select
   - Zoom/pan with smooth animations
   - Custom node/edge components

6. **Active Maintenance**: Healthy ecosystem
   - Regular updates (v11+ actively developed)
   - Responsive maintainers
   - Large community (Discord, GitHub discussions)
   - Extensive documentation
   - Battle-tested in production

**Trade-offs we accept:**

| Aspect | Trade-off | Justification |
|--------|-----------|---------------|
| Bundle size | +300KB (minified) | Acceptable for desktop Electron app |
| Learning curve | Team needs to learn React Flow API | Well-documented, ~1 week to proficiency |
| Dependency | External library dependency | Mature, stable, actively maintained |
| Customization | Some UI patterns constrained by library | Default patterns align with requirements |

**Why we rejected alternatives:**

- **Custom Canvas**: 6-8 weeks development time for basic features, ongoing maintenance burden, no virtualization out-of-box
- **Mermaid.js**: Diagram visualization only, not interactive editor, no drag-and-drop
- **D3.js**: Low-level library requiring significant custom code, steep learning curve, not React-focused
- **Cytoscape.js**: Graph theory focus (not workflow UI), complex API, limited React integration
- **Do Nothing**: Text-only YAML editing doesn't match "Visual First" product vision, limits user adoption

**Implementation approach:**

```typescript
// src/renderer/components/workflow/WorkflowCanvas.tsx
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom node types
import { PythonScriptNode } from './nodes/PythonScriptNode';
import { ClaudeAPINode } from './nodes/ClaudeAPINode';
import { ConditionalNode } from './nodes/ConditionalNode';

const nodeTypes = {
  python: PythonScriptNode,
  claude: ClaudeAPINode,
  conditional: ConditionalNode,
  // ... more node types
};

export const WorkflowCanvas: React.FC = () => {
  const { nodes, edges } = useWorkflowStore();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background color="#aaa" gap={16} />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};
```

**Custom node example:**

```typescript
// src/renderer/components/workflow/nodes/PythonScriptNode.tsx
import { Handle, Position } from '@xyflow/react';

interface PythonNodeData {
  label: string;
  scriptPath: string;
  status: 'pending' | 'running' | 'success' | 'error';
}

export const PythonScriptNode: React.FC<NodeProps<PythonNodeData>> = ({ data }) => {
  return (
    <div className={`python-node status-${data.status}`}>
      <Handle type="target" position={Position.Top} />

      <div className="node-header">
        <PythonIcon />
        <span>{data.label}</span>
      </div>

      <div className="node-body">
        <code>{data.scriptPath}</code>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

**Zustand integration:**

```typescript
// src/renderer/stores/workflow.store.ts
import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node['data']>) => void;
  removeNode: (id: string) => void;
  connectNodes: (connection: Connection) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  edges: [],

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),

  // ... more actions
}));
```

---

## Consequences

### Positive

- **Rapid Development**: React Flow provides 80% of required functionality out-of-box, reducing development time from 6-8 weeks (custom) to 3-4 weeks
- **Performance**: Built-in virtualization handles 1000+ nodes smoothly (tested in React Flow examples)
- **Type Safety**: TypeScript definitions catch edge cases at compile time, reducing runtime errors
- **Maintainability**: Well-documented library means team can reference official docs, not maintain custom canvas code
- **Ecosystem**: Large community provides examples, plugins, and troubleshooting support
- **Future Features**: React Flow roadmap includes features we'll need (collaborative editing, undo/redo, etc.)

### Negative

- **Bundle Size**: +300KB to application bundle (React Flow + dependencies)
  - Acceptable for desktop Electron app (not bandwidth-constrained)
  - Lazy loading not needed (workflows always loaded)

- **External Dependency**: Reliance on third-party library
  - Risk: Library abandonment or breaking changes
  - Mitigation: React Flow is actively maintained, large user base, stable API since v10

- **Learning Curve**: Team needs to learn React Flow patterns
  - ~1 week for proficiency with basic features
  - ~2-3 weeks for advanced patterns (custom edges, complex layouts)
  - Mitigation: Excellent documentation, active Discord community

- **Customization Limits**: Some UI patterns constrained by library design
  - Example: Edge routing algorithm is fixed (orthogonal or bezier)
  - Mitigation: Default patterns align with requirements, customization possible via plugins

- **React-Only**: Tightly coupled to React (not framework-agnostic)
  - Not an issue: Lighthouse uses React (ADR-002)
  - Future web version will also use React

### Mitigation Strategies

**For bundle size:**
- Monitor bundle size in CI/CD (warn if exceeds 5MB total)
- Use tree-shaking to eliminate unused React Flow features
- Desktop Electron app has no bandwidth constraints (acceptable trade-off)

**For external dependency:**
- Pin React Flow version in package.json
- Monitor React Flow releases for breaking changes
- Contribute bug fixes/features back to React Flow (good OSS citizenship)
- If library abandoned, fork is viable (MIT license, active community would maintain)

**For learning curve:**
- Create internal examples repository
- Document common patterns in Lighthouse codebase
- Pair programming for first 2 weeks (experienced dev with learner)
- Reference official React Flow docs and examples

**For customization limits:**
- Evaluate requirements against React Flow capabilities before implementation
- Use React Flow plugins for advanced features
- Build custom plugins if needed (React Flow supports plugin API)
- Fallback: Fork library only if absolutely necessary (unlikely given feature completeness)

---

## References

- [React Flow Documentation](https://reactflow.dev/)
- [React Flow GitHub](https://github.com/xyflow/xyflow) (10K+ stars)
- [React Flow Examples](https://reactflow.dev/examples)
- Epic 9: [Workflow Generator Implementation Plan](../../planning/epic-9-workflow-generator-implementation.md)
- Industry Research:
  - [n8n Workflow Automation](https://hatchworks.com/blog/ai-agents/n8n-guide/) (validates visual editor pattern)
  - [Langflow/Flowise](https://github.com/langflow-ai/langflow) (AI workflow builders using node-based UI)
- Related ADRs:
  - [ADR-002: React/TypeScript for UI](./ADR-002-react-typescript-for-ui.md)
  - [ADR-003: Zustand for State Management](./ADR-003-zustand-for-state-management.md)
- Implementation:
  - `src/renderer/components/workflow/WorkflowCanvas.tsx` (React Flow integration)
  - `src/renderer/stores/workflow.store.ts` (Zustand store)
  - `src/renderer/components/workflow/nodes/` (Custom node components)
- License: MIT (compatible with Lighthouse)

---

**Last Updated**: 2026-01-21
