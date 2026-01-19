# Architecture Decision: Custom IDE vs. VS Code Extension vs. CLI

**Date**: 2026-01-19
**Status**: CRITICAL DECISION REQUIRED
**Decision Maker**: Roy Love (Product Owner)

## Context

After completing comprehensive planning for a **custom Electron IDE** (Lighthouse Chat IDE), a critical question has emerged:

> "There is a reason Anthropic did Claude Code as a CLI, and Cursor forked VS Code to make their products—they didn't have to recreate what has already been done. Are we going about this the wrong way recreating the whole UI from scratch?"

**User Goals**:
- Desktop IDE capability
- Cloud/web IDE capability
- Conversational AI-powered development
- Multi-provider AI support
- SOC traceability and compliance
- Visual context (file explorer, editor, AI chat)

## Options Analysis

### Option 1: Custom Electron IDE (Current Plan)

**What we'd build**: Complete IDE from scratch using Electron + React + Monaco

**Pros**:
- ✅ **Full control** over UI/UX and feature set
- ✅ **Exact vision implementation** - can design perfect conversational workflow
- ✅ **Desktop + Web possible** - shared React components, separate deployment
- ✅ **No VS Code dependency** - independent evolution
- ✅ **Perfect AI integration** - purpose-built for conversational development
- ✅ **Differentiates Lighthouse** - unique product, not "another VS Code extension"

**Cons**:
- ❌ **Massive development effort** - 14-20 weeks for basic product
- ❌ **Recreating solved problems** - file explorer, editor, tabs, etc. already exist in VS Code
- ❌ **Monaco limitations** - using VS Code's editor without VS Code's ecosystem
- ❌ **Extension ecosystem gap** - no access to VS Code extensions (linters, formatters, etc.)
- ❌ **Maintenance burden** - responsible for all IDE features, not just AI
- ❌ **User adoption friction** - developers already use VS Code, asking them to switch is hard
- ❌ **Can never match VS Code features** - VS Code has hundreds of person-years of development

**Cost**: $132,500 - $252,500 (Year 1)
**Time to MVP**: 7-10 weeks
**Time to Professional**: 14-20 weeks

---

### Option 2: VS Code Extension (Like Cursor's Approach)

**What we'd build**: VS Code extension that adds AI chat panel + conversational file operations

**Pros**:
- ✅ **Leverage existing IDE** - file explorer, editor, tabs, settings all free
- ✅ **VS Code ecosystem** - users keep their extensions, themes, workflows
- ✅ **Faster development** - focus only on AI integration, not IDE features
- ✅ **Lower adoption friction** - users don't switch tools, just add extension
- ✅ **Professional from day 1** - VS Code quality built-in
- ✅ **Familiar UX** - developers already know VS Code
- ✅ **3-5 weeks to MVP** - extension API well-documented
- ✅ **Web version possible** - VS Code runs in browser (vscode.dev, GitHub Codespaces)
- ✅ **Webview for AI chat** - can use React in webview panel
- ✅ **Lower maintenance** - VS Code team handles IDE features

**Cons**:
- ❌ **VS Code dependency** - tied to their roadmap and decisions
- ❌ **Extension API limitations** - can't modify core VS Code behavior deeply
- ❌ **Less differentiation** - "just another VS Code extension"
- ❌ **Panel layout constraints** - limited control over VS Code panel arrangement
- ❌ **Extension marketplace rules** - must comply with VS Code marketplace policies
- ❌ **Harder to monetize** - extensions typically free, hard to charge

**Cost**: $40,000 - $80,000 (Year 1, ~60% reduction)
**Time to MVP**: 3-5 weeks (60% reduction)
**Time to Professional**: 6-10 weeks

---

### Option 3: VS Code Fork (Like Cursor)

**What we'd build**: Fork VS Code, integrate AI deeply into core

**Pros**:
- ✅ **Complete VS Code features** - everything users expect
- ✅ **Deep AI integration** - can modify VS Code core for perfect AI UX
- ✅ **Full control** - own the entire stack
- ✅ **Differentiation** - standalone product, not extension
- ✅ **Monetization freedom** - can charge, not subject to marketplace
- ✅ **Desktop + Web** - VS Code already supports both

**Cons**:
- ❌ **Upstream maintenance burden** - must merge VS Code updates continuously
- ❌ **Legal complexity** - MIT license allows fork, but must maintain attribution
- ❌ **User confusion** - "is this VS Code or not?"
- ❌ **Similar effort to Option 1** - forking doesn't eliminate work, just shifts it
- ❌ **Extension compatibility** - fork may break existing extensions
- ❌ **Cursor already exists** - direct competition with established player

**Cost**: $100,000 - $200,000 (Year 1)
**Time to MVP**: 8-12 weeks
**Time to Professional**: 16-24 weeks

---

### Option 4: CLI Tool (Like Claude Code)

**What we'd build**: Terminal-based conversational file operations

**Pros**:
- ✅ **Fastest to build** - 2-3 weeks to MVP
- ✅ **Simplest architecture** - no UI complexity
- ✅ **Works with any editor** - users keep their IDE
- ✅ **Lowest cost** - $20,000 - $40,000 (Year 1)
- ✅ **Proven pattern** - Claude Code validates approach

**Cons**:
- ❌ **No visual context** - defeats primary value proposition
- ❌ **Doesn't meet requirements** - user wants "desktop and cloud IDE"
- ❌ **No differentiation** - Claude Code already exists
- ❌ **Terminal-only** - can't do web version
- ❌ **Limited UX** - no visual feedback, no diff view, no file explorer integration

**Cost**: $20,000 - $40,000 (Year 1)
**Time to MVP**: 2-3 weeks
**VERDICT**: ❌ **Does not meet stated goal of "desktop and cloud IDE"**

---

## Recommendation Matrix

| Goal | Custom IDE | VS Code Extension | VS Code Fork | CLI |
|------|------------|-------------------|--------------|-----|
| **Desktop IDE** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Cloud/Web IDE** | ✅ Yes (separate build) | ✅ Yes (vscode.dev) | ✅ Yes | ❌ No |
| **Visual Context** | ✅ Perfect | ✅ Good | ✅ Perfect | ❌ None |
| **Fast to MVP** | ❌ 7-10 weeks | ✅ 3-5 weeks | ❌ 8-12 weeks | ✅ 2-3 weeks (but doesn't meet goals) |
| **Low Cost** | ❌ High | ✅ Medium | ❌ High | ✅ Low (but doesn't meet goals) |
| **Differentiation** | ✅ High | ⚠️ Medium | ✅ High | ❌ Low |
| **User Adoption** | ❌ Hard (switch tools) | ✅ Easy (add extension) | ❌ Hard (switch tools) | ⚠️ Medium (add CLI) |
| **Professional Quality** | ⚠️ 14-20 weeks | ✅ Immediate | ✅ Immediate | ❌ Not applicable |
| **Maintenance Burden** | ❌ High | ✅ Low | ❌ Very High | ✅ Low |

---

## Deep Analysis

### Why Anthropic Chose CLI (Claude Code)

- **Validation focus**: Prove conversational file operations work (focus on AI, not IDE)
- **Speed to market**: 4-6 weeks vs. 6+ months for IDE
- **Minimal maintenance**: No UI to maintain, just AI logic
- **Works everywhere**: Terminal on any OS, any editor
- **Low risk**: If it fails, small investment lost

**BUT**: Anthropic isn't competing in IDE space. They're an AI company validating AI capabilities.

### Why Cursor Chose VS Code Fork

- **IDE competition**: Cursor wants to BE the IDE, not augment it
- **Deep integration**: Can modify VS Code core for perfect AI UX
- **Monetization**: $20/month subscription requires standalone product
- **Venture-backed**: $60M+ funding can support large engineering team

**BUT**: Cursor raised $60M+ to fund this approach. They have 30+ engineers.

### Our Situation (Lighthouse)

- **Goals**: Desktop IDE + Cloud IDE with AI + SOC traceability
- **Resources**: 2-4 developers, $130-250K budget
- **Timeline**: Want MVP in weeks/months, not years
- **Market**: Lighthouse ecosystem first (500-1000 potential users), broader market later
- **Differentiation**: Multi-provider AI + SOC compliance, not just AI chat

---

## THE CRITICAL INSIGHT

**We're not Anthropic (proving AI works) and we're not Cursor (becoming THE IDE).**

**We're Lighthouse (bringing AI + governance to existing developer workflows).**

---

## Revised Recommendation: **VS Code Extension First, Custom IDE Later**

### Phase 1: VS Code Extension (MVP in 3-5 weeks)

**Build**:
- VS Code extension with AI chat webview panel (React)
- Conversational file operations using VS Code API
- Multi-provider AI support (Claude, GPT, Gemini, Ollama)
- SOC logging via AIChatSDK
- Permission system for file operations
- Diff view using VS Code diff editor

**Benefits**:
- ✅ **3-5 weeks to MVP** (60% faster than custom IDE)
- ✅ **$40-80K Year 1 cost** (60% cheaper than custom IDE)
- ✅ **Professional quality immediately** (VS Code features included)
- ✅ **Easy user adoption** (install extension, not new tool)
- ✅ **Works on desktop** (VS Code desktop)
- ✅ **Works on web** (vscode.dev, GitHub Codespaces, Gitpod)
- ✅ **Validates AI approach** with real users quickly
- ✅ **All core value delivered**: conversational operations, visual context, multi-provider, SOC

**What we give up** (vs. custom IDE):
- ⚠️ Panel layout flexibility (VS Code's panel system, not our custom layout)
- ⚠️ Full UI control (can customize webview, but not core VS Code)
- ⚠️ Standalone brand (it's "Lighthouse extension for VS Code" not "Lighthouse IDE")

**What we KEEP** (the important stuff):
- ✅ Conversational file operations (core value)
- ✅ Multi-provider AI (key differentiator)
- ✅ SOC traceability (enterprise value)
- ✅ Visual context (file explorer, editor, AI chat)
- ✅ Desktop + Web (both work)

### Phase 2: Custom Cloud IDE (If Extension Succeeds)

**ONLY if**:
- Extension gets 500+ active users
- Users demand features impossible in extension
- Budget available for $200K+ investment
- 6-12 month timeline acceptable

**Then build**: Custom cloud IDE using VS Code's Monaco + extension learnings

---

## Decision Framework

### **Choose VS Code Extension If**:
- ✅ Goal is **validate AI approach quickly** with real users
- ✅ Resources are **limited** (2-4 developers, $130-250K)
- ✅ Timeline is **aggressive** (want users in 1-2 months)
- ✅ Primary value is **AI capabilities**, not IDE innovation
- ✅ Users already **use VS Code** (most developers do)
- ✅ Want **web version** without building twice

### **Choose Custom Electron IDE If**:
- ✅ Goal is **create unique IDE brand** differentiated from VS Code
- ✅ Resources are **abundant** (6+ developers, $250K+ budget)
- ✅ Timeline is **flexible** (6-12 months acceptable)
- ✅ Primary value is **IDE innovation** + AI, not just AI
- ✅ Users willing to **switch tools** for better experience
- ✅ Want **complete control** over every UX detail

---

## Recommended Action Plan

### **Option A: Pivot to VS Code Extension (RECOMMENDED)**

**Week 1-2**: Validate Extension Feasibility
- Spike: Build basic VS Code extension with AI chat panel
- Spike: Test VS Code API for file operations
- Spike: Integrate AIChatSDK in extension context
- Decision: Confirm extension can deliver core value

**Week 3-5**: Build MVP Extension
- AI chat webview panel (React)
- File operation commands via VS Code API
- Multi-provider AI configuration
- Permission system
- SOC logging

**Week 6**: Beta Test
- Deploy to Lighthouse team (10-15 users)
- Gather feedback
- Iterate

**Week 7-12**: Enhance Extension
- Diff view
- Change management
- Settings UI
- Polish

**Month 4+**: Evaluate
- If successful (500+ users): Consider custom cloud IDE
- If limitations hit: Build custom IDE with learnings
- If validation failed: Minimal investment lost

**Total Investment**: $40-80K (Year 1), 3-5 weeks to MVP
**Risk**: Low (small investment, quick validation)
**Outcome**: Working product users can adopt immediately

---

### **Option B: Continue Custom IDE Plan**

**Weeks 1-4**: Phase 1 (Desktop Foundation)
**Weeks 5-7**: Phase 2 (AI Integration)
**Weeks 8-10**: Phase 3 (File Operations - MVP)
**Weeks 11-20**: Phases 4-6 (Multi-provider, Advanced Features, Polish)

**Total Investment**: $132-252K (Year 1), 7-10 weeks to MVP, 14-20 weeks to professional
**Risk**: High (large investment, slower validation, adoption friction)
**Outcome**: Custom product that may or may not gain adoption

---

## Questions for Decision

1. **Is standalone IDE branding critical?** Or is "best AI extension for VS Code" acceptable?

2. **Can we accept VS Code panel constraints?** Or do we need custom panel layouts?

3. **How quickly do we need users?** 3-5 weeks (extension) vs. 7-10 weeks (custom MVP)?

4. **How much risk can we accept?** $40-80K (extension) vs. $130-250K (custom IDE)?

5. **What's our cloud strategy timeline?** Extension works on vscode.dev immediately. Custom IDE needs separate cloud build.

6. **Are users already on VS Code?** If yes, extension has near-zero adoption friction.

---

## My Strong Recommendation

**Start with VS Code Extension. Build custom IDE only if extension proves limiting.**

**Rationale**:
- ✅ **60% faster to MVP** (3-5 weeks vs. 7-10 weeks)
- ✅ **60% cheaper** ($40-80K vs. $130-250K)
- ✅ **Desktop + Web immediately** (no separate builds)
- ✅ **Professional quality day 1** (VS Code features included)
- ✅ **Low adoption friction** (install extension vs. switch tools)
- ✅ **All core value delivered**: conversational AI, visual context, multi-provider, SOC
- ✅ **Validate fast, pivot if needed** (learnings inform custom IDE if we build later)
- ✅ **Lower risk** (small investment, quick feedback)

**What Cursor proves**: You CAN differentiate with an extension approach (they started as extension, then forked when they had $60M)

**What Claude Code proves**: CLI validates AI approach, but we need visual context (extension gives us both)

**What Lighthouse needs**: Quick validation with real users, not 6-month bet on custom IDE

---

## Next Steps

**If choosing Extension**:
1. ✅ Pause current Electron planning
2. ✅ Create VS Code Extension feasibility spike (2-3 days)
3. ✅ Design extension architecture (vs. Electron architecture)
4. ✅ Update IDF artifacts for extension approach
5. ✅ Begin Phase 1: Extension Foundation (Week 1)

**If choosing Custom IDE**:
1. ✅ Acknowledge higher risk, longer timeline, higher cost
2. ✅ Commit to 14-20 week development cycle
3. ✅ Proceed with Phase 1: Electron Foundation as planned
4. ✅ Accept slower user validation and adoption friction

---

## Document Information

- **Created By**: Claude (AI Assistant)
- **Creation Date**: 2026-01-19
- **Decision Required From**: Roy Love (Product Owner)
- **Urgency**: CRITICAL - Affects all downstream planning
- **Impact**: Changes 60% of architecture, 40% of cost, 60% of timeline
