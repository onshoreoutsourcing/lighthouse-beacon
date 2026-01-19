# ADR-001: Electron as Desktop Framework

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Roy Love (Product Owner), Claude Sonnet 4.5 (System Architect)
**Related**: Epic-1 (Desktop Foundation), ARCHITECTURE-DECISION-CUSTOM-IDE-VS-EXTENSION.md

---

## Context

Lighthouse Chat IDE requires a cross-platform desktop application framework to deliver conversational AI-powered development with complete visual context. The application needs:

- **Cross-platform support**: Run on macOS, Windows, and Linux from single codebase
- **Full filesystem access**: Read, write, and monitor files for IDE functionality
- **Modern UI capabilities**: Professional developer experience matching VS Code standards
- **Web technology stack**: Leverage React/TypeScript skills, avoid native development
- **Process isolation**: Security model separating UI from system operations
- **Proven scalability**: Handle large codebases (10,000+ files) performantly

**Strategic context**:
- Decision to build custom IDE (not VS Code extension/fork) requires desktop framework
- Product Vision emphasizes "Visual First" - requires rich desktop UI capabilities
- Phase 1 must establish solid foundation for Phases 2-6 (AI integration, file tools, etc.)
- Team has strong React/TypeScript experience, limited native development experience

**Requirements addressed**:
- NFR-1: Cross-platform compatibility (macOS, Windows, Linux)
- NFR-2: Performance (60 FPS UI, <50ms IPC)
- NFR-4: Security (sandboxed renderer, validated file operations)
- FR-1: Desktop application launch and workspace selection

---

## Considered Options

### Option 1: Electron (Chromium + Node.js)
**Description**: Use Electron framework combining Chromium browser engine with Node.js runtime

**Pros**:
- ✅ **Proven at scale**: Powers VS Code, Slack, Discord, GitHub Desktop, Figma
- ✅ **Cross-platform**: Write once, run on macOS/Windows/Linux
- ✅ **Web technologies**: Use React, TypeScript, modern web stack
- ✅ **Full system access**: Node.js provides complete filesystem and OS API access
- ✅ **Security model**: Multi-process architecture with sandboxed renderer
- ✅ **Mature ecosystem**: electron-builder, electron-vite, extensive documentation
- ✅ **Active maintenance**: Microsoft, GitHub, Slack contribute regularly

**Cons**:
- ❌ **Large bundle size**: ~200MB including Chromium + Node.js
- ❌ **Memory usage**: Higher than native (~200-500MB typical)
- ❌ **Startup time**: 1-3 seconds cold start (slower than native)
- ❌ **"Bloat" perception**: Some developers dislike Electron apps

**Implementation approach**:
```typescript
// Main process (Node.js)
import { app, BrowserWindow } from 'electron';

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,      // Security
      contextIsolation: true,       // Security
      preload: path.join(__dirname, 'preload.js')
    }
  });
};

app.whenReady().then(createWindow);
```

### Option 2: Tauri (Rust + System WebView)
**Description**: Use Tauri framework with Rust backend and native OS webviews

**Pros**:
- ✅ **Smaller bundle**: ~10-40MB (uses OS webview, no bundled Chromium)
- ✅ **Lower memory**: ~100-200MB typical
- ✅ **Faster startup**: <1 second cold start
- ✅ **Modern approach**: Growing community, good documentation

**Cons**:
- ❌ **Rust learning curve**: Team has no Rust experience, steep learning curve
- ❌ **Less proven**: Newer framework (2020), fewer production deployments
- ❌ **WebView inconsistencies**: Different rendering on macOS/Windows/Linux
- ❌ **Limited Monaco support**: WebView limitations may affect Monaco Editor
- ❌ **Smaller ecosystem**: Fewer tools, libraries, examples than Electron
- ❌ **Cross-platform quirks**: More platform-specific code needed

### Option 3: Native Applications (Swift/Kotlin/C++)
**Description**: Build separate native apps for macOS (Swift), Windows (C++/C#), Linux (C++/Qt)

**Pros**:
- ✅ **Best performance**: Native apps fastest and most memory-efficient
- ✅ **Platform integration**: Deep OS integration, native look and feel
- ✅ **No "bloat"**: Minimal resource usage

**Cons**:
- ❌ **3 separate codebases**: Maintain Swift + C++/C# + C++/Qt (or Kotlin)
- ❌ **3x development time**: Build every feature three times
- ❌ **3x testing effort**: Test on all platforms separately
- ❌ **Skill requirements**: Need Swift, C++/C#, and Linux expertise
- ❌ **Monaco integration difficult**: Monaco is web-based, awkward in native
- ❌ **Longer time to market**: 6-12 months vs. 3-4 weeks

### Option 4: Progressive Web App (PWA)
**Description**: Build web application with File System Access API

**Pros**:
- ✅ **No installation**: Runs in browser
- ✅ **Easy updates**: No app distribution needed
- ✅ **Cross-platform**: Works anywhere with modern browser

**Cons**:
- ❌ **Limited browser support**: File System Access API only in Chromium browsers
- ❌ **Reduced capabilities**: Can't run shell commands, limited OS integration
- ❌ **User friction**: Not perceived as "real" desktop application
- ❌ **Performance constraints**: Browser sandboxing limits optimization
- ❌ **Does not meet requirement**: NFR-1 requires desktop application

---

## Decision

**We have decided to use Electron as the desktop framework for Lighthouse Chat IDE.**

### Why This Choice

Electron is the optimal choice for Lighthouse Chat IDE's Phase 1 foundation, balancing:
1. **Speed to market** (3-4 weeks achievable vs. 6-12 months native)
2. **Team skills** (React/TypeScript expertise vs. learning Rust/Swift/C++)
3. **Proven reliability** (VS Code proves Electron works for professional IDEs)
4. **Full capabilities** (filesystem access, Monaco integration, IPC)
5. **Cross-platform guarantee** (single codebase for macOS/Windows/Linux)

**Key factors**:

1. **VS Code validation**: VS Code's success with Electron proves the framework can deliver professional IDE experiences. If Electron is good enough for VS Code (tens of millions of users), it's good enough for Lighthouse Chat IDE.

2. **Monaco Editor integration**: Monaco Editor (which we're using) is designed for Electron/web environments. Native integration would be significantly more complex.

3. **Timeline criticality**: Phase 1 foundation blocks all subsequent phases. Electron's 3-4 week timeline is acceptable; native's 6-12 months is not.

4. **Team velocity**: Team has strong React/TypeScript skills. Can be productive immediately with Electron vs. months of Rust/Swift learning with Tauri/native.

5. **Resource utilization acceptable**: ~200MB bundle and ~300-500MB RAM is acceptable for modern developer machines (16GB+ RAM typical).

6. **Proven security model**: Electron's context isolation + sandbox provides strong security when configured correctly (see ADR-005 for security configuration).

**Trade-offs accepted**:
- **Larger bundle size** (~200MB vs. ~40MB for Tauri) - Acceptable on developer machines with ample storage
- **Higher memory usage** (~300-500MB vs. ~100-200MB native) - Acceptable on developer machines with 16GB+ RAM
- **"Electron bloat" perception** - Mitigated by emphasizing functionality over bundle size, VS Code precedent

**Example Electron architecture**:

```typescript
// Project structure
lighthouse-beacon/
├── src/
│   ├── main/           // Main process (Node.js)
│   │   ├── index.ts    // Entry point
│   │   ├── window-manager.ts
│   │   └── services/
│   │       ├── file-system.service.ts
│   │       └── ipc-handlers.ts
│   ├── renderer/       // Renderer process (React)
│   │   ├── App.tsx
│   │   └── components/
│   ├── preload/        // Preload scripts
│   │   └── index.ts
│   └── shared/         // Shared types
│       └── types.ts
├── package.json
└── electron.vite.config.ts
```

---

## Consequences

### Positive

- ✅ **Rapid Phase 1 delivery**: 3-4 weeks to working foundation (vs. 6-12 months native)
- ✅ **Team productivity**: Immediate productivity with React/TypeScript (vs. months learning Rust/Swift)
- ✅ **Cross-platform guaranteed**: Single codebase runs identically on macOS/Windows/Linux
- ✅ **Monaco integration seamless**: Monaco Editor designed for Electron environments
- ✅ **Rich ecosystem**: electron-vite, electron-builder, extensive community resources
- ✅ **VS Code patterns reusable**: Can reference VS Code open-source architecture
- ✅ **Security model proven**: Context isolation + sandbox well-understood and documented
- ✅ **Future web version possible**: React components reusable for web deployment

### Negative

- ❌ **Large bundle size**: ~200MB download (vs. ~40MB for Tauri, ~10MB native)
  - **Impact**: Longer initial download time, more storage required
  - **Acceptable for**: Developer machines with ample storage and fast internet

- ❌ **Higher memory usage**: ~300-500MB typical (vs. ~100-200MB native)
  - **Impact**: More RAM required, slower on low-end machines
  - **Acceptable for**: Developer machines typically have 16GB+ RAM

- ❌ **Slower startup**: 1-3 seconds cold start (vs. <1 second native)
  - **Impact**: Slightly slower application launch
  - **Acceptable for**: IDE used for hours once launched, startup time amortized

- ❌ **"Electron bloat" perception**: Some developers dislike Electron apps
  - **Impact**: Potential user resistance, negative perception
  - **Mitigation**: Emphasize functionality, performance, VS Code precedent; deliver value that outweighs perception

- ❌ **Chromium/Node.js updates**: Must keep Electron updated for security
  - **Impact**: Ongoing maintenance burden, potential breaking changes
  - **Mitigation**: Use LTS Electron versions, test updates thoroughly, follow security advisories

### Mitigation Strategies

**For bundle size/memory concerns**:
- Monitor actual bundle size and memory usage in Phase 1
- If metrics exceed 250MB bundle or 600MB memory, investigate optimizations:
  - Tree-shaking unused dependencies
  - Lazy loading Phase 2+ features
  - V8 heap snapshots for memory profiling
- Communicate system requirements clearly (16GB+ RAM recommended)

**For "Electron bloat" perception**:
- Emphasize Lighthouse Chat IDE's unique value: AI + SOC + multi-provider
- Reference VS Code's success (tens of millions of Electron users)
- Deliver fast, polished, bug-free experience that proves quality over size
- Consider offering "lite" version in future if demand exists

**For Electron maintenance**:
- Schedule quarterly Electron updates during low-activity periods
- Test updates in staging environment before releasing
- Subscribe to Electron security advisories
- Budget 1-2 days per quarter for Electron updates

---

## References

- **Architecture Doc**: `/Docs/architecture/_main/04-Architecture.md` (Electron architecture section)
- **Product Plan**: `/Docs/architecture/_main/02-Product-Plan.md` (Phase 1 technology stack)
- **Electron Documentation**: https://www.electronjs.org/docs/latest
- **VS Code Architecture**: https://github.com/microsoft/vscode (open source reference)
- **Electron Security**: https://www.electronjs.org/docs/latest/tutorial/security
- **Electron Best Practices**: https://www.electronjs.org/docs/latest/tutorial/performance
- **Related ADRs**:
  - ADR-002: React + TypeScript for UI (UI layer decision)
  - ADR-004: Monaco Editor Integration (depends on Electron webview)
  - ADR-005: Vite as Build Tool (Electron + Vite integration)

---

**Last Updated**: 2026-01-19
