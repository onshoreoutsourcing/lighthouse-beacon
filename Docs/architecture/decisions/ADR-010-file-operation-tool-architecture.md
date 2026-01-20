# ADR-010: File Operation Tool Architecture

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Lighthouse Development Team
**Related**: Epic-3, Feature-3.1, Feature-3.2, Business Requirements (FR-1, FR-9)

---

## Context

Epic 3 implements the core file operation tools that enable conversational development:
- read, write, edit, delete (file manipulation)
- glob, grep (search and discovery)
- bash (shell command execution)

These tools are the foundation of Lighthouse Chat IDE's value proposition - AI can perform file operations through conversation. We need an architecture that:
- Integrates with AIChatSDK tool calling framework
- Provides consistent interface for all tools
- Enables easy addition of new tools
- Supports comprehensive testing (unit, integration)
- Handles errors gracefully with clear AI-readable messages
- Logs all operations to SOC for audit trail
- Works in Electron main process (file system access)

**Requirements:**
- Common interface for all tool implementations
- Type-safe tool parameters and results (TypeScript)
- Structured error handling (AI can recover from errors)
- Tool registration system (declarative tool list)
- Permission integration (check approval before execution)
- SOC logging for every operation
- Support synchronous and asynchronous operations
- Testable in isolation (mock file system)

**Constraints:**
- Must integrate with AIChatSDK tool schema format
- Electron main process for file system access (security)
- IPC communication with renderer process
- Epic 2 tool framework provides execution infrastructure

---

## Considered Options

- **Option 1: Individual Tool Modules with Common Interface** - Each tool as separate module implementing ToolExecutor<T, R>
- **Option 2: Single ToolService Class with Methods** - One class with all tools as methods
- **Option 3: Plugin Architecture with Dynamic Loading** - Tools loaded dynamically from plugins directory
- **Option 4: Functional Approach with Tool Registry** - Pure functions registered in central registry
- **Option 5: Class Hierarchy with Base Tool Class** - Abstract base class, each tool extends
- **Option 6: No Abstraction** - Direct functions called from AI service

---

## Decision

**We have decided to implement each tool as a separate module with a common TypeScript interface (ToolExecutor<TParams, TResult>), registered in a centralized ToolRegistry.**

### Why This Choice

Modular tools with common interface provide the best balance of flexibility, testability, and maintainability.

**Key factors:**

1. **Modularity**: Each tool is self-contained file - easy to understand, test, and modify independently.

2. **Type Safety**: Generic interface ensures type-safe parameters and results at compile time.

3. **Testability**: Mock ToolExecutor interface for unit tests; test each tool in isolation.

4. **Extensibility**: Add new tools by creating new module and registering - no changes to existing code.

5. **Discoverability**: ToolRegistry provides single source of truth for available tools.

6. **AIChatSDK Integration**: Tool schema maps directly from ToolExecutor interface.

**Interface definition:**

```typescript
// src/tools/types.ts
export interface ToolExecutor<TParams = unknown, TResult = unknown> {
  // Tool metadata for AIChatSDK schema
  readonly name: string;
  readonly description: string;
  readonly schema: ToolSchema;

  // Execution
  execute(params: TParams, context: ExecutionContext): Promise<TResult>;

  // Validation (called before permission prompt)
  validate?(params: TParams): ValidationResult;
}

export interface ExecutionContext {
  projectRoot: string;
  userId: string;
  conversationId: string;
  socLogger: SOCLogger;
}

export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: ToolError;
}

export interface ToolError {
  code: string;
  message: string; // Human-readable
  aiMessage: string; // AI-readable (how to fix)
  recoverable: boolean;
}
```

**Example tool implementation:**

```typescript
// src/tools/ReadTool.ts
export class ReadTool implements ToolExecutor<ReadParams, ReadResult> {
  readonly name = 'read';
  readonly description = 'Read contents of a file';
  readonly schema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Relative path to file' },
      startLine: { type: 'number', optional: true },
      endLine: { type: 'number', optional: true }
    },
    required: ['path']
  };

  async execute(params: ReadParams, context: ExecutionContext): Promise<ReadResult> {
    // Validate path (prevent directory traversal)
    const absolutePath = this.resolvePath(params.path, context.projectRoot);

    if (!this.isWithinProject(absolutePath, context.projectRoot)) {
      return {
        success: false,
        error: {
          code: 'PATH_OUTSIDE_PROJECT',
          message: 'Cannot read file outside project directory',
          aiMessage: 'The path you specified is outside the project root. Use a path relative to the project directory.',
          recoverable: true
        }
      };
    }

    try {
      // Read file
      const content = await fs.readFile(absolutePath, 'utf-8');

      // Apply line range if specified
      const lines = content.split('\n');
      const selectedLines = params.startLine !== undefined
        ? lines.slice(params.startLine, params.endLine)
        : lines;

      // Log to SOC
      await context.socLogger.log({
        operation: 'file.read',
        path: params.path,
        success: true
      });

      return {
        success: true,
        data: {
          path: params.path,
          content: selectedLines.join('\n'),
          lineCount: selectedLines.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FILE_READ_ERROR',
          message: error.message,
          aiMessage: `I couldn't read the file. ${error.code === 'ENOENT' ? 'The file does not exist.' : 'There was an error reading the file.'}`,
          recoverable: true
        }
      };
    }
  }

  validate(params: ReadParams): ValidationResult {
    if (!params.path) {
      return { valid: false, error: 'path is required' };
    }
    if (params.path.includes('..')) {
      return { valid: false, error: 'path cannot contain ..' };
    }
    return { valid: true };
  }
}
```

**Tool Registry:**

```typescript
// src/tools/ToolRegistry.ts
export class ToolRegistry {
  private tools = new Map<string, ToolExecutor>();

  register(tool: ToolExecutor): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolExecutor | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolExecutor[] {
    return Array.from(this.tools.values());
  }

  getSchemas(): ToolSchema[] {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.schema
    }));
  }
}

// src/tools/index.ts - Registration
export const toolRegistry = new ToolRegistry();

toolRegistry.register(new ReadTool());
toolRegistry.register(new WriteTool());
toolRegistry.register(new EditTool());
toolRegistry.register(new DeleteTool());
toolRegistry.register(new GlobTool());
toolRegistry.register(new GrepTool());
toolRegistry.register(new BashTool());
```

**Why we rejected alternatives:**

- **Single ToolService**: Becomes monolithic; all tools coupled; hard to test individually
- **Plugin architecture**: Overkill for MVP; dynamic loading adds complexity; tools are not truly plugins
- **Functional approach**: Harder to encapsulate validation logic and metadata; less object-oriented
- **Class hierarchy**: Base class can become bloated; prefer composition over inheritance; interface sufficient
- **No abstraction**: No type safety; no consistent error handling; hard to add tools; testing difficult

---

## Consequences

### Positive

- **Clear Structure**: Each tool is separate file - easy to find and understand
- **Type Safety**: Compile-time checking of tool parameters and results
- **Testable**: Mock interface for unit tests; test tools independently
- **Maintainable**: Changes to one tool don't affect others
- **Extensible**: Add tools by creating module and registering - 5 lines
- **Consistent Errors**: All tools return structured ToolError format
- **SOC Integration**: Context provides logger - every tool logs operations
- **AI-Friendly**: Error messages optimized for AI understanding

### Negative

- **Boilerplate**: Each tool needs class definition, interface implementation, registration
- **More Files**: 7 tools = 7 files (vs single file for all tools)
- **Interface Overhead**: Must define TParams and TResult types for each tool
- **Registration Required**: Must remember to register new tools in registry

### Mitigation Strategies

**For boilerplate:**
- Create tool template generator script
- Copy existing tool and modify (most code is similar)
- Boilerplate is one-time cost, provides long-term maintainability

**For file organization:**
- Keep all tools in `src/tools/` directory
- Use index.ts for exports and registration
- Clear naming: ReadTool.ts, WriteTool.ts, etc.

**For registration:**
- Single registration point in index.ts
- Add TypeScript test: ensure all exported tools are registered
- Fail fast if tool called but not registered

---

## References

- Business Requirements: FR-1 (Natural Language File Operations), FR-9 (Tool Execution Loop)
- Epic 3 Plan: `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- Related ADRs:
  - ADR-001: Electron as Desktop Framework
  - ADR-006: AIChatSDK Integration Approach
  - ADR-011: Directory Sandboxing Approach
- Implementation: `src/tools/` directory
- Tool Docs: Docs/guides/tools/README.md

---

**Last Updated**: 2026-01-19
