# Batch File Processing Workflow

Automate processing of multiple files with Python scripts - perfect for file transformations, format conversions, or bulk operations.

## Overview

This workflow processes multiple files from an input directory, applies a selected operation, and saves results to an output directory. It's a flexible template that can be customized for various batch processing needs like image resizing, file format conversion, text transformation, or data processing.

## Prerequisites

- Python 3.8 or higher
- Input directory with files to process
- Output directory (will be created if it doesn't exist)

## What This Workflow Does

1. **List Input Files**: Scans the input directory using a glob pattern to find matching files

2. **Validate Output Directory**: Ensures the output directory exists and is writable

3. **Process Files**: Applies the selected operation to each file:
   - **copy**: Duplicate files to output directory
   - **rename**: Copy with new naming pattern
   - **transform**: Apply custom transformation (requires script modification)
   - **convert**: Convert between formats (requires script modification)

4. **Generate Report**: Creates a summary report with:
   - Files processed successfully
   - Failed operations
   - Processing statistics
   - Detailed results log

## Usage

### From Lighthouse Beacon

1. Open Lighthouse Beacon
2. Navigate to Workflows → Templates
3. Select "Batch File Processing"
4. Click "Use This Template"
5. Configure inputs:
   - **Input Directory**: Folder with files to process
   - **Output Directory**: Destination for processed files
   - **File Pattern**: Glob pattern (e.g., `*.jpg`, `**/*.txt`)
   - **Operation**: Choose operation type
6. Click "Execute Workflow"

### Manual Execution

```bash
lighthouse workflow run workflow-templates/batch-file-processing/workflow.yaml \
  --input input_directory=./source \
  --input output_directory=./processed \
  --input file_pattern="*.jpg" \
  --input operation=convert
```

## Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| input_directory | directory | Yes | Directory containing files to process |
| output_directory | directory | Yes | Destination for processed files |
| file_pattern | string | No | Glob pattern to match files (default: `*.*`) |
| operation | select | Yes | Operation: copy, rename, transform, convert |

## Outputs

- Processed files in output directory
- Processing report (Markdown)
- Console summary with statistics

## Example Use Cases

### 1. Image Resizing

```bash
# Modify process_batch.py to resize images
# Then run:
lighthouse workflow run batch-file-processing \
  --input input_directory=./photos \
  --input output_directory=./thumbnails \
  --input file_pattern="*.{jpg,png}" \
  --input operation=transform
```

### 2. File Format Conversion

```bash
# Convert markdown to HTML
lighthouse workflow run batch-file-processing \
  --input input_directory=./docs \
  --input output_directory=./html \
  --input file_pattern="*.md" \
  --input operation=convert
```

### 3. Text File Processing

```bash
# Process all text files in subdirectories
lighthouse workflow run batch-file-processing \
  --input input_directory=./logs \
  --input output_directory=./processed-logs \
  --input file_pattern="**/*.log" \
  --input operation=transform
```

## File Pattern Examples

| Pattern | Matches |
|---------|---------|
| `*.*` | All files in directory |
| `*.jpg` | All JPEG files |
| `*.{jpg,png}` | All JPEG and PNG files |
| `**/*.txt` | All text files in all subdirectories |
| `report-*.pdf` | All PDFs starting with "report-" |

## Customizing Operations

The template includes placeholder operations. Customize `scripts/process_batch.py` for your needs:

```python
def process_file(file_path, output_dir, operation):
    if operation == "transform":
        # Your custom transformation
        with open(file_path, 'r') as f:
            content = f.read()

        # Apply transformation
        transformed = your_transform_function(content)

        # Save to output
        output_path = os.path.join(output_dir, os.path.basename(file_path))
        with open(output_path, 'w') as f:
            f.write(transformed)

    elif operation == "convert":
        # Your conversion logic
        pass
```

## Output Report Example

```markdown
# Batch Processing Report

**Operation**: Image Resize
**Date**: 2026-01-22 11:50:00

## Summary
- Total Files: 127
- Successfully Processed: 125
- Failed: 2
- Success Rate: 98.4%

## Results
✓ photo-001.jpg → thumbnail-001.jpg
✓ photo-002.jpg → thumbnail-002.jpg
✗ photo-003.jpg → Error: Corrupt file
...

## Failed Files
1. photo-003.jpg - Corrupt file
2. photo-089.jpg - Unsupported format
```

## Complexity: Beginner

This template demonstrates:
- Directory input handling
- File pattern matching
- Batch operations
- Error handling and reporting

## Performance

- Processes files sequentially (modify for parallel processing)
- Handles large file counts (tested with 1000+ files)
- Progress tracking in console output
- Error recovery (continues on individual file failures)

## Tags

`batch`, `file-processing`, `automation`, `python`

## Support

For issues or questions:
- Check the [Lighthouse Beacon Documentation](../README.md)
- Open an issue on GitHub
- Contact support

## License

MIT License - Free to use and modify
