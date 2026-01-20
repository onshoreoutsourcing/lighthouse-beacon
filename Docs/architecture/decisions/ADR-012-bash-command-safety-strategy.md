# ADR-012: Bash Command Safety Strategy

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Lighthouse Development Team
**Related**: Epic-3, Feature-3.3, Business Requirements (NFR-3 Security)

---

## Context

The bash tool enables AI to execute shell commands conversationally. This is extremely powerful but poses the highest security risk of any tool:
- Destructive commands (rm -rf /, format drives)
- Privilege escalation (sudo commands)
- Remote execution (curl malicious scripts, ssh)
- Data exfiltration (send files to external servers)
- System modification (install malware, change configs)
- Resource exhaustion (fork bombs, infinite loops)

**Requirements:**
- Block known dangerous commands
- Require explicit permission for EVERY bash command (no batch approval)
- Show full command to user before execution
- Sandbox command execution (current directory = project root)
- Prevent privilege escalation (no sudo)
- Timeout long-running commands (max 60 seconds)
- Capture stdout and stderr for AI feedback
- Log every command execution to SOC (audit trail)
- Cross-platform (handle Windows cmd, PowerShell differences)

**Constraints:**
- MVP focuses on safety, not full bash functionality
- Advanced features (pipes, environment variables) out of scope for Epic 3
- Must work in Electron main process
- Windows support deferred to future (focus on macOS/Linux for MVP)

**User Stories:**
- As a user, I trust AI won't destroy my system with bash commands
- As a developer, I want AI to run common commands (npm install, git status)
- As a user, I want to see and approve every command before it runs

---

## Considered Options

- **Option 1: Blocklist of Dangerous Commands** - Block known dangerous patterns (rm -rf, sudo, etc.)
- **Option 2: Allowlist of Safe Commands** - Only permit explicitly approved commands
- **Option 3: Docker/Container Execution** - Run commands in isolated container
- **Option 4: Parse and Analyze Commands** - AST parsing to detect dangerous operations
- **Option 5: Interactive Shell with Confirmation** - Prompt user for each operation
- **Option 6: No Bash Tool** - Don't implement bash tool (too risky)
- **Option 7: Read-Only Commands Only** - Only allow commands that don't modify system

---

## Decision

**We have decided to use a blocklist of dangerous commands combined with mandatory per-command permission prompts, working directory sandboxing, and strict timeout enforcement.**

### Why This Choice

Blocklist with mandatory approval provides balance of functionality and safety for MVP.

**Key factors:**

1. **Functionality**: Allowlist too restrictive - would miss many legitimate use cases (npm commands, custom scripts, etc.)

2. **Safety**: Blocklist catches obviously dangerous patterns; permission prompt catches everything else

3. **User Control**: User sees and approves EVERY command - consistent with "Human in Control" principle

4. **Simplicity**: No containers or complex parsing - straightforward implementation

5. **MVP Appropriate**: Good enough for Epic 3; can enhance with containers in future if needed

**Dangerous command patterns (blocked):**

```typescript
// src/tools/BashTool.ts - Blocked patterns
const BLOCKED_PATTERNS = [
  // Destructive file operations
  /rm\s+-rf\s+\//, // rm -rf /
  /rm\s+.*(\/\*|\/\.)/,  // rm /* or rm /.*
  /format\s+/, // format drives (Windows)

  // Privilege escalation
  /sudo\s+/,
  /su\s+/,
  /doas\s+/,

  // System modification
  /chmod\s+[0-7]{3,4}\s+\//, // chmod on root
  /chown\s+.*\//, // chown on root

  // Remote execution
  /curl.*\|\s*bash/, // curl script | bash
  /wget.*\|\s*bash/,
  /ssh\s+/,
  /scp\s+/,

  // Data exfiltration
  /curl.*-X\s+POST/, // POST to external servers
  /wget.*--post/,

  // Fork bombs and resource exhaustion
  /:\(\)\s*\{.*\}/, // :() { ... }

  // Background/daemon processes
  /nohup\s+/,
  /&\s*$/, // command &

  // Package managers with elevated privileges
  /apt(-get)?\s+install/,
  /brew\s+install/,
  /yum\s+install/,
];
```

**Implementation:**

```typescript
// src/tools/BashTool.ts
export class BashTool implements ToolExecutor<BashParams, BashResult> {
  readonly name = 'bash';
  readonly description = 'Execute shell command (requires approval)';

  async execute(params: BashParams, context: ExecutionContext): Promise<BashResult> {
    // 1. Validate command against blocklist
    const validation = this.validateCommand(params.command);
    if (!validation.valid) {
      await context.socLogger.logSecurityEvent({
        type: 'BLOCKED_BASH_COMMAND',
        command: params.command,
        reason: validation.error
      });

      return {
        success: false,
        error: {
          code: 'COMMAND_BLOCKED',
          message: validation.error,
          aiMessage: `This command is blocked for security reasons: ${validation.error}. Try a different approach that doesn't require this command.`,
          recoverable: false
        }
      };
    }

    // 2. Execute with sandboxing and timeout
    try {
      const result = await this.executeCommand(params.command, {
        cwd: context.projectRoot, // Sandbox to project directory
        timeout: 60000, // 60 second max
        shell: true,
      });

      // Log successful execution
      await context.socLogger.log({
        operation: 'bash.execute',
        command: params.command,
        exitCode: result.exitCode,
        success: result.exitCode === 0
      });

      return {
        success: result.exitCode === 0,
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMMAND_FAILED',
          message: error.message,
          aiMessage: `The command failed: ${error.message}`,
          recoverable: true
        }
      };
    }
  }

  private validateCommand(command: string): ValidationResult {
    // Check against blocklist
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(command)) {
        return {
          valid: false,
          error: `Command matches blocked pattern: ${pattern.source}`
        };
      }
    }

    // Additional checks
    if (command.includes('sudo') || command.includes('su ')) {
      return { valid: false, error: 'Privilege escalation not allowed' };
    }

    if (command.length > 1000) {
      return { valid: false, error: 'Command too long (max 1000 characters)' };
    }

    return { valid: true };
  }

  private async executeCommand(
    command: string,
    options: ExecutionOptions
  ): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [], {
        cwd: options.cwd,
        shell: options.shell,
        timeout: options.timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('exit', (code) => {
        resolve({ stdout, stderr, exitCode: code || 0 });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Enforce timeout
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Command timeout after 60 seconds'));
      }, options.timeout);
    });
  }
}
```

**Permission prompt for bash:**

```tsx
// High-risk red warning modal
<PermissionModal risk="critical">
  <Header>⚠️ AI wants to execute shell command</Header>
  <Body>
    <Command>{params.command}</Command>
    <Warning>
      This command will be executed with your privileges in the project directory.
      Review carefully before approving.
    </Warning>
  </Body>
  <Footer>
    {/* No "trust session" option - always prompt */}
    <Button variant="deny">Deny</Button>
    <Button variant="approve">Approve</Button>
  </Footer>
</PermissionModal>
```

**Why we rejected alternatives:**

- **Allowlist**: Too restrictive, would block many legitimate commands (git, npm, custom scripts)
- **Docker**: Overkill for MVP, adds deployment complexity, slower execution
- **Command parsing**: Complex AST parsing, many edge cases, hard to maintain
- **Interactive shell**: Conflicts with conversational UX, confusing for AI
- **No bash tool**: Removes valuable functionality, limits use cases
- **Read-only**: Still too restrictive, users want to run builds, tests, commits

---

## Consequences

### Positive

- **Strong Safety**: Dangerous commands blocked at validation stage
- **User Control**: User sees and approves EVERY bash command
- **Sandboxed Execution**: Commands run in project directory (can't affect system)
- **Timeout Protection**: Runaway commands killed after 60 seconds
- **Audit Trail**: All commands logged to SOC with results
- **Clear Errors**: Blocked commands explain why to user and AI
- **Incremental Enhancement**: Can tighten or loosen blocklist based on usage

### Negative

- **False Positives**: Legitimate commands may be blocked by overly broad patterns
- **Blocklist Maintenance**: Must update as new dangerous patterns discovered
- **Command Composition Limits**: No pipes, redirects, environment variables in MVP
- **Platform Differences**: Blocklist tuned for Unix/macOS, Windows needs different patterns
- **Permission Fatigue**: User must approve EVERY bash command (can be disruptive)

### Mitigation Strategies

**For false positives:**
- Test blocklist patterns extensively with common development workflows
- Provide clear error messages explaining why command blocked
- Allow user to report false positives via feedback mechanism
- Refine patterns based on user feedback in Epic 4

**For blocklist maintenance:**
- Document all blocked patterns with rationale
- Review security reports quarterly
- Add patterns based on OWASP command injection guidance
- Community feedback on dangerous patterns missed

**For command composition:**
- Epic 4 enhancement: Support pipes and redirects with additional validation
- Document limitations in user guide
- AI can work around limitations (multiple separate commands)

**For platform differences:**
- Epic 4 enhancement: Add Windows PowerShell support with separate blocklist
- Focus MVP on macOS/Linux (primary developer platforms)
- Detect platform and provide appropriate error messages

**For permission fatigue:**
- Consider "trust for this project" option in Epic 4 (with warnings)
- Group similar commands if possible (future)
- Educate users on risks vs. convenience trade-offs

---

## References

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [Node.js child_process.spawn()](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)
- Business Requirements: NFR-3 (Security)
- Epic 3 Plan: `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`
- [Shell Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
- Related ADRs:
  - ADR-008: Permission System UX Pattern
  - ADR-010: File Operation Tool Architecture
  - ADR-011: Directory Sandboxing Approach
- Implementation: `src/tools/BashTool.ts`
- Security Tests: `tests/security/bash-safety.test.ts`

---

**Last Updated**: 2026-01-19
