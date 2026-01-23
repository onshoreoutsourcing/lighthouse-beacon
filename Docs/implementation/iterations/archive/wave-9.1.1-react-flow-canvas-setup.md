# Wave 9.1.1: React Flow Canvas Setup

## Wave Overview
- **Wave ID:** Wave-9.1.1
- **Feature:** Feature 9.1 - Workflow Canvas Foundation
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Complete
- **Scope:** Establish visual workflow canvas with React Flow, custom node components, and drag-and-drop functionality
- **Wave Goal:** Deliver functional React Flow canvas with custom nodes (Python, Claude, Input, Output) and Zustand state integration
- **Estimated Hours:** 28 hours

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Integrate React Flow as the visual workflow canvas foundation
2. Implement custom node components for Python scripts and Claude AI
3. Create Zustand store for workflow state management
4. Enable drag-and-drop workflow node creation
5. Provide canvas controls (minimap, zoom, background grid)

## User Stories

### User Story 1: Visual Workflow Canvas Foundation

**As a** workflow designer
**I want** a visual canvas with drag-and-drop node placement
**So that** I can create workflows visually without writing YAML

**Acceptance Criteria:**
- [x] React Flow canvas renders in WorkflowCanvas component
- [x] Drag-and-drop adds nodes to canvas at mouse position
- [x] Node connections create edges between steps
- [x] Canvas includes minimap for navigation
- [x] Canvas includes zoom controls and background grid
- [x] Canvas state persists in Zustand store
- [x] Unit test coverage ≥90%
- [x] Performance: Canvas renders <100ms for 50 nodes
- [x] Performance: Drag-and-drop latency <50ms

**Priority:** High

**Estimated Hours:** 12 hours

**Objective UCP:** 15 UUCW (Average complexity: 4-7 transactions - canvas setup, drag handler, state sync, controls, minimap)

---

### User Story 2: Custom Workflow Node Components

**As a** workflow designer
**I want** specialized node types (Python, Claude AI, Input, Output)
**So that** I can build workflows with different operation types

**Acceptance Criteria:**
- [x] PythonScriptNode displays script path and configuration
- [x] ClaudeAPINode displays model selection and prompt preview
- [x] InputNode accepts workflow input parameters
- [x] OutputNode displays workflow results
- [x] All nodes render with consistent styling
- [x] Node handles (connection points) positioned correctly
- [x] Node state updates reflected in Zustand store
- [x] Integration tests validate node rendering
- [x] Nodes support customization (color, icon, label)

**Priority:** High

**Estimated Hours:** 10 hours

**Objective UCP:** 15 UUCW (Average complexity: 7 transactions - 4 node types, styling system, handle positioning, state binding)

---

### User Story 3: Workflow State Management Integration

**As a** workflow designer
**I want** workflow changes automatically saved to application state
**So that** I can seamlessly switch between workflows without losing work

**Acceptance Criteria:**
- [x] useWorkflowStore Zustand store manages nodes and edges
- [x] Store actions: addNode, removeNode, updateNode, addEdge, removeEdge
- [x] Store actions: loadWorkflow, saveWorkflow, clearWorkflow
- [x] Canvas automatically syncs with store state
- [x] State changes trigger React Flow re-renders
- [x] Store follows ADR-003 Zustand patterns
- [x] Unit tests for all store actions (≥90% coverage)
- [x] Integration tests validate store-canvas sync

**Priority:** High

**Estimated Hours:** 6 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - store setup, state sync, action handlers)

---

## Definition of Done

- [x] All 3 user stories completed with acceptance criteria met
- [x] Code coverage ≥90%
- [x] Integration tests validate React Flow + Zustand integration
- [x] No TypeScript/linter errors
- [x] Performance tests meet NFR targets (<100ms render, <50ms drag)
- [x] Code reviewed and approved
- [x] Documentation updated (component API, architecture diagrams)
- [x] Demo: Create workflow with 5 nodes via drag-and-drop

## Notes

**Architecture References:**
- ADR-015: React Flow for Visual Workflows
- ADR-003: Zustand for State Management
- ADR-002: React + TypeScript for UI

**Component Dependencies:**
- React Flow (@xyflow/react v12+) - ~300KB bundle
- Zustand (existing dependency from Epic 1)

**Performance Targets:**
- Canvas render: <100ms (up to 50 nodes)
- Drag-and-drop latency: <50ms
- Memory usage: <50MB for 50-node workflow

**Integration Points:**
- WorkflowCanvas component integrates into main layout (three-panel design)
- useWorkflowStore follows patterns from useEditorStore, useFileExplorerStore

---

**Total Stories:** 3
**Total Hours:** 28 hours
**Total Objective UCP:** 35 UUCW
**Wave Status:** Planning
