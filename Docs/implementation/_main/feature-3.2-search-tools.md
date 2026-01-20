# Feature 3.2: Search and Discovery Tools

## Feature Overview
- **Feature ID:** Feature-3.2
- **Epic:** Epic 3 - File Operation Tools Implementation (MVP)
- **Status:** Planning
- **Duration:** 2 waves (2-3 days estimated)
- **Priority:** High (P0 - Critical Path for MVP)

## Implementation Scope

Feature 3.2 delivers the **search and discovery capabilities** that enable AI to find files by pattern and search content across the codebase. These tools are essential for codebase exploration and understanding - a prerequisite for effective AI-assisted development.

**Objectives:**
- Implement GlobTool for file pattern matching (find files by name/path pattern)
- Implement GrepTool for content search with regex support (search within files)
- Achieve sub-second performance for typical codebases (up to 10,000 files)
- Format results for optimal AI consumption and conversation flow
- Integrate with SOC logging for complete audit trail

**Why This Matters:**
Search tools enable AI to answer questions like:
- "Find all TypeScript files in the src directory"
- "Where is the authentication logic defined?"
- "Show me all files that import the User model"
- "Find all TODO comments in the codebase"

Without search tools, AI would need to ask users to manually locate files, severely limiting conversational development effectiveness.

## Technical Requirements

### Functional Requirements

**GlobTool:**
- Accept glob patterns (e.g., `*.ts`, `**/*.tsx`, `src/**/*.test.ts`)
- Support common glob syntax: `*`, `**`, `?`, `[...]`, `{a,b,c}`
- Return list of matching file paths relative to project root
- Limit results to maximum 100 files (prevent overwhelming AI context)
- Support optional ignore patterns (e.g., exclude `node_modules`)
- Support optional subdirectory scope (e.g., search only in `src/`)
- Return metadata: pattern used, total matches, truncation indicator

**GrepTool:**
- Accept search pattern (string or regex)
- Search across multiple files (file pattern or glob)
- Support case-sensitive and case-insensitive search
- Return matching lines with file path, line number, and content
- Limit results to maximum 500 matches (prevent context overflow)
- Support regex patterns with proper escaping
- Return metadata: pattern, files searched, total matches, truncation indicator

### Non-Functional Requirements

**Performance:**
| Codebase Size | Glob Target | Grep Target |
|---------------|-------------|-------------|
| Small (~100 files) | < 50ms | < 100ms |
| Medium (~1,000 files) | < 200ms | < 500ms |
| Large (~10,000 files) | < 1,000ms | < 1,000ms |
| Very Large (~50,000 files) | < 3,000ms | < 3,000ms |

**Performance Optimization Strategies:**
1. Use `fast-glob` library (optimized for performance, respects .gitignore)
2. Stream file reading for grep (don't load entire files into memory)
3. Early termination when result limits reached
4. Exclude binary files from grep automatically
5. Respect `.gitignore` patterns by default
6. Parallel file processing where beneficial

**Security:**
- Path validation: all results must be within project root
- No access to files outside sandboxed directory
- Pattern validation: reject malicious patterns (ReDoS prevention)
- No execution of patterns - pure pattern matching only

**Scalability:**
- Handle monorepo-scale codebases (50,000+ files)
- Graceful degradation with result limiting
- Progress indication for long operations (future enhancement)

**Reliability:**
- Graceful handling of permission errors (skip inaccessible files)
- Handle symlinks appropriately (follow within project, ignore outside)
- Recover from individual file read errors without failing entire search
- Clear error messages when no matches found

### Technical Constraints

- Must implement ToolExecutor<TParams, TResult> interface (ADR-010)
- Must integrate with ToolRegistry for AIChatSDK tool schema
- Must run in Electron main process (file system access)
- Must use ExecutionContext for SOC logging
- Must work cross-platform (Windows, macOS, Linux path handling)
- Maximum response size considerations for AI context window

## Dependencies

**Prerequisites (must complete before this Feature):**
- Epic 2 complete: Tool calling framework operational
- Epic 2 complete: ToolRegistry and ExecutionContext infrastructure
- Epic 2 complete: SOC logging system integrated
- Epic 2 complete: Path validation utilities (from ADR-011)

**Can Parallelize With:**
- **Feature 3.1**: Core File Tools (Read, Write, Edit, Delete)
- Search tools are independent of file manipulation tools
- Both features share ToolRegistry but don't have code dependencies
- Parallel development reduces Epic 3 timeline

**Enables (this Feature enables):**
- Feature 3.4: Visual integration (clickable search results)
- Feature 3.3: Bash tool testing (can verify with grep)
- AI codebase exploration capabilities
- Pattern-based file selection for batch operations (future)

**External Dependencies:**

| Dependency | Purpose | Version | Fallback |
|------------|---------|---------|----------|
| fast-glob | Glob pattern matching | ^3.3.0 | minimatch (slower) |
| micromatch | Pattern testing | ^4.0.0 | Built-in regex |
| Node.js fs/promises | File reading | Built-in | N/A |
| Node.js path | Path handling | Built-in | N/A |

## Logical Unit Tests

Unit tests verify each tool works correctly in isolation with mocked file systems.

**GlobTool Test Cases:**

1. **Simple pattern matching**
   - Input: `{ pattern: "*.ts" }`
   - Expected: Returns all .ts files in root directory
   - Verify: Correct file list, relative paths

2. **Recursive pattern matching**
   - Input: `{ pattern: "**/*.tsx" }`
   - Expected: Returns all .tsx files recursively
   - Verify: Includes nested directories

3. **Pattern with directory scope**
   - Input: `{ pattern: "*.ts", cwd: "src" }`
   - Expected: Returns .ts files only in src/
   - Verify: No files from other directories

4. **Pattern with ignore**
   - Input: `{ pattern: "**/*.ts", ignore: ["**/node_modules/**"] }`
   - Expected: Excludes node_modules
   - Verify: No node_modules paths in results

5. **Result limiting (truncation)**
   - Input: `{ pattern: "**/*" }` on large codebase
   - Expected: Maximum 100 results, truncated flag true
   - Verify: Exactly 100 results, truncated indicator

6. **No matches**
   - Input: `{ pattern: "*.nonexistent" }`
   - Expected: Empty results, success true, truncated false
   - Verify: Graceful handling, AI-friendly message

7. **Path outside project (security)**
   - Input: `{ pattern: "../../../*" }`
   - Expected: Error or empty results (paths filtered)
   - Verify: No files outside project root returned

8. **Brace expansion**
   - Input: `{ pattern: "**/*.{ts,tsx}" }`
   - Expected: Returns both .ts and .tsx files
   - Verify: Both extensions included

**GrepTool Test Cases:**

1. **Simple text search**
   - Input: `{ pattern: "TODO", files: "**/*.ts" }`
   - Expected: All lines containing "TODO" in TypeScript files
   - Verify: Correct line numbers, content snippets

2. **Regex pattern search**
   - Input: `{ pattern: "import.*React", isRegex: true, files: "**/*.tsx" }`
   - Expected: All React import statements
   - Verify: Regex properly matched

3. **Case-insensitive search**
   - Input: `{ pattern: "error", caseSensitive: false }`
   - Expected: Matches "Error", "ERROR", "error"
   - Verify: All case variations found

4. **Case-sensitive search (default)**
   - Input: `{ pattern: "Error", caseSensitive: true }`
   - Expected: Only exact case matches
   - Verify: "error" not matched

5. **Result limiting (truncation)**
   - Input: `{ pattern: "const" }` on large codebase
   - Expected: Maximum 500 matches, truncated flag true
   - Verify: Exactly 500 results, truncated indicator

6. **No matches**
   - Input: `{ pattern: "xyz123nonexistent" }`
   - Expected: Empty results, success true
   - Verify: Graceful handling

7. **Binary file exclusion**
   - Input: `{ pattern: "test" }` with binary files present
   - Expected: Binary files skipped automatically
   - Verify: No binary content in results

8. **Multiple matches per file**
   - Input: `{ pattern: "function" }` in file with many functions
   - Expected: Each occurrence listed separately
   - Verify: All matches with correct line numbers

9. **Match context (line content)**
   - Input: Any search
   - Expected: Full line content for each match
   - Verify: Line content trimmed, readable

10. **Special regex characters (escaping)**
    - Input: `{ pattern: "console.log(", isRegex: false }`
    - Expected: Literal search (not regex interpreted)
    - Verify: Special chars not treated as regex

## Testing Strategy and Acceptance Criteria

### Testing Strategy

**Unit Tests (per tool):**
- Mock file system using memfs or similar
- Test each function/method in isolation
- Cover all parameter combinations
- Verify error handling paths
- Target: 80% code coverage per tool

**Integration Tests:**
- Real file system with test fixtures directory
- End-to-end tool execution through ToolRegistry
- Permission system integration (SOC logging)
- IPC communication (main -> renderer results)

**Performance Tests:**
- Benchmark against test codebases of varying sizes
- Automated regression tests for performance targets
- Profile memory usage for large searches
- Test with real-world codebases (React, Node.js projects)

**Security Tests:**
- Path traversal attempts (`../`, absolute paths)
- Malicious patterns (ReDoS patterns)
- Symlink escape attempts
- Permission boundary enforcement

### Test Fixtures

Create test fixture directories:
```
tests/fixtures/
  search-tools/
    small-project/          # ~50 files
    medium-project/         # ~500 files
    large-project/          # ~5,000 files (generated)
    special-cases/
      binary-files/
      symlinks/
      deep-nesting/         # 20+ levels
      unicode-names/
      permission-denied/
```

### Acceptance Criteria

**GlobTool:**
- [ ] Glob patterns `*`, `**`, `?`, `[...]`, `{a,b}` all work correctly
- [ ] Results limited to 100 files with truncation indicator
- [ ] Performance: < 1 second for 10,000 file codebase
- [ ] All paths relative to project root
- [ ] No paths outside project root returned
- [ ] Ignore patterns respected (including .gitignore)
- [ ] SOC logging for every glob operation
- [ ] AI-readable error messages for edge cases

**GrepTool:**
- [ ] Text and regex search modes work correctly
- [ ] Case-sensitive and case-insensitive options work
- [ ] Results limited to 500 matches with truncation indicator
- [ ] Performance: < 1 second for 10,000 file codebase (text search)
- [ ] Line numbers and content included in results
- [ ] Binary files automatically excluded
- [ ] File read errors handled gracefully (skip, continue)
- [ ] SOC logging for every grep operation
- [ ] AI-readable error messages for edge cases

**General:**
- [ ] All tests passing (unit, integration, performance)
- [ ] Code coverage >= 80%
- [ ] Security scan passed (no path traversal vulnerabilities)
- [ ] Documentation updated (tool usage guide)
- [ ] Performance benchmarks documented

## Integration Points

### Integration with Other Features

**Feature 3.1 (Core File Tools):**
- Parallel development - no direct code dependencies
- Shared ToolRegistry for tool registration
- Shared ExecutionContext interface
- Grep results can inform ReadTool usage (AI finds file, then reads it)

**Feature 3.3 (Bash + Permissions):**
- Search tools always use "Always-Allow" permission level (safe operations)
- Permission system shared but search tools bypass prompts
- Grep can validate bash command results

**Feature 3.4 (Visual Integration):**
- Search results displayed in chat with clickable file links
- Click file path -> opens in editor
- Click line number -> opens file at specific line
- Search results formatted as markdown lists

### Integration with Epic Infrastructure

**ToolRegistry (Epic 2):**
```typescript
// Registration in src/tools/index.ts
toolRegistry.register(new GlobTool());
toolRegistry.register(new GrepTool());
```

**AIChatSDK Tool Schema:**
- GlobTool and GrepTool schemas registered for AI tool calling
- Schema format per ADR-010 ToolExecutor interface

**SOC Logging (Epic 2):**
```typescript
// Example SOC log entry for glob
await context.socLogger.log({
  operation: 'file.glob',
  pattern: params.pattern,
  matchCount: results.length,
  truncated: results.truncated,
  success: true,
  timestamp: Date.now()
});
```

### External Integrations

**fast-glob Library:**
- Primary glob implementation
- Handles .gitignore automatically
- Cross-platform path normalization

**File System (Node.js):**
- fs.readFile for grep content reading
- fs.stat for file metadata (binary detection)
- path.resolve for path normalization

## Implementation Phases

### Wave 3.2.1: GlobTool Implementation

**Scope:** Complete GlobTool with full pattern matching, result limiting, and performance optimization.

**Deliverables:**
- GlobTool class implementing ToolExecutor<GlobParams, GlobResult>
- Pattern matching using fast-glob
- Result limiting (max 100 files)
- .gitignore respect by default
- Ignore pattern support
- Subdirectory scope support
- SOC logging integration
- Unit tests (80% coverage)
- Integration tests with ToolRegistry
- Performance benchmarks documented

**Estimated Duration:** 1-1.5 days

### Wave 3.2.2: GrepTool Implementation

**Scope:** Complete GrepTool with text/regex search, result limiting, and performance optimization.

**Deliverables:**
- GrepTool class implementing ToolExecutor<GrepParams, GrepResult>
- Text and regex search modes
- Case sensitivity option
- Result limiting (max 500 matches)
- Binary file detection and exclusion
- Line number and content extraction
- File pattern filtering (glob integration)
- SOC logging integration
- Unit tests (80% coverage)
- Integration tests with ToolRegistry
- Performance benchmarks documented
- Large codebase testing completed

**Estimated Duration:** 1-1.5 days

**Note:** Detailed wave plans will be created using /design-waves command after Feature plan review.

## Architecture and Design

### Component Architecture

```
src/tools/
  types.ts              # ToolExecutor interface (shared)
  ToolRegistry.ts       # Tool registration (shared)
  GlobTool.ts          # Glob implementation
  GrepTool.ts          # Grep implementation
  utils/
    pathValidator.ts    # Path security (shared with 3.1)
    binaryDetector.ts   # Binary file detection
    patternValidator.ts # ReDoS prevention
  index.ts             # Registration and exports
```

### GlobTool Design

```typescript
// src/tools/GlobTool.ts
interface GlobParams {
  pattern: string;        // Glob pattern (e.g., "**/*.ts")
  cwd?: string;           // Optional subdirectory scope
  ignore?: string[];      // Patterns to ignore
}

interface GlobResult {
  pattern: string;
  matches: string[];      // Relative file paths
  totalMatches: number;   // Before truncation
  truncated: boolean;     // True if results limited
}

export class GlobTool implements ToolExecutor<GlobParams, GlobResult> {
  readonly name = 'glob';
  readonly description = 'Find files matching a glob pattern';
  readonly schema = { /* ... */ };

  private readonly MAX_RESULTS = 100;

  async execute(params: GlobParams, context: ExecutionContext): Promise<ToolResult<GlobResult>> {
    // 1. Validate pattern (ReDoS prevention)
    // 2. Resolve cwd relative to projectRoot
    // 3. Execute fast-glob with options
    // 4. Filter results to ensure within project
    // 5. Truncate if exceeds MAX_RESULTS
    // 6. Log to SOC
    // 7. Return formatted result
  }

  validate(params: GlobParams): ValidationResult {
    // Pattern validation
    // Path validation for cwd
  }
}
```

### GrepTool Design

```typescript
// src/tools/GrepTool.ts
interface GrepParams {
  pattern: string;        // Search pattern
  files?: string;         // File pattern (default: "**/*")
  isRegex?: boolean;      // Treat as regex (default: false)
  caseSensitive?: boolean; // Case sensitive (default: true)
}

interface GrepMatch {
  path: string;           // Relative file path
  line: number;           // Line number (1-indexed)
  content: string;        // Matching line content (trimmed)
  matchStart: number;     // Character offset of match start
  matchEnd: number;       // Character offset of match end
}

interface GrepResult {
  pattern: string;
  matches: GrepMatch[];
  totalMatches: number;   // Before truncation
  filesSearched: number;
  truncated: boolean;
}

export class GrepTool implements ToolExecutor<GrepParams, GrepResult> {
  readonly name = 'grep';
  readonly description = 'Search file contents for a pattern';
  readonly schema = { /* ... */ };

  private readonly MAX_MATCHES = 500;

  async execute(params: GrepParams, context: ExecutionContext): Promise<ToolResult<GrepResult>> {
    // 1. Validate pattern (ReDoS for regex mode)
    // 2. Build regex from pattern
    // 3. Get file list using glob
    // 4. Stream-read each file
    // 5. Skip binary files
    // 6. Find matches line by line
    // 7. Collect until MAX_MATCHES
    // 8. Log to SOC
    // 9. Return formatted result
  }

  private isBinaryFile(filePath: string): Promise<boolean> {
    // Check first 8KB for null bytes
  }

  private escapeRegex(pattern: string): string {
    // Escape special regex characters for literal search
  }
}
```

### Result Formatting for AI

Results must be formatted for optimal AI consumption:

```typescript
// GlobTool result example (AI sees this)
{
  success: true,
  data: {
    pattern: "**/*.tsx",
    matches: [
      "src/components/Button.tsx",
      "src/components/Modal.tsx",
      "src/pages/Home.tsx"
      // ... up to 100
    ],
    totalMatches: 3,
    truncated: false
  }
}

// GrepTool result example (AI sees this)
{
  success: true,
  data: {
    pattern: "useState",
    matches: [
      {
        path: "src/components/Button.tsx",
        line: 5,
        content: "  const [clicked, setClicked] = useState(false);",
        matchStart: 35,
        matchEnd: 43
      },
      // ... up to 500
    ],
    totalMatches: 2,
    filesSearched: 15,
    truncated: false
  }
}
```

## Security Considerations

### Path Traversal Prevention

- All glob patterns resolved relative to project root
- Results filtered to exclude paths outside project
- Symlinks followed only if target within project
- Absolute paths in patterns rejected

```typescript
// Path validation (shared utility)
function isWithinProject(filePath: string, projectRoot: string): boolean {
  const resolved = path.resolve(projectRoot, filePath);
  const normalized = path.normalize(resolved);
  return normalized.startsWith(path.normalize(projectRoot));
}
```

### ReDoS (Regular Expression Denial of Service) Prevention

For GrepTool regex mode, patterns must be validated:

```typescript
// Pattern validation
function isPatternSafe(pattern: string): boolean {
  // Reject patterns with nested quantifiers
  // Example: (a+)+ or (a*)*
  const dangerousPatterns = [
    /\([^)]*[+*][^)]*\)[+*]/,  // Nested quantifiers
    /\([^)]*\|[^)]*\)[+*]/,    // Alternation with quantifier
  ];

  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return false;
    }
  }
  return true;
}
```

### Binary File Exclusion

Prevent searching/returning binary content:

```typescript
async function isBinaryFile(filePath: string): Promise<boolean> {
  const buffer = await fs.readFile(filePath, { encoding: null, length: 8192 });
  // Check for null bytes (common in binary files)
  return buffer.includes(0);
}
```

### SOC Logging

Every search operation logged for audit:

```typescript
// Logged for every operation
interface SearchLogEntry {
  operation: 'file.glob' | 'file.grep';
  pattern: string;
  scope?: string;           // cwd or file filter
  matchCount: number;
  truncated: boolean;
  durationMs: number;
  success: boolean;
  error?: string;
  timestamp: number;
  userId: string;
  conversationId: string;
}
```

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance degradation on very large repos (100K+ files) | Medium | Low | Result limiting; lazy evaluation; progress indication (future); test with large repos |
| ReDoS attacks via malicious regex patterns | High | Low | Pattern validation; execution timeout; reject dangerous patterns |
| Memory exhaustion from loading many files | High | Low | Stream reading; early termination; memory monitoring |
| Cross-platform path issues (Windows vs Unix) | Medium | Medium | Use path.sep; normalize all paths; test on all platforms |
| Binary file misdetection | Low | Low | Multiple detection methods; configurable threshold |
| Search results overwhelming AI context | Medium | Medium | Strict result limits (100/500); clear truncation indicators |

## Performance Optimization Details

### GlobTool Optimization

1. **Use fast-glob over alternatives**
   - 2-3x faster than node-glob
   - Built-in .gitignore support
   - Stream API for memory efficiency

2. **Configuration for performance**
   ```typescript
   const options = {
     cwd: projectRoot,
     ignore: ['**/node_modules/**', '**/.git/**', ...userIgnore],
     dot: false,           // Skip hidden files by default
     followSymbolicLinks: false,  // Avoid cycles
     suppressErrors: true, // Skip permission errors
     stats: false,         // Don't fetch stats unless needed
   };
   ```

3. **Early termination**
   - Stop after MAX_RESULTS + 1 found
   - Report total as "100+" when truncated

### GrepTool Optimization

1. **File filtering before reading**
   - Use glob to get file list first
   - Filter by extension for common searches
   - Skip obvious binary extensions (.png, .jpg, etc.)

2. **Stream-based reading**
   ```typescript
   const readline = require('readline');
   const rl = readline.createInterface({
     input: fs.createReadStream(filePath),
     crlfDelay: Infinity
   });

   let lineNumber = 0;
   for await (const line of rl) {
     lineNumber++;
     if (pattern.test(line)) {
       matches.push({ path, line: lineNumber, content: line.trim() });
       if (matches.length >= MAX_MATCHES) break;
     }
   }
   ```

3. **Parallel file processing**
   - Process files in batches (e.g., 10 concurrent)
   - Balance parallelism with I/O throughput
   - Early termination propagation

4. **Binary detection shortcut**
   - Check extension first (.exe, .dll, .png, etc.)
   - Only byte-check ambiguous files

## Definition of Done

- [ ] GlobTool fully implemented with all features
- [ ] GrepTool fully implemented with all features
- [ ] All acceptance criteria met with evidence
- [ ] Unit tests written and passing (80% coverage for each tool)
- [ ] Integration tests with ToolRegistry passing
- [ ] Performance benchmarks met and documented
- [ ] Security tests passing (path traversal, ReDoS)
- [ ] Code reviewed and approved
- [ ] Security scan passed with no high/critical issues
- [ ] SOC logging verified for all operations
- [ ] Documentation updated (tool schemas, usage examples)
- [ ] Tools registered in ToolRegistry
- [ ] AI tool schemas generated and validated
- [ ] Cross-platform testing completed (macOS, Windows, Linux)

## Related Documentation

- **Epic Plan:** `/Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`
- **Master Plan:** `/Docs/implementation/_main/epic-3-file-operation-tools-master-plan.md`
- **Product Requirements:** `Docs/architecture/_main/03-Business-Requirements.md` (FR-1, FR-9)
- **Architecture:** `Docs/architecture/_main/04-Architecture.md`
- **ADR-010:** Tool Architecture (ToolExecutor interface)
- **ADR-011:** Directory Sandboxing (PathValidator)

## Architecture Decision Records (ADRs)

| ADR | Title | Relevance to Feature 3.2 |
|-----|-------|--------------------------|
| [ADR-010](../../architecture/decisions/ADR-010-file-operation-tool-architecture.md) | File Operation Tool Architecture | Defines ToolExecutor interface for GlobTool and GrepTool |
| [ADR-011](../../architecture/decisions/ADR-011-directory-sandboxing-approach.md) | Directory Sandboxing Approach | Path validation used for search result filtering |

## Appendix: Tool Specifications

### GlobTool Schema (AIChatSDK Format)

```json
{
  "name": "glob",
  "description": "Find files matching a glob pattern. Returns up to 100 matching file paths.",
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Glob pattern to match files (e.g., '**/*.ts', 'src/**/*.tsx', '*.json')"
      },
      "cwd": {
        "type": "string",
        "description": "Optional subdirectory to search within (relative to project root)"
      },
      "ignore": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Optional patterns to ignore (e.g., ['**/node_modules/**'])"
      }
    },
    "required": ["pattern"]
  }
}
```

### GrepTool Schema (AIChatSDK Format)

```json
{
  "name": "grep",
  "description": "Search file contents for a pattern. Returns up to 500 matches with file path, line number, and content.",
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Search pattern (text or regex)"
      },
      "files": {
        "type": "string",
        "description": "File pattern to search (default: '**/*'). Example: '**/*.ts' for TypeScript files only"
      },
      "isRegex": {
        "type": "boolean",
        "description": "Treat pattern as regular expression (default: false)"
      },
      "caseSensitive": {
        "type": "boolean",
        "description": "Case-sensitive search (default: true)"
      }
    },
    "required": ["pattern"]
  }
}
```

### Example AI Interactions

**Example 1: Find all TypeScript files**
```
User: "Find all TypeScript files in the project"
AI calls: glob({ pattern: "**/*.ts" })
AI response: "I found 47 TypeScript files in the project:
- src/index.ts
- src/tools/GlobTool.ts
- src/tools/GrepTool.ts
... (showing first 10, 47 total)"
```

**Example 2: Search for a function definition**
```
User: "Where is the validatePath function defined?"
AI calls: grep({ pattern: "function validatePath", files: "**/*.ts" })
AI response: "I found the validatePath function defined in src/utils/pathValidator.ts at line 15:
`export function validatePath(path: string, projectRoot: string): boolean {`"
```

**Example 3: Find all TODO comments**
```
User: "Show me all the TODO comments in the codebase"
AI calls: grep({ pattern: "TODO", files: "**/*.{ts,tsx}" })
AI response: "I found 12 TODO comments across 8 files:
1. src/tools/GrepTool.ts:45 - TODO: Add progress indicator for large searches
2. src/components/FileExplorer.tsx:123 - TODO: Implement drag and drop
..."
```

---

**Document Information:**

| Field | Value |
|-------|-------|
| **Created By** | Wave Planner Agent |
| **Creation Date** | 2026-01-19 |
| **Last Updated** | 2026-01-19 |
| **Version** | 1.0 |
| **Status** | Planning - Awaiting Review |
| **Next Step** | Review, then create Wave plans with /design-waves |

---

*This Feature plan is a planning document. Implementation will proceed only after explicit instruction following review cycles.*
