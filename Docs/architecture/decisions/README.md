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

| ADR # | Title                                          | Status   | Date       | Related                     |
| ----- | ---------------------------------------------- | -------- | ---------- | --------------------------- |
| 001   | Electron as Desktop Framework                  | Accepted | 2026-01-19 | Epic-1, Architecture Decision |
| 002   | React + TypeScript for UI                      | Accepted | 2026-01-19 | Epic-1, ADR-001             |
| 003   | Zustand for State Management                   | Accepted | 2026-01-19 | Epic-1, ADR-002             |
| 004   | Monaco Editor Integration                      | Accepted | 2026-01-19 | Epic-1, ADR-001, ADR-002    |
| 005   | Vite as Build Tool                             | Accepted | 2026-01-19 | Epic-1, ADR-001, ADR-002    |
| 006   | AIChatSDK Integration Approach                 | Accepted | 2026-01-19 | Epic-2, Feature-2.1, Product Vision |
| 007   | Conversation Storage Strategy                  | Accepted | 2026-01-19 | Epic-2, Feature-2.2, FR-4   |
| 008   | Permission System UX Pattern                   | Accepted | 2026-01-19 | Epic-2, Feature-2.3, FR-6   |
| 009   | Streaming Response Implementation              | Accepted | 2026-01-19 | Epic-2, Feature-2.2, NFR-1  |
| 010   | File Operation Tool Architecture               | Accepted | 2026-01-19 | Epic-3, Feature-3.1, FR-1, FR-9 |
| 011   | Directory Sandboxing Approach                  | Accepted | 2026-01-19 | Epic-3, All Tools, NFR-3    |
| 012   | Bash Command Safety Strategy                   | Accepted | 2026-01-19 | Epic-3, Feature-3.3, NFR-3  |
| 013   | Visual Integration Pattern                     | Accepted | 2026-01-19 | Epic-3, Feature-3.4, FR-7   |
| 014   | Permission System Enhancement                  | Accepted | 2026-01-19 | Epic-3, Feature-3.3, FR-6   |
| 015   | React Flow for Visual Workflows                | Accepted | 2026-01-21 | Epic-9, ADR-002, ADR-003    |
| 016   | Python Script Execution Security Strategy      | Accepted | 2026-01-21 | Epic-9, ADR-011, ADR-012, ADR-008 |
| 017   | Workflow YAML Schema Design                    | Accepted | 2026-01-21 | Epic-9, Feature-9.1, ADR-015 |

## Next ADR Number

**Next Available: ADR-018**

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
