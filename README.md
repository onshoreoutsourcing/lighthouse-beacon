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

```
lighthouse-beacon/
├── src/
│   ├── main/           # Electron main process
│   │   └── index.ts    # Application entry point
│   ├── preload/        # Preload scripts
│   │   └── index.ts    # Context bridge setup
│   └── renderer/       # React UI
│       ├── index.html  # HTML entry
│       ├── main.tsx    # React entry point
│       ├── App.tsx     # Root component
│       └── index.css   # Global styles
├── Docs/               # Planning and architecture docs
├── electron.vite.config.ts  # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies
```

## Development Status

**Current Wave:** Wave 1.1.1 - Project Setup and Tooling (COMPLETE)
**Epic:** Epic 1 - Desktop Foundation with Basic UI
**Feature:** Feature 1.1 - Development Environment Setup

Completed:
- ✅ Modern build tooling (Vite + electron-vite)
- ✅ Package management (pnpm v8+)
- ✅ TypeScript strict mode configuration
- ✅ Minimal Electron application entry points
- ✅ Hot Module Replacement (HMR) < 1 second
- ✅ Build process for all three processes

Next Wave: Wave 1.1.2 - Code Quality Tooling

---

**Lighthouse Beacon** - Part of the Lighthouse Development Ecosystem
