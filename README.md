# Beacon IDE

**Your AI-Powered Development Guide**

Lighthouse Beacon is an AI-powered development environment that enables natural language interaction with codebases through conversational file operations.

## Overview

Beacon provides a visual IDE experience where developers interact with their code through conversation. Unlike terminal-based tools, Beacon offers a complete graphical interface with file explorer, chat panel, and integrated code editor - all powered by AI.

## Key Features

- **Natural Language File Operations** - Read, create, edit, and delete files using plain English
- **Visual Interface** - VS Code-style file explorer and integrated editor with real-time updates
- **Multi-Provider AI** - Works with Claude, GPT, Gemini, and local models
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

**Current Wave:** Wave 1.1.2 - Project Structure and Configuration (COMPLETE)
**Epic:** Epic 1 - Desktop Foundation with Basic UI
**Feature:** Feature 1.1 - Development Environment Setup

Completed:
- ✅ Modern build tooling (Vite + electron-vite)
- ✅ Package management (pnpm v8+)
- ✅ TypeScript strict mode configuration with path aliases
- ✅ Separate TypeScript configs for Node.js and browser environments
- ✅ ESLint with TypeScript and React rules
- ✅ Prettier code formatting
- ✅ Pre-commit hooks (Husky + lint-staged)
- ✅ VS Code workspace configuration
- ✅ SOLID project structure with service directories
- ✅ Shared types for cross-process communication
- ✅ Hot Module Replacement (HMR) < 1 second
- ✅ Debug configurations for main and renderer processes

Next Wave: Feature 1.2 - Basic Window and UI Shell

---

**Lighthouse Beacon** - Part of the Lighthouse Development Ecosystem
