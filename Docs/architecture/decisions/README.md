# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for this project.
ADRs document significant architectural decisions made during the project
lifecycle.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important
architectural decision made along with its context and consequences. For more
information on how to write ADRs, see
[HOW-TO-WRITE-ADR.md](./HOW-TO-WRITE-ADR.md).

## ADR Index

| ADR # | Title               | Status | Date | Related |
| ----- | ------------------- | ------ | ---- | ------- |
| -     | No ADRs created yet | -      | -    | -       |

## Next ADR Number

**Next Available: ADR-001**

## Creating a New ADR

1. Copy the template from: `../../templates/ADR-000-TEMPLATE.md`
2. Save it to this directory with the next available number:
   `ADR-{NNN}-{short-title}.md`
3. Fill in all sections following the template structure
4. Update this README.md with the new ADR entry
5. Increment the "Next Available" number above

## ADR Statuses

- **Proposed**: Decision under consideration
- **Accepted**: Decision approved and being/has been implemented
- **Deprecated**: Decision no longer applies but kept for historical record
- **Superseded**: Decision replaced by a newer ADR (link to superseding ADR)

## Resources

- [ADR Template](../../templates/ADR-000-TEMPLATE.md) - Standard template for
  creating new ADRs
- [How to Write ADRs](./HOW-TO-WRITE-ADR.md) - Comprehensive guide for writing
  effective ADRs
- [ADR GitHub](https://adr.github.io/) - Community resources and best practices

## Guidelines

- **Be Specific**: Document concrete decisions, not vague intentions
- **Include Context**: Explain why the decision was needed
- **List Alternatives**: Show what options were considered
- **Document Trade-offs**: Be honest about consequences (both positive and
  negative)
- **Update After Implementation**: Add actual outcomes to Consequences section
- **Link to Code**: Reference specific implementations when decision is realized
