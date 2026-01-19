# ADR-XXX: [Short Decision Title]

**Status**: Proposed | Accepted | Deprecated | Superseded by [ADR-YYY] **Date**:
YYYY-MM-DD **Deciders**: [List of people involved in the decision] **Related**:
[Epic/Iteration references, GitHub issues, related ADRs]

---

## Context

[Describe the situation and problem that requires a decision. Include the
technical, business, and project forces at play. Be factual and neutral.]

What is the issue we're trying to solve? What are the relevant facts? What
constraints and requirements do we have? What architectural forces are we
balancing?

**Example:**

> We need to implement credit card validation in our compliance SDK. The
> validation must be accurate, performant, and maintainable. Current system uses
> regex-only approach which has 15% false positive rate. We need to support
> real-time validation for 1000+ requests/second with <50ms latency.

---

## Considered Options

- **Option 1: [Name]** - [Brief description]
- **Option 2: [Name]** - [Brief description]
- **Option 3: [Name]** - [Brief description]
- **Option 4: Do Nothing** - [Continue with current approach]

---

## Decision

[State the decision clearly and explain the reasoning. This should be in active
voice and decisive.]

**We have decided to [decision statement].**

### Why This Choice

[Explain the rationale for choosing this option over the alternatives. Include
key factors, supporting evidence, and trade-offs considered.]

**Key factors:**

1. [Factor 1 with explanation]
2. [Factor 2 with explanation]
3. [Factor 3 with explanation]

**Example code/implementation approach:**

```typescript
// Show a code snippet if it helps clarify the decision
```

---

## Consequences

### Positive

- [Benefit 1: What becomes easier or better]
- [Benefit 2: Problems this solves]
- [Benefit 3: Opportunities this creates]

### Negative

- [Drawback 1: What becomes harder or more complex]
- [Drawback 2: Technical debt accepted]
- [Drawback 3: Risks introduced]

### Mitigation Strategies

[For significant negative consequences, describe how we'll address them]

---

## References

- [Link to related documentation]
- [Link to research/benchmarks]
- [Link to related ADRs]
- [Link to code implementation: `src/path/file.ts:123-456`]

---

**Last Updated**: YYYY-MM-DD
