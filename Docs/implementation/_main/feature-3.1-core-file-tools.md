# Feature 3.1: Core File Tools

## Feature Overview

| Field | Value |
|-------|-------|
| **Feature ID** | Feature-3.1 |
| **Epic** | Epic 3 - File Operation Tools Implementation |
| **Status** | Planning |
| **Duration** | 4-5 days (2 waves) |
| **Priority** | Critical (P0) |
| **Prerequisites** | Epic 2 Complete (AI Integration with Tool Calling Framework) |

---

## Implementation Scope

Feature 3.1 delivers the **four fundamental file manipulation tools** that form the foundation of conversational development in Lighthouse Chat IDE. These tools enable AI to read, create, modify, and remove files through natural language conversation.

**Objectives:**
- Implement ReadTool with full file reading and line range support
- Implement WriteTool with atomic writes (temp file + rename pattern)
- Implement EditTool with regex find/replace operations
- Implement DeleteTool with recursive directory support
- Establish path validation infrastructure (PathValidator) for all tools
- Provide structured error handling with AI-readable messages
- Integrate SOC logging for all file operations
- Enable complete tool execution loop through AIChatSDK

---

## Technical Requirements

### Functional Requirements

| ID | Requirement | Tool | Priority |
|----|-------------|------|----------|
| FR-3.1.1 | Read entire file contents with encoding detection | ReadTool | P0 |
| FR-3.1.2 | Read file with optional line range (startLine, endLine) | ReadTool | P0 |
| FR-3.1.3 | Return total line count with read results | ReadTool | P1 |
| FR-3.1.4 | Create new files with specified content | WriteTool | P0 |
| FR-3.1.5 | Overwrite existing files with new content | WriteTool | P0 |
| FR-3.1.6 | Create parent directories if needed (createDirectories option) | WriteTool | P1 |
| FR-3.1.7 | Perform atomic writes (temp file + rename) | WriteTool | P0 |
| FR-3.1.8 | Find and replace text patterns in files | EditTool | P0 |
| FR-3.1.9 | Support regex patterns in find/replace | EditTool | P0 |
| FR-3.1.10 | Support global replacement (all occurrences) | EditTool | P0 |
| FR-3.1.11 | Return replacement count and original content | EditTool | P1 |
| FR-3.1.12 | Delete individual files | DeleteTool | P0 |
| FR-3.1.13 | Delete directories (recursive option required) | DeleteTool | P0 |
| FR-3.1.14 | Return deletion metadata (type, items deleted) | DeleteTool | P1 |
| FR-3.1.15 | Validate all paths against project root (sandboxing) | All Tools | P0 |
| FR-3.1.16 | Return structured errors with AI-readable messages | All Tools | P0 |
| FR-3.1.17 | Log all operations to SOC via AIChatSDK | All Tools | P0 |

### Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | File read operation latency | < 100ms for files up to 1MB |
| **Performance** | File write operation latency | < 200ms for files up to 1MB |
| **Performance** | Path validation overhead | < 5ms per operation |
| **Security** | Path sandboxing enforcement | 100% - no operations outside project root |
| **Security** | Symlink resolution for escape detection | Required for all paths |
| **Reliability** | Atomic write success rate | 100% - no partial writes |
| **Reliability** | Error recovery rate | 100% - all errors produce structured response |
| **Scalability** | Maximum file size for read | 10MB (warn at 5MB) |
| **Scalability** | Maximum file size for write | 10MB |

### Technical Constraints

| Constraint | Description | Source |
|------------|-------------|--------|
| TC-1 | All tools must implement ToolExecutor<TParams, TResult> interface | ADR-010 |
| TC-2 | All paths must be validated via PathValidator before operations | ADR-011 |
| TC-3 | Tools execute in Electron main process (Node.js fs access) | Epic 1 |
| TC-4 | Tools communicate with renderer via IPC | Epic 1 |
| TC-5 | Permission checks occur before tool execution | Epic 2 |
| TC-6 | Tool schemas must be compatible with AIChatSDK format | Epic 2 |
| TC-7 | All operations must be async (fs/promises) | Performance |
| TC-8 | Encoding must be UTF-8 for text files | Compatibility |

---

## Dependencies

### Prerequisites (must complete before this Feature)

| Dependency | Description | Status |
|------------|-------------|--------|
| Epic 1 Complete | Desktop foundation with Electron, file explorer, Monaco editor | Required |
| Epic 2 Complete | AI integration with AIChatSDK, tool calling framework, permission system | Required |
| ToolExecutionService | Service to execute tools with permission checks | Epic 2 |
| ToolRegistry | Registry for tool registration and lookup | Epic 2 |
| PermissionService | Service to check and prompt for tool permissions | Epic 2 |
| SOCLogger | Logger interface for compliance logging | Epic 2 |
| ExecutionContext | Context object passed to all tool executions | Epic 2 |

### Enables (this Feature enables)

| Enablement | Description |
|------------|-------------|
| Feature 3.2 | Search tools (Glob, Grep) can be built on same infrastructure |
| Feature 3.3 | Bash tool uses PathValidator for working directory validation |
| Feature 3.4 | Visual integration requires working file tools |
| AI File Operations | AI can read, write, edit, delete files through conversation |
| MVP Foundation | Core file operations required for MVP functionality |

### External Dependencies

| Dependency | Type | Purpose | Risk |
|------------|------|---------|------|
| Node.js fs/promises | Built-in | Async file system operations | Low |
| Node.js path | Built-in | Cross-platform path handling | Low |
| Electron IPC | Framework | Main-renderer communication | Low |

---

## Architecture and Design

### Component Architecture

```
src/
  tools/
    types.ts              # ToolExecutor interface, ToolResult, ToolError types
    PathValidator.ts      # Path validation and sandboxing
    ToolRegistry.ts       # Tool registration and lookup
    index.ts              # Tool exports and registration

    core/                 # Feature 3.1 tools
      ReadTool.ts
      WriteTool.ts
      EditTool.ts
      DeleteTool.ts

    __tests__/            # Unit tests
      ReadTool.test.ts
      WriteTool.test.ts
      EditTool.test.ts
      DeleteTool.test.ts
      PathValidator.test.ts
```

### Class Diagram

```
                    +------------------------+
                    |  ToolExecutor<T, R>    |
                    |  (interface)           |
                    +------------------------+
                    | + name: string         |
                    | + description: string  |
                    | + schema: ToolSchema   |
                    +------------------------+
                    | + execute()            |
                    | + validate?()          |
                    +------------------------+
                            ^
                            |
          +-----------------+------------------+
          |                 |                  |
    +-----------+    +------------+    +-------------+
    | ReadTool  |    | WriteTool  |    | EditTool    |
    +-----------+    +------------+    +-------------+
          |                 |                  |
          +--------+--------+--------+---------+
                   |                 |
            +-------------+   +---------------+
            | DeleteTool  |   | PathValidator |
            +-------------+   +---------------+
```

### Data Model

#### Tool Parameter Types

```typescript
// ReadTool Parameters
interface ReadParams {
  path: string;           // Relative path to file from project root
  startLine?: number;     // Optional start line (0-indexed, inclusive)
  endLine?: number;       // Optional end line (0-indexed, exclusive)
}

// ReadTool Result
interface ReadResult {
  path: string;           // Path that was read
  content: string;        // File content (or selected lines)
  lineCount: number;      // Number of lines returned
  totalLines: number;     // Total lines in file
}

// WriteTool Parameters
interface WriteParams {
  path: string;           // Relative path to file
  content: string;        // Content to write
  createDirectories?: boolean;  // Create parent dirs if needed (default: false)
}

// WriteTool Result
interface WriteResult {
  path: string;           // Path that was written
  bytesWritten: number;   // Bytes written
  created: boolean;       // True if new file, false if overwrite
}

// EditTool Parameters
interface EditParams {
  path: string;           // Relative path to file
  search: string;         // Pattern to find (string or regex)
  replace: string;        // Replacement text
  isRegex?: boolean;      // Treat search as regex (default: false)
  global?: boolean;       // Replace all occurrences (default: true)
}

// EditTool Result
interface EditResult {
  path: string;           // Path that was edited
  replacements: number;   // Number of replacements made
  originalContent: string; // Original content (for potential undo)
}

// DeleteTool Parameters
interface DeleteParams {
  path: string;           // Relative path to file or directory
  recursive?: boolean;    // Required true for non-empty directories
}

// DeleteTool Result
interface DeleteResult {
  path: string;           // Path that was deleted
  type: 'file' | 'directory';  // What was deleted
  itemsDeleted: number;   // 1 for file, count for directory
}
```

#### Common Types

```typescript
// Tool execution result wrapper
interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: ToolError;
}

// Structured error format
interface ToolError {
  code: string;           // Machine-readable error code
  message: string;        // Human-readable message
  aiMessage: string;      // AI-readable message (how to fix)
  recoverable: boolean;   // Can AI retry with different params?
}

// Path validation result
interface PathValidationResult {
  valid: boolean;
  absolutePath?: string;
  relativePath?: string;
  error?: {
    code: string;
    message: string;
    aiMessage: string;
    securityViolation: boolean;
  };
}
```

### Tool Schema Definitions (AIChatSDK Format)

```typescript
// ReadTool Schema
const readToolSchema = {
  name: 'read',
  description: 'Read the contents of a file from the project. Returns the file content, optionally filtered by line range.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path to the file from the project root (e.g., "src/index.ts", "README.md")'
      },
      startLine: {
        type: 'number',
        description: 'Optional starting line number (0-indexed, inclusive). If not provided, reads from beginning.'
      },
      endLine: {
        type: 'number',
        description: 'Optional ending line number (0-indexed, exclusive). If not provided, reads to end of file.'
      }
    },
    required: ['path']
  }
};

// WriteTool Schema
const writeToolSchema = {
  name: 'write',
  description: 'Create a new file or overwrite an existing file with the specified content. Use for creating new files or completely replacing file contents.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path where the file should be written (e.g., "src/newfile.ts")'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file'
      },
      createDirectories: {
        type: 'boolean',
        description: 'If true, creates parent directories if they do not exist. Default is false.'
      }
    },
    required: ['path', 'content']
  }
};

// EditTool Schema
const editToolSchema = {
  name: 'edit',
  description: 'Find and replace text within a file. Supports both string and regex patterns. Use for modifying specific parts of existing files.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path to the file to edit'
      },
      search: {
        type: 'string',
        description: 'The text or pattern to find in the file'
      },
      replace: {
        type: 'string',
        description: 'The text to replace matches with'
      },
      isRegex: {
        type: 'boolean',
        description: 'If true, treats the search parameter as a regular expression. Default is false.'
      },
      global: {
        type: 'boolean',
        description: 'If true, replaces all occurrences. If false, replaces only the first. Default is true.'
      }
    },
    required: ['path', 'search', 'replace']
  }
};

// DeleteTool Schema
const deleteToolSchema = {
  name: 'delete',
  description: 'Delete a file or directory from the project. For non-empty directories, recursive must be set to true. This operation is dangerous and cannot be undone.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path to the file or directory to delete'
      },
      recursive: {
        type: 'boolean',
        description: 'Required to be true for deleting non-empty directories. Deletes all contents recursively.'
      }
    },
    required: ['path']
  }
};
```

---

## Security Considerations

### Path Sandboxing (ADR-011)

All file operations are restricted to the project root directory:

| Security Check | Implementation | Level |
|----------------|----------------|-------|
| Path resolution | Use path.resolve() to convert relative paths | Tool |
| Bounds checking | Verify absolute path starts with project root | PathValidator |
| Symlink resolution | Use fs.realpath() to detect escape attempts | PathValidator |
| Directory traversal | Block ../ patterns that escape project root | PathValidator |
| Absolute path blocking | Reject absolute paths not starting with project root | PathValidator |

**Security Violation Handling:**
1. Log security event to SOC with full details
2. Return structured error with security violation flag
3. Provide AI-readable message explaining the violation
4. Do not execute the operation

### Permission Levels

| Tool | Risk Level | Permission Default | Session Trust |
|------|------------|-------------------|---------------|
| read | Safe | Always-Allow | N/A |
| write | Moderate | Prompt | Allowed |
| edit | Moderate | Prompt | Allowed |
| delete | Dangerous | Always-Prompt | Disabled |

### Input Validation

| Input | Validation | Action on Failure |
|-------|------------|-------------------|
| path | Non-empty, valid characters, within project | Reject with clear error |
| content (write) | Valid UTF-8 encoding | Reject with encoding error |
| search (edit) | Valid regex if isRegex=true | Reject with syntax error |
| replace (edit) | Valid string | Accept (can be empty) |
| recursive (delete) | Must be true for non-empty directories | Reject with safety error |

### SOC Logging Requirements

Every file operation must log:
- Timestamp (ISO 8601)
- Operation type (read/write/edit/delete)
- File path (relative and absolute)
- User ID
- Conversation ID
- Success/failure status
- Error code (if failed)
- Security violation flag (if applicable)

---

## Testing Strategy and Acceptance Criteria

### Testing Strategy

#### Unit Tests

| Tool | Test File | Coverage Target |
|------|-----------|-----------------|
| ReadTool | ReadTool.test.ts | 90% |
| WriteTool | WriteTool.test.ts | 90% |
| EditTool | EditTool.test.ts | 90% |
| DeleteTool | DeleteTool.test.ts | 90% |
| PathValidator | PathValidator.test.ts | 95% |

#### Integration Tests

| Scenario | Components Tested |
|----------|-------------------|
| Read file through AI | AIService -> ToolExecutionService -> ReadTool |
| Write file with permission | WriteTool -> PermissionService -> PermissionModal |
| Edit file, verify content | EditTool -> fs.readFile -> verify changes |
| Delete file, verify removal | DeleteTool -> fs.stat -> verify not found |
| Path traversal blocked | PathValidator -> security logging -> error returned |

#### Security Tests

| Test Category | Test Cases |
|---------------|------------|
| Path Traversal | `../../../etc/passwd`, `..\\..\\Windows\\System32` |
| Absolute Paths | `/etc/passwd`, `C:\Windows\System32` |
| Symlink Escape | Symlink pointing outside project |
| Case Sensitivity | Windows/macOS path case variations |
| Unicode Paths | Paths with special characters, emoji |

### Logical Unit Tests

#### ReadTool Tests

```typescript
// ReadTool.test.ts
describe('ReadTool', () => {
  describe('execute', () => {
    it('should read entire file contents', async () => {
      // Setup: Create test file with known content
      // Execute: ReadTool.execute({ path: 'test.txt' })
      // Verify: content matches, lineCount correct
    });

    it('should read specified line range', async () => {
      // Setup: Create file with 10 lines
      // Execute: ReadTool.execute({ path: 'test.txt', startLine: 2, endLine: 5 })
      // Verify: Only lines 2-4 returned (3 lines)
    });

    it('should return error for non-existent file', async () => {
      // Execute: ReadTool.execute({ path: 'nonexistent.txt' })
      // Verify: success=false, error.code='FILE_NOT_FOUND'
    });

    it('should block path outside project', async () => {
      // Execute: ReadTool.execute({ path: '../../../etc/passwd' })
      // Verify: success=false, error.code='PATH_OUTSIDE_PROJECT'
    });

    it('should log read operation to SOC', async () => {
      // Execute: ReadTool.execute({ path: 'test.txt' })
      // Verify: SOCLogger.log called with correct parameters
    });
  });

  describe('validate', () => {
    it('should reject empty path', () => {
      // Execute: ReadTool.validate({ path: '' })
      // Verify: valid=false
    });

    it('should reject path with null bytes', () => {
      // Execute: ReadTool.validate({ path: 'test\x00.txt' })
      // Verify: valid=false
    });
  });
});
```

#### WriteTool Tests

```typescript
// WriteTool.test.ts
describe('WriteTool', () => {
  describe('execute', () => {
    it('should create new file with content', async () => {
      // Execute: WriteTool.execute({ path: 'new.txt', content: 'hello' })
      // Verify: File created, content matches, created=true
    });

    it('should overwrite existing file', async () => {
      // Setup: Create existing file
      // Execute: WriteTool.execute({ path: 'existing.txt', content: 'new content' })
      // Verify: Content replaced, created=false
    });

    it('should use atomic write (temp file + rename)', async () => {
      // Execute: WriteTool.execute({ path: 'atomic.txt', content: 'test' })
      // Verify: No partial file on failure, temp file cleaned up
    });

    it('should create parent directories when flag set', async () => {
      // Execute: WriteTool.execute({ path: 'new/dir/file.txt', content: 'test', createDirectories: true })
      // Verify: Directories created, file written
    });

    it('should fail if parent directory missing without flag', async () => {
      // Execute: WriteTool.execute({ path: 'missing/dir/file.txt', content: 'test' })
      // Verify: success=false, error.code='DIRECTORY_NOT_FOUND'
    });

    it('should block path outside project', async () => {
      // Execute: WriteTool.execute({ path: '/etc/crontab', content: 'malicious' })
      // Verify: success=false, error.code='PATH_OUTSIDE_PROJECT'
    });
  });
});
```

#### EditTool Tests

```typescript
// EditTool.test.ts
describe('EditTool', () => {
  describe('execute', () => {
    it('should replace single occurrence', async () => {
      // Setup: File with 'hello world'
      // Execute: EditTool.execute({ path: 'test.txt', search: 'hello', replace: 'hi', global: false })
      // Verify: Content is 'hi world', replacements=1
    });

    it('should replace all occurrences (global)', async () => {
      // Setup: File with 'hello hello hello'
      // Execute: EditTool.execute({ path: 'test.txt', search: 'hello', replace: 'hi' })
      // Verify: Content is 'hi hi hi', replacements=3
    });

    it('should support regex patterns', async () => {
      // Setup: File with 'foo123bar456'
      // Execute: EditTool.execute({ path: 'test.txt', search: '\\d+', replace: '#', isRegex: true })
      // Verify: Content is 'foo#bar#', replacements=2
    });

    it('should return original content for potential undo', async () => {
      // Execute: EditTool.execute({ ... })
      // Verify: result.data.originalContent matches original file
    });

    it('should handle no matches gracefully', async () => {
      // Setup: File without search pattern
      // Execute: EditTool.execute({ path: 'test.txt', search: 'nonexistent', replace: 'x' })
      // Verify: success=true, replacements=0, content unchanged
    });

    it('should fail on invalid regex', async () => {
      // Execute: EditTool.execute({ path: 'test.txt', search: '[invalid', replace: 'x', isRegex: true })
      // Verify: success=false, error.code='INVALID_REGEX'
    });
  });
});
```

#### DeleteTool Tests

```typescript
// DeleteTool.test.ts
describe('DeleteTool', () => {
  describe('execute', () => {
    it('should delete file', async () => {
      // Setup: Create test file
      // Execute: DeleteTool.execute({ path: 'test.txt' })
      // Verify: File removed, type='file', itemsDeleted=1
    });

    it('should delete empty directory', async () => {
      // Setup: Create empty directory
      // Execute: DeleteTool.execute({ path: 'empty-dir' })
      // Verify: Directory removed, type='directory'
    });

    it('should delete directory recursively', async () => {
      // Setup: Create directory with files
      // Execute: DeleteTool.execute({ path: 'dir-with-files', recursive: true })
      // Verify: All contents removed, itemsDeleted > 1
    });

    it('should fail on non-empty directory without recursive flag', async () => {
      // Setup: Create directory with files
      // Execute: DeleteTool.execute({ path: 'dir-with-files' })
      // Verify: success=false, error.code='DIRECTORY_NOT_EMPTY'
    });

    it('should fail on non-existent path', async () => {
      // Execute: DeleteTool.execute({ path: 'nonexistent' })
      // Verify: success=false, error.code='FILE_NOT_FOUND'
    });

    it('should block path outside project', async () => {
      // Execute: DeleteTool.execute({ path: '../../../important-file' })
      // Verify: success=false, error.code='PATH_OUTSIDE_PROJECT'
    });
  });
});
```

#### PathValidator Tests

```typescript
// PathValidator.test.ts
describe('PathValidator', () => {
  describe('validate', () => {
    it('should accept valid relative path within project', async () => {
      // Execute: validator.validate('src/index.ts')
      // Verify: valid=true, absolutePath correct
    });

    it('should reject path traversal attempt', async () => {
      // Execute: validator.validate('../../../etc/passwd')
      // Verify: valid=false, error.securityViolation=true
    });

    it('should reject absolute path outside project', async () => {
      // Execute: validator.validate('/etc/passwd')
      // Verify: valid=false, error.securityViolation=true
    });

    it('should resolve symlinks to detect escape', async () => {
      // Setup: Create symlink pointing outside project
      // Execute: validator.validate('symlink-to-external')
      // Verify: valid=false, error.securityViolation=true
    });

    it('should handle Windows paths correctly', async () => {
      // Execute: validator.validate('src\\components\\file.ts')
      // Verify: valid=true, path normalized
    });

    it('should handle non-existent paths for write operations', async () => {
      // Execute: validator.validate('new/file.txt')
      // Verify: valid=true (file doesn't exist but path is valid)
    });
  });
});
```

### Acceptance Criteria

#### ReadTool Acceptance Criteria

- [ ] AC-3.1.1: AI can read any file within project directory
- [ ] AC-3.1.2: AI can specify line range for partial file reads
- [ ] AC-3.1.3: Read results include total line count for AI context
- [ ] AC-3.1.4: File not found returns clear, AI-readable error
- [ ] AC-3.1.5: Path outside project returns security error
- [ ] AC-3.1.6: All read operations logged to SOC

#### WriteTool Acceptance Criteria

- [ ] AC-3.1.7: AI can create new files with specified content
- [ ] AC-3.1.8: AI can overwrite existing files
- [ ] AC-3.1.9: Atomic writes prevent partial file corruption
- [ ] AC-3.1.10: Parent directories created when flag enabled
- [ ] AC-3.1.11: Permission prompt shown before write operation
- [ ] AC-3.1.12: All write operations logged to SOC

#### EditTool Acceptance Criteria

- [ ] AC-3.1.13: AI can perform string find/replace in files
- [ ] AC-3.1.14: AI can use regex patterns for complex replacements
- [ ] AC-3.1.15: Global replacement replaces all occurrences
- [ ] AC-3.1.16: Original content preserved for potential undo
- [ ] AC-3.1.17: Permission prompt shown before edit operation
- [ ] AC-3.1.18: All edit operations logged to SOC

#### DeleteTool Acceptance Criteria

- [ ] AC-3.1.19: AI can delete individual files
- [ ] AC-3.1.20: AI can delete directories with recursive flag
- [ ] AC-3.1.21: Non-empty directory without recursive flag fails safely
- [ ] AC-3.1.22: Permission prompt always shown for delete (no session trust)
- [ ] AC-3.1.23: All delete operations logged to SOC

#### Security Acceptance Criteria

- [ ] AC-3.1.24: All path traversal attempts blocked with security log
- [ ] AC-3.1.25: Symlink escape attempts detected and blocked
- [ ] AC-3.1.26: No file operations execute outside project root (100%)
- [ ] AC-3.1.27: Security violations logged with full details

#### Quality Acceptance Criteria

- [ ] AC-3.1.28: All tests passing
- [ ] AC-3.1.29: Code coverage >= 80%
- [ ] AC-3.1.30: Security scan passed with no high/critical issues
- [ ] AC-3.1.31: Documentation updated for all tools

---

## Integration Points

### Integration with Epic 2 Components

| Component | Integration | Direction |
|-----------|-------------|-----------|
| ToolExecutionService | Calls tool.execute() with context | Incoming |
| PermissionService | Called before execute for write/edit/delete | Outgoing |
| ToolRegistry | Tools register schemas at startup | Outgoing |
| SOCLogger | Called after each operation for logging | Outgoing |
| AIChatSDK | Tool schemas provided for AI tool calling | Outgoing |

### Integration with Feature 3.2

- Glob and Grep tools will use same PathValidator for sandboxing
- Same ToolExecutor interface and error handling patterns
- Shared types (ToolResult, ToolError) defined in Feature 3.1

### Integration with Feature 3.4

- File operations emit IPC events for visual updates
- Write/Edit -> File explorer refresh
- Write/Edit/Delete -> Editor tab refresh if file open
- Results displayed in chat with clickable file links

### External Integrations

| System | Integration | Purpose |
|--------|-------------|---------|
| Node.js fs/promises | File system operations | Core functionality |
| Node.js path | Path resolution and normalization | Security |
| Electron IPC | Main-renderer communication | UI updates |
| AIChatSDK | Tool schema registration | AI integration |

---

## Implementation Phases

### Wave 3.1.1: Foundation and Read/Write Tools

**Scope:** Implement PathValidator infrastructure and the first two tools (ReadTool, WriteTool).

**Deliverables:**
- PathValidator class with full validation logic
- ReadTool implementation with line range support
- WriteTool implementation with atomic writes
- Tool type definitions (ToolExecutor, ToolResult, ToolError)
- Unit tests for PathValidator, ReadTool, WriteTool
- Security tests for path validation

**Duration:** 2-3 days

**Exit Criteria:**
- ReadTool passes all unit tests
- WriteTool passes all unit tests
- PathValidator blocks all traversal test cases
- Integration with ToolRegistry verified

### Wave 3.1.2: Edit and Delete Tools

**Scope:** Implement EditTool and DeleteTool, complete integration testing.

**Deliverables:**
- EditTool implementation with regex support
- DeleteTool implementation with recursive directory support
- Unit tests for EditTool, DeleteTool
- Integration tests for all four tools
- Security tests for edit and delete operations
- SOC logging verification for all tools

**Duration:** 2 days

**Exit Criteria:**
- EditTool passes all unit tests including regex edge cases
- DeleteTool passes all unit tests including recursive deletion
- All four tools integrated with ToolExecutionService
- SOC logging verified for all operations
- Security scan passed

---

## Risks and Mitigation

| Risk ID | Risk | Impact | Probability | Mitigation |
|---------|------|--------|-------------|------------|
| R-3.1.1 | Atomic write fails mid-operation | High | Low | Use temp file + rename pattern; validate before rename |
| R-3.1.2 | Regex causes catastrophic backtracking | Medium | Medium | Timeout regex operations; limit pattern complexity |
| R-3.1.3 | Symlink resolution performance on deep trees | Low | Low | Cache resolved paths; limit resolution depth |
| R-3.1.4 | File encoding detection incorrect | Medium | Low | Default to UTF-8; detect BOM; allow encoding override |
| R-3.1.5 | Path validation edge cases on Windows | Medium | Medium | Comprehensive Windows path testing; normalize early |
| R-3.1.6 | Large file read causes memory issues | Medium | Low | Implement streaming for large files (future); warn at 5MB |

---

## Definition of Done

- [ ] All functional requirements (FR-3.1.1 through FR-3.1.17) implemented
- [ ] All acceptance criteria met with evidence
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests written and passing
- [ ] Security tests passing (path traversal, symlink escape)
- [ ] Code reviewed and approved
- [ ] Security scan passed with no high/critical issues
- [ ] SOC logging verified for all operations
- [ ] Documentation updated (tool API reference)
- [ ] All four tools registered in ToolRegistry
- [ ] Tools integrated with ToolExecutionService
- [ ] Permission integration verified (write, edit require approval; delete always prompts)

---

## Related Documentation

- **Epic Plan:** `Docs/implementation/_main/epic-3-file-operation-tools-master-plan.md`
- **Epic Details:** `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`
- **Product Requirements:** `Docs/architecture/_main/03-Business-Requirements.md` (FR-1, FR-6, FR-7, FR-9)
- **Architecture:** `Docs/architecture/_main/04-Architecture.md`

## Architecture Decision Records (ADRs)

| ADR | Title | Relevance |
|-----|-------|-----------|
| [ADR-010](../../architecture/decisions/ADR-010-file-operation-tool-architecture.md) | File Operation Tool Architecture | Defines ToolExecutor interface, ToolRegistry pattern |
| [ADR-011](../../architecture/decisions/ADR-011-directory-sandboxing-approach.md) | Directory Sandboxing Approach | Defines PathValidator, security validation approach |

---

**Feature Status:** Planning
**Template Version:** 1.0
**Last Updated:** 2026-01-19
