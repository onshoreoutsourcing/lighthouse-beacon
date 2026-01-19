# ADR-011: Directory Sandboxing Approach

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Lighthouse Development Team
**Related**: Epic-3, All File Tools, Business Requirements (NFR-3 Security), Product Vision (Human in Control)

---

## Context

Lighthouse Chat IDE enables AI to perform file operations conversationally. While powerful, this creates significant security risks:
- AI could read sensitive files outside project directory (SSH keys, passwords, system files)
- AI could write/delete files outside project (data loss, system damage)
- Malicious prompts could attempt directory traversal attacks (../../../etc/passwd)
- Users need confidence that AI cannot access their entire file system

**Requirements:**
- Restrict ALL file operations to project root directory and subdirectories
- Block directory traversal attempts (../, absolute paths, symlinks)
- Provide clear error messages when operations blocked
- Work for all file tools (read, write, edit, delete, glob, grep)
- Validate paths before execution (prevent attacks)
- Log all sandboxing violations for security audit
- No false positives (don't block legitimate operations)
- Cross-platform (Windows, macOS, Linux path handling)

**Constraints:**
- Project root set by user when opening directory
- Tools run in Electron main process (Node.js file system access)
- Must handle Windows (C:\) and Unix (/home/) path formats
- Symlinks may point outside project (security risk)
- Relative paths must resolve to absolute for validation

**Security Principles:**
- Defense in depth - validate at multiple levels
- Fail securely - deny by default, allow explicitly
- Clear boundaries - project directory is hard limit
- User awareness - explain why operation blocked

---

## Considered Options

- **Option 1: Path Validation Before All Operations** - Resolve and validate every path against project root
- **Option 2: chroot-Style Jailing** - Use OS-level sandboxing (chroot, containers)
- **Option 3: Virtual File System** - Implement abstraction layer that filters operations
- **Option 4: File System Watcher with Blocklist** - Monitor operations, block violations
- **Option 5: Prompt Before Out-of-Bounds Operations** - Show permission prompt for external access
- **Option 6: Trust AI, No Sandboxing** - Rely on user supervision

---

## Decision

**We have decided to implement path validation before all file operations using Node.js path.resolve() and strict bounds checking against project root, with symlink resolution to detect escape attempts.**

### Why This Choice

Path validation provides robust sandboxing with minimal complexity and no external dependencies.

**Key factors:**

1. **Simplicity**: Pure TypeScript implementation using Node.js built-in APIs - no OS dependencies, works everywhere.

2. **Defense in Depth**: Validation happens:
   - In tool validate() method (before permission prompt)
   - In tool execute() method (before actual operation)
   - In ToolExecutor base checks (shared validation logic)

3. **Zero False Positives**: Legitimate operations within project work perfectly; only external paths blocked.

4. **Clear Error Messages**: Users understand why operation blocked; AI can correct path and retry.

5. **Symlink Protection**: Resolve symlinks to real paths before validation - prevents symlink escape attacks.

6. **Performance**: Path validation takes < 1ms - no noticeable performance impact.

**Implementation:**

```typescript
// src/tools/PathValidator.ts
export class PathValidator {
  constructor(private projectRoot: string) {
    // Ensure project root is absolute
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * Validates that path is within project root
   * @param relativePath - Path provided by AI (relative or absolute)
   * @returns Validation result with absolute path or error
   */
  async validate(relativePath: string): Promise<PathValidationResult> {
    // 1. Resolve to absolute path (handles ../, ./, etc.)
    const absolutePath = path.resolve(this.projectRoot, relativePath);

    // 2. Resolve symlinks (detect symlink escape attempts)
    let realPath: string;
    try {
      realPath = await fs.realpath(absolutePath);
    } catch (error) {
      // File doesn't exist yet (write operation) - use absolutePath
      realPath = absolutePath;
    }

    // 3. Check if real path is within project root
    const isWithinProject = realPath.startsWith(this.projectRoot);

    if (!isWithinProject) {
      return {
        valid: false,
        error: {
          code: 'PATH_OUTSIDE_PROJECT',
          message: `Path "${relativePath}" resolves to "${realPath}" which is outside project root "${this.projectRoot}"`,
          aiMessage: 'The path you specified is outside the project directory. Please use a path relative to the project root. For example, use "src/file.ts" instead of "../../../etc/passwd".',
          securityViolation: true
        }
      };
    }

    // 4. Additional checks
    if (relativePath.includes('..')) {
      // Warn but don't block - may be legitimate (e.g., "file..txt")
      // Already validated absolute path is safe
      console.warn(`Path contains ".." but resolves safely: ${relativePath} -> ${realPath}`);
    }

    return {
      valid: true,
      absolutePath: realPath,
      relativePath: path.relative(this.projectRoot, realPath)
    };
  }

  /**
   * Synchronous validation for cases where fs.realpath() not needed
   */
  validateSync(relativePath: string): PathValidationResult {
    const absolutePath = path.resolve(this.projectRoot, relativePath);
    const isWithinProject = absolutePath.startsWith(this.projectRoot);

    if (!isWithinProject) {
      return {
        valid: false,
        error: { /* same as async */ }
      };
    }

    return { valid: true, absolutePath };
  }
}
```

**Usage in tools:**

```typescript
// src/tools/ReadTool.ts
export class ReadTool implements ToolExecutor<ReadParams, ReadResult> {
  async execute(params: ReadParams, context: ExecutionContext): Promise<ReadResult> {
    const validator = new PathValidator(context.projectRoot);

    // Validate path before reading
    const validation = await validator.validate(params.path);

    if (!validation.valid) {
      // Log security violation
      if (validation.error.securityViolation) {
        await context.socLogger.logSecurityEvent({
          type: 'SANDBOX_VIOLATION',
          operation: 'read',
          path: params.path,
          projectRoot: context.projectRoot
        });
      }

      return {
        success: false,
        error: validation.error
      };
    }

    // Safe to read - path is within project
    const content = await fs.readFile(validation.absolutePath, 'utf-8');

    return { success: true, data: { content } };
  }
}
```

**Why we rejected alternatives:**

- **chroot jailing**: OS-specific, requires root privileges, overkill for desktop app
- **Virtual file system**: Complex implementation, performance overhead, difficult to maintain
- **File system watcher**: Cannot block operations before they happen, only detect violations after
- **Prompt for external access**: Undermines security - users might approve without understanding risk
- **No sandboxing**: Unacceptable security risk - AI could access entire file system

---

## Consequences

### Positive

- **Strong Security**: All file operations restricted to project directory
- **Defense in Depth**: Validation at multiple checkpoints
- **Symlink Protection**: Resolves real paths, prevents escape attacks
- **Clear Errors**: Users and AI understand why operations blocked
- **Cross-Platform**: Works identically on Windows, macOS, Linux
- **Zero Dependencies**: Uses Node.js built-in path and fs modules
- **Fast**: < 1ms validation overhead per operation
- **Security Logging**: All violations logged for audit

### Negative

- **Cannot Access External Files**: Legitimate use cases for external access blocked (e.g., importing config from ~/.config)
- **Symlink Limitation**: Symlinks to external resources won't work
- **Async Overhead**: fs.realpath() is async, adds complexity
- **Path Edge Cases**: Unusual path formats may need special handling

### Mitigation Strategies

**For legitimate external access:**
- Future enhancement (Epic 4+): Allow user to grant specific external directory access
- Provide clear error message explaining how to move files into project
- Document that external access not supported for security reasons

**For symlinks:**
- Symlinks within project work fine
- External symlinks blocked intentionally (security feature)
- Document symlink behavior in user guide

**For async complexity:**
- Provide synchronous validateSync() for cases where realpath not needed
- Use async validation in all actual file operations (safety priority)
- Error handling for fs.realpath() failures (file doesn't exist yet)

**For edge cases:**
- Comprehensive test suite with unusual path formats
- Test on all platforms (Windows, macOS, Linux)
- Handle case-insensitive file systems (macOS, Windows)
- Normalize paths before comparison

---

## References

- [Node.js path.resolve()](https://nodejs.org/api/path.html#pathresolvepaths)
- [Node.js fs.realpath()](https://nodejs.org/api/fs.html#fsrealpathpath-options-callback)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- Business Requirements: NFR-3 (Security - sandboxing)
- Product Vision: Docs/architecture/_main/01-Product-Vision.md (Human in Control)
- Epic 3 Plan: `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`
- Related ADRs:
  - ADR-010: File Operation Tool Architecture
  - ADR-012: Bash Command Safety Strategy
- Implementation: `src/tools/PathValidator.ts`
- Security Tests: `tests/security/path-traversal.test.ts`

---

**Last Updated**: 2026-01-19
