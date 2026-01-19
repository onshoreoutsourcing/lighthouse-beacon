# Update Documentation

Update existing core project documentation with recent implementation changes
through automated analysis of git history, code changes, and implementation
artifacts.

This command intelligently merges new information into existing documents while
preserving their structure, narrative, and historical context.

- **documentation-updater** All steps

## When to Use This Command

Use `/update-docs` when:
- After completing a sprint or epic
- After implementing significant features
- After making architectural changes
- After releasing a new version
- Periodically (weekly/bi-weekly) to keep docs current
- After major refactoring or technology changes

**Note**: This command updates **existing** documents. To generate **missing**
documents, use `/generate-docs` instead.

## Prerequisites

Before running this command, ensure:
- Core documentation exists (run `/generate-docs` if needed)
- Recent implementation work has been completed
- Git commits have descriptive messages
- Implementation docs and/or ADRs exist for major changes

## Step 1: Define Update Scope

**Agent**: documentation-updater

Determine the timeframe and scope for documentation updates:

### Default Scope
If not specified, analyze:
- Changes since last documentation update
- OR last 30 days of commits
- OR since last tagged release

### Custom Scope Options

**By Date Range**:
```bash
# Update with changes since specific date
--since="2025-01-01"
--since="2 weeks ago"
```

**By Commit Range**:
```bash
# Update with changes between commits
--from=abc123 --to=HEAD
--from=v1.0.0 --to=v1.1.0
```

**By Scope**:
```bash
# Update specific document types
--scope=architecture    # Only architecture docs
--scope=root           # Only root-level docs (README, ARCHITECTURE, CLAUDE.md)
--scope=all            # All core documents (default)
```

**By Epic/Feature**:
```bash
# Update based on specific epic/feature completion
--epic=5
--feature=5.1
```

## Step 2: Change Detection & Analysis

**Agent**: documentation-updater

Analyze what has changed in the codebase:

### Git History Analysis
```bash
# Get all commits in timeframe
git log --since="<timeframe>" --pretty=format:"%H|%ai|%an|%s" --name-status

# Group changes by type
git diff --name-status <since>..<until>

# Identify changed files
git diff --stat <since>..<until>
```

Extract:
- **New features**: New files, components, services added
- **Modifications**: Changed files, updated implementations
- **Deletions**: Removed files or features
- **Refactoring**: Restructured code, renamed components
- **Bug fixes**: Corrections that may affect documentation

### Implementation Documentation Review
```bash
# Find recent implementation docs
find Docs/implementation -name "implementation-*.md" -mtime -60
find Docs/implementation -name "retrospective-*.md" -mtime -60

# Read completion summaries
cat Docs/implementation/epic-*/retrospective-sprint-*.md
```

Extract:
- Features completed
- User stories implemented
- Technical decisions made
- Performance improvements
- Known issues resolved

### Architecture Decision Review
```bash
# Check for new ADRs
ls -lt Docs/architecture/decisions/ADR-*.md | head -10

# Read recent ADRs
cat Docs/architecture/decisions/ADR-021-*.md
```

Extract:
- New architectural decisions
- Technology choices
- Design pattern selections
- Integration strategies
- Compliance decisions

### Code Change Analysis
```bash
# Identify modified components
git diff --name-only <since>..<until> src/

# Check for new dependencies
git diff <since>..<until> package.json
git diff <since>..<until> requirements.txt
```

Extract:
- New services or components
- Modified existing components
- New dependencies added
- Configuration changes
- API changes

## Step 3: Impact Mapping

**Agent**: documentation-updater

Map detected changes to documentation sections that need updates:

### Change-to-Document Mapping

Create mapping of changes to affected documents:

**Feature Addition** → Updates:
- 02-Product-Plan.md (Roadmap § → mark feature complete)
- 03-Business-Requirements.md (Functional Requirements § → add new requirements)
- 04-Architecture.md (Core Components § → add new components)
- README.md (Features § → add to feature list, Usage § → add examples)

**Architecture Change** → Updates:
- 04-Architecture.md (System Design §, Component Diagrams §)
- ARCHITECTURE.md (High-Level Overview §)
- CLAUDE.md (Development Context §)
- Related ADRs (Consequences § → add actual outcomes)

**API Addition/Change** → Updates:
- 03-Business-Requirements.md (Integration Requirements §)
- 04-Architecture.md (Integration Architecture §, API Strategy §)
- README.md (API Usage §)

**User Experience Change** → Updates:
- 05-User-Experience.md (Workflows §, Interfaces §)
- README.md (Usage Instructions §)
- 03-Business-Requirements.md (UX Requirements §)

**Technology Change** → Updates:
- 04-Architecture.md (Technology Stack §)
- ARCHITECTURE.md (Key Technologies §)
- README.md (Installation §, Configuration §)
- CLAUDE.md (Development Setup §)

**Security/Compliance** → Updates:
- 04-Architecture.md (Security Architecture §)
- 03-Business-Requirements.md (Security Requirements §, Compliance §)
- Related security ADRs

### Priority Determination

Assign priority to each update:
- **HIGH**: Core architecture changes, new major features, security updates
- **MEDIUM**: Minor features, dependency updates, refactoring
- **LOW**: Bug fixes, documentation fixes, minor tweaks

## Step 4: Document Reading & Section Identification

**Agent**: documentation-updater

For each document needing updates:

### Read Current Content
```bash
# Read entire document
cat Docs/architecture/_main/04-Architecture.md
cat README.md
```

### Parse Document Structure

Extract:
- **Front matter**: Metadata (version, dates, status)
- **Section headers**: All ## and ### headings
- **Lists**: Bulleted and numbered lists
- **Tables**: Component tables, comparison matrices
- **Code blocks**: Examples, configurations
- **Links**: Internal and external references

### Identify Update Locations

For each change, pinpoint exact section(s) to update:
- **Section title**: e.g., "## Core Components"
- **Subsection**: e.g., "### Service Layer"
- **Line range**: Approximate location in file
- **Update type**: Append, modify, expand

## Step 5: Intelligent Content Merging

**Agent**: documentation-updater

Apply updates while preserving existing content:

### Preservation Rules

**Always Preserve**:
- ✅ Existing narrative and explanations
- ✅ Historical context and background
- ✅ Author's writing style and voice
- ✅ Document structure and formatting
- ✅ References and citations
- ✅ Diagrams and visualizations

**Never Delete**:
- ❌ Existing features (append new ones)
- ❌ Historical decisions (note evolution)
- ❌ Previous explanations (enhance them)
- ❌ Deprecated features (mark as deprecated, don't remove)

### Update Strategies

**Strategy 1: Append to Lists**
For adding new items to existing lists:

```markdown
<!-- BEFORE -->
## Core Components
- SessionManager: Manages Claude Code sessions
- FileWatcherService: Monitors hook events

<!-- AFTER -->
## Core Components
- SessionManager: Manages Claude Code sessions
- FileWatcherService: Monitors hook events
- EventStreamer: Batches and streams events to AI-SOC (Added 2025-01-10)
- HealthMonitor: Monitors service health and connectivity (Added 2025-01-10)
```

**Strategy 2: Expand Existing Sections**
For adding detail to existing content:

```markdown
<!-- BEFORE -->
### Authentication
The system uses Azure AD for authentication.

<!-- AFTER -->
### Authentication
The system uses Azure AD for authentication via the Microsoft authentication
provider integration.

**Implementation Details** (Updated 2025-01-10):
- Token management via VS Code credential storage
- Automatic token refresh with exponential backoff
- Multi-tenant support with tenant-specific policies
- Integration with Lighthouse Auth Service for validation

**Related Decisions**:
- See ADR-021-auth-token-management.md for token lifecycle decisions
- See ADR-019-azure-ad-integration.md for authentication provider selection
```

**Strategy 3: Update Tables**
For modifying tabular data:

```markdown
<!-- BEFORE -->
| Component | Purpose | Technology |
|-----------|---------|------------|
| API Server | REST API | Express.js |
| Database | Data storage | PostgreSQL |

<!-- AFTER -->
| Component | Purpose | Technology | Status | Added/Updated |
|-----------|---------|------------|--------|---------------|
| API Server | REST API | Express.js | ✅ Active | Initial |
| Database | Data storage | PostgreSQL | ✅ Active | Initial |
| Event Streamer | Activity streaming | TypeScript | ✅ Active | 2025-01-10 |
| Health Monitor | Service monitoring | TypeScript | ✅ Active | 2025-01-10 |
```

**Strategy 4: Inline Enhancements**
For improving existing prose:

```markdown
<!-- BEFORE -->
The extension monitors Claude Code activity.

<!-- AFTER -->
The extension monitors Claude Code activity through a transcript-based monitoring
system. All tool calls, prompts, and responses are captured in real-time from
Claude Code's transcript files. Events are batched (configurable, default 50
events per batch) and streamed to the AI-SOC service with automatic retry logic
and exponential backoff.

For detailed architecture, see § Event Flow Architecture below and
ADR-015-transcript-based-monitoring.md for decision rationale.
```

**Strategy 5: Version Annotations**
For tracking when content was added/modified:

```markdown
## Recent Changes

### Version 2.1 (2025-01-10)
- Added event streaming with configurable batch sizes
- Implemented transcript-based monitoring (replaced hook-based monitoring)
- Added automatic session correlation with AI-SOC
- Enhanced error handling with circuit breaker pattern

### Version 2.0 (2024-12-15)
- Initial workspace initialization support
- Azure AD authentication integration
- Base monitoring architecture
```

### Using Edit Tools

For precise updates, use regex-based editing:

```typescript
// Example: Add new component to list
mcp__serena__replace_regex({
  relative_path: "Docs/architecture/_main/04-Architecture.md",
  regex: "(## Core Components\\n(?:- .*\\n)*)",
  repl: "$1- EventStreamer: Batches and streams activity events to AI-SOC (Added 2025-01-10)\\n",
  allow_multiple_occurrences: false
});
```

## Step 6: Metadata Refresh

**Agent**: documentation-updater

Update document metadata:

### Front Matter Updates

```yaml
---
title: System Architecture
version: 2.1            # Increment: Major.Minor
last_updated: 2025-01-10
status: ✅ Active
authors:
  - Original Author
  - Updated by Claude Code (2025-01-10)
related_documents:
  - ADR-021-workspace-context-in-api-calls.md
  - ADR-020-streaming-batch-optimization.md
  - Docs/implementation/epic-5/retrospective-sprint-5.1.1-2025-01-07.md
change_summary: Added event streaming architecture, updated component descriptions
---
```

### Version Incrementing Rules

- **Major version (X.0)**: Significant architectural changes, major rewrites
- **Minor version (X.Y)**: Feature additions, component updates, moderate changes
- **Patch version (X.Y.Z)**: Bug fixes, minor corrections (optional)

## Step 7: Consistency Validation

**Agent**: documentation-updater

Ensure cross-document consistency:

### Cross-Reference Validation

Check consistency across documents:
- ✅ Component names identical everywhere
- ✅ Technology stack matches across README, Architecture, CLAUDE.md
- ✅ Feature lists consistent between Product Plan and Requirements
- ✅ Version numbers synchronized
- ✅ Dates consistent

### Link Validation
```bash
# Find all internal links
grep -r "\[.*\](.*/.*\.md)" Docs/

# Check ADR references
grep -r "ADR-[0-9]" Docs/
```

Verify:
- All ADR references point to existing ADRs
- Internal document links are valid
- Section references use correct headers
- External links still work

### Terminology Consistency

Ensure consistent terminology:
- Same component names (e.g., "TranscriptMonitorService" everywhere)
- Consistent product names (e.g., "AI-SOC" not "AI SOC" or "AISOC")
- Standard capitalization
- Consistent abbreviations

## Step 8: Update Report Generation

**Agent**: documentation-updater

Create comprehensive update report:

### Report Structure

```markdown
# Documentation Update Report
**Generated**: 2025-01-10 14:30:00
**Analysis Period**: 2024-12-15 to 2025-01-10 (25 days)
**Commits Analyzed**: 47 commits
**Implementation Docs Reviewed**: 8 files

## Executive Summary
[High-level overview of updates made]

## Changes by Document

### Document Name
**Version**: Old → New
**Sections Updated**: Count

#### Section Name (§Number)
- ✅ Change made
- ✅ Another change
- Source: Where information came from

**Confidence**: HIGH/MEDIUM/LOW

## Documents Not Updated
[Documents that didn't need changes and why]

## Changes Not Applied
[Changes that couldn't be applied and why]

## Source Attribution
- Git commits analyzed
- Documents referenced
- Code files analyzed

## Validation Checks
- Cross-document consistency
- Link validation
- Template compliance

## Recommendations
- Immediate actions needed
- Future update guidance
- Documentation gaps identified

## Statistics
- Documents updated: N
- Sections modified: N
- Lines added: ~N
- New references: N
```

### Display Report

Present report with:
- Clear formatting
- Confidence levels for each update
- Sources cited
- Actionable recommendations

## Step 9: Human Review Guidance

Provide clear guidance for reviewing updates:

### Review Priorities

**High Priority**:
1. Architecture changes (04-Architecture.md)
2. Feature additions (README.md, 03-Business-Requirements.md)
3. Technology changes (all docs)

**Medium Priority**:
1. Roadmap updates (02-Product-Plan.md)
2. Integration changes
3. Configuration updates

**Low Priority**:
1. Bug fix documentation
2. Minor corrections
3. Formatting improvements

### Review Checklist

- [ ] All updated sections read for accuracy
- [ ] New content integrates smoothly with existing
- [ ] No conflicting information introduced
- [ ] Links and references valid
- [ ] Terminology consistent
- [ ] Version numbers incremented correctly
- [ ] Change attributions clear (dates, sources)

## Important Notes

### What This Command Does
- ✅ Updates existing documentation with recent changes
- ✅ Preserves existing content and structure
- ✅ Intelligently merges new information
- ✅ Refreshes metadata (versions, dates)
- ✅ Ensures cross-document consistency
- ✅ Generates comprehensive update report

### What This Command Does NOT Do
- ❌ Generate missing documentation (use `/generate-docs`)
- ❌ Rewrite entire documents from scratch
- ❌ Delete historical information
- ❌ Make architectural decisions (use ADRs)
- ❌ Replace human judgment

### Quality Expectations

Updated documentation:
- Maintains existing narrative and style
- Adds new information seamlessly
- Cites sources for all updates
- Marks confidence levels where appropriate
- Preserves historical context
- Requires human review for accuracy

### Complementary Commands

- **Before**: Ensure documentation exists (use `/generate-docs` if needed)
- **Before**: Complete implementation work (sprint, epic, feature)
- **After**: Review updates for accuracy
- **After**: Commit updated documentation
- **Periodic**: Run regularly (weekly/bi-weekly) to stay current

## Success Criteria

- ✅ All relevant documents updated with recent changes
- ✅ Existing content preserved and enhanced
- ✅ Updates properly attributed with dates and sources
- ✅ Cross-document consistency maintained
- ✅ Metadata refreshed (versions, dates)
- ✅ Comprehensive update report generated
- ✅ No broken links or references
- ✅ Template structure maintained

## Example Workflow

```bash
# 1. After completing a sprint
/update-docs --since="2 weeks ago"

# Agent analyzes changes and updates docs...
# Report shows:
# - Updated: 04-Architecture.md (2 sections)
# - Updated: README.md (1 section)
# - Updated: 03-Business-Requirements.md (3 sections)
# - Not updated: 01-Product-Vision.md (no vision changes)

# 2. Review the updates
# Check each updated section
# Verify accuracy
# Approve changes

# 3. Commit updated documentation
git add Docs/ README.md ARCHITECTURE.md CLAUDE.md
git commit -m "docs: Update documentation for sprint 5.1.1 completion"

# 4. Continue implementation work...

# 5. Update again after next sprint
/update-docs --since="last commit to Docs/"
```

## Troubleshooting

**Problem**: Updates don't capture all changes
- **Solution**: Check git commit messages are descriptive
- **Solution**: Ensure implementation docs exist
- **Solution**: Create ADRs for architectural changes
- **Solution**: Extend analysis timeframe

**Problem**: Updates conflict with existing content
- **Solution**: Review conflicting sections manually
- **Solution**: Determine which information is correct
- **Solution**: Manually merge or rewrite as needed

**Problem**: Updates are too frequent/verbose
- **Solution**: Adjust update frequency (less often)
- **Solution**: Focus on significant changes only
- **Solution**: Use --scope parameter to limit updates

**Problem**: Metadata not updating correctly
- **Solution**: Check front matter format
- **Solution**: Manually correct version numbers
- **Solution**: Ensure dates in correct format

## Advanced Usage

### Selective Updates
```bash
# Update only architecture documents
/update-docs --scope=architecture --since="1 month ago"

# Update based on specific epic
/update-docs --epic=5 --feature=5.1

# Update with specific commit range
/update-docs --from=abc123 --to=HEAD
```

### Integration with CI/CD
```bash
# Run automatically after merges to main
on:
  push:
    branches: [main]
jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: claude /update-docs --since="last release"
      - run: git commit -am "docs: Auto-update from CI"
      - run: git push
```

### Scheduled Updates
```bash
# Weekly cron job to update documentation
0 0 * * 1 cd /project && claude /update-docs --since="1 week ago"
```
