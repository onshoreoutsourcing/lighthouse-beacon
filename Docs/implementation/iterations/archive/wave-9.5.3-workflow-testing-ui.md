# Wave 9.5.3: Workflow Testing UI

## Wave Overview
- **Wave ID:** Wave-9.5.3
- **Feature:** Feature 9.5 - UX Polish & Templates
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Complete
- **Scope:** Add workflow testing UI with mock inputs, dry run mode, and individual node testing
- **Wave Goal:** Enable users to test workflows without executing real API calls or file operations
- **Estimated Hours:** 18 hours

## Wave Goals

1. Create TestingUI component for workflow testing controls
2. Implement mock input editor (specify test data without execution)
3. Add dry run mode (validate workflow without API calls)
4. Enable testing individual nodes in isolation
5. Provide test result visualization and debugging feedback

## User Stories

### User Story 1: Mock Input Editor

**As a** workflow designer
**I want** to specify mock input values for testing
**So that** I can test workflows without needing real data or API credentials

**Acceptance Criteria:**
- [x] TestingUI component displays mock input editor
- [x] Editor shows all workflow inputs with type information
- [x] JSON editor for complex input values (objects, arrays)
- [x] Input validation (type checking, required fields)
- [x] Mock inputs saved with workflow for reuse
- [x] Example inputs provided for quick testing
- [x] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 6 hours

**Objective UCP:** 10 UUCW (Average complexity: 4 transactions - input editor UI, JSON editor, validation, persistence)

---

### User Story 2: Dry Run Execution

**As a** workflow user
**I want** to execute workflows in dry run mode
**So that** I can validate workflow logic without making real API calls or modifying files

**Acceptance Criteria:**
- [x] DryRunExecutor service validates workflow without execution
- [x] Python scripts mocked (return mock data instead of executing)
- [x] Claude API calls mocked (return sample responses)
- [x] File operations mocked (log operations without file changes)
- [x] Dry run shows execution flow with mock data
- [x] Clear indicator: "DRY RUN MODE" visible during execution
- [x] Performance: Dry run completes 10x faster than real execution
- [x] Unit tests for dry run scenarios (≥90% coverage)
- [x] Integration tests validate mock behavior

**Priority:** High

**Estimated Hours:** 10 hours

**Objective UCP:** 15 UUCW (Average complexity: 6 transactions - dry run executor, Python mocking, Claude mocking, file operation mocking, execution flow, mock data generation)

---

### User Story 3: Individual Node Testing

**As a** workflow designer
**I want** to test individual workflow nodes in isolation
**So that** I can debug specific steps without running the entire workflow

**Acceptance Criteria:**
- [x] Right-click node to select "Test Node"
- [x] Node test dialog shows required inputs
- [x] User specifies mock inputs for single node
- [x] Node executes with mock inputs (in dry run mode)
- [x] Test results displayed (outputs, errors, execution time)
- [x] Test results saveable for comparison
- [x] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - node test dialog, execution, results display)

---

## Definition of Done

- [x] All 3 user stories completed with acceptance criteria met
- [x] Code coverage ≥90%
- [x] Integration tests validate testing UI
- [x] No TypeScript/linter errors
- [x] Dry run mode functional (no real operations)
- [x] Code reviewed and approved
- [x] Documentation updated (testing guide, mock data reference)
- [x] Demo: Test workflow in dry run mode, verify no real operations

## Notes

**Architecture References:**
- Feature 9.2 WorkflowExecutor (dry run extends it)
- Wave 9.2.1 PythonExecutor for script mocking
- Feature 2.1 AIService for Claude mocking

**Testing UI Layout:**

```
┌────────────────────────────────────────────────────┐
│ Testing Panel                         [Dry Run: ON]│
├────────────────────────────────────────────────────┤
│ Mock Inputs:                                       │
│ ┌──────────────────────────────────────────────┐  │
│ │ {                                             │  │
│ │   "repository_path": "/mock/repo",            │  │
│ │   "api_key": "mock_key_123",                  │  │
│ │   "output_path": "/mock/output.md"            │  │
│ │ }                                             │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ [Load Example] [Validate] [Execute Dry Run]       │
│                                                    │
│ Dry Run Results:                                   │
│ ┌──────────────────────────────────────────────┐  │
│ │ ✅ analyze_codebase (0.2s)                    │  │
│ │    Outputs: { files: 42, structure: "..." }  │  │
│ │                                               │  │
│ │ ✅ generate_documentation (0.5s)              │  │
│ │    Outputs: { documentation: "# Docs..." }   │  │
│ │                                               │  │
│ │ ✅ save_documentation (0.1s)                  │  │
│ │    File written (mock): /mock/output.md      │  │
│ └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Dry Run Execution Strategy:**

**Python Script Mocking:**
```typescript
// Instead of executing script
const result = await spawn('python3', [scriptPath], { input: JSON.stringify(inputs) });

// Dry run returns mock data
const result = {
  outputs: {
    // Generate mock data based on script name
    files: 42,
    structure: "{ ... mock data ... }"
  },
  executionTime: Math.random() * 1000, // Random time 0-1s
  success: true
};
```

**Claude API Mocking:**
```typescript
// Instead of calling Claude API
const response = await claudeAPI.messages.create({ ... });

// Dry run returns mock response
const response = {
  content: [
    {
      type: "text",
      text: "This is a mock Claude response for testing purposes. In a real execution, Claude would analyze the input and provide a detailed response."
    }
  ],
  usage: { input_tokens: 100, output_tokens: 50 }
};
```

**File Operation Mocking:**
```typescript
// Instead of writing file
await fs.writeFile(path, content);

// Dry run logs operation
console.log(`[DRY RUN] Would write to: ${path}`);
console.log(`[DRY RUN] Content length: ${content.length} bytes`);
return { success: true, mock: true, path, bytes: content.length };
```

**Individual Node Testing:**

```
┌────────────────────────────────────────────────────┐
│ Test Node: generate_documentation                  │
├────────────────────────────────────────────────────┤
│ Mock Inputs (JSON):                                │
│ ┌──────────────────────────────────────────────┐  │
│ │ {                                             │  │
│ │   "codebase_structure": {                     │  │
│ │     "files": 42,                              │  │
│ │     "directories": 8,                         │  │
│ │     "languages": ["Python", "TypeScript"]     │  │
│ │   }                                           │  │
│ │ }                                             │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ [Load from Previous Run] [Execute Test]           │
│                                                    │
│ Test Results:                                      │
│ ┌──────────────────────────────────────────────┐  │
│ │ Status: ✅ Success                            │  │
│ │ Execution Time: 0.8s                          │  │
│ │                                               │  │
│ │ Outputs:                                      │  │
│ │ {                                             │  │
│ │   "documentation": "# Project Documentation..." │ │
│ │ }                                             │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ [Save Results] [Close]                            │
└────────────────────────────────────────────────────┘
```

**Mock Data Generation Strategies:**

**1. Type-Based Mocking:**
```typescript
function generateMockData(type: string): any {
  switch (type) {
    case 'string': return 'mock_string_value';
    case 'number': return 42;
    case 'boolean': return true;
    case 'array': return ['item1', 'item2'];
    case 'object': return { key: 'value' };
  }
}
```

**2. Example-Based Mocking:**
```typescript
// If workflow includes example inputs
inputs:
  api_key:
    type: string
    example: "sk_test_..."

// Use example as mock data
mockInputs.api_key = workflow.inputs.api_key.example;
```

**3. Smart Mocking (Based on Names):**
```typescript
function smartMock(name: string, type: string): any {
  if (name.includes('email')) return 'test@example.com';
  if (name.includes('url')) return 'https://example.com';
  if (name.includes('path')) return '/mock/path';
  if (name.includes('count') || name.includes('number')) return 42;
  // ... more heuristics
  return generateMockData(type); // Fallback
}
```

**Dry Run Indicators:**

```
┌────────────────────────────────────────────────────┐
│ 🧪 DRY RUN MODE ACTIVE - No real operations       │
│                                                    │
│ ⚠️ API calls mocked - No real requests sent       │
│ ⚠️ File operations mocked - No files modified     │
│ ⚠️ Scripts mocked - No code executed              │
└────────────────────────────────────────────────────┘
```

**Benefits of Dry Run Mode:**
1. **Faster feedback** - No waiting for real API calls
2. **No side effects** - Files/databases unchanged
3. **No costs** - No API usage charges
4. **Safe testing** - Test without valid credentials
5. **Reproducible** - Same inputs always produce same results

---

**Total Stories:** 3
**Total Hours:** 18 hours
**Total Objective UCP:** 30 UUCW
**Wave Status:** Planning
