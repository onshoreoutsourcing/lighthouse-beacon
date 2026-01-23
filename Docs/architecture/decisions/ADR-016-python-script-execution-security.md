# ADR-016: Python Script Execution Security Strategy

**Status**: Accepted
**Date**: 2026-01-21
**Deciders**: Lighthouse Development Team
**Related**: Epic 9 (Workflow Generator), ADR-011 (Directory Sandboxing), ADR-012 (Bash Command Safety)

---

## Context

Epic 9 Workflow Generator enables users to create workflows that execute Python scripts as part of automation sequences. These scripts:
- Read/write files in the project directory
- Process data from previous workflow steps (via stdin JSON)
- Call external APIs or perform computations
- Return results to subsequent workflow steps (via stdout JSON)

**Security Challenge**: Executing user-defined Python scripts introduces security risks:
- Malicious scripts could access sensitive files outside project directory
- Infinite loops or resource-intensive operations could hang the application
- Scripts could execute arbitrary system commands
- Unvalidated file paths could lead to directory traversal attacks
- Scripts could consume excessive memory or CPU

**Requirements:**
- Execute Python scripts safely within project context
- Prevent access to files outside project directory
- Limit execution time to prevent infinite loops
- Provide clear feedback when scripts violate security policies
- Maintain usability (don't block legitimate use cases)
- Follow principle of least privilege

**Constraints:**
- Must work on Windows, macOS, Linux (cross-platform)
- Cannot require Docker or containerization (adds complexity)
- Must integrate with existing permission system (ADR-008)
- Must work with existing file operation sandboxing (ADR-011)
- Python must be installed on user's system (reasonable requirement for workflows)

**Related Decisions:**
- ADR-011: Directory sandboxing already validates file paths
- ADR-012: Bash command safety provides patterns for subprocess execution
- ADR-008: Permission system provides user consent patterns

---

## Considered Options

- **Option 1: Path Validation + Process Isolation + Timeouts** - Validate paths, run scripts in separate process, enforce timeouts
- **Option 2: Docker Container Execution** - Execute scripts in isolated Docker containers
- **Option 3: Python Sandbox (RestrictedPython)** - Use Python sandboxing library to restrict dangerous operations
- **Option 4: WebAssembly (Pyodide)** - Run Python in browser via WebAssembly
- **Option 5: Remote Execution Service** - Execute scripts on remote server
- **Option 6: Do Nothing** - Execute scripts without additional security measures

---

## Decision

**We have decided to use path validation, process isolation, and timeout enforcement as our Python script execution security strategy, with future option to add Docker container isolation if needed.**

### Why This Choice

This approach provides adequate security for trusted user workflows while maintaining simplicity and cross-platform compatibility.

**Key factors:**

1. **Path Validation** (Leverage existing ADR-011):
   - Scripts can only access files within project directory
   - Use existing `PathValidator` from file operation tools
   - Prevents directory traversal attacks (`../../../etc/passwd`)
   - Validates all file paths in script inputs before execution

2. **Process Isolation**:
   - Scripts run in separate Node.js child process
   - Script cannot access main application memory or state
   - Script termination doesn't crash main application
   - Standard stdin/stdout JSON communication (validated by Kestra research)

3. **Timeout Enforcement**:
   - Default 30-second timeout per script
   - Prevents infinite loops from hanging application
   - User-configurable per workflow step
   - Automatic process termination on timeout

4. **Permission Prompts** (Leverage existing ADR-008):
   - User approves workflows before execution
   - Permission modal shows script path and operation details
   - Batch approval for entire workflow (not per-step)
   - User can review scripts in Monaco editor before approval

5. **Script Review UI**:
   - Monaco editor displays script contents before execution
   - Syntax highlighting for Python code
   - User can edit/review before approving workflow
   - Clear indication of which scripts will execute

**Implementation approach:**

```typescript
// src/main/services/PythonExecutor.ts
import { spawn } from 'node:child_process';
import { PathValidator } from './PathValidator';

export class PythonExecutor {
  private pathValidator: PathValidator;

  constructor(projectRoot: string) {
    this.pathValidator = new PathValidator(projectRoot);
  }

  async executeScript(
    scriptPath: string,
    inputs: Record<string, any>,
    options: { timeout?: number } = {}
  ): Promise<PythonResult> {
    // 1. Validate script path (must be in project directory)
    if (!this.pathValidator.isPathSafe(scriptPath)) {
      throw new Error(`Script path outside project directory: ${scriptPath}`);
    }

    // 2. Validate input file paths (if any)
    this.validateInputPaths(inputs);

    // 3. Spawn isolated Python process
    const timeout = options.timeout || 30000; // 30 seconds default
    const python = spawn('python3', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout,
    });

    // 4. Send inputs via stdin (JSON)
    python.stdin.write(JSON.stringify(inputs));
    python.stdin.end();

    // 5. Collect outputs
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`Invalid JSON output: ${stdout}`));
          }
        } else {
          reject(new Error(`Script exited with code ${code}: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to execute script: ${error.message}`));
      });

      // Timeout handling (kill process)
      setTimeout(() => {
        if (!python.killed) {
          python.kill('SIGTERM');
          reject(new Error(`Script timeout after ${timeout}ms`));
        }
      }, timeout);
    });
  }

  private validateInputPaths(inputs: Record<string, any>): void {
    // Recursively validate any file paths in inputs
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string' && this.looksLikeFilePath(value)) {
        if (!this.pathValidator.isPathSafe(value)) {
          throw new Error(`Input path outside project directory: ${value}`);
        }
      }
    }
  }

  private looksLikeFilePath(value: string): boolean {
    // Heuristic: looks like file path if contains / or \ and file extension
    return /[/\\]/.test(value) && /\.\w+$/.test(value);
  }
}
```

**Python script contract with security considerations:**

```python
#!/usr/bin/env python3
"""
Workflow Script: Process Data

SECURITY:
- Only access files within project directory
- Use relative paths or paths provided via inputs
- Do not access system files (/etc/, C:\Windows\, etc.)
- Script will be terminated after 30 seconds

Inputs:
  - data_file: string (path to data file)
  - output_file: string (path to output file)

Outputs:
  - processed_count: integer
"""

import sys
import json
import os

def main(inputs: dict) -> dict:
    try:
        data_file = inputs['data_file']
        output_file = inputs['output_file']

        # Scripts receive inputs, process data, return outputs
        # Path validation handled by PythonExecutor before execution
        # Timeout handled by PythonExecutor (script killed after 30s)

        # ... process data ...

        return {
            'success': True,
            'processed_count': 100
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    input_data = sys.stdin.read()
    inputs = json.loads(input_data) if input_data else {}

    outputs = main(inputs)

    print(json.dumps(outputs, indent=2))
    sys.exit(0 if outputs.get('success', True) else 1)
```

**Permission integration:**

```typescript
// src/main/services/WorkflowService.ts
async executeWorkflow(workflowPath: string): Promise<WorkflowResult> {
  const workflow = await this.loadWorkflow(workflowPath);

  // Analyze workflow for Python scripts
  const pythonSteps = workflow.steps.filter(s => s.type === 'python');

  if (pythonSteps.length > 0) {
    // Request batch permission for all Python scripts in workflow
    const approved = await this.permissionService.requestBatchPermission({
      operation: 'workflow.execute',
      context: `Workflow: ${workflow.name}`,
      details: {
        pythonScripts: pythonSteps.map(s => s.script),
        message: `This workflow will execute ${pythonSteps.length} Python script(s). Scripts can only access files within the project directory and will timeout after 30 seconds.`
      }
    });

    if (!approved) {
      return { success: false, error: 'Workflow execution denied by user' };
    }
  }

  // Execute workflow
  return await this.doExecuteWorkflow(workflow);
}
```

**Why we rejected alternatives:**

- **Docker Containers**: Adds significant complexity (Docker installation, container management, cross-platform issues), overkill for trusted user workflows executing their own scripts in their own projects. Future enhancement if needed.

- **RestrictedPython**: Python-specific sandboxing that's difficult to configure correctly, breaks many legitimate use cases (file I/O, imports), maintenance burden, doesn't prevent resource exhaustion.

- **WebAssembly (Pyodide)**: Limited Python stdlib support, large bundle size (~50MB), poor performance for compute-intensive tasks, doesn't integrate well with native file system.

- **Remote Execution**: Requires server infrastructure, latency issues, complexity of managing remote environment, user data leaves local machine (privacy concern), dependency on network connectivity.

- **Do Nothing**: Unacceptable security risk - user could accidentally run malicious scripts, no protection against infinite loops or directory traversal.

---

## Consequences

### Positive

- **Simple Implementation**: Leverages existing `PathValidator` and permission system, ~200 lines of code
- **Cross-Platform**: Works on Windows, macOS, Linux (anywhere Node.js + Python run)
- **No External Dependencies**: No Docker, containers, or additional infrastructure needed
- **Performance**: Native Python execution (no virtualization overhead)
- **Familiar Pattern**: Similar to Bash tool safety (ADR-012), consistent with Lighthouse architecture
- **User Control**: Clear permission prompts, ability to review scripts before execution
- **Timeout Protection**: Prevents infinite loops from hanging application

### Negative

- **Python Dependency**: Requires Python 3 installed on user's system
  - Mitigation: Check Python availability on startup, show clear error if missing
  - Acceptable: Workflows are advanced feature for technical users

- **Limited Resource Isolation**: Script can still consume CPU/memory on user's machine
  - Mitigation: Timeout terminates runaway processes (30s default)
  - Acceptable: User is executing their own scripts in their own project
  - Future: Add memory/CPU monitoring if needed

- **No True Sandbox**: Script could theoretically execute system commands if intentionally malicious
  - Mitigation: Path validation prevents file access outside project
  - Mitigation: Permission prompts require user approval
  - Mitigation: Monaco editor shows script contents before execution
  - Acceptable: User is running scripts they created or reviewed
  - Threat model: Protecting against accidents, not malicious users attacking themselves

- **Stdout Parsing Fragility**: Scripts must output valid JSON to stdout
  - Mitigation: Clear error messages if JSON parsing fails
  - Mitigation: Script contract documentation and examples
  - Mitigation: Script validator (Epic 9 Phase 2) checks contract compliance

### Security Threat Model

**In Scope (Protected Against):**
- ✅ Accidental directory traversal (path validation)
- ✅ Infinite loops (timeout enforcement)
- ✅ Access to files outside project (path validation)
- ✅ Application crashes from script errors (process isolation)
- ✅ Running untrusted scripts without review (permission prompts + Monaco review)

**Out of Scope (Acceptable Risk):**
- ⚠️ User intentionally running malicious scripts they created (user attacking themselves)
- ⚠️ High CPU/memory usage within timeout window (user's own machine, their responsibility)
- ⚠️ Scripts with malicious dependencies (pip install) (user responsible for dependencies)

**Threat Model Rationale:**
Lighthouse workflows are designed for **trusted user scripts in trusted projects**. The user:
- Creates the scripts themselves OR reviews scripts before running
- Executes scripts in their own project directory on their own machine
- Has full visibility into what scripts do (Monaco editor review)
- Approves execution explicitly via permission prompt

This is fundamentally different from executing untrusted third-party code. The security measures protect against **accidents** (infinite loops, wrong file paths), not malicious intent.

### Mitigation Strategies

**For Python dependency:**
- Check Python availability on first workflow execution:
  ```typescript
  const pythonVersion = await checkPythonInstalled();
  if (!pythonVersion) {
    throw new Error('Python 3 is required for workflows. Install: https://python.org');
  }
  ```
- Show clear installation instructions
- Document Python requirement in workflow documentation

**For resource isolation:**
- Monitor execution time, warn if scripts consistently timeout
- Log resource usage (future enhancement):
  ```typescript
  const usage = process.resourceUsage();
  logger.info('[Workflow] Script resource usage', {
    scriptPath,
    cpu: usage.userCPUTime,
    memory: usage.maxRSS
  });
  ```
- If resource issues arise, add Docker container option (Phase 2 enhancement)

**For stdout parsing:**
- Provide script template with correct JSON output format
- Script validator (Epic 9 Phase 2) checks contract compliance
- Clear error messages:
  ```
  Error: Script output invalid JSON
  Expected: { "success": true, "outputs": {...} }
  Received: <script output>
  ```

**For security concerns:**
- Comprehensive documentation on script security
- Clear warnings in workflow creation UI
- Best practice examples (never access system files, use relative paths)
- Future: Add security linter for Python scripts (check for dangerous patterns)

---

## Future Enhancements

**Phase 2 Enhancements (If Needed):**

1. **Docker Container Isolation** (if user requests it):
   - Optional setting: "Run scripts in Docker containers"
   - Isolates scripts from host system
   - Prevents resource exhaustion
   - Trade-off: Requires Docker, slower execution, complex setup

2. **Resource Monitoring**:
   - Track CPU/memory usage per script
   - Warn if scripts exceed thresholds
   - Automatic termination if excessive resource usage

3. **Script Security Linter**:
   - Analyze Python scripts for dangerous patterns
   - Warn about `os.system()`, `subprocess.run()`, etc.
   - Suggest safer alternatives

4. **Script Sandboxing Library**:
   - Investigate Python sandboxing options
   - Only if Docker overhead unacceptable
   - Requires careful evaluation of trade-offs

**Decision Criteria for Docker:**
- User requests it for security (handling untrusted scripts)
- Security audit identifies risks in current approach
- Users report resource exhaustion issues

---

## References

- [Kestra Python Integration](https://kestra.io/features/code-in-any-language/python) (validates stdin/stdout JSON pattern)
- [Node.js child_process.spawn](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)
- Epic 9: [Workflow Generator Implementation Plan](../../planning/epic-9-workflow-generator-implementation.md)
- Related ADRs:
  - [ADR-011: Directory Sandboxing Approach](./ADR-011-directory-sandboxing-approach.md) (path validation patterns)
  - [ADR-012: Bash Command Safety Strategy](./ADR-012-bash-command-safety-strategy.md) (subprocess execution patterns)
  - [ADR-008: Permission System UX Pattern](./ADR-008-permission-system-ux-pattern.md) (user consent patterns)
- Security Research:
  - [OWASP Command Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
  - [Subprocess Security Best Practices](https://security.openstack.org/guidelines/dg_use-subprocess-securely.html)
- Implementation:
  - `src/main/services/PythonExecutor.ts` (script execution)
  - `src/main/services/PathValidator.ts` (path validation, from ADR-011)
  - `src/main/services/WorkflowService.ts` (permission integration)

---

**Last Updated**: 2026-01-21
