# Wave 9.3.1: Workflow Explorer & CRUD Operations

## Wave Overview
- **Wave ID:** Wave-9.3.1
- **Feature:** Feature 9.3 - Workflow Management
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Create workflow file browser with full CRUD operations (create, read, update, delete)
- **Wave Goal:** Enable users to manage workflows through visual file explorer interface
- **Estimated Hours:** 20 hours

## Wave Goals

1. Create WorkflowExplorer component for left panel
2. Implement workflow listing with search and filter
3. Add workflow CRUD operations
4. Build delete confirmation dialog
5. Integrate with WorkflowService

## User Stories

### User Story 1: Workflow File Browser

**As a** workflow user
**I want** to browse and search my saved workflows
**So that** I can easily find and open the workflow I need

**Acceptance Criteria:**
- [ ] WorkflowExplorer displays in left panel (replaces file explorer when in workflow mode)
- [ ] Workflows listed from `~/Documents/Lighthouse/workflows/`
- [ ] Search bar filters workflows by name in real-time
- [ ] Filter by tags (if workflow has tags in YAML)
- [ ] Workflow list shows: name, description (truncated), last modified date
- [ ] Click workflow to open in canvas
- [ ] Empty state shown when no workflows exist
- [ ] Unit test coverage ≥90%
- [ ] Performance: List loads <300ms for 100 workflows
- [ ] Performance: Search updates <200ms

**Priority:** High

**Estimated Hours:** 10 hours

**Objective UCP:** 10 UUCW (Average complexity: 5 transactions - list workflows, search filter, tag filter, open workflow, empty state)

---

### User Story 2: Workflow CRUD Operations

**As a** workflow user
**I want** to create, update, and delete workflows
**So that** I can manage my workflow library

**Acceptance Criteria:**
- [ ] "New Workflow" button creates blank workflow
- [ ] "Delete" context menu option removes workflow
- [ ] Delete shows confirmation dialog (prevents accidental deletion)
- [ ] Update operations auto-save workflow changes
- [ ] WorkflowService methods: createWorkflow, deleteWorkflow, updateWorkflow
- [ ] All operations validated before execution
- [ ] Success/error notifications shown to user
- [ ] Unit tests for all CRUD operations (≥90% coverage)
- [ ] Integration tests validate file operations

**Priority:** High

**Estimated Hours:** 8 hours

**Objective UCP:** 10 UUCW (Average complexity: 5 transactions - create, delete, update, validate, notifications)

---

### User Story 3: Delete Confirmation Safety

**As a** workflow user
**I want** confirmation before deleting workflows
**So that** I don't accidentally lose work

**Acceptance Criteria:**
- [ ] DeleteConfirmationDialog shows workflow name being deleted
- [ ] Dialog shows warning: "This action cannot be undone"
- [ ] Confirm button requires explicit click (no keyboard shortcuts)
- [ ] Cancel button is default focus
- [ ] Dialog dismisses on cancel (workflow preserved)
- [ ] Delete only executes on explicit confirmation
- [ ] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 2 transactions - show dialog, execute/cancel)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] Integration tests validate CRUD operations
- [ ] No TypeScript/linter errors
- [ ] Performance: List <300ms, search <200ms
- [ ] Code reviewed and approved
- [ ] Documentation updated (WorkflowExplorer API)
- [ ] Demo: Browse, create, delete workflows via UI

## Notes

**Architecture References:**
- Epic 1 left panel patterns (similar to FileExplorer)
- Feature 9.1 WorkflowService for file operations
- FileSystemService for file management

**UI Integration:**
- WorkflowExplorer replaces FileExplorerPanel when in workflow mode
- Mode toggle: File Explorer / Workflow Explorer
- Consistent styling with existing left panel components

**Delete Safety:**
- No "Delete All" batch operation (too risky)
- Soft delete possible future enhancement (not MVP)
- Deleted workflows not recoverable (warn users)

---

**Total Stories:** 3
**Total Hours:** 20 hours
**Total Objective UCP:** 25 UUCW
**Wave Status:** Planning
