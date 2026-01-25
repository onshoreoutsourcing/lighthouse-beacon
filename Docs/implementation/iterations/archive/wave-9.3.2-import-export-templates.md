# Wave 9.3.2: Import/Export & Workflow Templates

## Wave Overview
- **Wave ID:** Wave-9.3.2
- **Feature:** Feature 9.3 - Workflow Management
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Complete
- **Scope:** Enable workflow import/export and provide pre-built workflow templates
- **Wave Goal:** Allow users to share workflows and quickly start from templates
- **Estimated Hours:** 18 hours

## Wave Goals

1. Implement workflow import from YAML files
2. Implement workflow export to YAML files
3. Create 3+ pre-built workflow templates
4. Add template selection UI
5. Enable workflow sharing via file export

## User Stories

### User Story 1: Workflow Import & Export

**As a** workflow user
**I want** to import and export workflows as YAML files
**So that** I can share workflows with others and back up my work

**Acceptance Criteria:**
- [x] "Import" button opens file picker (filters: .yaml, .yml)
- [x] Import validates YAML syntax and schema
- [x] Import errors show line numbers and actionable messages
- [x] "Export" button saves workflow to user-selected location
- [x] Export preserves all workflow data (steps, inputs, UI metadata)
- [x] Exported YAML is human-readable and editable
- [x] ImportExportDialog component handles both operations
- [x] Unit test coverage ≥90%
- [x] Integration tests validate round-trip (export → import → verify)

**Priority:** High

**Estimated Hours:** 10 hours

**Objective UCP:** 10 UUCW (Average complexity: 5 transactions - file picker, import validation, YAML parsing, export serialization, error handling)

---

### User Story 2: Pre-Built Workflow Templates

**As a** workflow user
**I want** to start from pre-built templates for common tasks
**So that** I don't have to build workflows from scratch

**Acceptance Criteria:**
- [x] 3+ templates provided: Documentation Generator, Code Review Automation, Batch File Processing
- [x] Templates stored in `workflow-templates/` directory
- [x] Templates include: workflow definition, README with usage instructions
- [x] "New from Template" button shows template gallery
- [x] Template selection creates new workflow (copy of template)
- [x] Templates demonstrate best practices (variable usage, error handling)
- [x] Templates fully functional (can execute without modification)
- [x] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 6 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - template listing, template selection, template instantiation)

---

### User Story 3: Template Gallery UI

**As a** workflow user
**I want** an attractive template gallery with previews
**So that** I can quickly understand what each template does

**Acceptance Criteria:**
- [x] Template gallery shows cards with: name, description, preview image, tags
- [x] Cards display complexity indicator (beginner/intermediate/advanced)
- [x] Clicking card shows template details modal
- [x] "Use Template" button creates workflow from template
- [x] Gallery searchable by name or tags
- [x] Templates sorted by popularity (static for MVP, dynamic later)
- [x] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 2 transactions - gallery display, template selection)

---

## Definition of Done

- [x] All 3 user stories completed with acceptance criteria met
- [x] Code coverage ≥90%
- [x] Integration tests validate import/export round-trip
- [x] No TypeScript/linter errors
- [x] 3+ templates created and tested
- [x] Code reviewed and approved
- [x] Documentation updated (import/export guide, template authoring guide)
- [x] Demo: Import workflow, export workflow, create from template

## Notes

**Architecture References:**
- Electron dialog API for file picker
- Feature 9.1 YAML parser for import validation
- FileSystemService for file operations

**Template Examples:**

**1. Documentation Generator:**
- Analyzes code repository
- Generates documentation with Claude
- Saves to file

**2. Code Review Automation:**
- Loads pull request diff
- Reviews with Claude
- Posts comments to PR

**3. Batch File Processing:**
- Loops through files in directory
- Processes each with Python script
- Aggregates results

**Template Structure:**
```
workflow-templates/
  documentation-generator/
    workflow.yaml
    README.md
    preview.png
  code-review-automation/
    workflow.yaml
    README.md
    preview.png
  batch-file-processing/
    workflow.yaml
    README.md
    preview.png
```

---

**Total Stories:** 3
**Total Hours:** 18 hours
**Total Objective UCP:** 20 UUCW
**Wave Status:** Planning
