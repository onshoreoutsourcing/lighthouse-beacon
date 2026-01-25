# Documentation Generator Workflow

Automatically generates comprehensive documentation for your code repository using AI-powered analysis.

## Overview

This workflow analyzes your codebase structure, extracts key information about functions, classes, and architecture, then uses Claude AI to generate professional documentation in Markdown format.

## Prerequisites

- Python 3.8 or higher
- Claude AI API key configured in Lighthouse Beacon
- Code repository with source files

## What This Workflow Does

1. **Analyze Code Structure**: Scans your repository and extracts:
   - File and directory structure
   - Functions and classes
   - Import dependencies
   - Code patterns and architecture

2. **Generate Documentation**: Uses Claude AI to create:
   - Project overview and purpose
   - Architecture documentation
   - API reference
   - Setup instructions
   - Usage examples
   - Contributing guidelines

3. **Save Documentation**: Writes the generated documentation to `DOCUMENTATION.md` in your repository root

## Usage

### From Lighthouse Beacon

1. Open Lighthouse Beacon
2. Navigate to Workflows → Templates
3. Select "Documentation Generator"
4. Click "Use This Template"
5. Configure inputs:
   - **Repository Path**: Select your code repository directory
6. Click "Execute Workflow"

### Manual Execution

```bash
# From Lighthouse Beacon CLI
lighthouse workflow run workflow-templates/documentation-generator/workflow.yaml \
  --input repo_path=/path/to/your/repo
```

## Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| repo_path | directory | Yes | Path to the code repository to document |

## Outputs

- `DOCUMENTATION.md` - Generated documentation file in repository root
- Console output with file path confirmation

## Example Output

The workflow generates documentation following this structure:

```markdown
# Project Name

## Overview
[AI-generated project description]

## Architecture
[Architecture patterns and design decisions]

## API Documentation
[Function and class documentation]

## Setup Instructions
[Installation and configuration steps]

## Usage Examples
[Code examples and use cases]

## Contributing
[Guidelines for contributors]
```

## Customization

You can customize the documentation by modifying the AI prompt template in `workflow.yaml`:

```yaml
prompt_template: |
  [Your custom prompt here]
  - Add specific sections you want
  - Adjust tone and style
  - Include company-specific guidelines
```

## Complexity: Beginner

This template is suitable for users new to workflows. It demonstrates:
- Python script execution
- AI integration with Claude
- File operations
- Variable interpolation

## Tags

`documentation`, `ai`, `automation`, `python`, `claude`

## Support

For issues or questions:
- Check the [Lighthouse Beacon Documentation](../README.md)
- Open an issue on GitHub
- Contact support

## License

MIT License - Free to use and modify
