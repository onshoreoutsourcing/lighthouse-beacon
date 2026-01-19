# How to Write an Architecture Decision Record (ADR)

## Quick Start

1. **Copy the template**: `ADR-000-TEMPLATE.md`
2. **Rename** it with the next number: `ADR-{next-number}-{kebab-case-title}.md`
3. **Fill in each section** (guidance below)
4. **Update the index** in `README.md`
5. **Commit** with message: `docs: Add ADR-{number} for {title}`

---

## When to Write an ADR

Write an ADR when you make a decision that:

- ✅ **Affects the architecture** - Structure, boundaries, or patterns
- ✅ **Has long-term impact** - Hard to reverse or change later
- ✅ **Involves trade-offs** - Choosing between multiple valid alternatives
- ✅ **Needs explanation** - Future developers will ask "why did we do this?"
- ✅ **Impacts multiple teams** - Affects how others work with the system
- ✅ **Sets precedent** - Similar decisions should follow this pattern

### What NOT to Write ADRs For

- ❌ **Implementation details** - These belong in code comments
- ❌ **Bug fixes** - Use commit messages
- ❌ **Configuration changes** - Document in config files
- ❌ **Obvious choices** - No need to document "use Git for version control"
- ❌ **Temporary decisions** - Only document architectural choices with lasting
  impact

---

## ADR Template Structure

Our ADRs follow the industry-standard format (Michael Nygard style):

```
1. Title + Metadata (Status, Date, Deciders)
2. Context (The situation and forces)
3. Considered Options (Alternatives evaluated)
4. Decision (What we chose and why)
5. Consequences (Positive, negative, risks)
6. References (Links and related docs)
```

---

## Section-by-Section Guide

### 1. Title and Metadata

```markdown
# ADR-042: Use TypeScript for SDK Implementation

**Status**: Accepted **Date**: 2025-10-20 **Deciders**: Jane Smith (Tech Lead),
Bob Chen (Architect), Alice Kumar (Senior Dev) **Related**: Epic 1-5, GitHub
Issue #123, ADR-001
```

**Guidelines:**

- **Title**: Use active voice and be specific
  - ✅ "Use TypeScript for SDK Implementation"
  - ❌ "TypeScript vs JavaScript"
- **Status**:
  - `Proposed` - Under review
  - `Accepted` - Approved and implemented
  - `Deprecated` - No longer relevant
  - `Superseded by ADR-XXX` - Replaced by newer decision
- **Date**: When the decision was made (not when written)
- **Deciders**: Names of people who participated
- **Related**: Links to epics, issues, PRs, or related ADRs

---

### 2. Context Section

**Purpose**: Explain the situation and why a decision is needed.

```markdown
## Context

We need to implement a compliance detection SDK that can run in both Node.js
backend services and browser frontend applications. The SDK must provide type
safety for handling sensitive PCI/HIPAA data and offer excellent developer
experience with autocomplete and refactoring support.

Current implementation uses Python scripts that:

- Lack type safety (runtime errors in production)
- Cannot run in browsers (limits use cases)
- Provide poor IDE support (no autocomplete)
- Require Python runtime (deployment complexity)

Requirements:

- Type-safe API to prevent PII/PHI handling errors
- Cross-platform (Node.js + browsers)
- Bundle size <100KB gzipped
- Compatible with CommonJS and ESM
- Support legacy browsers (ES5 compilation)

Constraints:

- Team has 3 Python developers, 2 JavaScript developers
- Must maintain backward compatibility with existing API
- Timeline: 3 months for initial release
```

**Tips:**

- Describe the problem, not the solution
- Include relevant background and history
- Be specific about requirements and constraints
- Focus on facts, not opinions
- Answer: "Why do we need to make a decision?"

---

### 3. Considered Options

**Purpose**: Show you evaluated alternatives fairly.

```markdown
## Considered Options

- **Option 1: TypeScript** - Strongly typed superset of JavaScript
- **Option 2: Plain JavaScript (ES2020+)** - No type system, standard JS
- **Option 3: Python with type hints** - Current approach with mypy types
- **Option 4: Flow** - Facebook's static type checker for JavaScript
- **Option 5: Do Nothing** - Continue with current Python implementation
```

**Guidelines:**

- List 3-5 realistic alternatives
- Include "Do Nothing" as an option
- Keep descriptions brief (one line each)
- Save detailed pros/cons for Decision section

---

### 4. Decision Section

**Purpose**: State what you decided and explain why.

````markdown
## Decision

**We have decided to implement the SDK in TypeScript with strict mode enabled,
targeting ES2020 for modern environments and compiling to ES5 for legacy
browsers.**

### Why This Choice

TypeScript provides the best balance of type safety, developer experience, and
ecosystem compatibility for our compliance SDK.

**Key factors:**

1. **Type Safety**: Strict mode catches 90% of PII/PHI handling errors at
   compile time rather than runtime. Microsoft Research shows TypeScript reduces
   production bugs by 15%.

2. **Cross-Platform**: Compiles to JavaScript that runs everywhere - Node.js,
   browsers, workers, edge functions. Single codebase for all platforms.

3. **Developer Experience**: Excellent IDE support with autocomplete,
   refactoring, and inline documentation. Reduces integration time by 40%
   compared to untyped JavaScript.

4. **Ecosystem**: 80% of npm packages have TypeScript definitions. Large
   community and talent pool. Easy to hire TypeScript developers.

5. **Maintainability**: Type system makes refactoring safer. Interface contracts
   prevent breaking changes.

**Trade-offs we accept:**

| Aspect         | Trade-off                 | Justification                                  |
| -------------- | ------------------------- | ---------------------------------------------- |
| Build time     | +30% slower compilation   | Worth it for type safety in compliance code    |
| Learning curve | Python devs need training | 2-week investment vs long-term maintainability |
| Bundle size    | +5KB for type definitions | Negligible compared to 100KB budget            |

**Why we rejected alternatives:**

- **Plain JavaScript**: No type safety - unacceptable for PII/PHI handling
- **Python**: Doesn't run in browsers - blocks 50% of use cases
- **Flow**: Declining adoption, less tooling support than TypeScript
- **Do Nothing**: Current error rate (15% false positives) is too high

**Implementation approach:**

```typescript
// Strict TypeScript configuration
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true
  }
}

// Dual package support (CJS + ESM)
// Use Rollup for optimized bundling
```
````

````

**Tips:**
* Start with a clear decision statement
* Explain reasoning with evidence (not just opinions)
* Include data/benchmarks when possible
* Show the trade-offs you consciously accepted
* Explain why alternatives were rejected
* Add code examples if they clarify the decision
* Be decisive - avoid hedging language

---

### 5. Consequences Section

**Purpose**: Document expected outcomes (good and bad).

```markdown
## Consequences

### Positive

* **Type Safety**: Catch 90% of errors at compile time, reducing production
  bugs in compliance-critical code
* **Better IDE Support**: Autocomplete, go-to-definition, and refactoring
  tools improve developer productivity by 40%
* **Single Codebase**: One TypeScript codebase compiles for Node.js and
  browsers - no need to maintain separate implementations
* **Easier Onboarding**: Types serve as documentation - new developers
  understand APIs faster
* **Ecosystem Access**: Can use 80% of npm packages with full type support
* **Safer Refactoring**: Type system prevents breaking changes, making
  architecture evolution easier

### Negative

* **Build Complexity**: Need TypeScript compiler + bundler (Rollup) in build
  pipeline - adds 30% to build time
* **Learning Curve**: 3 Python developers need TypeScript training - 2 weeks
  per developer
* **Compilation Step**: Cannot run code directly like Python - requires build
  step for development
* **Type Maintenance**: Need to keep type definitions updated as API evolves
* **Strictness Friction**: Strict mode catches edge cases that would "just work"
  in JavaScript - requires more upfront thinking

### Mitigation Strategies

**For build complexity:**
* Use standard toolchain (TypeScript + Rollup) with proven configurations
* Implement watch mode for fast incremental compilation during development
* Set up CI/CD pipeline with caching to minimize build times

**For learning curve:**
* Provide TypeScript training materials and workshops
* Pair Python developers with TypeScript experts for first 2 weeks
* Start with simple types, gradually adopt advanced patterns
* Create internal style guide with best practices

**For type maintenance:**
* Use automated tests to catch type mismatches
* Implement pre-commit hooks for type checking
* Schedule quarterly reviews of type definitions
````

**Tips:**

- Be honest about both positives AND negatives
- Quantify benefits when possible ("40% faster" not "faster")
- Don't minimize drawbacks - acknowledge them
- Provide concrete mitigation strategies for negatives
- Think long-term (1-3 years), not just immediate impact

---

### 6. References Section

**Purpose**: Link to supporting materials.

```markdown
## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Microsoft Research: TypeScript Reduces Bugs by 15%](https://example.com/research)
- [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/)
- Internal: [Technology Stack Evaluation Spreadsheet](link)
- Related:
  [ADR-001: Dual Package Distribution Strategy](./ADR-001-dual-package-distribution.md)
- Implementation: `src/tsconfig.json` and `rollup.config.js`
- Benchmark: [Build Time Analysis](link)
```

**Tips:**

- Link to external standards, research, or documentation
- Reference internal docs or spreadsheets
- Link to related ADRs
- Include code references with file paths and line numbers
- Add benchmark or performance test results

---

## Writing Tips

### ✅ Be Specific, Not Generic

**Bad:**

> "We'll use a database for storage."

**Good:**

> "We'll use PostgreSQL 15 on AWS RDS for data storage because it supports our
> expected 10M records/day, provides point-in-time recovery (PCI DSS 10.5.4),
> and has HIPAA BAA available."

---

### ✅ Use Active Voice

**Bad:**

> "A decision was made to implement caching."

**Good:**

> "We decided to implement Redis caching for session data to reduce database
> load by 80%."

---

### ✅ Provide Context, Not Just Facts

**Bad:**

> "TypeScript is statically typed."

**Good:**

> "TypeScript's static typing catches 90% of PII handling errors at compile time
> (vs runtime in JavaScript), which is critical for compliance code where
> mistakes can result in regulatory violations."

---

### ✅ Show Your Work

**Bad:**

> "We chose X because it's better."

**Good:**

> "We chose X over Y because:
>
> 1. X has 99.99% SLA (vs Y's 99.9%) - critical for our uptime requirements
> 2. X costs $1000/mo less at our scale (10M req/day)
> 3. X has native TypeScript support (vs Y's community-maintained types)
> 4. X's latency is 20ms (vs Y's 80ms) for our use case"

---

### ✅ Be Honest About Trade-offs

**Bad:**

> "This solution is perfect and has no downsides."

**Good:**

> "This solution increases build time by 30%, but we accept this trade-off
> because the type safety it provides reduces production bugs by 15%, which is
> critical for our compliance-focused SDK."

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Too Vague

**Bad:**

> "We'll use a modern approach for authentication that follows best practices."

**Good:**

> "We'll use OAuth 2.0 with PKCE for authentication, implemented via Auth0, to
> meet PCI DSS Requirement 8.2 for multi-factor authentication."

---

### ❌ Mistake 2: No Alternatives Shown

**Bad:**

> "We decided to use PostgreSQL."

**Good:**

> "We evaluated PostgreSQL, MySQL, and MongoDB. PostgreSQL won because:
>
> 1. Better JSON support than MySQL (critical for our schema-flexible data)
> 2. Full ACID compliance (MongoDB lacks multi-document transactions)
> 3. Proven at scale (Instagram uses it for 1B+ records)
> 4. Native support on AWS RDS with automated backups"

---

### ❌ Mistake 3: No Consequences

**Bad:**

> "We'll add caching to improve performance."

**Good:**

> "We'll add Redis caching.
>
> Positive: 90% faster response times (50ms → 5ms), reduced DB load Negative:
> Cache invalidation complexity, increased operational burden Mitigation: Use
> cache-aside pattern, implement monitoring dashboards"

---

### ❌ Mistake 4: Decision Already Made in Context

**Bad:**

```markdown
## Context

We need TypeScript for type safety...

## Decision

We decided to use TypeScript.
```

**Good:**

```markdown
## Context

We need a type-safe language for our SDK...

## Considered Options

- TypeScript
- Flow
- Plain JavaScript

## Decision

We chose TypeScript because [reasons]...
```

---

### ❌ Mistake 5: Opinion Without Evidence

**Bad:**

> "TypeScript is better than JavaScript."

**Good:**

> "TypeScript reduces production bugs by 15% (Microsoft Research, 2019) and
> provides IDE autocomplete that speeds up development by 40% (Developer Survey
> 2024)."

---

## Review Checklist

Before finalizing an ADR, verify:

- [ ] **Title** is clear, specific, and uses active voice
- [ ] **Status** is correct (Proposed/Accepted/Deprecated/Superseded)
- [ ] **Date** is when decision was made (not when written)
- [ ] **Deciders** lists everyone who participated
- [ ] **Context** explains WHY decision was needed (not the solution)
- [ ] **Considered Options** lists 3-5 realistic alternatives
- [ ] **Decision** is stated clearly with strong rationale
- [ ] **Decision** explains why alternatives were rejected
- [ ] **Decision** includes code examples or implementation approach (if
      applicable)
- [ ] **Consequences** lists both positive AND negative outcomes
- [ ] **Consequences** are specific and quantified (not vague)
- [ ] **Mitigation** strategies provided for negative consequences
- [ ] **References** include supporting links/docs/code
- [ ] **README.md** index updated with new ADR
- [ ] No compliance jargon unless necessary
- [ ] Language is clear and accessible to junior developers

---

## Examples of Good ADRs

See these ADRs in this directory for examples:

- **ADR-001**: `typescript-sdk-implementation.md` - Technology choice
- **ADR-002**: `luhn-validation-strategy.md` - Algorithm selection
- **ADR-003**: `safe-harbor-compliance.md` - Compliance strategy
- **ADR-004**: `confidence-scoring-system.md` - Design pattern
- **ADR-005**: `census-data-integration.md` - Data integration

---

## Frequently Asked Questions

**Q: How long should an ADR be?** A: As long as needed to explain the decision
clearly. Typically 1-3 pages. Simple decisions might be 1 page, complex
architectural choices might be 3-4 pages.

**Q: Who approves ADRs?** A: Typically the tech lead, architect, and affected
team leads. For major decisions, include product management and security teams.

**Q: When do we mark status as "Accepted"?** A: After review and approval by
stakeholders, typically before implementation starts.

**Q: Can we change ADRs after they're accepted?** A: Yes! ADRs are living
documents. Use git history to track changes. Update consequences with learnings
from implementation.

**Q: What if we made the wrong decision?** A: Create a new ADR that supersedes
the old one. Mark the old ADR as "Superseded by ADR-XXX". Explain what changed
and why.

**Q: Should we create ADRs for decisions made in the past?** A: Yes, retroactive
ADRs are valuable for documenting important decisions that weren't recorded at
the time. Mark them with the original decision date.

**Q: How do we handle ADRs that become outdated?** A: Mark them as "Deprecated"
but don't delete them. They provide historical context for why we made certain
choices.

---

## External Resources

- [Michael Nygard's Original ADR Article (2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
- [Markdown Any Decision Records (MADR)](https://adr.github.io/madr/)
- [ThoughtWorks Technology Radar on ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)

---

**Remember**: ADRs document the "why" behind architectural decisions, not the
"what" or "how" (that's in code and documentation). Focus on explaining the
reasoning so future developers can understand your thought process.

---

**Last Updated**: 2025-10-30
