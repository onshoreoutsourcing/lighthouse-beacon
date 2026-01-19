# Setup-Lighthouse

## Purpose
Initialize the standard Onshore AI SOC documentation structure for lighthouse-idf-workflow-specialist agent coordination and project organization.

## Step 1: Setup Standard Docs Folder Structure

Create the following directory structure in the project root:

```bash
mkdir -p docs/{architecture,dev_notes,implementation,planning,reports}
mkdir -p docs/architecture/_main
mkdir -p docs/implementation/{_main,completed}
mkdir -p docs/planning
mkdir -p docs/reports/{implementation,project_status,quality,security,unit_tests}
```

## Step 2: Create Base README Files

Create README.md files in each main directory:

### docs/architecture/README.md
```markdown
# Architecture Documentation

## Structure
- `_main/` - Core architectural decisions and system design
- `phase-x-phase-desc/` - Phase-specific architectural documentation
  - `feature-x-feature-desc/` - Feature-specific architectural details

## Standards
- All architecture decisions must include rationale and alternatives considered
- Include diagrams and data flow documentation
- Link to related implementation documentation
```

### docs/dev_notes/README.md
```markdown
# Development Notes

## Structure
- `feature-x-feature-desc/` - Feature-specific development notes and discoveries

## Standards
- Document implementation discoveries and learnings
- Include troubleshooting notes and workarounds
- Track technical debt and improvement opportunities
```

### docs/implementation/README.md
```markdown
# Implementation Documentation

## Structure
- `_main/` - Overall implementation guidelines and standards
- `completed/` - Completed epic and iteration documentation
- `epic-n-name/` - Active epic implementation tracking
  - `iteration-1-feature-description/` - Individual iteration plans and progress

## Standards
- Each iteration must have plan, tasks, and summary documents
- Include acceptance criteria and validation results
- Link git commits to implementation milestones
```

### docs/planning/README.md
```markdown
# Planning Documentation

## Purpose
Strategic planning documents, requirements analysis, and project roadmaps

## Standards
- Include stakeholder requirements and acceptance criteria
- Document planning assumptions and constraints
- Maintain traceability from planning to implementation
```

### docs/reports/README.md
```markdown
# Reports Documentation

## Structure
- `implementation/` - Implementation progress and completion reports
- `project_status/` - Overall project status and milestone reports
- `quality/` - Code quality, testing, and validation reports
- `security/` - Security audit and compliance reports
- `unit_tests/` - Test execution and coverage reports

## Standards
- All reports must include metrics and evidence
- Generate reports at iteration and epic completion
- Include actionable insights and recommendations
```

## Success Criteria
- [ ] All directory structure created
- [ ] README files in place with standards
- [ ] Directory structure matches Onshore AI SOC standards

## Usage with Lighthouse Agent
Once setup is complete, the lighthouse-idf-workflow-specialist can:
- Generate epic and iteration documentation in standard locations
- Track implementation progress with consistent structure
- Create reports with proper categorization
- Maintain traceability from planning through completion

## Step 3: Setup MCP servers
Check what MCP servers are currently available and install the needed following for the project
- Ask user what Azure DevOps server they would like to connect to, if any? {userProvided}
- Azure DevOps MCP: claude mcp add azure-devops -- npx -y @azure-devops/mcp {userProvided}
- Exa web search: claude mcp add exa -e EXA_API_KEY=c5675d32-69ff-497f-a239-6168b2fade10 -- npx -y exa-mcp-server
- Context7 documentation: claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ctx7sk-577b979a-3e5f-4c38-9cff-3ed7eb372d8f"
- Semgrep security: claude mcp add semgrep uvx semgrep-mcp
- Serena memory: claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
- Browser MCP testing: in "mcpServers" element of `.claude/mcp.json` add "browsermcp": {
      "command": "npx",
      "args": ["@browsermcp/mcp@latest"]
    }

## Step 4: Create project agents
Create the following agents:
-product-manager
-git-coordinator
-system-architect
-document-organizer
-iteration-planner
-backend-specialist
-frontend-specialist
-quality-control
-security-auditor
-implementation-validator