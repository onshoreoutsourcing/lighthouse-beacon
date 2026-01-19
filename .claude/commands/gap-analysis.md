# Production Readiness Gap Analysis

I need you to perform a comprehensive gap analysis for this project to identify
what's missing before it's truly production-ready. Focus on **functional
capabilities and features**, not just documentation or infrastructure.

## Required Skills

### During Context Gathering (Step 0)

1. **cross-documentation-verification**: Validate documentation claims against actual implementation
   - Check: README claims match actual code capabilities
   - Verify: CLAUDE.md context aligns with implementation
   - Identify: Documentation inconsistencies (claims without implementation)
   - **Invoke during Step 0 when gathering project context**

### During Gap Analysis (Sections 1-10)

2. **development-best-practices**: Reference for security, operational, and quality standards
   - Security gaps: Anti-hardcoding, secrets management, authentication patterns
   - Operational gaps: Error handling, logging, monitoring, health checks
   - Quality gaps: Testing standards, accessibility compliance, performance targets
   - **Reference during Sections 4, 9, 10 (Extensibility, Security, Operational)**

3. **architectural-conformance-validation**: Distinguish intentional architecture decisions from true gaps
   - Check: Are "missing" features intentionally excluded per ADRs?
   - Validate: Gap findings against existing architectural decisions
   - Examples: "No plugin system" might be intentional per ADR-005 "Monolithic design for simplicity"
   - **Invoke during Sections 1, 4, 6 (Feature completeness, Extensibility, Integration)**

## Analysis Framework

Please analyze the following dimensions:

### 1. Core Feature Completeness

- What features does the code currently support?
- What features are common in similar products but missing here?
- What features do the docs/README claim but might not be fully implemented?
- What edge cases or scenarios aren't handled?

### 2. Real-World Usability

- What would prevent a customer from using this in production TODAY?
- What workarounds would customers need to implement?
- What are the common "but can it..." questions customers would ask?
- What limitations would force customers to choose a competitor?

### 3. Data Format Support

- What data formats can be processed? (JSON, XML, CSV, etc.)
- What file formats can be handled? (PDF, DOCX, images, etc.)
- Is structured data preserved during processing?
- Are there format-specific limitations?

### 4. Extensibility & Customization

- Can users customize behavior without modifying source?
- Are there hooks, plugins, or extension points?
- Can users add their own rules/patterns/validators?
- Is configuration flexible enough for different use cases?

### 5. Policy & Rules Management

- Can users define business rules ("if X then Y")?
- Is there allowlist/blocklist/exception management?
- Can rules be conditional or context-dependent?
- Are there risk scoring or severity-based actions?

### 6. Integration Capabilities

- How easy is it to integrate with other systems?
- Are there common integrations missing? (SIEM, monitoring, reporting)
- Does it support batch processing or streaming?
- Can it export data in common formats?

### 7. Internationalization

- Does it support multiple languages/locales?
- Are patterns region-specific (US vs EU vs Asia)?
- Can it handle character sets beyond ASCII/UTF-8?

### 8. Performance & Scale

- Are there documented performance benchmarks?
- What happens under load (1000s of requests)?
- Are there batch/bulk operation APIs?
- Memory/resource optimization for large datasets?

### 9. Security & Compliance

- Are there features for reversible operations (tokenization)?
- Is audit logging built-in?
- Can sensitive data be safely handled in all scenarios?
- Are there compliance reporting features?

### 10. Operational Features

- Health checks, metrics, monitoring integration?
- Graceful degradation and error recovery?
- Circuit breakers, rate limiting, retries?
- Operational runbooks or troubleshooting guides?

## Investigation Steps

**STEP 0: Gather Project Context** (see "Context Gathering" section above)
- Invoke cross-documentation-verification skill during this step

**Then proceed with gap analysis:**

1. **Read the README/CLAUDE.md** - What does it claim to do?
2. **Review the main exports** (src/index.ts or src/extension.ts) - What APIs
   are exposed?
3. **Check the documentation** (Docs/ folder) - What use cases are covered?
4. **Examine the tests** - What scenarios are tested?
5. **Look at issues/TODO comments** - What's known to be missing?
6. **Review integration examples** - What limitations appear in example code?
7. **Review ADRs** - What architectural decisions explain design constraints?
   - **Invoke architectural-conformance-validation skill**
   - Identify which "gaps" are intentional architectural decisions
   - Note: "Missing feature X per ADR-005 (intentional simplicity trade-off)"
8. **Reference development-best-practices skill** for security/operational gaps:
   - Check: Anti-hardcoding compliance (secrets management, config externalization)
   - Check: Error handling and logging patterns
   - Check: Security standards (authentication, authorization, encryption)
   - Check: Operational features (monitoring, health checks, metrics)
9. **Compare with competitors** - Research 2-3 similar products based on the
   actual product type you discovered

## Output Format

Please provide your analysis as:

### Executive Summary

- Current state assessment (what works well)
- Critical gaps (must-have for production)
- Impact summary (how gaps affect usability)

### Critical Missing Features (🔴)

For each critical gap:

- **Feature Name**
- **Problem**: What can't users do today?
- **Real-World Impact**: Why does this matter?
- **Customer Quote**: "I can't use this because..."
- **Example**: Code snippet showing what users want
- **Architectural Note**: Is this gap intentional per ADRs, or a true omission?
  - If intentional: "Per ADR-XXX: [reason for exclusion]"
  - If true gap: "No ADR addresses this - genuine missing capability"
- **Effort Estimate**: Hours to implement
- **Priority Justification**: Why is this critical?

### High-Value Missing Features (🟡)

Same structure as critical, but for nice-to-have features

### Nice-to-Have Features (🟢)

Brief descriptions only

### Feature Comparison Matrix

| Feature | Our Product | Competitor A | Typical Industry |
| ------- | ----------- | ------------ | ---------------- |
| ...     | ✅/❌/⚠️    | ✅/❌/⚠️     | ✅/❌/⚠️         |

### Implementation Roadmap

- Phase 1: MVP (features + hours)
- Phase 2: Enterprise-Ready (features + hours)
- Phase 3: Market Leader (features + hours)

### Prioritization Recommendations

Which features to build first and why, based on:

- Customer impact
- Competitive necessity
- Implementation effort
- Risk mitigation

## Important Guidelines

1. **Use Actual Project Context**: Base your analysis on the project context you
   discovered, not generic assumptions
2. **Be Specific**: Don't just say "better error handling" - specify what error
   scenarios aren't handled
3. **Show Examples**: Include code snippets of what users would want to write
4. **Think Like a Customer**: What would prevent YOU from using this in
   production?
5. **Focus on Gaps**: Not documentation or infrastructure, but actual functional
   capabilities
6. **Be Realistic**: Consider effort vs impact when prioritizing
7. **Research Competitors**: Look at 2-3 similar products in the SAME CATEGORY
   you discovered
8. **Consider Edge Cases**: What breaks the product? What scenarios fail?
9. **Think Globally**: Consider use cases appropriate to the product type you
   discovered

## Red Flags to Look For

- ❌ Only handles one data format (e.g., plain text only, no JSON)
- ❌ No way to customize without forking
- ❌ One-way operations (e.g., redaction with no way to reverse)
- ❌ No batch/bulk operations for scale
- ❌ Missing common integrations (webhooks, exports, etc.)
- ❌ Hardcoded assumptions (e.g., US-only, English-only)
- ❌ No policy/rules engine (just raw outputs)
- ❌ Missing file format support (if files are in scope)
- ❌ No allowlist/exception handling
- ❌ Format-breaking operations (e.g., breaks JSON structure)

## Context Gathering - Step 0

**BEFORE starting the gap analysis, you must gather context about this
project:**

1. **Read CLAUDE.md** (if exists) - Primary project overview
2. **Read README.md** (if exists) - Project description and capabilities
3. **Read package.json** - Project name, description, type
4. **Scan src/** structure - Identify project architecture and type
5. **Check Docs/** - Any architecture or requirements documents
6. **Read existing ADRs** - Understand architectural decisions that may explain apparent "gaps"

**Invoke cross-documentation-verification skill:**

- Validate documentation claims against actual implementation:
  - README claims vs actual code exports/APIs
  - CLAUDE.md context vs actual project structure
  - Docs/ architecture vs actual implementation
- Identify documentation inconsistencies:
  - Features claimed but not implemented
  - Capabilities documented but missing in code
  - Usage examples that don't work

**Extract and summarize:**

- **Product Type**: What kind of software is this? (SDK, VS Code Extension, API,
  CLI tool, etc.)
- **Target Users**: Who uses this product?
- **Main Use Case**: What problem does it solve?
- **Technology Stack**: Key technologies used
- **Domain/Industry**: What domain does this serve? (DevOps, Security,
  Compliance, Productivity, etc.)
- **Key Competitors**: What similar products exist in the market?
- **Architectural Decisions**: Key ADRs that explain design choices

**IMPORTANT**: Use the ACTUAL project context you discover, not assumptions or
examples from other projects.

## Example Output Quality

Good ❌:

> "Need better data handling"

Excellent ✅ (example from a hypothetical SDK project):

> **Feature**: Structured Data Support (JSON/XML)
>
> **Problem**: SDK can only scan flat text strings, not JSON/XML while
> preserving structure. When scanning `{"card": "4111..."}`, redaction breaks
> JSON: `{"card": "[REDACTED]"}` might not be valid.
>
> **Real-World Impact**: 80% of modern data is structured (APIs, databases,
> configs). Customers must stringify, scan, then manually rebuild structure.
>
> **Customer Quote**: "I can't use this because my API payloads are JSON and I
> need the structure intact after scanning."
>
> **Example**: [code snippet]
>
> **Effort**: 16-24 hours
>
> **Priority**: CRITICAL - Most real-world data is structured, not plain text.

**NOTE**: This is just an example format. Your analysis should use gaps relevant
to the ACTUAL project you're analyzing.

---

Now, please perform this analysis on the current project.
