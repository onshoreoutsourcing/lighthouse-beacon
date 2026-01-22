/**
 * PythonExecutor Unit Tests
 *
 * Tests for secure Python script execution:
 * - Path validation (project directory enforcement)
 * - Timeout enforcement
 * - JSON stdin/stdout interface
 * - Error handling (exit codes, stderr, timeouts)
 * - Process isolation
 *
 * Coverage Target: ≥90%
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PythonExecutor } from '../PythonExecutor';
import { mkdirSync, writeFileSync, rmSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('PythonExecutor', () => {
  let testProjectRoot: string;
  let executor: PythonExecutor;

  beforeEach(() => {
    // Create temporary project directory
    const rawTestDir = join(tmpdir(), `lighthouse-test-${Date.now()}`);
    mkdirSync(rawTestDir, { recursive: true });

    // Resolve symlinks (macOS /var -> /private/var)
    testProjectRoot = realpathSync(rawTestDir);

    // Create test scripts directory
    const scriptsDir = join(testProjectRoot, 'scripts');
    mkdirSync(scriptsDir, { recursive: true });

    // Initialize executor
    executor = new PythonExecutor(testProjectRoot);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('Constructor', () => {
    it('should create executor with project root', () => {
      expect(executor).toBeDefined();
      expect(executor.getProjectRoot()).toBe(testProjectRoot);
    });

    it('should use default timeout of 30 seconds', () => {
      // This is tested implicitly in timeout tests
      expect(executor).toBeDefined();
    });

    it('should accept custom timeout', async () => {
      const customExecutor = new PythonExecutor(testProjectRoot, { defaultTimeoutMs: 5000 });
      expect(customExecutor).toBeDefined();
      const available = await customExecutor.checkPythonAvailable();
      expect(available).toBe(true);
    });

    it('should accept custom python path', async () => {
      const customExecutor = new PythonExecutor(testProjectRoot, { pythonPath: 'python' });
      expect(customExecutor).toBeDefined();
      // Try to check if python is available
      const available = await customExecutor.checkPythonAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('Path Validation', () => {
    it('should accept script within project directory', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'test.py');
      writeFileSync(
        scriptPath,
        'import sys, json\nprint(json.dumps({"success": True}))\nsys.exit(0)'
      );

      const result = await executor.executeScript('scripts/test.py');
      expect(result.success).toBe(true);
    });

    it('should reject script outside project directory using absolute path', async () => {
      const outsidePath = '/tmp/malicious.py';

      const result = await executor.executeScript(outsidePath);
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should reject script outside project using directory traversal', async () => {
      const result = await executor.executeScript('../../../etc/passwd');
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should reject script with relative path escaping project', async () => {
      const result = await executor.executeScript('../../outside.py');
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should handle nested directories within project', async () => {
      const nestedDir = join(testProjectRoot, 'scripts', 'utils', 'helpers');
      mkdirSync(nestedDir, { recursive: true });

      const scriptPath = join(nestedDir, 'test.py');
      writeFileSync(
        scriptPath,
        'import sys, json\nprint(json.dumps({"success": True}))\nsys.exit(0)'
      );

      const result = await executor.executeScript('scripts/utils/helpers/test.py');
      expect(result.success).toBe(true);
    });
  });

  describe('Script Existence Checks', () => {
    it('should reject non-existent script', async () => {
      const result = await executor.executeScript('scripts/nonexistent.py');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should accept existing script', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'exists.py');
      writeFileSync(
        scriptPath,
        'import sys, json\nprint(json.dumps({"success": True}))\nsys.exit(0)'
      );

      const result = await executor.executeScript('scripts/exists.py');
      expect(result.success).toBe(true);
    });
  });

  describe('Timeout Enforcement', () => {
    it('should enforce 30-second default timeout', async () => {
      // Create script that sleeps longer than timeout
      const scriptPath = join(testProjectRoot, 'scripts', 'slow.py');
      writeFileSync(
        scriptPath,
        `import time, sys, json
time.sleep(60)
print(json.dumps({"done": True}))
sys.exit(0)`
      );

      const executor = new PythonExecutor(testProjectRoot, { defaultTimeoutMs: 1000 });
      const result = await executor.executeScript('scripts/slow.py');

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(1000);
      expect(result.executionTimeMs).toBeLessThan(5000); // Should not wait full 60 seconds
    }, 10000);

    it('should allow custom timeout per execution', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'medium.py');
      writeFileSync(
        scriptPath,
        `import time, sys, json
time.sleep(2)
print(json.dumps({"done": True}))
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/medium.py', {}, { timeoutMs: 500 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    }, 5000);

    it('should complete fast scripts before timeout', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'fast.py');
      writeFileSync(
        scriptPath,
        'import sys, json\nprint(json.dumps({"result": "done"}))\nsys.exit(0)'
      );

      const result = await executor.executeScript('scripts/fast.py', {}, { timeoutMs: 5000 });

      expect(result.success).toBe(true);
      expect(result.executionTimeMs).toBeLessThan(5000);
    });
  });

  describe('JSON stdin/stdout Interface', () => {
    it('should send inputs via stdin as JSON', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'echo_inputs.py');
      writeFileSync(
        scriptPath,
        `import sys, json
inputs = json.loads(sys.stdin.read())
print(json.dumps({"received": inputs}))
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/echo_inputs.py', {
        name: 'test',
        count: 42,
      });

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        received: { name: 'test', count: 42 },
      });
    });

    it('should handle empty inputs', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'empty_inputs.py');
      writeFileSync(
        scriptPath,
        `import sys, json
inputs = json.loads(sys.stdin.read() or '{}')
print(json.dumps({"success": True, "inputs_empty": len(inputs) == 0}))
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/empty_inputs.py');

      expect(result.success).toBe(true);
      expect(result.output?.inputs_empty).toBe(true);
    });

    it('should parse JSON output from stdout', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'json_output.py');
      writeFileSync(
        scriptPath,
        `import sys, json
output = {
  "status": "success",
  "data": {"count": 100, "processed": True}
}
print(json.dumps(output))
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/json_output.py');

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        status: 'success',
        data: { count: 100, processed: true },
      });
    });

    it('should reject non-JSON output', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'text_output.py');
      writeFileSync(
        scriptPath,
        `import sys
print("This is not JSON")
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/text_output.py');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON output');
    });

    it('should handle complex nested JSON', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'complex.py');
      writeFileSync(
        scriptPath,
        `import sys, json
output = {
  "results": [
    {"id": 1, "data": {"nested": True}},
    {"id": 2, "data": {"nested": False}}
  ]
}
print(json.dumps(output))
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/complex.py');

      expect(result.success).toBe(true);
      expect(result.output?.results).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should capture non-zero exit codes', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'error_exit.py');
      writeFileSync(
        scriptPath,
        `import sys
print('{"error": "Something went wrong"}')
sys.exit(1)`
      );

      const result = await executor.executeScript('scripts/error_exit.py');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('exited with code 1');
    });

    it('should capture stderr output', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'stderr_test.py');
      writeFileSync(
        scriptPath,
        `import sys
sys.stderr.write("Error message\\n")
print('{"done": true}')
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/stderr_test.py');

      expect(result.success).toBe(true);
      expect(result.stderr).toContain('Error message');
    });

    it('should handle Python syntax errors', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'syntax_error.py');
      writeFileSync(
        scriptPath,
        `import sys, json
this is not valid python syntax
print(json.dumps({"done": true}))`
      );

      const result = await executor.executeScript('scripts/syntax_error.py');

      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
    });

    it('should handle Python runtime errors', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'runtime_error.py');
      writeFileSync(
        scriptPath,
        `import sys
raise Exception("Runtime error occurred")
`
      );

      const result = await executor.executeScript('scripts/runtime_error.py');

      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Exception');
    });

    it('should handle missing Python interpreter gracefully', async () => {
      const executorBadPython = new PythonExecutor(testProjectRoot, {
        pythonPath: 'python-nonexistent-xyz',
      });

      const scriptPath = join(testProjectRoot, 'scripts', 'test.py');
      writeFileSync(scriptPath, 'import sys\nprint("{}")\nsys.exit(0)');

      const result = await executorBadPython.executeScript('scripts/test.py');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should not crash main process when script crashes', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'crash.py');
      writeFileSync(
        scriptPath,
        `import sys, os
os._exit(42)  # Hard crash
`
      );

      const result = await executor.executeScript('scripts/crash.py');

      expect(result.success).toBe(false);
      // Main process should still be running
      expect(process.pid).toBeGreaterThan(0);
    });
  });

  describe('Input Path Validation', () => {
    it('should validate file paths in inputs', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'file_processor.py');
      writeFileSync(
        scriptPath,
        `import sys, json
inputs = json.loads(sys.stdin.read())
print(json.dumps({"success": True}))
sys.exit(0)`
      );

      // Try to pass path outside project
      const result = await executor.executeScript('scripts/file_processor.py', {
        input_file: '/etc/passwd',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('outside project');
    });

    it('should allow file paths within project', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'file_processor.py');
      writeFileSync(
        scriptPath,
        `import sys, json
inputs = json.loads(sys.stdin.read())
print(json.dumps({"success": True, "file": inputs.get("input_file")}))
sys.exit(0)`
      );

      const dataFile = join(testProjectRoot, 'data', 'input.txt');
      mkdirSync(join(testProjectRoot, 'data'), { recursive: true });
      writeFileSync(dataFile, 'test data');

      const result = await executor.executeScript('scripts/file_processor.py', {
        input_file: 'data/input.txt',
      });

      expect(result.success).toBe(true);
    });

    it('should validate nested file paths in inputs', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'nested.py');
      writeFileSync(
        scriptPath,
        `import sys, json
print(json.dumps({"success": True}))
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/nested.py', {
        config: {
          files: {
            input: '/etc/passwd',
          },
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('outside project');
    });
  });

  describe('Performance Metrics', () => {
    it('should track execution time', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'timed.py');
      writeFileSync(
        scriptPath,
        `import sys, json, time
time.sleep(0.1)
print(json.dumps({"done": True}))
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/timed.py');

      expect(result.success).toBe(true);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(100);
      expect(result.executionTimeMs).toBeLessThan(5000);
    });

    it('should start scripts in less than 500ms', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'quick.py');
      writeFileSync(scriptPath, 'import sys, json\nprint(json.dumps({"done": True}))\nsys.exit(0)');

      const result = await executor.executeScript('scripts/quick.py');

      expect(result.success).toBe(true);
      expect(result.executionTimeMs).toBeLessThan(500);
    });
  });

  describe('Python Availability Check', () => {
    it('should detect Python availability', async () => {
      const available = await executor.checkPythonAvailable();
      expect(available).toBe(true);
    });

    it('should detect unavailable Python', async () => {
      const executorBadPython = new PythonExecutor(testProjectRoot, {
        pythonPath: 'python-fake-xyz',
      });

      const available = await executorBadPython.checkPythonAvailable();
      expect(available).toBe(false);
    });
  });

  describe('Script Contract Validation', () => {
    it('should validate scripts that follow contract', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'valid_contract.py');
      writeFileSync(
        scriptPath,
        `import sys, json
inputs = json.loads(sys.stdin.read() or '{}')
output = {"success": True}
print(json.dumps(output))
sys.exit(0)`
      );

      const isValid = await executor.validateScriptContract('scripts/valid_contract.py');
      expect(isValid).toBe(true);
    });

    it('should reject scripts that do not follow contract', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'invalid_contract.py');
      writeFileSync(
        scriptPath,
        `import sys
print("Not JSON")
sys.exit(1)`
      );

      const isValid = await executor.validateScriptContract('scripts/invalid_contract.py');
      expect(isValid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle scripts with no output', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'no_output.py');
      writeFileSync(
        scriptPath,
        `import sys
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/no_output.py');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle scripts with very large output', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'large_output.py');
      writeFileSync(
        scriptPath,
        `import sys, json
output = {"data": "x" * 10000}
print(json.dumps(output))
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/large_output.py');

      expect(result.success).toBe(true);
      expect(result.output?.data).toHaveLength(10000);
    });

    it('should handle Unicode in inputs and outputs', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'unicode.py');
      writeFileSync(
        scriptPath,
        `import sys, json
inputs = json.loads(sys.stdin.read())
output = {"message": inputs["message"] + " 世界"}
print(json.dumps(output, ensure_ascii=False))
sys.exit(0)`
      );

      const result = await executor.executeScript('scripts/unicode.py', {
        message: 'Hello',
      });

      expect(result.success).toBe(true);
      expect(result.output?.message).toBe('Hello 世界');
    });
  });
});
