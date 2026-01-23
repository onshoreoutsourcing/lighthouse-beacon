/**
 * PythonExecutor Integration Tests
 *
 * Integration tests with real Python scripts to validate:
 * - Actual Python script execution
 * - Real-world data processing scenarios
 * - File I/O operations within project
 * - Error handling with actual Python errors
 * - Performance benchmarks
 *
 * These tests require Python 3.8+ to be installed on the system.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PythonExecutor } from '../PythonExecutor';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('PythonExecutor Integration Tests', () => {
  let testProjectRoot: string;
  let executor: PythonExecutor;

  beforeEach(() => {
    // Create temporary project directory
    const rawTestDir = join(tmpdir(), `lighthouse-integration-${Date.now()}`);
    mkdirSync(rawTestDir, { recursive: true });

    // Resolve symlinks (macOS /var -> /private/var)
    testProjectRoot = realpathSync(rawTestDir);

    // Create test directory structure
    mkdirSync(join(testProjectRoot, 'scripts'), { recursive: true });
    mkdirSync(join(testProjectRoot, 'data'), { recursive: true });
    mkdirSync(join(testProjectRoot, 'output'), { recursive: true });

    // Initialize executor
    executor = new PythonExecutor(testProjectRoot);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('Real-World Data Processing', () => {
    it('should process CSV data', async () => {
      // Create test CSV file
      const csvData = `name,age,city
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago`;
      writeFileSync(join(testProjectRoot, 'data', 'users.csv'), csvData);

      // Create Python script to process CSV
      const scriptPath = join(testProjectRoot, 'scripts', 'process_csv.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
import sys
import json
import csv

def main(inputs):
    csv_file = inputs['csv_file']

    # Read CSV
    users = []
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            users.append({
                'name': row['name'],
                'age': int(row['age']),
                'city': row['city']
            })

    # Process data
    total_age = sum(user['age'] for user in users)
    avg_age = total_age / len(users) if users else 0

    return {
        'success': True,
        'user_count': len(users),
        'average_age': avg_age,
        'cities': [user['city'] for user in users]
    }

if __name__ == '__main__':
    input_data = sys.stdin.read()
    inputs = json.loads(input_data) if input_data else {}

    try:
        output = main(inputs)
        print(json.dumps(output))
        sys.exit(0)
    except Exception as e:
        error_output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_output))
        sys.exit(1)
`
      );

      // Execute script
      const result = await executor.executeScript('scripts/process_csv.py', {
        csv_file: join(testProjectRoot, 'data', 'users.csv'),
      });

      expect(result.success).toBe(true);
      expect(result.output?.user_count).toBe(3);
      expect(result.output?.average_age).toBe(30);
      expect(result.output?.cities).toEqual(['New York', 'Los Angeles', 'Chicago']);
    }, 10000);

    it('should transform JSON data', async () => {
      // Create test JSON file
      const jsonData = {
        products: [
          { id: 1, name: 'Widget', price: 9.99, stock: 100 },
          { id: 2, name: 'Gadget', price: 19.99, stock: 50 },
          { id: 3, name: 'Doohickey', price: 5.99, stock: 200 },
        ],
      };
      writeFileSync(
        join(testProjectRoot, 'data', 'products.json'),
        JSON.stringify(jsonData, null, 2)
      );

      // Create Python script to transform JSON
      const scriptPath = join(testProjectRoot, 'scripts', 'transform_json.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
import sys
import json

def main(inputs):
    json_file = inputs['json_file']

    # Read JSON
    with open(json_file, 'r') as f:
        data = json.load(f)

    # Transform: calculate total inventory value
    total_value = sum(p['price'] * p['stock'] for p in data['products'])

    # Find most expensive product
    most_expensive = max(data['products'], key=lambda p: p['price'])

    return {
        'success': True,
        'total_value': round(total_value, 2),
        'product_count': len(data['products']),
        'most_expensive': {
            'name': most_expensive['name'],
            'price': most_expensive['price']
        }
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
`
      );

      // Execute script
      const result = await executor.executeScript('scripts/transform_json.py', {
        json_file: join(testProjectRoot, 'data', 'products.json'),
      });

      expect(result.success).toBe(true);
      expect(result.output?.total_value).toBe(3196.5);
      expect(result.output?.product_count).toBe(3);
      const mostExpensive = result.output?.most_expensive as
        | { name: string; price: number }
        | undefined;
      expect(mostExpensive?.name).toBe('Gadget');
    }, 10000);

    it('should write output files', async () => {
      // Create Python script that writes a file
      const scriptPath = join(testProjectRoot, 'scripts', 'write_report.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
import sys
import json

def main(inputs):
    output_file = inputs['output_file']
    report_data = inputs['report_data']

    # Write report
    with open(output_file, 'w') as f:
        f.write(f"Report: {report_data['title']}\\n")
        f.write(f"Generated: {report_data['timestamp']}\\n")
        f.write(f"Items: {len(report_data['items'])}\\n")

    return {
        'success': True,
        'file_written': output_file
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
`
      );

      // Execute script
      const outputPath = join(testProjectRoot, 'output', 'report.txt');
      const result = await executor.executeScript('scripts/write_report.py', {
        output_file: outputPath,
        report_data: {
          title: 'Test Report',
          timestamp: '2026-01-21',
          items: [1, 2, 3, 4, 5],
        },
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const reportContent = readFileSync(outputPath, 'utf-8');
      expect(reportContent).toContain('Report: Test Report');
      expect(reportContent).toContain('Items: 5');
    }, 10000);
  });

  describe('Error Handling with Real Python', () => {
    it('should handle import errors', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'bad_import.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
import nonexistent_module
import sys
import json

print(json.dumps({'success': True}))
sys.exit(0)
`
      );

      const result = await executor.executeScript('scripts/bad_import.py');

      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('ModuleNotFoundError');
    });

    it('should handle file not found errors', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'missing_file.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
import sys
import json

def main(inputs):
    # Try to read non-existent file
    with open('/nonexistent/file.txt', 'r') as f:
        data = f.read()

    return {'success': True, 'data': data}

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
`
      );

      const result = await executor.executeScript('scripts/missing_file.py');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      // Check that error info is in stderr (script handled the error)
      expect(result.stderr).toBeDefined();
    });

    it('should handle JSON parsing errors', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'json_parse_error.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
import sys
import json

def main(inputs):
    # Try to parse invalid JSON
    invalid_json = "{ not valid json }"
    data = json.loads(invalid_json)

    return {'success': True, 'data': data}

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
`
      );

      const result = await executor.executeScript('scripts/json_parse_error.py');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      // Check that error is reported
      expect(result.stderr).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should execute simple scripts in < 500ms', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'simple.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
import sys
import json

inputs = json.loads(sys.stdin.read() or '{}')
output = {'success': True, 'message': 'Hello World'}
print(json.dumps(output))
sys.exit(0)
`
      );

      const startTime = Date.now();
      const result = await executor.executeScript('scripts/simple.py');
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500);
    });

    it('should handle moderate computation', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'compute.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
import sys
import json

def main(inputs):
    n = inputs.get('n', 1000)

    # Compute sum of squares
    result = sum(i * i for i in range(n))

    return {
        'success': True,
        'sum_of_squares': result,
        'n': n
    }

if __name__ == '__main__':
    input_data = sys.stdin.read()
    inputs = json.loads(input_data) if input_data else {}

    output = main(inputs)
    print(json.dumps(output))
    sys.exit(0)
`
      );

      const result = await executor.executeScript('scripts/compute.py', {
        n: 10000,
      });

      expect(result.success).toBe(true);
      expect(result.output?.sum_of_squares).toBe(333283335000);
      expect(result.executionTimeMs).toBeLessThan(1000);
    });
  });

  describe('Python Contract Examples', () => {
    it('should work with standard script template', async () => {
      // Create script following recommended template
      const scriptPath = join(testProjectRoot, 'scripts', 'template.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
"""
Workflow Script Template

This script follows the recommended contract for Lighthouse workflows:
- Reads inputs from stdin as JSON
- Returns outputs to stdout as JSON
- Uses sys.exit(0) for success, sys.exit(1) for errors
- Includes error handling

SECURITY:
- Only access files within project directory
- Use paths provided via inputs
- Script will timeout after 30 seconds
"""

import sys
import json

def main(inputs: dict) -> dict:
    """
    Main script logic

    Args:
        inputs: Dictionary of input parameters

    Returns:
        Dictionary of output results
    """
    name = inputs.get('name', 'World')

    return {
        'success': True,
        'message': f'Hello, {name}!',
        'inputs_received': inputs
    }

if __name__ == '__main__':
    # Read inputs from stdin
    input_data = sys.stdin.read()
    inputs = json.loads(input_data) if input_data else {}

    try:
        # Execute main logic
        output = main(inputs)

        # Write output to stdout
        print(json.dumps(output, indent=2))
        sys.exit(0)
    except Exception as e:
        # Handle errors
        error_output = {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)
`
      );

      const result = await executor.executeScript('scripts/template.py', {
        name: 'Lighthouse',
      });

      expect(result.success).toBe(true);
      expect(result.output?.message).toBe('Hello, Lighthouse!');
      const inputsReceived = result.output?.inputs_received as { name: string } | undefined;
      expect(inputsReceived?.name).toBe('Lighthouse');
    });
  });

  describe('Python Availability', () => {
    it('should detect Python installation', async () => {
      const available = await executor.checkPythonAvailable();
      expect(available).toBe(true);
    });

    it('should validate script contract', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'valid.py');
      writeFileSync(
        scriptPath,
        `#!/usr/bin/env python3
import sys
import json

inputs = json.loads(sys.stdin.read() or '{}')
output = {'success': True}
print(json.dumps(output))
sys.exit(0)
`
      );

      const isValid = await executor.validateScriptContract('scripts/valid.py');
      expect(isValid).toBe(true);
    });
  });
});
