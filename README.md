# Beacon IDE

**Your AI-Powered Development Guide**

Lighthouse Beacon is an AI-powered development environment that enables natural language interaction with codebases through conversational file operations.

## Overview

Beacon provides a visual IDE experience where developers interact with their code through conversation. Unlike terminal-based tools, Beacon offers a complete graphical interface with file explorer, chat panel, and integrated code editor - all powered by AI.

## Key Features

- **Natural Language File Operations** - Read, create, edit, and delete files using plain English
- **Visual Interface** - VS Code-style file explorer and integrated editor with real-time updates
- **Multi-Provider AI** - Works with Claude, GPT, Gemini, and local models
- **Visual Workflow Generator** - Create AI-powered automation workflows with drag-and-drop canvas (Added 2026-01-23)
  - React Flow-based visual editor for workflow creation
  - YAML workflow definitions with variable interpolation
  - Secure Python script execution with timeout enforcement
  - Conditional branching, loops, and parallel execution
  - AI-assisted workflow generation from natural language
  - Step-by-step debugging with breakpoints
- **Dual Deployment** - Desktop application and web-based versions
- **Lighthouse Integration** - Built-in SOC traceability and compliance scanning

## Documentation

- [Project Summary](./PRODUCT-SUMMARY.md) - Complete product vision and technical foundation
- [Product Naming](./PRODUCT-NAME-ANALYSIS.md) - Strategic analysis behind the Beacon name

## Getting Started

### Prerequisites

- Node.js v18+ (developed with v24.4.1)
- pnpm v8+

### Installation

1. Install pnpm globally (if not already installed):
   ```bash
   npm install -g pnpm@8
   ```

2. Install project dependencies:
   ```bash
   pnpm install
   ```

3. Verify setup:
   ```bash
   ./verify-setup.sh
   ```

### Development

Start the development server with hot module replacement:
```bash
pnpm dev
```

The Electron application will launch automatically with:
- Development tools open by default
- Hot Module Replacement (HMR) active
- React DevTools integration

#### Code Quality Commands

```bash
# Run TypeScript type checking
pnpm typecheck

# Run ESLint
pnpm lint

# Run ESLint with auto-fix
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting without modifying files
pnpm format:check
```

#### Pre-commit Hooks

The project uses Husky and lint-staged to automatically run linting and formatting on staged files before each commit. This ensures code quality standards are maintained.

### Build

Build the application for production:
```bash
pnpm build
```

Build outputs are located in `dist-electron/`:
- `main/` - Electron main process
- `preload/` - Preload scripts
- `renderer/` - React renderer

## Project Structure

The project follows SOLID principles with a clear separation of concerns:

```
lighthouse-beacon/
├── src/
│   ├── main/           # Electron main process (Node.js)
│   │   ├── index.ts    # Application entry point
│   │   └── services/   # Business logic services
│   ├── preload/        # Preload scripts (bridge between main/renderer)
│   │   └── index.ts    # Context bridge setup
│   ├── renderer/       # React UI (browser environment)
│   │   ├── index.html  # HTML entry
│   │   ├── main.tsx    # React entry point
│   │   ├── App.tsx     # Root component
│   │   ├── index.css   # Global styles
│   │   ├── components/ # React components
│   │   └── stores/     # State management (Zustand)
│   └── shared/         # Code shared across processes
│       └── types/      # TypeScript type definitions
├── .vscode/            # VS Code workspace configuration
│   ├── settings.json   # Editor settings
│   ├── extensions.json # Recommended extensions
│   └── launch.json     # Debug configurations
├── Docs/               # Planning and architecture docs
├── electron.vite.config.ts  # Vite configuration
├── tsconfig.json       # Base TypeScript configuration
├── tsconfig.main.json  # Main process TypeScript config
├── tsconfig.renderer.json   # Renderer process TypeScript config
├── eslint.config.js    # ESLint configuration
├── .prettierrc         # Prettier configuration
└── package.json        # Project dependencies
```

### Path Aliases

TypeScript path aliases are configured for clean imports:

- `@main/*` - Main process code
- `@preload/*` - Preload scripts
- `@renderer/*` - Renderer (React) code
- `@shared/*` - Shared types and utilities

Example:
```typescript
import type { AppConfig } from '@shared/types';
```

## Development Status

**Current Epic:** Epic 9 - Visual Workflow Generator (90% Complete)
**Current Branch:** epic-9-visual-workflow-generator

### Completed Epics:
- ✅ **Epic 1** - Desktop Foundation with Basic UI (14 waves)
- ✅ **Epic 7** - Infrastructure & Operations (Logging)
- ✅ **Epic 9** (90%) - Visual Workflow Generator

### Epic 9 Progress:
- ✅ Feature 9.1 - Workflow Canvas Foundation (React Flow canvas, YAML parser)
- ✅ Feature 9.2 - Workflow Execution Engine (Python execution, real-time visualization)
- ✅ Feature 9.3 - Workflow Management (CRUD, import/export)
- ✅ Feature 9.4 - Advanced Control Flow (conditionals, loops, parallel execution, variables)
- ⏳ Feature 9.5 - UX Polish & Templates (AI generation, testing UI, prompt editor - partial)

### Key Technologies Added (Epic 9):
- React Flow (@xyflow/react v12+) for visual workflow canvas
- js-yaml for YAML workflow parsing
- Secure Python execution with path validation and timeouts

### Architecture Decision Records:
- ADR-015: React Flow for Visual Workflows
- ADR-016: Python Script Execution Security Strategy
- ADR-017: Workflow YAML Schema Design

See `/Docs/architecture/decisions/` for detailed ADRs.

---

**Lighthouse Beacon** - Part of the Lighthouse Development Ecosystem
