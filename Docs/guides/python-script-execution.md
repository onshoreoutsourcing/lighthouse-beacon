# Python Script Execution Guide

**Version:** 1.0
**Date:** 2026-01-21
**Status:** Active

## Overview

The PythonExecutor service provides secure Python script execution for Lighthouse workflows. Scripts execute in isolated processes with path validation, timeout enforcement, and JSON-based communication.

## Features

### Security

- **Path Validation**: Scripts can only access files within project directory
- **Directory Traversal Prevention**: Rejects `../` attempts and absolute paths outside project
- **Timeout Enforcement**: Default 30-second timeout prevents infinite loops
- **Process Isolation**: Scripts run in separate process, crashes don't affect main app
- **Input Validation**: All file paths in inputs are validated before execution

### Communication

- **JSON stdin/stdout Interface**: Structured data exchange via JSON
- **Error Handling**: Captures exit codes, stderr, and execution metrics
- **Performance Tracking**: Records execution time for monitoring

### Reliability

- **Python Detection**: Checks Python availability before execution
- **Contract Validation**: Verify scripts follow expected interface
- **Comprehensive Error Messages**: Clear feedback for debugging

## Quick Start

### 1. Install Python 3.8+

PythonExecutor requires Python 3.8 or higher installed on your system.

**Check installation:**
```bash
python3 --version
# Should output: Python 3.8.x or higher
```

**Installation guides:**
- **macOS**: `brew install python3`
- **Ubuntu/Debian**: `sudo apt install python3`
- **Windows**: Download from [python.org](https://python.org)

### 2. Create a Python Script

Use the provided template as a starting point:

```python
#!/usr/bin/env python3
import sys
import json

def main(inputs):
    name = inputs.get('name', 'World')

    return {
        'success': True,
        'message': f'Hello, {name}!'
    }

if __name__ == '__main__':
    input_data = sys.stdin.read()
    inputs = json.loads(input_data) if input_data else {}

    try:
        output = main(inputs)
        print(json.dumps(output))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)
```

Save this to `scripts/hello.py` in your project directory.

### 3. Execute the Script

```typescript
import { PythonExecutor } from '@/main/services/workflow';

// Create executor for your project
const executor = new PythonExecutor('/path/to/project');

// Execute script with inputs
const result = await executor.executeScript('scripts/hello.py', {
  name: 'Lighthouse'
});

// Check result
if (result.success) {
  console.log('Output:', result.output);
  // Output: { success: true, message: 'Hello, Lighthouse!' }
} else {
  console.error('Error:', result.error);
  console.error('Exit code:', result.exitCode);
}
```

## API Reference

### PythonExecutor

#### Constructor

```typescript
constructor(
  projectRoot: string,
  options?: {
    defaultTimeoutMs?: number;
    pythonPath?: string;
  }
)
```

**Parameters:**
- `projectRoot`: Absolute path to project root directory (required)
- `options.defaultTimeoutMs`: Default timeout in milliseconds (default: 30000)
- `options.pythonPath`: Path to Python interpreter (default: 'python3')

**Example:**
```typescript
const executor = new PythonExecutor('/path/to/project', {
  defaultTimeoutMs: 60000, // 1 minute timeout
  pythonPath: 'python3.11'
});
```

#### executeScript()

```typescript
async executeScript(
  scriptPath: string,
  inputs?: Record<string, unknown>,
  options?: PythonExecutionOptions
): Promise<PythonExecutionResult>
```

**Parameters:**
- `scriptPath`: Path to Python script (relative to project root)
- `inputs`: Input data to send via stdin as JSON (optional)
- `options.timeoutMs`: Override default timeout for this execution
- `options.pythonPath`: Override default Python interpreter path
- `options.args`: Additional command-line arguments

**Returns:** `PythonExecutionResult`
- `success`: boolean - Whether execution succeeded
- `output`: Record<string, unknown> - Parsed JSON output (if success)
- `error`: string - Error message (if failure)
- `exitCode`: number - Script exit code
- `stderr`: string - Standard error output
- `executionTimeMs`: number - Execution time in milliseconds

**Example:**
```typescript
const result = await executor.executeScript(
  'scripts/process_data.py',
  {
    input_file: 'data/raw.csv',
    output_file: 'data/processed.json',
    threshold: 100
  },
  {
    timeoutMs: 120000 // 2 minute timeout for this script
  }
);
```

#### checkPythonAvailable()

```typescript
async checkPythonAvailable(): Promise<boolean>
```

Check if Python interpreter is available on the system.

**Returns:** `true` if Python is available, `false` otherwise

**Example:**
```typescript
const available = await executor.checkPythonAvailable();
if (!available) {
  console.error('Python 3 is not installed. Please install from python.org');
}
```

#### validateScriptContract()

```typescript
async validateScriptContract(scriptPath: string): Promise<boolean>
```

Validate that a script follows the expected contract (accepts JSON inputs, returns JSON outputs).

**Parameters:**
- `scriptPath`: Path to Python script (relative to project root)

**Returns:** `true` if script appears to follow contract, `false` otherwise

**Example:**
```typescript
const isValid = await executor.validateScriptContract('scripts/my_script.py');
if (!isValid) {
  console.warn('Script may not follow expected contract');
}
```

## Script Contract

### Required Elements

All Python scripts must follow this contract:

1. **Read inputs from stdin as JSON**
2. **Write outputs to stdout as JSON**
3. **Use `sys.exit(0)` for success**
4. **Use `sys.exit(1)` for errors**
5. **Include error handling**

### Input Format

Scripts receive inputs via stdin as JSON:

```python
import sys
import json

input_data = sys.stdin.read()
inputs = json.loads(input_data) if input_data else {}

# Access inputs
name = inputs.get('name', 'default')
threshold = inputs.get('threshold', 10)
```

### Output Format

Scripts must write JSON to stdout:

```python
import json

output = {
    'success': True,
    'processed_count': 100,
    'output_file': 'data/result.json'
}

print(json.dumps(output))
sys.exit(0)
```

### Error Handling

Always handle errors and return structured error information:

```python
try:
    output = main(inputs)
    print(json.dumps(output))
    sys.exit(0)
except Exception as e:
    error_output = {
        'success': False,
        'error': str(e),
        'error_type': type(e).__name__
    }
    print(json.dumps(error_output))
    sys.exit(1)
```

## Security Best Practices

### File Access

✅ **DO:**
- Use relative paths from project root
- Access files provided via inputs
- Read/write within project directory

```python
# Good - uses path from inputs
input_file = inputs['input_file']
with open(input_file, 'r') as f:
    data = f.read()
```

❌ **DON'T:**
- Access system files
- Use absolute paths outside project
- Attempt directory traversal

```python
# Bad - tries to access system file
with open('/etc/passwd', 'r') as f:  # Will be rejected
    data = f.read()

# Bad - directory traversal
with open('../../../sensitive.txt', 'r') as f:  # Will be rejected
    data = f.read()
```

### Resource Usage

✅ **DO:**
- Complete processing within timeout (default 30 seconds)
- Handle large datasets in chunks
- Clean up temporary files

❌ **DON'T:**
- Create infinite loops
- Load entire large files into memory
- Spawn subprocess without timeout

### Input Validation

✅ **DO:**
- Validate all inputs before processing
- Check file existence before opening
- Handle missing/invalid inputs gracefully

```python
def validate_inputs(inputs):
    if 'input_file' not in inputs:
        raise ValueError('Missing required input: input_file')

    if 'threshold' in inputs:
        threshold = inputs['threshold']
        if not isinstance(threshold, (int, float)):
            raise ValueError('threshold must be a number')
```

## Common Patterns

### File Processing

```python
#!/usr/bin/env python3
import sys
import json
import os

def process_file(inputs):
    input_file = inputs['input_file']
    output_file = inputs['output_file']

    # Read input
    with open(input_file, 'r') as f:
        data = f.read()

    # Process data
    processed = data.upper()  # Example processing

    # Write output
    with open(output_file, 'w') as f:
        f.write(processed)

    return {
        'success': True,
        'input_size': len(data),
        'output_file': output_file
    }

if __name__ == '__main__':
    input_data = sys.stdin.read()
    inputs = json.loads(input_data) if input_data else {}

    try:
        output = process_file(inputs)
        print(json.dumps(output))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)
```

### Data Transformation

```python
#!/usr/bin/env python3
import sys
import json

def transform_data(inputs):
    items = inputs.get('items', [])
    operation = inputs.get('operation', 'uppercase')

    if operation == 'uppercase':
        transformed = [item.upper() for item in items]
    elif operation == 'lowercase':
        transformed = [item.lower() for item in items]
    else:
        raise ValueError(f'Unknown operation: {operation}')

    return {
        'success': True,
        'transformed': transformed,
        'count': len(transformed)
    }

if __name__ == '__main__':
    input_data = sys.stdin.read()
    inputs = json.loads(input_data) if input_data else {}

    try:
        output = transform_data(inputs)
        print(json.dumps(output))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)
```

### API Calls

```python
#!/usr/bin/env python3
import sys
import json
import urllib.request

def call_api(inputs):
    url = inputs['api_url']

    # Make API request
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read())

    # Process response
    result = {
        'success': True,
        'data': data,
        'status': 'completed'
    }

    return result

if __name__ == '__main__':
    input_data = sys.stdin.read()
    inputs = json.loads(input_data) if input_data else {}

    try:
        output = call_api(inputs)
        print(json.dumps(output))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)
```

## Troubleshooting

### Python Not Found

**Error:** `Python interpreter not found: python3`

**Solution:**
1. Install Python 3.8+ from [python.org](https://python.org)
2. Verify installation: `python3 --version`
3. If using custom path, specify in constructor:
   ```typescript
   const executor = new PythonExecutor('/path/to/project', {
     pythonPath: '/usr/local/bin/python3.11'
   });
   ```

### Script Timeout

**Error:** `Script execution timed out after 30000ms`

**Solution:**
1. Optimize script performance
2. Increase timeout for this script:
   ```typescript
   const result = await executor.executeScript('scripts/slow.py', inputs, {
     timeoutMs: 120000 // 2 minutes
   });
   ```
3. Process large datasets in chunks

### Path Validation Failed

**Error:** `Script path validation failed: Path is outside project root`

**Solution:**
1. Use relative paths from project root:
   ```typescript
   // Good
   await executor.executeScript('scripts/process.py', {
     input_file: 'data/input.csv'
   });

   // Bad - absolute path
   await executor.executeScript('/etc/scripts/process.py', {});
   ```
2. Ensure all file paths in inputs are within project directory

### Invalid JSON Output

**Error:** `Invalid JSON output from script`

**Solution:**
1. Ensure script outputs valid JSON to stdout
2. Don't print debug messages to stdout (use stderr)
3. Test JSON output:
   ```bash
   echo '{}' | python3 scripts/my_script.py | python3 -m json.tool
   ```

### Script Errors

**Error:** `Script exited with code 1`

**Solution:**
1. Check stderr for Python error messages:
   ```typescript
   if (!result.success) {
     console.error('Script error:', result.error);
     console.error('Stderr:', result.stderr);
   }
   ```
2. Test script manually:
   ```bash
   echo '{"test": "data"}' | python3 scripts/my_script.py
   ```
3. Add comprehensive error handling to script

## Performance Tips

### Optimize Script Startup

- Minimize imports (only import what you need)
- Avoid expensive initialization
- Use built-in libraries when possible

### Handle Large Files

```python
# Good - process in chunks
with open(large_file, 'r') as f:
    for line in f:  # Read line by line
        process(line)

# Bad - load entire file
with open(large_file, 'r') as f:
    data = f.read()  # Loads entire file into memory
```

### Monitor Execution Time

```typescript
const result = await executor.executeScript('scripts/process.py', inputs);

console.log(`Execution time: ${result.executionTimeMs}ms`);

if (result.executionTimeMs > 5000) {
  console.warn('Script taking longer than expected');
}
```

## Additional Resources

- **Template:** `/Docs/guides/python-script-template.py`
- **Architecture:** `/Docs/architecture/decisions/ADR-016-python-script-execution-security.md`
- **Examples:** `/src/main/services/workflow/__tests__/PythonExecutor.integration.test.ts`

## Support

For issues or questions:
1. Check this documentation
2. Review example scripts in test files
3. Consult ADR-016 for security considerations
4. Test scripts manually before integrating

---

**Last Updated:** 2026-01-21
**Version:** 1.0
