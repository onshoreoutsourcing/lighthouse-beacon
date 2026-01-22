# Feature 9.2: Workflow Execution Engine

## Feature Overview
- **Feature ID:** Feature-9.2
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Duration:** 3 waves, 3-4 weeks
- **Priority:** High (MVP Core)

## Implementation Scope

Feature 9.2 builds secure Python script execution, real-time execution visualization, error handling, and execution history on top of Feature 9.1's canvas foundation.

**Objectives:**
- Implement secure Python script execution (path validation, timeouts, process isolation)
- Add real-time execution visualization (node status indicators on canvas)
- Build comprehensive error handling and retry logic
- Create execution history with logs

## Technical Requirements

### Functional Requirements
- **FR-9.2.1**: Python scripts execute with path validation (project directory only)
- **FR-9.2.2**: 30-second timeout enforced per Python script
- **FR-9.2.3**: Real-time execution visualization shows node status (pending/running/success/error)
- **FR-9.2.4**: Execution history displays 5 most recent runs per workflow
- **FR-9.2.5**: Error logs include context (inputs, outputs, stack trace)
- **FR-9.2.6**: Retry logic with exponential backoff (configurable per step)
- **FR-9.2.7**: Python scripts receive JSON via stdin, return JSON via stdout
- **FR-9.2.8**: Scripts run in isolated child process

### Non-Functional Requirements
- **Performance:**
  - Python script startup latency < 500ms
  - Execution status updates render < 50ms
  - Execution history query < 200ms

- **Security:**
  - Path validation prevents directory traversal (ADR-011)
  - Process isolation prevents main app crashes (ADR-016)
  - Timeout prevents infinite loops (ADR-016)
  - No sensitive data in logs (redact API keys, credentials)

- **Reliability:**
  - Failed scripts don't crash application
  - Retry logic recovers from transient failures
  - Execution history persists across restarts

### Technical Constraints
- Python 3.8+ required on user's system
- Scripts must follow stdin/stdout JSON contract
- Process isolation via Node.js child_process.spawn

## Dependencies

**Prerequisites (must complete before this Feature):**
- ✅ Feature 9.1: Workflow Canvas Foundation - REQUIRED
- ✅ ADR-011: Directory Sandboxing (path validation) - COMPLETE
- ✅ ADR-012: Bash Command Safety (subprocess pattern) - COMPLETE
- ✅ ADR-016: Python Script Execution Security - COMPLETE

**Enables (this Feature enables):**
- Feature 9.3: Workflow Management (requires stable execution)
- Feature 9.4: Advanced Control Flow (builds on execution engine)

**External Dependencies:**
- Python 3.8+ (user's system)
- Node.js child_process.spawn

## Logical Unit Tests

**Test Cases:**

1. **Test Case: Python Script Path Validation**
   - Attempt to execute script outside project directory
   - Verify PathValidator rejects path
   - Assert: throws error "Script path outside project directory"

2. **Test Case: Python Script Timeout Enforcement**
   - Execute Python script with infinite loop
   - Verify script terminated after 30 seconds
   - Assert: error "Script timeout after 30000ms"

3. **Test Case: Python Script stdin/stdout JSON**
   - Execute script with JSON inputs: `{"name": "test", "value": 42}`
   - Verify script receives inputs via stdin
   - Verify script returns JSON via stdout
   - Assert: result.success === true, result.outputs.name === "test"

4. **Test Case: Execution Visualizer Real-Time Updates**
   - Start workflow execution
   - Monitor node status changes (pending → running → success)
   - Verify ExecutionVisualizer updates canvas nodes
   - Assert: node status updates within 50ms

5. **Test Case: Execution History Persistence**
   - Execute workflow 3 times
   - Query execution history
   - Verify 3 runs recorded with timestamps, results
   - Assert: executionHistory.length === 3

6. **Test Case: Retry Logic Exponential Backoff**
   - Configure step with retry: max_attempts=3, backoff=2x
   - Execute step that fails twice, succeeds third time
   - Verify retry delays: 1s, 2s, 4s
   - Assert: result.success === true, result.retry_count === 2

## Testing Strategy and Acceptance Criteria

### Testing Strategy

- **Unit Tests:**
  - Test PythonExecutor path validation (8+ tests)
  - Test PythonExecutor timeout enforcement (5+ tests)
  - Test RetryPolicy exponential backoff (6+ tests)
  - Test ExecutionHistory persistence (4+ tests)
  - Mock child_process.spawn for Python execution

- **Integration Tests:**
  - Test actual Python script execution (real Python scripts)
  - Test execution visualizer updates canvas nodes
  - Test error handling with failing scripts
  - Test retry logic with transient failures

- **End-to-End Tests:**
  - Execute workflow with 3 Python scripts
  - Verify all scripts execute in sequence
  - Verify execution history recorded
  - Verify execution visualizer shows progress
  - Verify errors logged with context

- **Performance Tests:**
  - Measure Python script startup latency
  - Measure execution status update render time
  - All metrics must meet NFR targets

### Acceptance Criteria

- [ ] PythonExecutor validates script paths (project directory only)
- [ ] 30-second timeout enforced, scripts terminated on timeout
- [ ] Python scripts receive JSON via stdin, return JSON via stdout
- [ ] Process isolation: scripts run in child process
- [ ] ExecutionVisualizer shows real-time node status (pending/running/success/error)
- [ ] Execution history displays 5 most recent runs per workflow
- [ ] Error logs include inputs, outputs, stack trace
- [ ] Retry logic with exponential backoff configurable per step
- [ ] All unit tests passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Performance tests meet NFR targets
- [ ] Security scan passed
- [ ] Documentation updated

## Integration Points

### Integration with Other Features (Epic 9)

- **Feature 9.1: Workflow Canvas Foundation**
  - Uses: WorkflowExecutor foundation
  - Extends: Adds secure Python execution, real-time visualization

- **Feature 9.3: Workflow Management**
  - Provides: Execution history for workflow runs
  - Enables: Workflow testing and debugging

- **Feature 9.4: Advanced Control Flow**
  - Provides: Sequential execution engine
  - Feature 9.4 extends: Adds conditional, parallel, loop execution

### Integration with Other Epics

- **Epic 3: File Operations**
  - Uses: PathValidator for script path validation (ADR-011)
  - Uses: Subprocess execution pattern (ADR-012)

## Implementation Phases

### Wave 9.2.1: Secure Python Script Execution
- Implement PythonExecutor with path validation
- Add timeout enforcement (30-second default)
- Implement stdin/stdout JSON interface
- Process isolation via child_process.spawn
- Unit tests for path validation, timeouts

**Deliverables:**
- `src/main/services/PythonExecutor.ts` (replaces PythonExecutorStub from 9.1)
- Unit tests: `src/main/__tests__/python-executor.test.ts`

### Wave 9.2.2: Real-Time Execution Visualization
- Create ExecutionVisualizer component
- Add node status indicators to canvas (pending/running/success/error)
- Implement execution progress tracking
- Add execution events (step_started, step_completed, step_failed)
- Real-time updates via IPC events

**Deliverables:**
- `src/renderer/components/workflow/ExecutionVisualizer.tsx`
- `src/main/services/ExecutionEvents.ts` (event emitter)
- IPC handlers: `workflow:execution:subscribe`, `workflow:execution:unsubscribe`

### Wave 9.2.3: Error Handling & Execution History
- Implement ErrorBoundary for graceful error handling
- Add RetryPolicy with exponential backoff
- Create ExecutionHistory storage (localStorage)
- Add ExecutionHistoryPanel component (shows past runs)
- Error logging with context (inputs, outputs, stack trace)

**Deliverables:**
- `src/renderer/components/workflow/ErrorBoundary.tsx`
- `src/main/services/RetryPolicy.ts`
- `src/main/services/ExecutionHistory.ts`
- `src/renderer/components/workflow/ExecutionHistoryPanel.tsx`

## Architecture and Design

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Renderer Process (React)                                │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ WorkflowCanvas.tsx                               │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │ ExecutionVisualizer                      │   │   │
│  │  │  - Shows node status (pending/running/   │   │   │
│  │  │    success/error) in real-time           │   │   │
│  │  │  - Subscribes to execution events        │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ExecutionHistoryPanel                            │   │
│  │  - Displays 5 most recent workflow runs          │   │
│  │  - Shows execution time, results, errors         │   │
│  └──────────────────────────────────────────────────┘   │
│                      ↕ (IPC events)                      │
└─────────────────────────────────────────────────────────┘
                       ↕
┌─────────────────────────────────────────────────────────┐
│ Main Process (Node.js)                                  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ WorkflowExecutor                                 │   │
│  │  - Executes workflows step-by-step              │   │
│  │  - Emits execution events (step_started, etc.)  │   │
│  └──────────────────────────────────────────────────┘   │
│           ↕                    ↕                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │ PythonExecutor  │  │ RetryPolicy                 │   │
│  │  - Path valid.  │  │  - Exponential backoff      │   │
│  │  - Timeout      │  │  - Max attempts             │   │
│  │  - Process isol.│  │  - Retry conditions         │   │
│  └─────────────────┘  └─────────────────────────────┘   │
│           ↕                    ↕                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │ PathValidator   │  │ ExecutionHistory            │   │
│  │  (from ADR-011) │  │  - Stores run results       │   │
│  └─────────────────┘  │  - Persists to localStorage │   │
│                       └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Data Model

**Execution Events:**

```typescript
export interface ExecutionEvent {
  workflow_id: string;
  event_type: 'workflow_started' | 'step_started' | 'step_completed' | 'step_failed' | 'workflow_completed' | 'workflow_failed';
  step_id?: string;
  timestamp: number;
  data?: any;
}

export interface StepStartedEvent extends ExecutionEvent {
  event_type: 'step_started';
  step_id: string;
  data: {
    step_label: string;
    inputs: Record<string, any>;
  };
}

export interface StepCompletedEvent extends ExecutionEvent {
  event_type: 'step_completed';
  step_id: string;
  data: {
    outputs: Record<string, any>;
    execution_time_ms: number;
  };
}

export interface StepFailedEvent extends ExecutionEvent {
  event_type: 'step_failed';
  step_id: string;
  data: {
    error: string;
    stack_trace?: string;
    inputs: Record<string, any>;
    retry_attempt?: number;
  };
}
```

**Execution History:**

```typescript
export interface ExecutionHistoryEntry {
  id: string;
  workflow_id: string;
  workflow_name: string;
  timestamp: number;
  duration_ms: number;
  status: 'success' | 'failed' | 'cancelled';
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  steps_executed: number;
  steps_failed: number;
}
```

**Retry Policy:**

```typescript
export interface RetryPolicy {
  max_attempts: number;
  initial_delay_ms: number;
  backoff_multiplier: number; // 2x = exponential backoff
  max_delay_ms: number;
  retry_on_error_types?: string[]; // Optional: only retry specific errors
}

// Example: Default retry policy
const defaultRetryPolicy: RetryPolicy = {
  max_attempts: 3,
  initial_delay_ms: 1000, // 1 second
  backoff_multiplier: 2,   // 2x exponential
  max_delay_ms: 30000,     // 30 seconds max
};
```

### API Design

**IPC Event Handlers:**

```typescript
// Subscribe to execution events
ipcMain.on('workflow:execution:subscribe', (event, workflowId: string) => {
  executionEvents.on('execution_event', (execEvent: ExecutionEvent) => {
    if (execEvent.workflow_id === workflowId) {
      event.sender.send('workflow:execution:event', execEvent);
    }
  });
});

// Unsubscribe from execution events
ipcMain.on('workflow:execution:unsubscribe', (event, workflowId: string) => {
  executionEvents.removeAllListeners('execution_event');
});

// Get execution history
ipcMain.handle('workflow:execution:history', async (event, workflowId: string) => {
  return await executionHistory.getHistory(workflowId, 5); // 5 most recent
});
```

## Security Considerations

- **Path Validation (ADR-011):**
  - All script paths validated via PathValidator
  - Scripts must be within project directory
  - Absolute paths rejected

- **Process Isolation (ADR-016):**
  - Scripts run in separate child process
  - Script crashes don't affect main application
  - Resource limits enforced (timeout)

- **Timeout Enforcement:**
  - 30-second default timeout per script
  - Configurable per-step via YAML
  - Script killed if timeout exceeded (SIGTERM)

- **Input Validation:**
  - All script inputs validated before execution
  - File paths in inputs validated (PathValidator)
  - No code injection via inputs

- **Log Sanitization:**
  - API keys, credentials redacted from logs
  - Stack traces sanitized (no file system paths)
  - Execution history redacts sensitive data

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Python not installed on user's system | High | Medium | Check Python on startup, show installation guide |
| Infinite loops in Python scripts | Medium | Medium | Timeout enforcement (30s), kill process if exceeded |
| Process isolation fails on Windows | High | Low | Test on Windows, fallback to timeout-only if needed |
| Execution history grows too large | Medium | Low | Limit to 5 most recent runs, prune old entries |
| Retry logic causes long delays | Medium | Low | Max delay cap (30s), exponential backoff configurable |

## Definition of Done

- [ ] PythonExecutor implemented with path validation, timeouts, process isolation
- [ ] Python scripts receive JSON via stdin, return JSON via stdout
- [ ] ExecutionVisualizer shows real-time node status on canvas
- [ ] Execution history stores 5 most recent runs per workflow
- [ ] Error logs include inputs, outputs, stack trace
- [ ] Retry logic with exponential backoff implemented
- [ ] Unit tests written and passing (coverage ≥ 90%)
- [ ] Integration tests written and passing
- [ ] End-to-end test: workflow with Python scripts executes successfully
- [ ] Performance tests meet NFR targets
- [ ] Code reviewed and approved
- [ ] Security scan passed
- [ ] Documentation updated

## Related Documentation

- Epic Plan: Docs/implementation/_main/epic-9-workflow-generator-master-plan.md
- Feature 9.1: Docs/implementation/_main/feature-9.1-workflow-canvas-foundation.md
- Architecture: Docs/architecture/_main/04-Architecture.md

## Architecture Decision Records (ADRs)

- [ADR-016: Python Script Execution Security Strategy](../../architecture/decisions/ADR-016-python-script-execution-security.md)
- [ADR-011: Directory Sandboxing Approach](../../architecture/decisions/ADR-011-directory-sandboxing-approach.md)
- [ADR-012: Bash Command Safety Strategy](../../architecture/decisions/ADR-012-bash-command-safety-strategy.md)

---

**Feature Plan Version:** 1.0
**Last Updated:** January 21, 2026
**Status:** Ready for Wave Planning
