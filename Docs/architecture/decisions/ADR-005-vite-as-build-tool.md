# ADR-005: Vite as Build Tool

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Roy Love (Product Owner), Claude Sonnet 4.5 (System Architect)
**Related**: Epic-1 (Desktop Foundation), ADR-001 (Electron), ADR-002 (React + TypeScript)

---

## Context

Lighthouse Chat IDE requires a build tool to bundle, transpile, and optimize the Electron application. The build system must:

- **Fast development**: Sub-second hot module replacement (HMR) for rapid iteration
- **TypeScript support**: Native TypeScript compilation, no additional configuration
- **Electron integration**: Build both main process (Node.js) and renderer process (React)
- **React support**: JSX/TSX transformation, React Fast Refresh
- **Production optimization**: Minification, tree-shaking, code splitting
- **Simple configuration**: Minimal setup, sensible defaults
- **Modern standards**: ESM-first, modern JavaScript features

**Strategic context**:
- Phase 1 timeline is 3-4 weeks - need productive development environment immediately
- Team needs fast feedback loop for UI development (instant HMR)
- Electron requires building 2 separate bundles: main process + renderer process
- Production builds need to be optimized for distribution (~200MB target)

**Requirements addressed**:
- NFR-2: Performance (development speed, fast builds)
- Epic-1: Development Environment Setup (Feature 1.1)

---

## Considered Options

### Option 1: Vite + electron-vite
**Description**: Use Vite (modern build tool) with electron-vite plugin for Electron integration

**Pros**:
- ✅ **Fastest HMR**: Sub-second updates, instant feedback
- ✅ **Modern**: ESM-first, optimized for modern browsers (Chromium in Electron)
- ✅ **TypeScript-native**: First-class TypeScript support, no configuration
- ✅ **Electron integration**: electron-vite handles main + renderer builds
- ✅ **Simple config**: Minimal vite.config.ts, sensible defaults
- ✅ **React Fast Refresh**: Built-in, preserves state during HMR
- ✅ **Industry momentum**: Replacing Webpack as modern standard
- ✅ **Small bundle**: Rollup under the hood, excellent tree-shaking

**Cons**:
- ❌ **Newer than Webpack**: Smaller ecosystem (but growing rapidly)
- ❌ **Electron integration**: electron-vite is newer, less proven than electron-webpack

**Example config**:
```typescript
// electron.vite.config.ts
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    // Main process (Node.js)
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  preload: {
    // Preload scripts
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    // Renderer process (React)
    plugins: [react()]
  }
});
```

### Option 2: Webpack + electron-webpack
**Description**: Use Webpack (traditional bundler) with electron-webpack

**Pros**:
- ✅ **Mature**: Proven over 10+ years
- ✅ **Large ecosystem**: Vast library of loaders, plugins
- ✅ **Electron integration**: electron-webpack well-established
- ✅ **VS Code uses it**: Can reference VS Code build configs

**Cons**:
- ❌ **Slow HMR**: 5-10 seconds for updates (vs. <1 second Vite)
- ❌ **Complex configuration**: webpack.config.js verbose, hard to understand
- ❌ **Slower builds**: 2-5 minutes production builds (vs. <1 minute Vite)
- ❌ **Dated architecture**: Pre-ESM design, complex module resolution
- ❌ **Developer frustration**: Slow feedback loop hurts productivity

### Option 3: esbuild
**Description**: Use esbuild (ultra-fast bundler) directly

**Pros**:
- ✅ **Fastest builds**: 10-100x faster than Webpack (Go-based)
- ✅ **Simple**: Minimal configuration
- ✅ **TypeScript support**: Built-in TypeScript compilation

**Cons**:
- ❌ **No HMR**: Hot reload requires custom integration
- ❌ **No Electron integration**: Would need to build ourselves
- ❌ **Limited plugins**: Smaller ecosystem than Webpack/Vite
- ❌ **More work**: Need to integrate with Electron, React, etc. manually

### Option 4: Rollup
**Description**: Use Rollup (library bundler) for application

**Pros**:
- ✅ **Excellent tree-shaking**: Best dead code elimination
- ✅ **ESM-native**: Modern JavaScript module support

**Cons**:
- ❌ **No HMR**: Requires dev server plugin
- ❌ **Complex config**: More setup than Vite
- ❌ **No Electron integration**: Would need custom setup
- ❌ **Better for libraries**: Designed for library bundling, not applications

---

## Decision

**We have decided to use Vite with electron-vite for building Lighthouse Chat IDE.**

### Why This Choice

Vite + electron-vite is the optimal choice for Lighthouse Chat IDE's build system, balancing:
1. **Development speed** (sub-second HMR vs. 5-10 seconds Webpack)
2. **Simple configuration** (minimal config vs. complex Webpack)
3. **TypeScript-native** (no ts-loader or babel configuration needed)
4. **Modern tooling** (ESM-first, future-proof)
5. **Electron integration** (electron-vite handles main + renderer builds)

**Key factors**:

1. **Development velocity**: Vite's sub-second HMR vs. Webpack's 5-10 second updates = 10x faster iteration. Over 3-4 week Phase 1, this saves hours of waiting time.

2. **Simple configuration**: Vite config is ~20 lines vs. ~200 lines for Webpack. Easier to understand, maintain, debug.

3. **TypeScript-native**: Vite compiles TypeScript out of the box. No ts-loader, no babel configuration, no tsconfig.json complexity.

4. **React Fast Refresh**: Vite includes React Fast Refresh built-in. Preserves component state during HMR (huge DX improvement).

5. **Electron integration**: electron-vite plugin handles:
   - Main process build (Node.js bundle)
   - Preload script build (isolated context)
   - Renderer process build (React bundle)
   - Development server with HMR
   - Production builds with optimization

6. **Industry momentum**: Vite is replacing Webpack as modern standard. Vue, React, Svelte official templates use Vite. Growing ecosystem, active development.

7. **Future-proof**: Vite is ESM-first, aligned with modern JavaScript standards. Webpack is legacy (CommonJS-based).

**Example development workflow**:

```bash
# Start development server (HMR enabled)
npm run dev

# Vite starts 3 processes:
# 1. Main process watcher (rebuilds on main/ changes)
# 2. Preload watcher (rebuilds on preload/ changes)
# 3. Renderer dev server (HMR for renderer/ changes)

# Edit React component → see changes in <1 second
# Edit main process → auto-restart Electron
# Edit preload → auto-reload renderer
```

**Example production build**:

```bash
# Build for production
npm run build

# Vite builds:
# - Main process: Minified Node.js bundle
# - Preload: Minified isolated script
# - Renderer: Minified React bundle (code split, tree-shaken)

# Package for distribution
npm run package

# electron-builder creates:
# - macOS: .dmg installer
# - Windows: .exe installer
# - Linux: .deb, .AppImage
```

**Minimal configuration**:

```typescript
// electron.vite.config.ts
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer')
      }
    },
    plugins: [react()]
  }
});
```

---

## Consequences

### Positive

- ✅ **10x faster HMR**: <1 second vs. 5-10 seconds Webpack = massive productivity boost
- ✅ **Simple config**: ~20 lines vs. ~200 lines Webpack = easier to maintain
- ✅ **TypeScript-native**: No ts-loader, babel, or complex tsconfig needed
- ✅ **React Fast Refresh**: Preserves component state during HMR (huge DX improvement)
- ✅ **Fast production builds**: <1 minute vs. 2-5 minutes Webpack
- ✅ **Modern tooling**: ESM-first, aligned with JavaScript standards
- ✅ **Future-proof**: Industry moving to Vite, growing ecosystem
- ✅ **Excellent tree-shaking**: Rollup under hood, optimal dead code elimination

### Negative

- ❌ **Newer than Webpack**: Smaller ecosystem, fewer examples
  - **Impact**: Harder to find answers to uncommon questions
  - **Mitigation**: Vite docs excellent, electron-vite docs good, community active

- ❌ **electron-vite newer**: Less proven than electron-webpack
  - **Impact**: Potential bugs or missing features
  - **Mitigation**: electron-vite maintained, actively developed, sufficient for our needs

- ❌ **Different from VS Code**: VS Code uses Webpack, can't directly copy configs
  - **Impact**: Can't reference VS Code build setup
  - **Mitigation**: Vite simpler, less need for complex configs; electron-vite examples sufficient

### Mitigation Strategies

**For ecosystem maturity**:
- Document Vite/electron-vite setup in architecture guide
- Build internal knowledge base for common issues
- Contribute back to electron-vite if we find bugs
- Join Vite Discord for community support

**For uncommon issues**:
- Vite docs: https://vitejs.dev/
- electron-vite docs: https://electron-vite.org/
- Vite Discord: https://chat.vitejs.dev/
- Stack Overflow: Growing Vite community

**For build optimization**:
- Monitor bundle size with rollup-plugin-visualizer
- Configure code splitting for Phase 2+ features
- Use dynamic imports for heavy dependencies (Monaco, etc.)
- Target: Keep renderer bundle < 10MB, main process < 5MB

---

## References

- **Architecture Doc**: `/Docs/architecture/_main/04-Architecture.md` (Build tool section)
- **Product Plan**: `/Docs/architecture/_main/02-Product-Plan.md` (Technology stack)
- **Vite Documentation**: https://vitejs.dev/
- **electron-vite**: https://electron-vite.org/
- **@vitejs/plugin-react**: https://github.com/vitejs/vite-plugin-react
- **Vite vs Webpack**: https://vitejs.dev/guide/why.html
- **Related ADRs**:
  - ADR-001: Electron as Desktop Framework (Vite builds Electron app)
  - ADR-002: React + TypeScript for UI (Vite compiles React + TypeScript)
  - ADR-004: Monaco Editor Integration (Vite bundles Monaco)

---

**Last Updated**: 2026-01-19
