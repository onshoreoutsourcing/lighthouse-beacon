# ADR-006: AIChatSDK Integration Approach

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Lighthouse Development Team
**Related**: Epic-2, Feature-2.1, Product Vision (AI Ethics), Business Requirements (FR-5)

---

## Context

With Epic 1 complete (desktop foundation), we need to integrate AI capabilities into Lighthouse Chat IDE. The core value proposition is conversational file operations powered by AI. We must integrate an AI SDK that supports multiple providers (Claude, GPT, Gemini, Ollama) while maintaining SOC traceability, permission controls, and a clean architecture.

**Requirements:**
- Multi-provider AI support (start with Claude, enable others in future)
- SOC logging for all AI operations (compliance traceability)
- Tool calling framework for file operations
- Streaming response support for real-time UX
- API key security (encrypted storage)
- Conversation persistence
- Electron compatibility (main and renderer processes)
- TypeScript type safety

**Constraints:**
- AIChatSDK is available as local clone in `../AIChatSDK` directory
- Must work in Electron environment (Node.js + Chromium)
- Cannot use cloud-based AI routing (users control API keys)
- Must support offline development with Ollama (future)

**Existing System:**
- Desktop application built on Electron
- Three-panel layout operational
- IPC communication between main and renderer processes
- No AI integration yet - this is the first AI feature

---

## Considered Options

- **Option 1: Import AIChatSDK as Local Module** - Import from `../AIChatSDK` directory, wrap in service layer
- **Option 2: Install AIChatSDK from npm** - Publish AIChatSDK to npm, install as dependency
- **Option 3: Direct Provider Integration** - Integrate Anthropic SDK directly without abstraction
- **Option 4: Custom AI Abstraction** - Build our own multi-provider abstraction layer
- **Option 5: Do Nothing** - Continue without AI capabilities (not viable for product vision)

---

## Decision

**We have decided to import AIChatSDK as a local module from `../AIChatSDK` and wrap it in an application-specific service layer (`AIService`).**

### Why This Choice

AIChatSDK provides exactly the multi-provider abstraction, SOC logging, and tool calling framework we need, while local import gives us control and flexibility during active development.

**Key factors:**

1. **Multi-Provider Foundation**: AIChatSDK already abstracts differences between Claude, GPT, Gemini, and Ollama. Building this ourselves would take 2-3 weeks and duplicate effort.

2. **SOC Integration Built-in**: AIChatSDK has native SOC logging for all AI operations, meeting our compliance requirements (FR-10) without additional implementation.

3. **Development Control**: Local import allows us to modify AIChatSDK if needed during Beacon development. Both projects are owned by Lighthouse.

4. **Tool Calling Standard**: AIChatSDK provides standardized tool schema format compatible with all providers. Epic 3 file operations will use this framework.

5. **Streaming Support**: Real-time token streaming is built into AIChatSDK, critical for responsive conversational UX (NFR-1).

**Implementation approach:**

```typescript
// AIService wraps AIChatSDK with app-specific logic
// src/services/AIService.ts
import { AIChatClient, ClaudeProvider } from '../../../AIChatSDK';

export class AIService {
  private client: AIChatClient;

  async initialize(apiKey: string) {
    // AIChatSDK handles provider abstraction
    this.client = new AIChatClient({
      provider: new ClaudeProvider({ apiKey }),
      soc: { enabled: true, endpoint: LIGHTHOUSE_SOC_ENDPOINT }
    });
  }

  async sendMessage(message: string): AsyncIterator<string> {
    // Streaming responses
    return this.client.streamChat(message);
  }

  async executeTool(tool: string, params: unknown): Promise<unknown> {
    // Tool execution (Epic 3)
    return this.client.executeTool(tool, params);
  }
}
```

**Service layer rationale:**
- Keeps AIChatSDK configuration separate from app code
- Allows app-specific error handling and state management
- Provides clean boundary for testing (mock AIService)
- Simplifies future refactoring if AIChatSDK API changes

**Why we rejected alternatives:**

- **npm package**: AIChatSDK not published yet; local import gives more flexibility during concurrent development
- **Direct provider integration**: Would require building multi-provider abstraction ourselves (2-3 weeks extra work)
- **Custom abstraction**: Duplicates AIChatSDK functionality; wastes time; harder to maintain

---

## Consequences

### Positive

- **Fast Integration**: AIChatSDK provides all needed capabilities - no need to build abstraction layer
- **Multi-Provider Ready**: Foundation supports GPT, Gemini, Ollama in Epic 4 with minimal effort
- **SOC Compliance**: Built-in logging meets FR-10 (SOC Traceability) without additional code
- **Tool Framework**: Epic 3 file operations can use AIChatSDK tool calling immediately
- **Streaming UX**: Real-time token display provides professional conversational experience
- **Development Flexibility**: Local import allows AIChatSDK modifications if needed
- **Type Safety**: Full TypeScript support from AIChatSDK

### Negative

- **Local Dependency**: Must maintain correct relative path to `../AIChatSDK` directory
- **Version Coordination**: Changes to AIChatSDK might require updates to Beacon simultaneously
- **Build Complexity**: TypeScript compilation needs to resolve local module paths
- **Deployment Consideration**: Must package AIChatSDK code with Beacon distribution

### Mitigation Strategies

**For local dependency:**
- Document AIChatSDK location requirement in README
- Add validation check on app startup to ensure AIChatSDK is available
- Use TypeScript path aliases to make imports clearer

**For version coordination:**
- Keep AIChatSDK and Beacon in adjacent directories as documented
- Test both projects together in CI/CD pipeline
- Plan to publish AIChatSDK to npm after Beacon MVP (Epic 3 complete)

**For build complexity:**
- Configure Vite and TypeScript to resolve local modules correctly
- Test bundling early to catch path resolution issues
- Document build setup in developer guide

**For deployment:**
- Vite bundler will include AIChatSDK in distribution
- Test packaged application with local AIChatSDK code
- Monitor bundle size (AIChatSDK should add <200KB)

---

## References

- [AIChatSDK Repository](https://github.com/lighthouse/aichatsdk) (internal)
- Product Vision: Docs/architecture/_main/01-Product-Vision.md (Section: AI Ethics)
- Business Requirements: FR-5 (Multi-Provider Support), FR-10 (SOC Traceability)
- Epic 2 Plan: `Docs/implementation/_main/epic-2-ai-integration-aichatsdk.md`
- Related ADRs:
  - ADR-001: Electron as Desktop Framework
  - ADR-002: React + TypeScript for UI
- Implementation: Will be in `src/services/AIService.ts`

---

**Last Updated**: 2026-01-19
