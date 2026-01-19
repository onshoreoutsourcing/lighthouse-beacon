# Generate Documentation

Generate missing core project documentation through automated analysis of the
codebase, git history, implementation documents, and architectural artifacts.

This command creates first drafts of missing documentation files, which should
then be reviewed and refined by humans.

- **documentation-generator** All steps

## When to Use This Command

Use `/generate-docs` when:
- Starting a new project that needs documentation baseline
- Inheriting an undocumented or partially documented project
- After major refactoring that invalidated old documentation
- Setting up documentation for a legacy codebase
- Documentation was accidentally deleted or lost

**Note**: This command generates **missing** documents. To update **existing**
documents, use `/update-docs` instead.

## Prerequisites

Before running this command, ensure:
- Project has been initialized (has package.json, src/, basic structure)
- Some implementation work exists to analyze
- Git repository has commit history
- At least basic README or documentation exists for context

## Step 1: Documentation Audit

**Agent**: documentation-generator

Analyze which core documentation files exist and which are missing:

### Check Core Architecture Documents
```bash
ls -la Docs/architecture/_main/
```

Required files:
- 01-Product-Vision.md
- 02-Product-Plan.md
- 03-Business-Requirements.md
- 04-Architecture.md
- 05-User-Experience.md

### Check Root Documentation
```bash
ls -la README.md ARCHITECTURE.md CLAUDE.md
```

Required files:
- README.md (project overview)
- ARCHITECTURE.md (high-level architecture)
- CLAUDE.md (AI assistant context)

### Create Inventory Report

Document findings:
- ✅ **Existing**: Files that are present and appear complete
- ❌ **Missing**: Files that don't exist and need generation
- ⚠️ **Incomplete**: Files that exist but are stubs or incomplete

## Step 2: Codebase Analysis

**Agent**: documentation-generator

For each missing document, gather context through comprehensive analysis:

### Analyze Project Structure
```bash
# Read project configuration
cat package.json    # Node.js/TypeScript projects
cat pyproject.toml  # Python projects
cat Cargo.toml      # Rust projects

# Understand directory structure
ls -la src/
tree -L 2 src/      # If available
```

Extract:
- Project name, description, version
- Technology stack (languages, frameworks, runtimes)
- Dependencies (libraries, services, tools)
- Build and deployment scripts
- Key directories and their purposes

### Review Git History
```bash
# Get project timeline
git log --oneline --all --graph -n 50

# Identify major milestones
git log --all --pretty=format:"%h - %s (%an, %ar)" --since="6 months ago"

# Check for releases/tags
git tag -l
```

Extract:
- Project age and maturity
- Development velocity
- Major features and milestones
- Key contributors
- Release history

### Mine Existing Documentation
```bash
# Read architectural decisions
cat Docs/architecture/decisions/README.md
ls Docs/architecture/decisions/ADR-*.md

# Review implementation docs
ls Docs/implementation/
cat Docs/implementation/epic-*/implementation-*.md

# Check planning documents
ls Docs/planning/
cat Docs/planning/*.md
```

Extract:
- Architectural decisions and rationale
- Features implemented or planned
- Business requirements captured
- Technical constraints
- Integration requirements

### Analyze Source Code
```bash
# Scan source files
find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) | head -20

# Identify main entry points
ls src/index.* src/main.* src/app.*

# Check configuration files
ls src/config/ config/
cat tsconfig.json .env.example
```

Extract:
- Core components and services
- Design patterns in use
- Integration points (APIs, databases, services)
- Configuration structure
- Testing approach

## Step 3: Template-Based Generation

**Agent**: documentation-generator

For each missing document, use templates to generate structured content:

### Load Templates
Templates are in `.lighthouse/templates/`:
- 01-Product-Vision-Template.md
- 02-Product-Plan-Template.md
- 03-Business-Requirements-Template.md
- 04-Architecture-Template.md
- 05-User-Experience-Template.md

### Generate Documents

For each missing document:

1. **Load the appropriate template**
2. **Populate sections with discovered information**:
   - Use concrete facts from analysis
   - Make reasonable inferences where appropriate
   - Mark uncertainties clearly
3. **Mark gaps for human review**:
   - Use `[NEEDS REVIEW: reason]` for information gaps
   - Use `[TO BE DETERMINED: context]` for future decisions
   - Use `[INFERRED FROM: source]` for educated guesses
4. **Cite sources**:
   - Reference git commits for features
   - Reference ADRs for architectural decisions
   - Reference implementation docs for requirements
   - Reference code files for technical details
5. **Write complete document** to proper location

### Document-Specific Guidance

**01-Product-Vision.md**:
- Extract mission from README, package.json description
- Identify target users from user stories or requirements
- Infer problem being solved from implementation docs
- Extract strategic goals from epic plans

**02-Product-Plan.md**:
- Build roadmap from epic/sprint plans
- Extract milestones from git tags
- Identify phases from implementation folder structure
- Note dependencies from package.json

**03-Business-Requirements.md**:
- Gather functional requirements from user stories
- Extract non-functional requirements from ADRs
- Identify integrations from import statements
- List compliance needs from security docs

**04-Architecture.md**:
- Map system components from src/ structure
- Document data flow from service implementations
- Extract technology stack from dependencies
- Summarize ADRs for architectural decisions

**05-User-Experience.md**:
- Identify user roles from auth code
- Map workflows from implementation docs
- Document interfaces from UI components or API endpoints
- Extract accessibility from tests or comments

**README.md**:
- Project name and description from package.json
- Installation steps from package scripts
- Usage examples from tests or documentation
- Configuration from environment files

**ARCHITECTURE.md**:
- High-level overview from 04-Architecture.md if exists
- Component summary from src/ structure
- Key patterns from code analysis
- Integration points from service clients

**CLAUDE.md**:
- Project context from README and architecture
- Development workflow from contributing guides
- Key commands from package.json scripts
- Important conventions from code style

## Step 4: Quality Validation

**Agent**: documentation-generator

Validate generated documents:

### Check Completeness
- ✅ All template sections present
- ✅ Front matter properly formatted
- ✅ Metadata filled (version, dates, status)
- ✅ Appropriate level of detail for each section

### Verify Accuracy
- ✅ Facts match source code and configuration
- ✅ Technology stack correctly identified
- ✅ Component names match actual implementation
- ✅ Links and references valid

### Mark Uncertainties
- ✅ All gaps marked with `[NEEDS REVIEW]`
- ✅ Inferences marked with `[INFERRED FROM: source]`
- ✅ Future decisions marked with `[TO BE DETERMINED]`
- ✅ Each marker includes context/reason

### Check Consistency
- ✅ Terminology consistent across documents
- ✅ Component names match everywhere
- ✅ Cross-references between documents work
- ✅ No conflicting information

## Step 5: Generation Report

**Agent**: documentation-generator

Create comprehensive report of generation activity:

### Report Structure

```markdown
# Documentation Generation Report
**Generated**: [timestamp]
**Agent**: documentation-generator
**Analysis Scope**: [description of what was analyzed]

## Summary
[High-level summary of what was generated and confidence level]

## Generated Documents

### Successfully Created
List each document with:
- ✅ File path and name
- Confidence level (HIGH/MEDIUM/LOW)
- Completion percentage
- Sections marked for review
- Primary sources used

### Partially Generated
List documents that were updated rather than created:
- ⚠️ File path and name
- What was added
- What was preserved
- Sections needing review

### Could Not Generate
List documents that couldn't be created:
- ❌ File path and name
- Reason for failure
- Missing information needed
- Recommendation for manual creation

## Information Sources Used
- Configuration files analyzed
- ADRs reviewed
- Git commits analyzed
- Implementation docs read
- Source code files scanned

## Review Actions Required
Numbered list of specific review actions needed:
1. Review all [NEEDS REVIEW] markers
2. Validate specific inferred information
3. Complete specific missing sections
4. Verify specific facts with stakeholders

## Next Steps
- Recommended immediate actions
- Suggested follow-up commands
- Documentation maintenance recommendations
```

### Display Report

Present the report to the user with clear formatting and actionable next steps.

## Step 6: Human Review Guidance

Provide clear guidance on how to review generated documentation:

### Review Checklist

**For Each Generated Document**:
- [ ] Read entire document for accuracy
- [ ] Search for `[NEEDS REVIEW]` markers
- [ ] Validate inferred information
- [ ] Fill in gaps where possible
- [ ] Verify links and references
- [ ] Check cross-document consistency
- [ ] Update metadata if needed

**Priority Reviews**:
1. Vision and strategic goals (01-Product-Vision.md)
2. Roadmap and milestones (02-Product-Plan.md)
3. Technical architecture (04-Architecture.md)
4. Setup and usage (README.md)

**Optional Enhancements**:
- Add diagrams and visuals
- Expand examples and use cases
- Add troubleshooting sections
- Include performance metrics

## Important Notes

### What This Command Does
- ✅ Generates missing core documentation files
- ✅ Uses templates for consistent structure
- ✅ Analyzes codebase and git history
- ✅ Marks uncertainties for human review
- ✅ Cites sources for all content

### What This Command Does NOT Do
- ❌ Update existing complete documentation (use `/update-docs`)
- ❌ Generate implementation-specific docs
- ❌ Create ADRs (use `/plan-enhancement`)
- ❌ Generate API documentation (use code doc tools)
- ❌ Replace human judgment and review

### Quality Expectations

Generated documentation is a **first draft** that:
- Provides structure and baseline content
- Saves significant manual effort
- Requires human review and refinement
- May have gaps requiring additional information
- Should be validated before relying on it

### Complementary Commands

- **Before**: `/setup-lighthouse` to create docs folder structure
- **Before**: `/begin-lighthouse` for interactive document creation
- **After**: Human review and refinement of generated content
- **After**: `/update-docs` to keep docs current with implementation
- **Periodic**: Re-run when major project changes occur

## Success Criteria

- ✅ All missing core documents generated
- ✅ Generated content uses proper template structure
- ✅ Uncertain information clearly marked
- ✅ Sources cited for all factual content
- ✅ Comprehensive generation report created
- ✅ Clear review actions provided
- ✅ Documents ready for human review

## Example Workflow

```bash
# 1. Check what's missing
/generate-docs

# Agent performs analysis and generation...
# Report shows:
# - Generated: 01-Product-Vision.md, 04-Architecture.md, README.md
# - Updated: ARCHITECTURE.md
# - Could not generate: 05-User-Experience.md (insufficient info)

# 2. Review generated documents
# Search for [NEEDS REVIEW] markers
# Validate inferred information
# Fill in gaps

# 3. Keep docs updated going forward
/update-docs  # After implementation work
```

## Troubleshooting

**Problem**: Agent can't find enough information
- **Solution**: Ensure project has basic structure (package.json, src/)
- **Solution**: Add minimal README with project description
- **Solution**: Create basic implementation docs first

**Problem**: Generated content is too generic
- **Solution**: Add more ADRs and implementation docs
- **Solution**: Ensure git commit messages are descriptive
- **Solution**: Run `/begin-lighthouse` for interactive generation

**Problem**: Generated docs conflict with reality
- **Solution**: Review and correct inaccuracies
- **Solution**: Improve source documentation
- **Solution**: Re-run generation after corrections

**Problem**: Missing critical sections
- **Solution**: Fill in manually during review
- **Solution**: Add source information and regenerate
- **Solution**: Use `/begin-lighthouse` for those sections
