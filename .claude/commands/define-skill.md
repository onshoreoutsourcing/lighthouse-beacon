# Define Skill

Create a new Claude Agent Skill following Onshore's Skills Development Guide and Anthropic's best practices.

**Reference**: See `docs/dev_notes/Onshore_Skills_Development_Guide 1.md` for complete methodology.

---

## Overview

This command implements the **"Skills Not Agents"** paradigm:
- Skills are organized folders of instructions, scripts, and resources
- Skills use progressive disclosure (metadata → instructions → references)
- Skills encode institutional knowledge in executable form

**Workflow**: 7 steps from discovery to completion (30-60 minutes for simple skills)

---

## Step 0: Skill Discovery Questions

Ask the user to define the skill scope:

1. **What is the skill name?** (lowercase-with-hyphens format)
   - Example: `ucp-calculator`, `contract-composer`, `baseline-analysis`

2. **What tasks should trigger this skill?**
   - What would a user say that should activate it?
   - What file types or keywords indicate this skill is needed?
   - What specific scenarios require this expertise?

3. **What are the expected inputs and outputs?**
   - Input: What data/files/context does the skill need?
   - Output: What should the skill produce?

4. **What existing documentation should be encoded?**
   - Are there existing guides, procedures, or standards?
   - Where are they located?

5. **Where should the skill live?**
   - **Project skill**: `.claude/skills/` (version controlled, team shared)
   - **Personal skill**: `~/.claude/skills/` (user-specific)

---

## Step 1: Understand the Skill (Gather Examples)

**CRITICAL**: Before creating any files, collect concrete examples.

Ask the user to provide:

1. **Real-world example #1**: Show a typical task this skill would handle
   - What's the trigger? (user request, file type, context)
   - What's the input?
   - What's the expected output?

2. **Real-world example #2**: Show an edge case or variation
   - How does this differ from example #1?
   - What additional complexity exists?

3. **Real-world example #3** (if applicable): Show another scenario

**Document examples** in a temporary analysis section for reference.

---

## Step 2: Plan Reusable Contents

For each example gathered in Step 1, analyze what belongs where:

### Decision Matrix

**Question 1**: Is this code that gets rewritten repeatedly?
- **YES** → Create script in `scripts/`
- **NO** → Continue to Question 2

**Question 2**: Is this detailed documentation or reference material?
- **YES** → Create reference doc in `references/`
- **NO** → Continue to Question 3

**Question 3**: Is this a file used in output (template, image, etc.)?
- **YES** → Store in `assets/`
- **NO** → Include in SKILL.md body

### Content Inventory

Create an inventory table:

| Content | Type | Location | Why |
|---------|------|----------|-----|
| [Item 1] | Script/Reference/Asset/Instruction | [Path] | [Reasoning] |
| [Item 2] | Script/Reference/Asset/Instruction | [Path] | [Reasoning] |

**Ask user to confirm** this organization makes sense.

---

## Step 3: Initialize the Skill Structure

Create the directory structure based on Step 2 inventory:

```bash
# Determine base path from Step 0
SKILL_PATH="[.claude/skills or ~/.claude/skills]/[skill-name]"

# Create base directory
mkdir -p "$SKILL_PATH"

# Create subdirectories only if needed (based on Step 2)
# Only create directories that will have content!
mkdir -p "$SKILL_PATH/scripts"    # If scripts identified
mkdir -p "$SKILL_PATH/references" # If references identified
mkdir -p "$SKILL_PATH/assets"     # If assets identified

# Create SKILL.md placeholder
touch "$SKILL_PATH/SKILL.md"
```

**Verify structure created**: List the created directory structure.

---

## Step 4: Implement Resources (Bottom-Up)

Work from the most concrete (scripts) to most abstract (instructions).

### 4.1: Create Scripts (if applicable)

For each script identified in Step 2:

1. **Script purpose**: What deterministic operation does it perform?
2. **Script inputs**: What parameters/arguments?
3. **Script outputs**: What does it return? (structured data Claude can parse)
4. **Error handling**: What can go wrong? How should it fail gracefully?

**Implementation guidelines**:
- Test scripts before including
- Use clear argument parsing (`argparse` for Python)
- Return structured output (JSON, formatted text, exit codes)
- Include docstrings/comments for maintainability

**Create script**: Use Write tool to create `scripts/[name].py` (or appropriate extension)

**Test script**: Execute script with sample data to verify it works

### 4.2: Create References (if applicable)

For each reference doc identified in Step 2:

1. **Reference purpose**: What detailed knowledge does it contain?
2. **When loaded**: What scenario requires this reference?
3. **Content source**: Is this based on existing documentation?

**Implementation guidelines**:
- Keep focused (one topic per file)
- Use clear markdown structure with headers
- Include examples where helpful
- Avoid duplication with SKILL.md

**Create reference**: Use Write tool to create `references/[name].md`

### 4.3: Create Assets (if applicable)

For each asset identified in Step 2:

1. **Asset purpose**: How is it used in output?
2. **Asset format**: Template, image, boilerplate code, etc.

**Implementation guidelines**:
- Organize by type (templates/, images/, etc.)
- Include only essential files
- Assets are used, not read into context

**Copy/create assets**: Use appropriate tools to populate `assets/`

---

## Step 5: Write SKILL.md

Now that resources exist, write the core skill instructions.

### 5.1: Write Frontmatter

**CRITICAL**: The `description` field is the most important part of your skill.

Create YAML frontmatter:

```yaml
---
name: [skill-name from Step 0]
description: [SEE BELOW - This is critical!]
---
```

**Writing the Description** (This determines when skill triggers):

The description must include:
1. **What it does** (one sentence)
2. **When to use it** (specific triggers)
3. **File types or keywords** that should activate it

**Template for description**:
```
[Action verb] [what] using [methodology/standard]. Includes [key capabilities]. Use when [trigger 1], [trigger 2], [trigger 3], or any [general pattern].
```

**Example — GOOD**:
```yaml
description: Calculate Use Case Points for software development work using Onshore's UCP methodology. Includes work item classification, Technical Complexity Factor (TCF) calculation, Environmental Complexity Factor (ECF) calculation, and productivity analysis. Use when analyzing development effort, estimating projects, calculating billing, generating baseline reports, or any UCP-related calculation.
```

**Example — BAD**:
```yaml
description: Calculates UCPs.
```

**Ask user to review and approve description** before proceeding.

### 5.2: Write Body Structure

Follow this recommended structure:

```markdown
# [Skill Name]

[Brief overview - 1-2 sentences about what this skill does]

## Quick Start

[Minimal working example - 3-5 lines showing the simplest use case]

## Core Workflow

[Step-by-step process for the main scenario]

1. [Step one with specific action]
2. [Step two with specific action]
3. [Step three with specific action]

## Key Concepts

[Domain knowledge Claude needs to understand]
- **[Term 1]**: [Definition]
- **[Term 2]**: [Definition]

## Available Resources

[Only include sections that exist based on Step 2]

- **scripts/**:
  - `[script-name].py` — [What it does, usage example]
- **references/**:
  - `[ref-name].md` — [What it contains, when to read]
- **assets/**:
  - `[asset-name]` — [What it provides]

## Output Format

[Expected structure of skill output]

[Include example output if helpful]
```

**Token Efficiency Rules**:
1. **Claude is already smart** — Only add what Claude doesn't know
2. **Challenge every paragraph** — "Does this justify its token cost?"
3. **Prefer examples over explanations** — Show, don't tell
4. **Use progressive disclosure** — Move details to references

**Target length**: <500 lines, <5,000 words for SKILL.md body

**Writing style**:
- Use imperative/infinitive: "Calculate the UCPs" not "You should calculate"
- Be concise: Every word should earn its place
- Structure with headers: Easy scanning and navigation
- Provide examples: Input/output pairs are powerful

**Create SKILL.md**: Use Write tool to create complete SKILL.md file

---

## Step 6: Validation and Verification

Verify the skill is complete and ready to use:

### Quick Validation Checklist

**Structure**:
- [ ] SKILL.md exists with valid YAML frontmatter
- [ ] `name` field is lowercase-with-hyphens
- [ ] `description` field is comprehensive with specific triggers
- [ ] Only necessary directories created (no empty folders)

**Content**:
- [ ] SKILL.md body is concise (<500 lines recommended)
- [ ] Scripts tested (if applicable)
- [ ] References are focused (if applicable)
- [ ] Writing style is imperative and concise

**Installation**:
- [ ] Skill location confirmed
- [ ] Files readable and properly formatted

### Verify Skill Discovery

```bash
# List skills to confirm it's there
ls [.claude/skills or ~/.claude/skills]

# View frontmatter to confirm format
head -10 [skill-path]/SKILL.md
```

---

## Step 7: Completion Summary

Provide user with:

1. **Skill Summary**:
   ```
   Skill: [name]
   Location: [path]
   Description: [description]
   Components:
   - SKILL.md (XXX lines)
   - scripts/ (X files) [if applicable]
   - references/ (X files) [if applicable]
   - assets/ (X files) [if applicable]
   ```

2. **How to Use**:
   ```
   The skill will automatically trigger when you:
   - [Trigger scenario 1]
   - [Trigger scenario 2]
   - [Trigger scenario 3]

   You can also explicitly invoke by saying:
   "Use the [skill-name] skill to [action]"
   ```

3. **Next Steps**:
   - Test skill by triggering it with example scenarios
   - Iterate and refine based on real usage
   - Share with team (if project skill)
   - Consider adding to skills catalog

4. **Quick Tips**:
   - Skills improve with real-world usage
   - Update when procedures change
   - Split into multiple skills if SKILL.md grows >500 lines
   - Add LICENSE.txt if needed for proprietary content

---

## Common Patterns for Onshore Skills

### Pattern 1: Encoding Existing Documentation

If skill is based on existing docs:
1. Read existing documentation
2. Extract workflow steps → SKILL.md body
3. Move detailed rules/schemas → references/
4. Add deterministic calculations → scripts/

**Example**: MSA_Drafting_Principles.md (54KB) → `contract-composer` skill

### Pattern 2: Multi-Platform Support

If skill works across multiple platforms:
1. Platform selection logic in SKILL.md
2. Platform-specific workflows in references/
3. Unified script handles multiple formats

**Example**: `ucp-devops-integration` supporting Azure DevOps, GitHub, Jira

### Pattern 3: Skill Composition

If skill orchestrates other skills:
1. High-level workflow in SKILL.md
2. Explicit skill invocations: "Use [other-skill] skill to..."
3. Clear handoff points between skills

**Example**: `baseline-analysis` orchestrating `onshore-git-workflow`, `ucp-calculator`, `pitch-generator`

---

## Important Reminders

1. **Progressive Disclosure**: Only frontmatter is always loaded (~50-100 tokens per skill)
2. **Token Efficiency**: Context window is a public good — be concise
3. **Security**: Audit scripts, watch for unexpected network calls
4. **Version Control**: Project skills should be in git (team shared)
5. **Testing**: Always test on real scenarios before considering complete

---

## Reference Links

**Official Documentation**:
- Agent Skills Overview: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
- Best Practices: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices
- Skills Cookbook: https://github.com/anthropics/claude-cookbooks/tree/main/skills

**Onshore Guide**:
- Complete methodology: `docs/dev_notes/Onshore_Skills_Development_Guide 1.md`
