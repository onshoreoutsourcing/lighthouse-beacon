# Code Review Automation Workflow

Automate code reviews with AI-powered analysis focusing on quality, security, performance, and best practices.

## Overview

This workflow analyzes git diffs or patches using Claude AI to provide comprehensive code review feedback similar to what an experienced developer would provide. Perfect for pull request reviews, pre-commit checks, or learning best practices.

## Prerequisites

- Python 3.8 or higher
- Claude AI API key configured in Lighthouse Beacon
- Git diff file or patch file to review

## What This Workflow Does

1. **Load Diff File**: Parses the git diff to extract:
   - Changed files
   - Line additions and deletions
   - Code context

2. **AI Code Review**: Claude AI analyzes the changes for:
   - **Code Quality**: Readability, maintainability, complexity
   - **Security**: Input validation, vulnerabilities, data exposure
   - **Performance**: Algorithm efficiency, resource usage, optimization opportunities
   - **Best Practices**: Design patterns, error handling, testing
   - **Suggestions**: Specific improvements and alternatives

3. **Format Review Report**: Creates a structured report with:
   - Severity levels (Critical, High, Medium, Low, Info)
   - Actionable feedback
   - Code examples
   - Statistics summary

## Usage

### Generating a Diff File

```bash
# For uncommitted changes
git diff > changes.diff

# For a specific commit
git show <commit-hash> > commit.diff

# For a pull request
git diff origin/main...feature-branch > pr.diff
```

### From Lighthouse Beacon

1. Open Lighthouse Beacon
2. Navigate to Workflows → Templates
3. Select "Code Review Automation"
4. Click "Use This Template"
5. Configure inputs:
   - **PR Diff File**: Select your diff file
   - **Review Focus**: Choose focus area (optional)
6. Click "Execute Workflow"

### Manual Execution

```bash
lighthouse workflow run workflow-templates/code-review-automation/workflow.yaml \
  --input pr_diff_file=./changes.diff \
  --input review_focus=security
```

## Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| pr_diff_file | file | Yes | Git diff or patch file to review |
| review_focus | select | No | Focus area: comprehensive, security, performance, style, testing |

## Outputs

- Formatted code review report (Markdown)
- Review summary with statistics
- Severity-categorized findings

## Example Output

```markdown
# Code Review Report

## Summary
- Files Changed: 5
- Lines Added: 127
- Lines Deleted: 43
- Total Issues: 8
  - Critical: 1
  - High: 2
  - Medium: 3
  - Low: 2

## Critical Issues

### 1. SQL Injection Vulnerability
**File**: `api/users.py`
**Line**: 45
**Severity**: Critical

**Issue**: Direct string interpolation in SQL query creates injection risk.

**Suggestion**: Use parameterized queries:
\```python
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
\```

[... more findings ...]
```

## Review Focus Options

- **comprehensive** (default): All aspects of code quality
- **security**: Focus on security vulnerabilities and risks
- **performance**: Algorithm efficiency and optimization
- **style**: Code style, naming, organization
- **testing**: Test coverage and quality

## Customization

Modify the AI prompt in `workflow.yaml` to adjust review criteria:

```yaml
prompt_template: |
  [Custom review guidelines]
  - Your team's specific standards
  - Framework-specific patterns
  - Company coding policies
```

## Complexity: Intermediate

This template demonstrates:
- File input handling
- AI-powered analysis
- Select input options
- Structured output formatting

## Integration with CI/CD

You can integrate this workflow into your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Code Review with AI
  run: |
    git diff origin/main...HEAD > pr.diff
    lighthouse workflow run code-review-automation --input pr_diff_file=pr.diff
```

## Tags

`code-review`, `ai`, `quality`, `security`, `automation`

## Best Practices

1. **Review Before Merging**: Run on all pull requests
2. **Learn Patterns**: Use reviews to improve coding skills
3. **Combine with Human Review**: AI complements, doesn't replace human reviewers
4. **Focus Reviews**: Use specific focus areas for targeted analysis

## Support

For issues or questions:
- Check the [Lighthouse Beacon Documentation](../README.md)
- Open an issue on GitHub
- Contact support

## License

MIT License - Free to use and modify
