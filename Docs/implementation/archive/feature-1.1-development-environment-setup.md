# Feature 1.1: Development Environment Setup

**Feature ID:** Feature-1.1
**Epic:** Epic-1 (Desktop Foundation with Basic UI)
**Status:** ✅ Complete
**Priority:** P0 (Critical)
**Estimated Duration:** 2-3 days
**Dependencies:** None (first feature in Epic 1)

---

## Feature Overview

### Problem Statement

Before implementing any Electron application features, we need a properly configured development environment with modern build tooling, code quality enforcement, and project structure following SOLID principles. Without this foundation, development will be inefficient, code quality will suffer, and the project will be difficult to maintain.

**Current State:** Empty repository with planning documents only
**Desired State:** Fully functional development environment ready for feature implementation

### Business Value

**Value to Users:** None directly (infrastructure feature)
**Value to Business:**
- **Development velocity**: Proper tooling enables 2-3x faster development through HMR, TypeScript autocomplete, and linting
- **Code quality**: ESLint + Prettier + TypeScript strict mode prevent bugs before they occur
- **Maintainability**: Clean project structure and conventions reduce onboarding time for new developers
- **Technical foundation**: Establishes patterns that will be followed throughout all 8 development phases

**Success Metrics:**
- Development server starts in < 5 seconds
- Hot module replacement (HMR) updates in < 1 second
- TypeScript strict mode enabled with zero errors
- ESLint and Prettier configured and passing
- Project structure follows SOLID principles
- README provides clear setup instructions

---

## Scope

### In Scope

**Development Tools:**
- [x] Node.js LTS installation verification (18.x+)
- [x] pnpm installation and configuration (v8+)
- [x] TypeScript configuration (strict mode, tsconfig.json)
- [x] ESLint configuration (TypeScript + React rules)
- [x] Prettier configuration (code formatting)
- [x] Git repository initialization
- [x] .gitignore setup
- [x] README.md with setup instructions

**Build Tooling:**
- [x] Vite configuration (v5+)
- [x] electron-vite plugin setup
- [x] Development server configuration (HMR enabled)
- [x] Build scripts for main, preload, and renderer processes
- [x] Environment variable configuration

**Project Structure:**
- [x] Directory structure following SOLID principles:
  - `src/main/` - Main process (Node.js)
  - `src/preload/` - Preload scripts (IPC bridge)
  - `src/renderer/` - Renderer process (React UI)
  - `src/shared/` - Shared types and constants
- [x] Package.json with all dependencies
- [x] Scripts: dev, build, lint, format

**Code Quality:**
- [x] TypeScript strict mode enabled
- [x] ESLint rules for TypeScript + React
- [x] Prettier formatting rules
- [x] Pre-commit hooks (optional, recommended)

### Out of Scope

- ❌ Actual Electron application code (Feature 1.2)
- ❌ React components (Features 1.3-1.6)
- ❌ Automated testing setup (future phase)
- ❌ CI/CD pipeline (future phase)
- ❌ Deployment configuration (future phase)

---

## Technical Design

### Technology Stack

**Package Manager:**
- **pnpm** v8+ (faster than npm, efficient disk usage)

**Build Tool:**
- **Vite** v5+ with **electron-vite** plugin
- Rationale: Fast HMR (<1s), modern ESM-first, excellent TypeScript support (ADR-005)

**Language:**
- **TypeScript** v5+ strict mode
- Rationale: Type safety prevents bugs, better IDE support, self-documenting code (ADR-002)

**Code Quality:**
- **ESLint** with TypeScript + React plugins
- **Prettier** for code formatting
- **@typescript-eslint/parser** and related packages

**Electron:**
- **Electron** v28+ (latest stable)
- Rationale: Cross-platform desktop framework with full filesystem access (ADR-001)

### Project Structure

```
lighthouse-beacon/
├── .vscode/                 # VS Code workspace settings
│   ├── settings.json        # Editor config (format on save, etc.)
│   └── extensions.json      # Recommended extensions
├── Docs/                    # Planning and architecture docs (existing)
├── src/
│   ├── main/                # Main process (Node.js runtime)
│   │   ├── index.ts         # Main entry point
│   │   ├── window-manager.ts
│   │   └── services/        # Business logic services
│   ├── preload/             # Preload scripts (IPC bridge)
│   │   └── index.ts         # Expose IPC to renderer
│   ├── renderer/            # Renderer process (React UI)
│   │   ├── index.html       # HTML entry point
│   │   ├── main.tsx         # React entry point
│   │   ├── App.tsx          # Root React component
│   │   ├── components/      # React components
│   │   ├── stores/          # Zustand state stores
│   │   └── services/        # IPC service wrappers
│   └── shared/              # Shared types and constants
│       ├── types/           # TypeScript interfaces/types
│       └── constants/       # IPC channels, config values
├── .gitignore               # Git ignore patterns
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
├── electron.vite.config.ts  # Vite configuration for Electron
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # TypeScript for Node.js code
└── README.md                # Setup and development guide
```

### Configuration Files

**package.json** (dependencies):

```json
{
  "name": "lighthouse-chat-ide",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\""
  },
  "dependencies": {
    "electron": "^28.0.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "electron-vite": "^2.0.0",
    "eslint": "^8.50.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.0.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0"
  }
}
```

**tsconfig.json** (TypeScript strict mode):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./src/*"],
      "@main/*": ["./src/main/*"],
      "@renderer/*": ["./src/renderer/*"],
      "@shared/*": ["./src/shared/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

**electron.vite.config.ts** (Vite configuration):

```typescript
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@main': resolve(__dirname, 'src/main'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    },
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@renderer': resolve(__dirname, 'src/renderer'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    plugins: [react()]
  }
});
```

**.eslintrc.json** (ESLint configuration):

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "env": {
    "browser": true,
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "react/react-in-jsx-scope": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

**.prettierrc** (Prettier configuration):

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100
}
```

**.gitignore:**

```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local

# Logs
npm-debug.log*
pnpm-debug.log*
```

**README.md** (setup instructions):

````markdown
# Lighthouse Chat IDE (Beacon)

AI-powered desktop development environment enabling conversational codebase interaction.

## Setup Instructions

### Prerequisites

- **Node.js**: v18.0.0 or later ([Download](https://nodejs.org/))
- **pnpm**: v8.0.0 or later (install: `npm install -g pnpm`)

### Installation

1. Clone repository:
   ```bash
   git clone <repository-url>
   cd lighthouse-beacon
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start development server:
   ```bash
   pnpm dev
   ```

### Development

- **`pnpm dev`** - Start development server with HMR
- **`pnpm build`** - Build for production
- **`pnpm lint`** - Run ESLint
- **`pnpm format`** - Format code with Prettier

### Project Structure

- `src/main/` - Electron main process (Node.js)
- `src/preload/` - Preload scripts (IPC bridge)
- `src/renderer/` - React UI components
- `src/shared/` - Shared types and constants

## Technology Stack

- **Electron** - Desktop framework
- **React** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool with HMR
- **Zustand** - State management (Phase 1+)
- **Monaco Editor** - Code editor (Phase 1+)

## Documentation

- [Product Vision](Docs/architecture/_main/01-Product-Vision.md)
- [Architecture](Docs/architecture/_main/04-Architecture.md)
- [Epic 1 Plan](Docs/implementation/_main/epic-1-desktop-foundation.md)
````

---

## Implementation Approach

### Development Phases (Feature Waves)

This feature will be implemented in **1 wave** focusing on complete environment setup.

**Wave 1.1.1: Development Environment Configuration**
- Install and verify Node.js and pnpm
- Initialize project with package.json
- Configure TypeScript with strict mode
- Configure Vite with electron-vite
- Configure ESLint and Prettier
- Create project directory structure
- Write README with setup instructions
- Verify: `pnpm dev` starts successfully (even with minimal code)

### User Stories (Feature-Level)

**Story 1: Modern Build Tooling**
- **As a** developer
- **I want** fast hot module replacement and TypeScript support
- **So that** I can iterate quickly with instant feedback and type safety
- **Acceptance Criteria:**
  - Development server starts in < 5 seconds
  - HMR updates code in < 1 second after file save
  - TypeScript strict mode enabled with zero errors
  - Build completes successfully for main, preload, and renderer processes

**Story 2: Code Quality Enforcement**
- **As a** developer
- **I want** automated code quality checks (linting, formatting)
- **So that** code remains consistent and follows best practices
- **Acceptance Criteria:**
  - ESLint configured with TypeScript + React rules
  - Prettier configured for consistent formatting
  - `pnpm lint` passes with zero errors
  - `pnpm format` correctly formats all code files

**Story 3: Clear Project Structure**
- **As a** developer
- **I want** a well-organized directory structure following SOLID principles
- **So that** I can easily locate code and understand the architecture
- **Acceptance Criteria:**
  - Directory structure matches design (main, preload, renderer, shared)
  - Path aliases work (@main, @renderer, @shared)
  - README documents structure and setup process
  - New developers can set up project in < 10 minutes

### Technical Implementation Details

**Step 1: Verify Prerequisites**
```bash
# Check Node.js version
node --version  # Should be v18.0.0+

# Install pnpm globally
npm install -g pnpm

# Verify pnpm installation
pnpm --version  # Should be v8.0.0+
```

**Step 2: Initialize Project**
```bash
# Create package.json
pnpm init

# Install core dependencies
pnpm add electron

# Install dev dependencies
pnpm add -D electron-vite vite @vitejs/plugin-react
pnpm add -D typescript @types/node @types/react @types/react-dom
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks
pnpm add -D prettier
```

**Step 3: Create Configuration Files**
- Create `tsconfig.json` (TypeScript strict mode)
- Create `electron.vite.config.ts` (Vite configuration)
- Create `.eslintrc.json` (ESLint rules)
- Create `.prettierrc` (Prettier formatting)
- Create `.gitignore` (ignore node_modules, dist, etc.)

**Step 4: Create Directory Structure**
```bash
mkdir -p src/main src/preload src/renderer src/shared/types src/shared/constants
```

**Step 5: Create Minimal Entry Points**

`src/main/index.ts` (minimal Electron main process):
```typescript
import { app, BrowserWindow } from 'electron';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load index.html from renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile('dist/renderer/index.html');
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

`src/renderer/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lighthouse Chat IDE</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

`src/renderer/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/renderer/App.tsx`:
```typescript
import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Lighthouse Chat IDE</h1>
      <p>Development environment configured successfully!</p>
    </div>
  );
}

export default App;
```

**Step 6: Test Development Server**
```bash
# Start development server
pnpm dev

# Should open Electron window with "Development environment configured successfully!"
```

**Step 7: Test Code Quality Tools**
```bash
# Run linting
pnpm lint  # Should pass with zero errors

# Run formatting
pnpm format  # Should format all files correctly

# Run TypeScript compilation check
npx tsc --noEmit  # Should pass with zero errors
```

**Step 8: Write README**
- Document prerequisites (Node.js, pnpm)
- Document installation steps
- Document development scripts
- Document project structure

---

## Testing Strategy

### Manual Testing (Phase 1)

**Test 1: Development Server Startup**
- Run `pnpm dev`
- Expected: Electron window opens with "Development environment configured successfully!"
- Expected: HMR works (edit App.tsx, see changes immediately)
- Time to first render: < 5 seconds

**Test 2: Build Process**
- Run `pnpm build`
- Expected: Build completes successfully
- Expected: `dist/` directory created with main, preload, renderer bundles

**Test 3: Code Quality Tools**
- Run `pnpm lint`
- Expected: Zero errors
- Introduce intentional error (unused variable)
- Expected: ESLint catches error

**Test 4: TypeScript Strict Mode**
- Create variable without type annotation: `const x = null;`
- Try to access `x.toString()`
- Expected: TypeScript error (object possibly null)

**Test 5: Path Aliases**
- Import from `@shared/types`
- Expected: Import resolves correctly, no TypeScript errors

### Acceptance Criteria

- [x] Node.js 18+ installed
- [x] pnpm 8+ installed
- [x] `pnpm install` completes successfully
- [x] `pnpm dev` starts Electron window in < 5 seconds
- [x] HMR updates in < 1 second
- [x] `pnpm build` completes successfully
- [x] `pnpm lint` passes with zero errors
- [x] `pnpm format` formats all files
- [x] TypeScript strict mode enabled (check tsconfig.json)
- [x] Project structure matches design
- [x] Path aliases work (@main, @renderer, @shared)
- [x] README documents setup process
- [x] .gitignore configured correctly

---

## Dependencies and Risks

### Dependencies

**Prerequisites:**
- ✅ Node.js 18+ installed on development machine
- ✅ pnpm 8+ installed globally
- ✅ Git installed and repository initialized

**Enables:**
- **Feature 1.2**: Electron Application Shell (requires this build environment)
- **All subsequent features**: All Phase 1 features depend on this foundation

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Node.js version mismatch** | Medium - Build errors, compatibility issues | Low | Document required version in README, use `.nvmrc` file for version management |
| **pnpm learning curve** | Low - Developers unfamiliar with pnpm | Low | pnpm similar to npm, provide commands in README |
| **Vite configuration complexity** | Medium - Incorrect config prevents HMR | Low | Use electron-vite plugin (handles most config), test immediately |
| **TypeScript strict mode errors** | Low - More errors than expected | Medium | Accept that strict mode catches real bugs, fix incrementally |

---

## Architectural Alignment

### SOLID Principles

**Single Responsibility:**
- Each configuration file has single purpose (tsconfig.json for TypeScript, .eslintrc.json for linting)
- Directory structure separates concerns (main, preload, renderer, shared)

**Open/Closed:**
- Configuration files can be extended without modification (add ESLint rules, Prettier options)

**Liskov Substitution:**
- Not applicable (infrastructure feature)

**Interface Segregation:**
- Separate TypeScript configurations for different contexts (tsconfig.json for renderer, tsconfig.node.json for main)

**Dependency Inversion:**
- Not applicable (infrastructure feature)

### ADR Compliance

- **ADR-001 (Electron)**: This feature sets up Electron development environment ✅
- **ADR-002 (React + TypeScript)**: Configures TypeScript strict mode and React ✅
- **ADR-005 (Vite)**: Configures Vite as build tool ✅

### Development Best Practices

- **Anti-hardcoding**: Environment variables via Vite config (`process.env.NODE_ENV`)
- **Error handling**: Build scripts will fail fast on errors (TypeScript, ESLint)
- **Logging**: Console logging available in development mode
- **Testing**: Manual testing via `pnpm dev` and `pnpm build`
- **Security**: No security concerns (infrastructure only)

---

## Success Criteria

**Feature Complete When:**
- [x] All acceptance criteria met
- [x] `pnpm dev` starts Electron window showing minimal UI
- [x] HMR works (edit code, see changes instantly)
- [x] `pnpm build` completes successfully
- [x] `pnpm lint` and `pnpm format` pass
- [x] TypeScript strict mode enabled with zero errors
- [x] README provides clear setup instructions
- [x] Project structure follows SOLID principles
- [x] Developer can set up project and start coding in < 10 minutes

**Measurement:**
- Development server startup time < 5 seconds
- HMR update time < 1 second
- Zero TypeScript errors in strict mode
- Zero ESLint errors
- New developer setup time < 10 minutes (manual testing with new team member)

---

**Feature Owner:** Roy Love
**Created Date:** 2026-01-19
**Last Updated:** 2026-01-19
**Status:** ✅ Complete
**Next Review:** After Wave 1.1.1 completion
