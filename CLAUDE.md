# Claude Instructions for Lighthouse Chat IDE Project

This file contains project-specific instructions for AI assistants working on the Lighthouse Chat IDE (Beacon) project.

---

## Core Working Principles

### Planning and Implementation Process

**CRITICAL: This is an iterative planning project**

1. **Planning is iterative** - We will go through multiple rounds of planning before implementation
2. **Never go directly from planning to implementation** - Always create planning documents first
3. **Planning documents are for review** - After creating planning documents, wait for review and feedback
4. **More planning follows review** - After review, we do more planning, refinement, and detailed design
5. **Implementation only on explicit instruction** - I will explicitly tell you what to implement and when
6. **No assumptions about readiness** - Do not assume a plan is ready for implementation just because it's complete

**Planning Workflow:**
```
Create Planning Doc → Review → Refine → More Planning → Review → Repeat...
                                                              ↓
                                                    (Explicit instruction)
                                                              ↓
                                                      Implementation
```

### Git Operations

**NEVER perform git operations unless explicitly instructed:**

- ❌ Do NOT commit changes automatically
- ❌ Do NOT push to remote repositories
- ❌ Do NOT merge branches
- ❌ Do NOT create pull requests
- ❌ Do NOT perform any git operations on your own initiative

**ONLY perform git operations when I explicitly say:**
- ✅ "Commit these changes"
- ✅ "Push to remote"
- ✅ "Create a pull request"
- ✅ "Merge this branch"

---

## Project Context

### What We're Building

Lighthouse Chat IDE (Beacon) is an AI-powered development environment that enables natural language interaction with codebases through conversational file operations. See `/Docs/planning/PRODUCT-SUMMARY.md` for complete project vision.

### Development Approach

- **Phased development** - 8 phases from MVP to production (see `/Docs/planning/DEVELOPMENT-PHASES.md`)
- **Documentation-first** - Comprehensive planning and documentation before implementation
- **Iterative refinement** - Multiple rounds of review and improvement
- **Quality over speed** - Take time to get designs right before coding
- **Wave-based planning** - Lighthouse methodology with structured task waves

---

## Project Structure

```
lighthouse-beacon/
├── Docs/
│   ├── planning/          # Planning documents and architectural decisions
│   ├── architecture/      # Architecture documentation
│   └── guides/           # User and developer guides
├── src/                  # Source code (when implementation begins)
├── tests/               # Test files
└── CLAUDE.md            # This file
```

---

## Working Guidelines

### Documentation

- **Always reference existing planning documents** before creating new ones
- **Update planning documents** when requirements or decisions change
- **Create new documents** for significant architectural decisions
- **Keep documentation synchronized** with actual implementation (once implementation begins)
- **Use clear headings and structure** for easy navigation

### Code Standards (For Future Implementation)

When implementation begins:
- TypeScript for all code
- Functional programming patterns preferred
- Comprehensive error handling
- Detailed logging for debugging
- Unit tests for all business logic
- Integration tests for critical workflows
- Clear, descriptive variable and function names
- Comments for complex logic only (code should be self-documenting)

### Communication Style

- **Be concise and direct** - Avoid unnecessary verbosity
- **Explain reasoning** - Help me understand your thought process
- **Ask questions** when requirements are unclear
- **Present options** when multiple valid approaches exist
- **Acknowledge constraints** from previous decisions
- **Reference documents** by path when discussing plans

---

## Phases Overview

Current focus will be explicitly stated. Do not assume which phase we're working on.

1. **Phase 1:** Core Foundation & Basic CLI
2. **Phase 2:** Enhanced File Operations & Multi-Provider
3. **Phase 3:** Basic Visual Interface (Desktop)
4. **Phase 4:** Integrated Code Editor
5. **Phase 5:** Advanced Visual Features
6. **Phase 6:** Web Deployment
7. **Phase 7:** Lighthouse Ecosystem Integration
8. **Phase 8:** Polish & Production Readiness

**MVP = Phase 4 Complete**

---

## Technology Stack

### Core Technologies
- **Language:** TypeScript
- **AI Integration:** AIChatSDK (Lighthouse framework)
- **Desktop:** Electron
- **Web:** Modern web frameworks (TBD during planning)
- **Editor:** Monaco Editor (VS Code engine)
- **Build Tools:** To be determined during Phase 1 planning

### AI Providers (Multi-Provider Support)
- Anthropic Claude
- OpenAI GPT
- Google Gemini
- Ollama (local models)

---

## Key Project Principles

### Differentiation from Claude Code CLI

We are **NOT** competing with Claude Code - we're building on its validated concept with:
- ✅ Visual IDE interface (file explorer, integrated editor)
- ✅ Multi-provider AI support
- ✅ Desktop and web deployment options
- ✅ Lighthouse ecosystem integration
- ✅ SOC traceability and compliance scanning

### User Experience Focus

- Natural language interaction is primary
- Visual feedback is essential
- Manual and AI collaboration must coexist
- Permission and safety are non-negotiable
- Real-time streaming responses
- Clear indication of AI operations

### Technical Excellence

- Code sharing between desktop and web versions
- Comprehensive error handling
- Security through sandboxing and permissions
- Performance optimization
- Scalable architecture
- Maintainable codebase

---

## Planning Document Types

### Strategic Planning
- Product summaries
- Phase overviews
- Roadmaps
- Success criteria

### Technical Planning
- Architecture designs
- API specifications
- Tool implementations
- Data models
- Integration patterns

### Implementation Planning
- Wave plans (task breakdowns)
- Technical specifications
- Test strategies
- Deployment plans

---

## Questions and Clarifications

When you need clarification:
1. **Check existing documentation first** - The answer may already be documented
2. **Ask specific questions** - Help me understand exactly what needs clarification
3. **Present context** - Reference relevant planning documents or decisions
4. **Suggest options** - If multiple approaches are viable, present them
5. **Explain implications** - Help me understand the impact of different choices

---

## Important Reminders

- 🚫 **NO automatic commits, pushes, or merges**
- 🚫 **NO direct planning-to-implementation**
- ✅ **Always create planning documents for review**
- ✅ **Wait for explicit implementation instructions**
- ✅ **Iterate on plans multiple times before coding**
- ✅ **Ask questions when unclear**
- ✅ **Reference existing documents frequently**

---

## Current Status

**Project Phase:** Initial Planning
**Current Activity:** Creating foundational planning documents
**Next Steps:** Will be explicitly communicated

---

## Notes for AI Assistants

This project values **thorough planning over rapid implementation**. Take time to:
- Understand the full context before suggesting solutions
- Create comprehensive planning documents
- Consider multiple approaches
- Document trade-offs and decisions
- Build on previous planning work
- Wait for explicit go-ahead before implementing

**Quality planning now prevents costly refactoring later.**

---

*Last Updated: January 18, 2026*
