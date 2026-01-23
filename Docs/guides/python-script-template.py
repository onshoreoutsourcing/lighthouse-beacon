#!/usr/bin/env python3
"""
Lighthouse Workflow Script Template

This template demonstrates the recommended contract for Python scripts
used in Lighthouse workflows.

CONTRACT:
- Reads inputs from stdin as JSON
- Returns outputs to stdout as JSON
- Uses sys.exit(0) for success, sys.exit(1) for errors
- Includes comprehensive error handling

SECURITY:
- Only access files within project directory
- Use relative paths or paths provided via inputs
- Do NOT access system files (/etc/, C:\Windows\, etc.)
- Script will be terminated after 30 seconds (configurable)

INPUT VALIDATION:
- All file paths are validated by PythonExecutor before script runs
- You can safely use paths from inputs
- Invalid paths outside project will be rejected before execution

EXAMPLE USAGE:
  const executor = new PythonExecutor(projectRoot);
  const result = await executor.executeScript('scripts/my_script.py', {
    input_file: 'data/input.csv',
    output_file: 'output/result.json',
    options: { verbose: true }
  });

  if (result.success) {
    console.log('Output:', result.output);
  } else {
    console.error('Error:', result.error);
  }
"""

import sys
import json
import os
from typing import Dict, Any


def main(inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main script logic - implement your data processing here

    Args:
        inputs: Dictionary of input parameters from workflow step
                Example: {
                  "input_file": "data/input.csv",
                  "output_file": "output/result.json",
                  "threshold": 42
                }

    Returns:
        Dictionary of output results
        Example: {
          "success": True,
          "processed_count": 100,
          "output_file": "output/result.json"
        }

    Raises:
        Exception: Any errors during processing
    """
    # Example: Get input parameters with defaults
    input_file = inputs.get('input_file', 'data/default.txt')
    output_file = inputs.get('output_file', 'output/result.json')
    threshold = inputs.get('threshold', 10)

    # Example: Validate required parameters
    if 'required_param' in inputs:
        required_value = inputs['required_param']
    else:
        raise ValueError('Missing required parameter: required_param')

    # Example: Process data
    processed_count = 0

    # If processing files, use the paths provided
    # (they are already validated to be within project directory)
    if os.path.exists(input_file):
        with open(input_file, 'r') as f:
            data = f.read()
            # Process data...
            processed_count = len(data.split('\n'))

    # Example: Write output
    if output_file:
        with open(output_file, 'w') as f:
            f.write(json.dumps({'processed': True, 'count': processed_count}, indent=2))

    # Return results
    return {
        'success': True,
        'processed_count': processed_count,
        'output_file': output_file,
        'threshold_used': threshold,
    }


def validate_inputs(inputs: Dict[str, Any]) -> None:
    """
    Optional: Validate inputs before processing

    Args:
        inputs: Dictionary of input parameters

    Raises:
        ValueError: If inputs are invalid
    """
    # Example validation
    if 'threshold' in inputs:
        threshold = inputs['threshold']
        if not isinstance(threshold, (int, float)):
            raise ValueError(f'threshold must be a number, got {type(threshold).__name__}')
        if threshold < 0:
            raise ValueError(f'threshold must be positive, got {threshold}')


if __name__ == '__main__':
    # Read inputs from stdin
    try:
        input_data = sys.stdin.read()
        inputs = json.loads(input_data) if input_data else {}
    except json.JSONDecodeError as e:
        error_output = {
            'success': False,
            'error': f'Invalid JSON input: {str(e)}',
            'error_type': 'JSONDecodeError',
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

    try:
        # Optional: Validate inputs
        validate_inputs(inputs)

        # Execute main logic
        output = main(inputs)

        # Ensure output has success flag
        if 'success' not in output:
            output['success'] = True

        # Write output to stdout as JSON
        print(json.dumps(output, indent=2))
        sys.exit(0)

    except FileNotFoundError as e:
        error_output = {
            'success': False,
            'error': f'File not found: {str(e)}',
            'error_type': 'FileNotFoundError',
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

    except ValueError as e:
        error_output = {
            'success': False,
            'error': f'Invalid value: {str(e)}',
            'error_type': 'ValueError',
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

    except Exception as e:
        # Catch-all for unexpected errors
        error_output = {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)
