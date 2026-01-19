# Wave 1.1.1: Project Setup and Tooling

## Wave Overview
- **Wave ID:** Wave-1.1.1
- **Feature:** Feature 1.1 - Development Environment Setup
- **Epic:** Epic 1 - Desktop Foundation with Basic UI
- **Status:** Planning
- **Scope:** Initialize project with Node.js, pnpm, and Vite build tooling with HMR support
- **Wave Goal:** Establish functional development environment with fast build tooling and hot module replacement

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Initialize Node.js project with pnpm package manager and core dependencies
2. Configure Vite with electron-vite for fast development builds with HMR
3. Establish minimal Electron entry points that successfully launch development server

---

## User Story 1: Modern Build Tooling Setup

**As a** developer
**I want** fast hot module replacement and modern build tooling
**So that** I can iterate quickly with instant feedback during development

**Acceptance Criteria:**
- [ ] Development server starts in < 5 seconds
- [ ] HMR updates code in < 1 second after file save
- [ ] Build completes successfully for main, preload, and renderer processes
- [ ] Electron window launches and displays React content
- [ ] Tests passing > 80% coverage (manual validation for this wave)

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 12

---

## User Story 2: Package Management and Dependencies

**As a** developer
**I want** properly configured package management with all required dependencies
**So that** I can install and manage project dependencies efficiently

**Acceptance Criteria:**
- [ ] pnpm v8+ configured as package manager
- [ ] package.json contains all required dependencies (Electron, React, Vite)
- [ ] pnpm install completes without errors
- [ ] Development dependencies separated from runtime dependencies
- [ ] Lock file (pnpm-lock.yaml) generated and tracked

**Priority:** High
**Estimated Hours:** 4
**Objective UCP:** 8

---

## User Story 3: Minimal Electron Application Entry Points

**As a** developer
**I want** working Electron entry points for main, preload, and renderer processes
**So that** I have a foundation to build the IDE upon

**Acceptance Criteria:**
- [ ] src/main/index.ts creates BrowserWindow and loads renderer
- [ ] src/preload/index.ts provides contextBridge placeholder
- [ ] src/renderer/main.tsx renders React root component
- [ ] Application window displays "Development environment configured" message
- [ ] No runtime errors on application launch

**Priority:** High
**Estimated Hours:** 6
**Objective UCP:** 10

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] pnpm dev launches Electron window successfully
- [ ] HMR updates render in < 1 second
- [ ] No TypeScript compilation errors
- [ ] No ESLint errors (once configured in Wave 1.1.2)
- [ ] Documentation updated (README installation steps)

---

## Notes

- This wave focuses on getting a working development environment, not code quality tooling (Wave 1.1.2)
- Minimal Electron code - just enough to verify build tooling works
- Reference ADR-001 (Electron), ADR-005 (Vite) for architectural decisions
- Performance target: < 5 second cold start for development server

---

**Total Stories:** 3
**Total Hours:** 18
**Wave Status:** Planning
