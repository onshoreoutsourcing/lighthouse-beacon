# Wave 9.5.1: Template Marketplace

## Wave Overview
- **Wave ID:** Wave-9.5.1
- **Feature:** Feature 9.5 - UX Polish & Templates
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Create template marketplace with 20+ pre-built workflows across 5 categories
- **Wave Goal:** Provide extensive library of ready-to-use workflow templates for common use cases
- **Estimated Hours:** 28 hours

## Wave Goals

1. Create TemplateMarketplace component for browsing templates
2. Build 20+ workflow templates across 5 categories
3. Implement template preview and installation
4. Add template search and filtering
5. Include template documentation and usage guides

## User Stories

### User Story 1: Template Marketplace UI

**As a** workflow user
**I want** to browse and search workflow templates in a marketplace
**So that** I can quickly find and install templates for my needs

**Acceptance Criteria:**
- [ ] TemplateMarketplace component displays template gallery
- [ ] Templates organized by categories: AI & Documentation, Testing & QA, Data Processing, Deployment, Development
- [ ] Search bar filters templates by name, description, tags
- [ ] Category filter narrows results by category
- [ ] Template cards show: name, description, preview image, complexity level, tags
- [ ] Click card to view template details modal
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 8 hours

**Objective UCP:** 10 UUCW (Average complexity: 5 transactions - gallery display, search filter, category filter, card rendering, details modal)

---

### User Story 2: Pre-Built Workflow Templates

**As a** workflow user
**I want** 20+ pre-built templates for common tasks
**So that** I don't have to build workflows from scratch

**Acceptance Criteria:**
- [ ] 20+ templates created across 5 categories
- [ ] **AI & Documentation (5 templates):** Documentation generator, code review automation, tech spec writer, API docs generator, release notes generator
- [ ] **Testing & QA (4 templates):** Test suite generator, bug report automation, regression testing, end-to-end test orchestration
- [ ] **Data Processing (4 templates):** CSV processing pipeline, JSON transformation, batch file processor, data validation workflow
- [ ] **Deployment (4 templates):** CI/CD automation, deployment checklist, rollback automation, blue-green deployment
- [ ] **Development (3 templates):** Code scaffolding, boilerplate generator, refactoring automation
- [ ] Each template includes: workflow.yaml, README.md, preview.png, example inputs
- [ ] All templates tested and functional
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 18 hours

**Objective UCP:** 20 UUCW (Complex complexity: 20+ templates created, each with documentation and testing)

---

### User Story 3: Template Installation and Customization

**As a** workflow user
**I want** to install templates with one click and customize them
**So that** I can quickly adapt templates to my specific needs

**Acceptance Criteria:**
- [ ] "Use Template" button creates workflow from template
- [ ] Installed template opens in canvas for immediate editing
- [ ] Template installation copies files to user's workflow directory
- [ ] Installation wizard prompts for required inputs (e.g., API keys, file paths)
- [ ] Templates include variable placeholders for customization
- [ ] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - installation, file copy, customization prompt)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] 20+ templates created and tested
- [ ] No TypeScript/linter errors
- [ ] Template marketplace UI functional
- [ ] Code reviewed and approved
- [ ] Documentation updated (template authoring guide, marketplace user guide)
- [ ] Demo: Browse, search, install template successfully

## Notes

**Architecture References:**
- Feature 9.3 WorkflowService for file operations
- Feature 9.1 React Flow for template preview
- Wave 9.3.2 template structure (extends with marketplace)

**Template Categories and Examples:**

**1. AI & Documentation (5 templates):**
- **Documentation Generator:** Analyzes codebase, generates README.md with Claude
- **Code Review Automation:** Reviews pull requests, posts comments with suggestions
- **Tech Spec Writer:** Converts requirements into technical specifications
- **API Docs Generator:** Generates OpenAPI/Swagger docs from code
- **Release Notes Generator:** Summarizes commits into user-facing release notes

**2. Testing & QA (4 templates):**
- **Test Suite Generator:** Generates unit tests for functions/classes
- **Bug Report Automation:** Reproduces bugs, generates detailed reports
- **Regression Testing:** Runs test suite, compares results to baseline
- **End-to-End Test Orchestration:** Coordinates multi-step integration tests

**3. Data Processing (4 templates):**
- **CSV Processing Pipeline:** Reads CSV, transforms data, outputs results
- **JSON Transformation:** Converts JSON format A to format B
- **Batch File Processor:** Loops through files, applies transformations
- **Data Validation Workflow:** Validates data against schema, reports errors

**4. Deployment (4 templates):**
- **CI/CD Automation:** Builds, tests, deploys application
- **Deployment Checklist:** Runs pre-deployment checks (tests, migrations, config)
- **Rollback Automation:** Detects failed deployment, automatically rolls back
- **Blue-Green Deployment:** Deploys to staging, switches to production on success

**5. Development (3 templates):**
- **Code Scaffolding:** Generates boilerplate code for new features
- **Boilerplate Generator:** Creates project structure (files, directories, configs)
- **Refactoring Automation:** Applies code transformations (rename, extract method)

**Template Structure:**

```
workflow-templates/
  documentation-generator/
    workflow.yaml          # Workflow definition
    README.md              # Usage instructions
    preview.png            # Screenshot/diagram
    example-inputs.json    # Example input values
    scripts/               # Required scripts
      analyze_code.py
      generate_docs.py
```

**Example Template YAML:**

```yaml
name: Documentation Generator
description: Analyzes codebase and generates comprehensive documentation
category: AI & Documentation
tags: [documentation, claude, automation]
complexity: intermediate
author: Lighthouse Team
version: 1.0

inputs:
  repository_path:
    type: string
    required: true
    description: Path to the code repository
  output_path:
    type: string
    required: true
    default: ./docs/README.md

steps:
  - id: analyze_codebase
    type: python
    script: ./scripts/analyze_code.py
    inputs:
      repo_path: ${workflow.inputs.repository_path}

  - id: generate_documentation
    type: claude
    prompt: |
      Analyze the following codebase structure and generate comprehensive documentation:
      ${steps.analyze_codebase.outputs.structure}

      Include:
      - Project overview
      - Architecture explanation
      - Setup instructions
      - API reference
    inputs:
      codebase_structure: ${steps.analyze_codebase.outputs.structure}

  - id: save_documentation
    type: file_operation
    operation: write
    inputs:
      path: ${workflow.inputs.output_path}
      content: ${steps.generate_documentation.outputs.documentation}

ui_metadata:
  nodes:
    - id: analyze_codebase
      position: { x: 100, y: 100 }
    - id: generate_documentation
      position: { x: 300, y: 100 }
    - id: save_documentation
      position: { x: 500, y: 100 }
```

**Template Marketplace UI Layout:**

```
┌────────────────────────────────────────────────────┐
│ Template Marketplace                    [Search 🔍]│
├────────────────────────────────────────────────────┤
│ Categories: [All] [AI] [Testing] [Data] [Deploy] │
├────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐          │
│ │ Documentation   │ │ Code Review     │          │
│ │ Generator       │ │ Automation      │          │
│ │                 │ │                 │          │
│ │ Category: AI    │ │ Category: AI    │          │
│ │ Level: Medium   │ │ Level: Advanced │          │
│ │ ⭐⭐⭐⭐☆         │ │ ⭐⭐⭐⭐⭐          │          │
│ └─────────────────┘ └─────────────────┘          │
│ ┌─────────────────┐ ┌─────────────────┐          │
│ │ CSV Processing  │ │ CI/CD Pipeline  │          │
│ │ Pipeline        │ │                 │          │
│ │                 │ │                 │          │
│ │ Category: Data  │ │ Category: Deploy│          │
│ │ Level: Simple   │ │ Level: Advanced │          │
│ │ ⭐⭐⭐☆☆          │ │ ⭐⭐⭐⭐☆          │          │
│ └─────────────────┘ └─────────────────┘          │
└────────────────────────────────────────────────────┘
```

---

**Total Stories:** 3
**Total Hours:** 28 hours
**Total Objective UCP:** 35 UUCW
**Wave Status:** Planning
