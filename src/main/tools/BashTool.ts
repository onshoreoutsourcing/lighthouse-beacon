/**
 * BashTool
 *
 * AI tool for executing shell commands with comprehensive security controls.
 * Blocks dangerous commands, enforces timeouts, and provides sandboxed execution.
 *
 * Security Features:
 * - Command blocklist (destructive, privilege escalation, remote execution)
 * - Working directory sandboxing (project root only)
 * - 60-second timeout with graceful termination
 * - Comprehensive SOC audit logging
 * - AI-friendly error messages
 *
 * Blocklist Categories:
 * - Destructive: rm -rf /, format, mkfs
 * - Privilege Escalation: sudo, su, doas
 * - Remote Execution: curl|bash, wget|sh
 * - Resource Exhaustion: fork bombs, while true loops
 * - System Modification: systemctl, apt-get with install/remove
 *
 * Usage:
 * const tool = new BashTool(projectRoot);
 * const result = await tool.execute({ command: 'npm test' }, context);
 */

import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import type {
  ToolDefinition,
  ToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult,
  ToolValidationError,
} from '@shared/types';
import { PathValidator } from './PathValidator';

/**
 * Bash tool parameters
 */
export interface BashParams {
  /** Shell command to execute */
  command: string;
  /** Optional working directory (relative to project root) */
  cwd?: string;
  /** Optional timeout in milliseconds (max 60000, default 60000) */
  timeout?: number;
}

/**
 * Bash execution result
 */
export interface BashResult {
  /** Command that was executed */
  command: string;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Exit code (0 = success, non-zero = error) */
  exitCode: number;
  /** Whether command was killed due to timeout */
  timedOut: boolean;
  /** Execution duration in milliseconds */
  duration: number;
}

/**
 * Blocklist pattern and reason
 */
interface BlocklistPattern {
  /** Regex pattern to match */
  pattern: RegExp;
  /** Human-readable reason for blocking */
  reason: string;
  /** Category for logging */
  category: string;
}

/**
 * BashTool implementation
 */
export class BashTool implements ToolExecutor {
  private static readonly DEFAULT_TIMEOUT_MS = 60000; // 60 seconds
  private static readonly MAX_TIMEOUT_MS = 60000; // Hard limit
  private static readonly KILL_SIGNAL_DELAY_MS = 2000; // Wait 2s before SIGKILL

  /**
   * Comprehensive command blocklist
   * Based on ADR-012 security specification
   *
   * Categories:
   * - Destructive (5 patterns): rm -rf, mkfs, dd, format, disk writes
   * - Privilege escalation (4 patterns): sudo, su, doas, pkexec
   * - Remote execution (10 patterns): curl|bash, wget|sh, eval, backticks, nc, base64 decode
   * - Resource exhaustion (3 patterns): fork bombs, infinite loops
   * - System modification (9 patterns): systemctl, packages, chmod, chown, crontab, at, nohup
   * - Command injection (5 patterns): hex/octal encoding, python -c, node -e, perl -e, ruby -e
   *
   * Total: 36 patterns
   */
  private static readonly BLOCKLIST: BlocklistPattern[] = [
    // Destructive commands
    {
      pattern: /\brm\s+(-[rf]*r[rf]*\s+|--recursive\s+)(\s*\/\s*|\s*\.\s*$|.*\/\*)/i,
      reason: 'rm -rf with dangerous targets (/, ., /*) is blocked',
      category: 'destructive',
    },
    {
      pattern: /\bmkfs\b/i,
      reason: 'Filesystem formatting (mkfs) is blocked',
      category: 'destructive',
    },
    {
      pattern: /\bdd\s+.*of=/i,
      reason: 'Direct disk write (dd) with output file is blocked',
      category: 'destructive',
    },
    {
      pattern: /\bformat\b/i,
      reason: 'Format command is blocked',
      category: 'destructive',
    },
    {
      pattern: />\s*\/dev\/(sda|hda|nvme)/i,
      reason: 'Direct write to disk devices is blocked',
      category: 'destructive',
    },

    // Privilege escalation
    {
      pattern: /\bsudo\b/i,
      reason: 'Privilege escalation via sudo is blocked',
      category: 'privilege_escalation',
    },
    {
      pattern: /\bsu\b/i,
      reason: 'Privilege escalation via su is blocked',
      category: 'privilege_escalation',
    },
    {
      pattern: /\bdoas\b/i,
      reason: 'Privilege escalation via doas is blocked',
      category: 'privilege_escalation',
    },
    {
      pattern: /\bpkexec\b/i,
      reason: 'Privilege escalation via pkexec is blocked',
      category: 'privilege_escalation',
    },

    // Remote execution
    {
      pattern: /curl\s+.*\|\s*(bash|sh|zsh|fish)/i,
      reason: 'Remote code execution via curl|bash is blocked',
      category: 'remote_execution',
    },
    {
      pattern: /wget\s+.*\|\s*(bash|sh|zsh|fish)/i,
      reason: 'Remote code execution via wget|sh is blocked',
      category: 'remote_execution',
    },
    {
      pattern: /curl\s+.*-o.*\|\s*(bash|sh)/i,
      reason: 'Remote code execution via curl download is blocked',
      category: 'remote_execution',
    },
    {
      pattern: /\beval\s*\$\(/i,
      reason: 'Command injection via eval is blocked',
      category: 'remote_execution',
    },
    {
      pattern: /`.*curl/i,
      reason: 'Backtick command substitution with curl is blocked',
      category: 'remote_execution',
    },
    {
      pattern: /`.*wget/i,
      reason: 'Backtick command substitution with wget is blocked',
      category: 'remote_execution',
    },
    {
      pattern: /base64\s+(-d|--decode).*\|\s*(bash|sh|zsh|fish)/i,
      reason: 'Base64 decode to shell is blocked',
      category: 'remote_execution',
    },
    {
      pattern: /\bnc\s+-[a-z]*l/i,
      reason: 'Network listener (nc -l) is blocked',
      category: 'remote_execution',
    },
    {
      pattern: /\bnetcat\s+-[a-z]*l/i,
      reason: 'Network listener (netcat -l) is blocked',
      category: 'remote_execution',
    },

    // Resource exhaustion / Fork bombs
    {
      pattern: /:\(\)\s*\{\s*:\|:&\s*\}/i,
      reason: 'Fork bomb pattern is blocked',
      category: 'resource_exhaustion',
    },
    {
      pattern: /while\s+true\s*;\s*do/i,
      reason: 'Infinite while loop is blocked',
      category: 'resource_exhaustion',
    },
    {
      pattern: /\bfork\(/i,
      reason: 'Direct fork() calls are blocked',
      category: 'resource_exhaustion',
    },

    // System modification
    {
      pattern: /\bsystemctl\s+(stop|disable|mask)/i,
      reason: 'System service modification is blocked',
      category: 'system_modification',
    },
    {
      pattern: /\bapt-get\s+(install|remove|purge)/i,
      reason: 'Package installation/removal requires manual execution',
      category: 'system_modification',
    },
    {
      pattern: /\byum\s+(install|remove|erase)/i,
      reason: 'Package installation/removal requires manual execution',
      category: 'system_modification',
    },
    {
      pattern: /\bbrew\s+(install|uninstall|remove)/i,
      reason: 'Package installation/removal requires manual execution',
      category: 'system_modification',
    },
    {
      pattern: /\bchmod\s+[0-7]*[0-7][0-7][0-7]\s+(\/|\.)/i,
      reason: 'Recursive chmod on root or current directory is blocked',
      category: 'system_modification',
    },
    {
      pattern: /\bchown\s+.*\s+(\/|\.)/i,
      reason: 'Ownership change on root or current directory is blocked',
      category: 'system_modification',
    },
    {
      pattern: /\bcrontab\s+-[a-z]*e/i,
      reason: 'Crontab editing is blocked',
      category: 'system_modification',
    },
    {
      pattern: /\bat\s+\d/i,
      reason: 'Scheduled command execution (at) is blocked',
      category: 'system_modification',
    },
    {
      pattern: /\bnohup\b/i,
      reason: 'Background processes that survive shell exit (nohup) are blocked',
      category: 'system_modification',
    },

    // Dangerous shell features
    {
      pattern: /\$\(.*curl/i,
      reason: 'Command substitution with curl is blocked',
      category: 'remote_execution',
    },
    {
      pattern: /\$\(.*wget/i,
      reason: 'Command substitution with wget is blocked',
      category: 'remote_execution',
    },

    // Command injection / Obfuscation
    {
      pattern: /\$'\\x/i,
      reason: 'Hex-encoded shell commands are blocked',
      category: 'command_injection',
    },
    {
      pattern: /\$'\\0[0-7]/i,
      reason: 'Octal-encoded shell commands are blocked',
      category: 'command_injection',
    },
    {
      pattern: /\bpython[23]?\s+-c\s+/i,
      reason: 'Arbitrary Python code execution (python -c) is blocked',
      category: 'command_injection',
    },
    {
      pattern: /\bnode\s+-e\s+/i,
      reason: 'Arbitrary Node.js code execution (node -e) is blocked',
      category: 'command_injection',
    },
    {
      pattern: /\bperl\s+-e\s+/i,
      reason: 'Arbitrary Perl code execution (perl -e) is blocked',
      category: 'command_injection',
    },
    {
      pattern: /\bruby\s+-e\s+/i,
      reason: 'Arbitrary Ruby code execution (ruby -e) is blocked',
      category: 'command_injection',
    },
  ];

  private projectRoot: string;
  private pathValidator: PathValidator;

  /**
   * Create BashTool instance
   *
   * @param projectRoot - Project root directory (must be absolute)
   */
  constructor(projectRoot: string) {
    if (!path.isAbsolute(projectRoot)) {
      throw new Error('Project root must be an absolute path');
    }
    this.projectRoot = path.normalize(projectRoot);
    this.pathValidator = new PathValidator(this.projectRoot);
  }

  /**
   * Get tool definition for AI
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'bash',
      description:
        'Execute shell commands in the project directory. ' +
        'Supports common development tasks like npm, git, node, and other CLI tools. ' +
        'Commands run in project root (or specified subdirectory) with 60-second timeout. ' +
        'Returns stdout, stderr, and exit code. ' +
        'SECURITY: Dangerous commands (rm -rf /, sudo, curl|bash, etc.) are blocked. ' +
        'Use for: running tests, git operations, building projects, checking status.',
      parameters: {
        command: {
          type: 'string',
          description:
            'Shell command to execute. ' +
            'Examples: "npm test", "git status", "node --version", "ls -la src". ' +
            'Note: Dangerous commands are blocked for security.',
          required: true,
        },
        cwd: {
          type: 'string',
          description:
            'Optional working directory (relative to project root). ' +
            'Example: "src" to run command in the src directory. ' +
            'Default: project root',
          required: false,
        },
        timeout: {
          type: 'number',
          description:
            'Optional timeout in milliseconds (max 60000). ' +
            'Command will be terminated if it runs longer. ' +
            'Default: 60000 (60 seconds)',
          required: false,
        },
      },
      requiredParameters: ['command'],
      permissionRequirement: 'always_prompt', // High-risk operation
      riskLevel: 'high',
    };
  }

  /**
   * Validate tool parameters
   */
  validate(parameters: Record<string, unknown>): ToolValidationError[] {
    const errors: ToolValidationError[] = [];

    // Validate command
    if (!parameters.command) {
      errors.push({
        parameter: 'command',
        message: 'Command is required',
        expected: 'non-empty string',
        received: String(parameters.command),
      });
    } else if (typeof parameters.command !== 'string') {
      errors.push({
        parameter: 'command',
        message: 'Command must be a string',
        expected: 'string',
        received: typeof parameters.command,
      });
    } else if (parameters.command.trim() === '') {
      errors.push({
        parameter: 'command',
        message: 'Command cannot be empty',
        expected: 'non-empty string',
        received: '""',
      });
    } else {
      // Check blocklist
      const blockResult = this.checkBlocklist(parameters.command);
      if (blockResult) {
        errors.push({
          parameter: 'command',
          message: blockResult.reason,
          expected: 'safe command',
          received: this.sanitizeCommand(parameters.command),
        });
      }
    }

    // Validate cwd if provided
    if (parameters.cwd !== undefined) {
      if (typeof parameters.cwd !== 'string') {
        errors.push({
          parameter: 'cwd',
          message: 'Working directory must be a string',
          expected: 'string (path relative to project root)',
          received: typeof parameters.cwd,
        });
      } else {
        const validation = this.pathValidator.validate(parameters.cwd);
        if (!validation.isValid) {
          errors.push({
            parameter: 'cwd',
            message: `Working directory path is invalid: ${validation.error}`,
            expected: 'path within project root',
            received: parameters.cwd,
          });
        }
      }
    }

    // Validate timeout if provided
    if (parameters.timeout !== undefined) {
      if (typeof parameters.timeout !== 'number') {
        errors.push({
          parameter: 'timeout',
          message: 'Timeout must be a number',
          expected: 'number (milliseconds)',
          received: typeof parameters.timeout,
        });
      } else if (parameters.timeout <= 0) {
        errors.push({
          parameter: 'timeout',
          message: 'Timeout must be positive',
          expected: 'positive number',
          received: String(parameters.timeout),
        });
      } else if (parameters.timeout > BashTool.MAX_TIMEOUT_MS) {
        errors.push({
          parameter: 'timeout',
          message: `Timeout cannot exceed ${BashTool.MAX_TIMEOUT_MS}ms`,
          expected: `<= ${BashTool.MAX_TIMEOUT_MS}`,
          received: String(parameters.timeout),
        });
      }
    }

    return errors;
  }

  /**
   * Execute shell command
   */
  async execute(
    parameters: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Validate parameters
      const validationErrors = this.validate(parameters);
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map((e) => `${e.parameter}: ${e.message}`)
          .join(', ');

        // SOC logging for blocked/invalid commands
        console.error(
          `[BashTool] Validation failed - ${errorMessages} | ` +
            `Command: "${this.sanitizeCommand(String(parameters.command))}" | ` +
            `Context: ${context.conversationId || 'no-conversation'}`
        );

        return {
          success: false,
          error: `Command validation failed: ${errorMessages}`,
          duration: Date.now() - startTime,
        };
      }

      const params = parameters as unknown as BashParams;
      const timeout = params.timeout || BashTool.DEFAULT_TIMEOUT_MS;

      // Determine working directory
      let workingDir = this.projectRoot;
      if (params.cwd) {
        const validation = this.pathValidator.validate(params.cwd);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Invalid working directory: ${validation.error}`,
            duration: Date.now() - startTime,
          };
        }
        workingDir = validation.absolutePath!;
      }

      // Execute command
      const result = await this.executeCommand(params.command, workingDir, timeout);

      const duration = Date.now() - startTime;

      // SOC logging for successful execution
      // eslint-disable-next-line no-console
      console.log(
        `[BashTool] Executed - Command: "${this.sanitizeCommand(params.command)}" | ` +
          `Exit code: ${result.exitCode} | ` +
          `Timed out: ${result.timedOut} | ` +
          `Duration: ${result.duration}ms | ` +
          `CWD: "${params.cwd || '(root)'}" | ` +
          `Context: ${context.conversationId || 'no-conversation'}`
      );

      return {
        success: true,
        data: result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // SOC logging for errors
      console.error(
        `[BashTool] Error - ${errorMessage} | ` +
          `Command: "${this.sanitizeCommand(String(parameters.command))}" | ` +
          `Duration: ${duration}ms | ` +
          `Context: ${context.conversationId || 'no-conversation'}`
      );

      return {
        success: false,
        error: `Command execution failed: ${errorMessage}`,
        duration,
      };
    }
  }

  /**
   * Check if command matches blocklist
   *
   * @param command - Command to check
   * @returns Block result if matched, null if allowed
   */
  private checkBlocklist(
    command: string
  ): { reason: string; category: string; pattern: string } | null {
    for (const block of BashTool.BLOCKLIST) {
      if (block.pattern.test(command)) {
        return {
          reason: block.reason,
          category: block.category,
          pattern: block.pattern.source,
        };
      }
    }
    return null;
  }

  /**
   * Execute command as child process
   *
   * @param command - Command to execute
   * @param cwd - Working directory
   * @param timeoutMs - Timeout in milliseconds
   * @returns Execution result with stdout, stderr, exit code
   */
  private async executeCommand(
    command: string,
    cwd: string,
    timeoutMs: number
  ): Promise<BashResult> {
    const startTime = Date.now();

    return new Promise<BashResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let processKilled = false;

      // Spawn shell process
      const childProcess: ChildProcess = spawn(command, {
        cwd,
        shell: true,
        timeout: timeoutMs,
      });

      // Capture stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Capture stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Set up timeout handler
      // eslint-disable-next-line no-undef
      const timeoutHandle = setTimeout(() => {
        if (!processKilled) {
          timedOut = true;

          console.warn(
            `[BashTool] Command timeout (${timeoutMs}ms) - sending SIGTERM: "${this.sanitizeCommand(command)}"`
          );

          // Try graceful shutdown with SIGTERM
          childProcess.kill('SIGTERM');

          // Force kill with SIGKILL after delay
          // eslint-disable-next-line no-undef
          setTimeout(() => {
            if (!processKilled) {
              console.warn(
                `[BashTool] SIGTERM failed - sending SIGKILL: "${this.sanitizeCommand(command)}"`
              );
              childProcess.kill('SIGKILL');
            }
          }, BashTool.KILL_SIGNAL_DELAY_MS);
        }
      }, timeoutMs);

      // Handle process exit
      childProcess.on('close', (code, signal) => {
        processKilled = true;
        // eslint-disable-next-line no-undef
        clearTimeout(timeoutHandle);

        const duration = Date.now() - startTime;
        const exitCode = code ?? (signal ? 1 : 0);

        resolve({
          command,
          stdout,
          stderr,
          exitCode,
          timedOut,
          duration,
        });
      });

      // Handle spawn errors
      childProcess.on('error', (error) => {
        processKilled = true;
        // eslint-disable-next-line no-undef
        clearTimeout(timeoutHandle);

        const duration = Date.now() - startTime;

        resolve({
          command,
          stdout,
          stderr: stderr + '\n' + error.message,
          exitCode: 1,
          timedOut: false,
          duration,
        });
      });
    });
  }

  /**
   * Sanitize command for logging (truncate long commands)
   *
   * @param command - Command to sanitize
   * @returns Sanitized command string
   */
  private sanitizeCommand(command: string): string {
    const MAX_LENGTH = 200;
    if (command.length > MAX_LENGTH) {
      return command.substring(0, MAX_LENGTH) + '... (truncated)';
    }
    return command;
  }
}
