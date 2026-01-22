# Wave 9.4.6: Step-by-Step Debugging

## Wave Overview
- **Wave ID:** Wave-9.4.6
- **Feature:** Feature 9.4 - Advanced Control Flow
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Add step-by-step debugging with breakpoints, step-through execution, and variable inspection
- **Wave Goal:** Enable workflows to be debugged interactively with breakpoints and step controls
- **Estimated Hours:** 22 hours

## Wave Goals

1. Create DebugMode UI component (debug toolbar and controls)
2. Implement DebugExecutor service (pause, resume, step-through execution)
3. Add breakpoint support on workflow nodes
4. Provide variable inspection UI (view variable values at breakpoints)
5. Enable step controls: pause, resume, step-over, continue

## User Stories

### User Story 1: Breakpoint Management

**As a** workflow designer
**I want** to set breakpoints on workflow nodes
**So that** I can pause execution and inspect state at specific points

**Acceptance Criteria:**
- [ ] Click node to toggle breakpoint (visual indicator: red dot)
- [ ] Breakpoints persist across workflow sessions
- [ ] Execution pauses before executing node with breakpoint
- [ ] DebugMode UI shows breakpoint list (view, enable/disable, remove)
- [ ] Performance: Breakpoint check adds <10ms overhead per node
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 8 hours

**Objective UCP:** 10 UUCW (Average complexity: 5 transactions - breakpoint toggle, persistence, execution pause, UI list, performance validation)

---

### User Story 2: Step-Through Execution

**As a** workflow user
**I want** to step through workflow execution one node at a time
**So that** I can observe how data flows through the workflow

**Acceptance Criteria:**
- [ ] Debug toolbar provides: Pause, Resume, Step Over, Continue buttons
- [ ] Step Over executes current node and pauses at next node
- [ ] Continue resumes execution until next breakpoint or completion
- [ ] Execution state persists during pause (no timeout)
- [ ] Current node highlighted during debugging
- [ ] Performance: Pause/resume instant (<100ms)
- [ ] Unit tests for debug controls (≥90% coverage)
- [ ] Integration tests validate step-through behavior

**Priority:** High

**Estimated Hours:** 12 hours

**Objective UCP:** 15 UUCW (Average complexity: 6 transactions - pause logic, resume logic, step-over logic, continue logic, state persistence, UI controls)

---

### User Story 3: Variable Inspection

**As a** workflow user
**I want** to inspect variable values during debugging
**So that** I can verify data is correct at each step

**Acceptance Criteria:**
- [ ] Variable inspector panel shows workflow inputs, step outputs, environment variables
- [ ] Inspector updates when execution pauses at breakpoint
- [ ] Nested objects expandable (JSON tree view)
- [ ] Variable values editable during pause (for testing)
- [ ] Changes applied when resuming execution
- [ ] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - variable display, tree view, value editing)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] Integration tests validate debugging workflow
- [ ] No TypeScript/linter errors
- [ ] Performance: Breakpoint overhead <10ms, pause/resume <100ms
- [ ] Code reviewed and approved
- [ ] Documentation updated (debugging guide, breakpoint reference)
- [ ] Demo: Workflow debugged with breakpoints and step-through

## Notes

**Architecture References:**
- Feature 9.2 WorkflowExecutor for execution integration
- Wave 9.4.4 VariableResolver for variable inspection
- Electron IPC for debug control communication

**Debug Toolbar UI:**

```
┌─────────────────────────────────────────────────┐
│ Debug Mode: ON                                  │
│ [⏸ Pause] [▶️ Resume] [⏭️ Step Over] [⏩ Continue] │
│ Current: fetch_user_data (paused)              │
│ Breakpoints: 3 active                          │
└─────────────────────────────────────────────────┘
```

**Variable Inspector UI:**

```
┌─────────────────────────────────────────┐
│ Variables                               │
├─────────────────────────────────────────┤
│ workflow.inputs                         │
│   ├─ user_id: "123"                     │
│   └─ api_key: "sk_***" (redacted)      │
│                                         │
│ steps.fetch_user.outputs                │
│   ├─ user                               │
│   │   ├─ id: "123"                      │
│   │   ├─ name: "John Doe"               │
│   │   └─ email: "john@example.com"     │
│   └─ status: "success"                  │
│                                         │
│ env                                     │
│   └─ API_ENDPOINT: "https://api.ex..."  │
└─────────────────────────────────────────┘
```

**Breakpoint Visual Indicator:**

```
┌──────────────────┐
│ 🔴               │  ← Red dot = breakpoint
│  fetch_user      │
│                  │
└──────────────────┘
```

**Debug Execution Flow:**

1. User sets breakpoint on node
2. Workflow execution starts
3. Execution reaches node with breakpoint
4. DebugExecutor pauses execution
5. Variable inspector shows current state
6. User inspects variables, sets new values
7. User clicks "Step Over"
8. Node executes
9. Execution pauses at next node
10. Repeat until user clicks "Continue" or workflow completes

**Implementation Details:**

**DebugExecutor Service:**
```typescript
export class DebugExecutor {
  private breakpoints: Set<string>;  // Node IDs with breakpoints
  private isPaused: boolean = false;
  private stepMode: boolean = false;

  async executeNode(node: WorkflowNode): Promise<void> {
    // Check breakpoint
    if (this.breakpoints.has(node.id) || this.stepMode) {
      this.isPaused = true;
      await this.waitForResume();  // Block until user resumes
    }

    // Execute node
    const result = await node.execute();

    // Step mode: pause after execution
    if (this.stepMode) {
      this.isPaused = true;
      await this.waitForResume();
    }

    return result;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    // Resolve waitForResume promise
  }

  stepOver(): void {
    this.stepMode = true;
    this.resume();  // Execute one node, then pause again
  }

  continue(): void {
    this.stepMode = false;
    this.resume();  // Execute until next breakpoint
  }
}
```

**Security Considerations:**
- Variable editing only in debug mode
- Redact sensitive values (API keys, passwords)
- Timeout debug sessions after 30 minutes (prevent indefinite pause)

---

**Total Stories:** 3
**Total Hours:** 22 hours
**Total Objective UCP:** 30 UUCW
**Wave Status:** Planning
