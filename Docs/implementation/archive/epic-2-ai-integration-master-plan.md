# Epic 2: AI Integration with AIChatSDK - Master Implementation Plan

## Document Overview

**Document Type:** Master Implementation Plan
**Epic:** Epic-2 (AI Integration with AIChatSDK)
**Status:** COMPLETE
**Completed:** January 20, 2026
**Version:** 1.0
**Created:** 2026-01-19
**Last Updated:** 2026-01-20

---

## 1. Executive Summary

### 1.1 Epic Overview

Epic 2 transforms Lighthouse Chat IDE from a static desktop IDE shell into an AI-powered conversational development environment. Building on the solid foundation established in Epic 1 (Desktop Foundation), this epic integrates AIChatSDK to enable natural language interaction with the codebase through Anthropic Claude.

**Primary Objective:** Enable conversational interaction with AI through integrated AIChatSDK, creating the foundation for AI-driven file operations in Epic 3.

**Business Value:**
- Enables core product value proposition: conversational file operations
- Establishes multi-provider AI architecture (starting with Claude)
- Implements SOC traceability for all AI operations
- Creates tool calling infrastructure for future file operation tools

### 1.2 Scope Summary

| Aspect | Description |
|--------|-------------|
| **Duration** | 2-3 weeks |
| **Team Size** | 1-2 developers |
| **Priority** | Critical (P0) |
| **Phase** | Phase 2 |
| **Prerequisites** | Epic 1 Complete |
| **Enables** | Epic 3 (File Operation Tools), Epic 4 (Multi-Provider Support) |

### 1.3 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| AI chat interface functional | Yes | Manual testing |
| Streaming response start time | < 2 seconds | Performance testing |
| Multi-turn conversation context | Maintained correctly | Functional testing |
| Tool calling framework | Operational | Integration testing |
| Permission system blocking | 100% of unapproved operations | Security testing |
| SOC logging coverage | 100% of AI operations | Audit verification |
| Critical bugs | 0 | Bug tracking |

---

## 2. Prerequisites and Dependencies

### 2.1 Epic 1 Completion Requirements

Epic 2 cannot begin until Epic 1 is verified complete with the following exit criteria met:

| Requirement | Status | Verification |
|-------------|--------|--------------|
| Electron application launches on macOS/Windows/Linux | Required | Manual test |
| Three-panel layout functional and stable | Required | Manual test |
| File explorer displays directory tree correctly | Required | Manual test |
| Monaco editor opens files with syntax highlighting | Required | Manual test |
| Manual editing and saving works | Required | Manual test |
| Multiple tabs functional | Required | Manual test |
| IPC communication latency < 50ms | Required | Performance test |
| No P0 bugs in desktop foundation | Required | Bug audit |

### 2.2 External Dependencies

| Dependency | Type | Status | Impact if Unavailable | Mitigation |
|------------|------|--------|----------------------|------------|
| **AIChatSDK** | Local Module | Available | Critical blocker | Guaranteed (Lighthouse owned) |
| **Anthropic Claude API** | AI Service | Available | Cannot test AI features | Users provide own API keys |
| **Electron safeStorage** | Security | Available | Cannot secure API keys | Built into Electron |

### 2.3 Technical Prerequisites

- AIChatSDK available as local clone in `../AIChatSDK` directory
- Developer machine with Anthropic API key for testing
- Epic 1 codebase with stable IPC communication layer
- Node.js 18+ and pnpm 8+ installed

---

## 3. Feature Breakdown

### 3.1 Feature 2.1: AIChatSDK Integration and Configuration

**Scope:** Set up AIChatSDK, configure Claude provider, implement API key storage and error handling

**Deliverables:**
- AIService wrapper around AIChatSDK
- Claude provider configuration
- API key management with Electron safeStorage
- SOC logging integration
- Error handling for AI communication failures
- IPC handlers for AI communication

**Key Technical Decisions:**
- Import AIChatSDK as local module from `../AIChatSDK` (ADR-006)
- Wrap in service layer for application-specific logic
- Use Electron safeStorage for API key encryption

**Acceptance Criteria:**
- [ ] AIChatSDK imported and initialized successfully
- [ ] Claude provider configured and communicating
- [ ] API keys stored securely (encrypted)
- [ ] API key never appears in logs or UI
- [ ] SOC logging captures all AI requests
- [ ] Clear error messages for authentication failures
- [ ] Clear error messages for rate limiting

**Estimated Effort:** 5 days

**Dependencies:** None (first feature)

---

### 3.2 Feature 2.2: Chat Interface and Streaming

**Scope:** Build conversation UI with message history, input field, streaming visualization, and message formatting

**Deliverables:**
- ChatInterface React component in right panel
- Message history display with user/AI distinction
- Text input field with send functionality
- Streaming response visualization
- Markdown rendering with syntax highlighting
- File path highlighting (clickable links)
- Auto-scroll behavior
- Conversation persistence (JSON files)
- ChatStore (Zustand) for state management

**Key Technical Decisions:**
- 50ms token buffering with requestAnimationFrame (ADR-009)
- React 18 useDeferredValue for markdown rendering
- JSON files in Electron userData directory (ADR-007)

**Acceptance Criteria:**
- [ ] Chat interface displays in right panel (replacing placeholder)
- [ ] Message history shows user and AI messages distinctly
- [ ] User can type messages and send (Enter or button)
- [ ] AI responses stream in real-time (not after completion)
- [ ] Streaming indicator visible while AI responding
- [ ] Code blocks have syntax highlighting
- [ ] File paths are highlighted and clickable
- [ ] Clicking file path opens file in editor
- [ ] Auto-scroll to latest message during streaming
- [ ] Conversation persists across application restarts
- [ ] UI remains responsive during streaming (60 FPS)

**Estimated Effort:** 8 days

**Dependencies:** Feature 2.1 (requires working AI communication)

---

### 3.3 Feature 2.3: Tool Framework and Permissions

**Scope:** Implement tool calling infrastructure, permission system with approve/deny prompts, and operation logging

**Deliverables:**
- Tool calling infrastructure integrated with AIChatSDK
- Tool schema definitions (read-only for Phase 2)
- ToolExecutionService in main process
- PermissionService for operation approval
- PermissionModal React component
- Permission logging to SOC
- Session trust option (optional checkbox)

**Key Technical Decisions:**
- Modal dialog for permission prompts (ADR-008)
- Color-coded risk levels (green/yellow/red)
- Keyboard accessible (Enter=approve, Escape=deny)
- Delete and bash always require confirmation (no trust option)

**Acceptance Criteria:**
- [ ] Tool calling infrastructure parses AI tool requests
- [ ] Permission modal appears before file operations
- [ ] Modal shows operation details (type, path, preview)
- [ ] User can approve (green button, Enter key)
- [ ] User can deny (red button, Escape key)
- [ ] "Trust this session" checkbox functional (for non-dangerous ops)
- [ ] Denied operations reported back to AI
- [ ] All permission decisions logged to SOC
- [ ] Tool results fed back to AI for next step
- [ ] Framework ready for Epic 3 tool implementations

**Estimated Effort:** 5 days

**Dependencies:** Feature 2.2 (requires conversation context)

---

## 4. Implementation Order and Dependency Chain

### 4.1 Dependency Diagram

```
                    Epic 1 (Complete)
                          |
                          v
              +------------------------+
              | Feature 2.1            |
              | AIChatSDK Integration  |
              | (5 days)               |
              +------------------------+
                          |
                          | Requires working AI communication
                          v
              +------------------------+
              | Feature 2.2            |
              | Chat Interface         |
              | (8 days)               |
              +------------------------+
                          |
                          | Requires conversation context
                          v
              +------------------------+
              | Feature 2.3            |
              | Tool Framework         |
              | (5 days)               |
              +------------------------+
                          |
                          v
                    Epic 3 (Enabled)
```

### 4.2 Implementation Rationale

**Feature 2.1 first** because:
- Chat interface cannot display AI responses without AIChatSDK working
- Streaming visualization requires working streaming connection
- All subsequent features depend on AI communication

**Feature 2.2 second** because:
- Tool framework needs conversation context to function
- Permission prompts appear during conversation flow
- Tool results display in chat interface

**Feature 2.3 last** because:
- Tools execute within conversation context
- Results must be displayed in chat
- Framework is final piece before Epic 3 file operations

### 4.3 Parallel Work Opportunities

While features are sequential, these tasks can be parallelized within features:

**Feature 2.1:**
- API key UI development can happen while AIService is being built
- SOC logging configuration can be tested independently

**Feature 2.2:**
- ChatStore development can parallel ChatInterface component
- Message rendering can be built while streaming logic is implemented

**Feature 2.3:**
- PermissionModal UI can be built while ToolExecutionService is developed
- Tool schemas can be defined while permission logic is implemented

---

## 5. Technical Stack

### 5.1 Core Technologies

| Technology | Version | Purpose | Phase 2 Usage |
|------------|---------|---------|---------------|
| **AIChatSDK** | Local | AI provider abstraction, SOC logging | Core AI integration |
| **React** | 18+ | UI framework | ChatInterface, PermissionModal |
| **Zustand** | 4+ | State management | ChatStore |
| **Electron** | 28+ | Desktop framework | IPC, safeStorage |
| **TypeScript** | 5+ | Type safety | All code |
| **TailwindCSS** | 3+ | Styling | Chat UI, Permission UI |

### 5.2 New Dependencies (Epic 2)

| Package | Purpose | Installation |
|---------|---------|--------------|
| `react-markdown` | Markdown rendering in chat | pnpm add react-markdown |
| `remark-gfm` | GitHub Flavored Markdown | pnpm add remark-gfm |
| `react-syntax-highlighter` | Code block highlighting | pnpm add react-syntax-highlighter |
| `uuid` | Unique IDs for messages/conversations | pnpm add uuid |

### 5.3 Architecture Patterns

**Service Layer Pattern:**
```typescript
// AIService wraps AIChatSDK with application-specific logic
export class AIService {
  private client: AIChatClient;

  async initialize(apiKey: string): Promise<void>
  async sendMessage(message: string): AsyncIterator<string>
  async executeTool(tool: string, params: unknown): Promise<unknown>
}
```

**Observer Pattern:**
```typescript
// ChatStore subscribes to streaming events
const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,

  subscribeToStream: (messageId: string) => {
    // Subscribe to AI streaming events via IPC
  }
}));
```

**Repository Pattern:**
```typescript
// ConversationStorage abstracts persistence
export class ConversationStorage {
  async save(conversation: Conversation): Promise<void>
  async load(id: string): Promise<Conversation>
  async list(): Promise<ConversationMetadata[]>
  async delete(id: string): Promise<void>
}
```

---

## 6. Success Criteria (Detailed)

### 6.1 Functional Requirements

| Requirement | Priority | Verification |
|-------------|----------|--------------|
| AI chat interface functional and responsive | P0 | Manual testing |
| Streaming responses appear in real-time | P0 | Performance test |
| AIChatSDK communicates with Anthropic Claude | P0 | Integration test |
| Multi-turn conversations maintain context | P0 | Functional test |
| Basic tool calling framework operational | P0 | Integration test |
| Permission system blocks unapproved operations | P0 | Security test |
| SOC logging captures 100% of operations | P0 | Audit verification |
| Natural conversations about codebase work | P0 | User testing |

### 6.2 Non-Functional Requirements

| Requirement | Target | Verification |
|-------------|--------|--------------|
| Streaming start time | < 2 seconds | Performance test |
| UI responsiveness during streaming | 60 FPS | Performance test |
| Memory usage with active conversation | < 600MB | Profiling |
| Conversation persistence reliability | 100% | Functional test |
| API key security | Never exposed | Security audit |

### 6.3 Exit Criteria (Epic 2 Complete)

All of the following must be achieved before proceeding to Epic 3:

- [ ] Chat interface displays conversation history
- [ ] AI responses stream smoothly without UI blocking
- [ ] Users can send messages and receive AI responses
- [ ] Tool calling infrastructure ready for file operation tools
- [ ] Permission prompts appear and work correctly
- [ ] All AI operations logged to SOC via AIChatSDK
- [ ] No critical bugs in AI communication or chat UI
- [ ] Conversation context maintained across 20+ turns
- [ ] API key stored securely and never exposed
- [ ] Error handling for all failure scenarios

---

## 7. Integration Points

### 7.1 Feature-to-Feature Integration

```
+-------------------+       +-------------------+       +-------------------+
|   Feature 2.1     |       |   Feature 2.2     |       |   Feature 2.3     |
|   AIService       |------>|   ChatInterface   |------>|   ToolExecution   |
|                   |       |   ChatStore       |       |   Permission      |
+-------------------+       +-------------------+       +-------------------+
        |                           |                           |
        | Provides AI               | Provides UI               | Provides control
        | communication             | for display               | for tools
        |                           |                           |
        v                           v                           v
+-----------------------------------------------------------------------+
|                        IPC Communication Layer                         |
|                        (from Epic 1)                                   |
+-----------------------------------------------------------------------+
```

### 7.2 Epic 1 Integration Points

| Epic 1 Component | Epic 2 Integration | Notes |
|------------------|-------------------|-------|
| **Three-Panel Layout** | Chat replaces right panel placeholder | Direct replacement |
| **Monaco Editor** | File paths in chat open files | Reuse openFile action |
| **File Explorer** | Visual feedback when AI references files | Highlight files |
| **IPC Layer** | New channels for AI, chat, permissions | Extend existing |
| **Zustand Stores** | New ChatStore, extend EditorStore | Same pattern |

### 7.3 New IPC Channels (Epic 2)

```typescript
// src/shared/constants/ipc-channels.ts (additions)
export const IPC_CHANNELS = {
  // Existing from Epic 1...

  // AI Service (Feature 2.1)
  AI_INITIALIZE: 'ai:initialize',
  AI_SEND_MESSAGE: 'ai:send-message',
  AI_STREAM_MESSAGE: 'ai:stream-message',  // Event channel
  AI_CANCEL: 'ai:cancel',

  // Settings (Feature 2.1)
  SETTINGS_GET_API_KEY: 'settings:get-api-key',
  SETTINGS_SET_API_KEY: 'settings:set-api-key',

  // Tool Execution (Feature 2.3)
  TOOL_EXECUTE: 'tool:execute',
  TOOL_RESULT: 'tool:result',  // Event channel

  // Permissions (Feature 2.3)
  PERMISSION_REQUEST: 'permission:request',  // Event channel
  PERMISSION_RESPONSE: 'permission:response',

  // Conversation Storage (Feature 2.2)
  CONVERSATION_SAVE: 'conversation:save',
  CONVERSATION_LOAD: 'conversation:load',
  CONVERSATION_LIST: 'conversation:list',
};
```

### 7.4 State Management Integration

```typescript
// New Zustand stores for Epic 2

// ChatStore - manages conversation state
interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentConversationId: string | null;

  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateStreamingMessage: (content: string) => void;
  clearConversation: () => void;
}

// PermissionStore - manages permission prompts
interface PermissionState {
  pendingRequest: PermissionRequest | null;
  trustSettings: Map<string, boolean>;

  showPermissionPrompt: (request: PermissionRequest) => void;
  approvePermission: (requestId: string) => void;
  denyPermission: (requestId: string) => void;
  setTrustSession: (toolName: string, trust: boolean) => void;
}
```

---

## 8. Testing Strategy

### 8.1 Unit Testing

| Component | Test Focus | Tools |
|-----------|------------|-------|
| **AIService** | API communication, error handling, streaming | Jest, mock AIChatSDK |
| **ChatStore** | State transitions, message handling | Jest, Zustand testing |
| **ConversationStorage** | Save/load operations, file handling | Jest, mock fs |
| **PermissionService** | Approval logic, timeout handling | Jest |

**Test Coverage Target:** 80% for services and stores

### 8.2 Integration Testing

| Integration Point | Test Scenarios | Tools |
|-------------------|---------------|-------|
| **AIService + AIChatSDK** | Real API calls with test key | Integration tests |
| **IPC Communication** | Message passing, event handling | Electron testing |
| **Chat + Editor** | File link clicks open files | Component tests |
| **Permission Flow** | Approve/deny with tool execution | E2E simulation |

### 8.3 End-to-End Testing

| User Flow | Test Steps | Priority |
|-----------|------------|----------|
| **Basic Conversation** | Send message, receive response, verify display | P0 |
| **Streaming Response** | Send message, verify streaming, verify completion | P0 |
| **Permission Approval** | Trigger tool, approve, verify execution | P0 |
| **Permission Denial** | Trigger tool, deny, verify blocking | P0 |
| **Conversation Persistence** | Create conversation, restart app, verify reload | P0 |
| **File Link Navigation** | Click file path in chat, verify editor opens | P1 |
| **Error Recovery** | Simulate API error, verify graceful handling | P1 |

### 8.4 Performance Testing

| Test | Target | Method |
|------|--------|--------|
| Streaming start latency | < 2 seconds | Timestamp measurement |
| UI frame rate during streaming | 60 FPS | Chrome DevTools |
| Memory during long conversation | < 600MB | Chrome DevTools profiler |
| Token rendering rate | 50+ tokens/second | Custom measurement |

### 8.5 Security Testing

| Test | Verification | Priority |
|------|--------------|----------|
| API key storage | Encrypted in safeStorage | P0 |
| API key not logged | Check all log outputs | P0 |
| API key not in renderer | Verify IPC only | P0 |
| Permission bypass attempt | Cannot skip modal | P0 |
| IPC channel whitelist | Only allowed channels work | P0 |

---

## 9. Risk Management

### 9.1 Risk Register

| Risk ID | Risk | Impact | Probability | Mitigation | Owner |
|---------|------|--------|-------------|------------|-------|
| R2-01 | AIChatSDK Electron compatibility | High | Low | Local clone allows modification; early testing | Dev Lead |
| R2-02 | Streaming causes UI jank | Medium | Medium | 50ms buffering, useDeferredValue, perf testing | Frontend Dev |
| R2-03 | Permission prompts too disruptive | Medium | Medium | "Trust session" option, gather user feedback | UX/Dev |
| R2-04 | Claude API rate limits | Low | Medium | Retry with backoff, clear error messages | Dev |
| R2-05 | Tool calling format inconsistencies | Medium | Low | AIChatSDK abstracts differences, validate schemas | Dev |
| R2-06 | Context window limits exceeded | Medium | Low | Truncate old messages, implement sliding window | Dev |
| R2-07 | Conversation storage corruption | High | Low | Atomic writes, temp file then rename | Dev |
| R2-08 | API key exposure in logs/UI | High | Low | Security audit, never log keys, IPC only | Security |

### 9.2 Mitigation Details

**R2-01: AIChatSDK Electron Compatibility**
- Test AIChatSDK in Electron environment in first 2 days of Feature 2.1
- If issues found, modify local AIChatSDK clone as needed
- Document any Electron-specific modifications

**R2-02: Streaming UI Performance**
- Implement 50ms token buffering with requestAnimationFrame
- Use React 18 useDeferredValue for markdown rendering
- Test with long responses (10,000+ tokens)
- Monitor frame rate with Chrome DevTools during development

**R2-03: Permission UX Balance**
- Start with modal for all operations (safe default)
- Implement "trust this session" checkbox
- Gather feedback during internal testing
- Iterate on UX in Epic 3 based on feedback

**R2-06: Context Window Management**
- Implement message truncation when approaching 100K tokens
- Keep system prompt and recent messages, summarize older
- Display indicator when context truncated
- Test with 50+ turn conversations

### 9.3 Contingency Plans

| Trigger | Action |
|---------|--------|
| AIChatSDK incompatible with Electron | Fork and modify AIChatSDK for Electron support |
| Streaming performance unacceptable | Increase buffer to 100ms, reduce render frequency |
| Permission UX too disruptive | Add "approve all similar" option for batch operations |
| Claude API unavailable | Document alternative provider setup (manual in Phase 2) |

---

## 10. Timeline and Milestones

### 10.1 Timeline Overview

```
Week 1                    Week 2                    Week 3
|----- Feature 2.1 -----|----- Feature 2.2 -----|----- Feature 2.3 -----|
|                       |                       |                       |
Day 1-5                 Day 6-13                Day 14-18
AIChatSDK Integration   Chat Interface          Tool Framework
                                                + Testing + Buffer
```

### 10.2 Detailed Milestones

| Milestone | Target | Description | Exit Criteria |
|-----------|--------|-------------|---------------|
| **Epic 2 Start** | Week 1, Day 1 | Begin Feature 2.1 | Development environment ready |
| **AIChatSDK Working** | Week 1, Day 3 | Basic AI communication | Can send/receive messages |
| **Feature 2.1 Complete** | Week 1, Day 5 | Full AI integration | API keys secure, SOC logging, errors handled |
| **Chat UI Functional** | Week 2, Day 3 | Basic chat working | Messages display, streaming visible |
| **Feature 2.2 Complete** | Week 2, Day 5 | Full chat interface | Persistence, formatting, file links |
| **Permissions Working** | Week 3, Day 2 | Permission system functional | Modal appears, approve/deny works |
| **Feature 2.3 Complete** | Week 3, Day 3 | Tool framework complete | Ready for Epic 3 tools |
| **Epic 2 Testing** | Week 3, Day 4-5 | Integration testing, bug fixes | All exit criteria verified |
| **Epic 2 Complete** | Week 3, Day 5 | Ready for Epic 3 | Sign-off from product owner |

### 10.3 Buffer and Contingency

- **Built-in buffer:** 2-3 days in timeline for unexpected issues
- **Learning curve:** 1-2 days allocated for AIChatSDK familiarization
- **Testing allocation:** 2 days dedicated to integration testing and bug fixes

---

## 11. Resource Requirements

### 11.1 Team

| Role | Allocation | Responsibilities |
|------|------------|------------------|
| **Full-Stack Developer (Primary)** | 100% | All features, main implementation |
| **Full-Stack Developer (Secondary)** | 50-100% | Support, parallel tasks, testing |
| **Product Owner** | 10% | Requirements clarification, acceptance |

### 11.2 Skills Required

| Skill | Requirement Level | Notes |
|-------|------------------|-------|
| React 18+ | Expert | Hooks, concurrent features, useDeferredValue |
| TypeScript strict mode | Expert | All code in TypeScript |
| Electron IPC | Proficient | Security patterns, contextBridge |
| Zustand | Proficient | State management patterns |
| AIChatSDK | Learning (1-2 days) | Can learn during Feature 2.1 |
| Async JavaScript | Expert | Promises, async/await, streaming |

### 11.3 Infrastructure

| Resource | Purpose | Status |
|----------|---------|--------|
| Development machine (macOS/Windows/Linux) | Development and testing | Available |
| Anthropic API key (test) | Development testing | Required (developer provides) |
| AIChatSDK local clone | AI integration | Available at ../AIChatSDK |

---

## 12. Compliance and Security

### 12.1 Security Requirements

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| API key encryption | Electron safeStorage | Security audit |
| API key not logged | Log filtering | Code review |
| API key not in renderer | IPC only | Architecture review |
| Secure IPC | contextBridge whitelist | Security audit |
| Input sanitization | Validate before AI | Code review |

### 12.2 SOC Traceability

| Operation | Logged Data | Log Destination |
|-----------|-------------|-----------------|
| AI request | Timestamp, message content, model | SOC via AIChatSDK |
| AI response | Timestamp, response content, tokens used | SOC via AIChatSDK |
| Tool call | Timestamp, tool name, parameters | SOC via AIChatSDK |
| Permission decision | Timestamp, tool, approve/deny, user | SOC via AIChatSDK |

### 12.3 Privacy Considerations

| Consideration | Implementation |
|---------------|----------------|
| Code sent to AI provider | Clear disclosure in UI |
| API keys | Never transmitted except to AI provider |
| Conversations | Stored locally only, never uploaded |
| SOC logs | May contain file paths and operation details |

---

## 13. Documentation Requirements

### 13.1 Technical Documentation

| Document | Owner | Due Date |
|----------|-------|----------|
| AI Service API reference | Developer | Feature 2.1 complete |
| Chat component documentation | Developer | Feature 2.2 complete |
| Tool framework developer guide | Developer | Feature 2.3 complete |
| IPC channel reference (updated) | Developer | Epic 2 complete |

### 13.2 User Documentation

| Document | Owner | Due Date |
|----------|-------|----------|
| AI setup guide (API key configuration) | Developer | Feature 2.1 complete |
| Chat interface user guide | Developer | Feature 2.2 complete |
| Permission system explanation | Developer | Feature 2.3 complete |

---

## 14. Related Documentation

### 14.1 Architecture Decision Records

| ADR | Decision | Relevance |
|-----|----------|-----------|
| [ADR-006: AIChatSDK Integration Approach](../../architecture/decisions/ADR-006-aichatsdk-integration-approach.md) | Import as local module, wrap in service layer | Feature 2.1 |
| [ADR-007: Conversation Storage Strategy](../../architecture/decisions/ADR-007-conversation-storage-strategy.md) | JSON files in Electron userData | Feature 2.2 |
| [ADR-008: Permission System UX Pattern](../../architecture/decisions/ADR-008-permission-system-ux-pattern.md) | Modal dialogs with approve/deny | Feature 2.3 |
| [ADR-009: Streaming Response Implementation](../../architecture/decisions/ADR-009-streaming-response-implementation.md) | 50ms buffering with React 18 | Feature 2.2 |

### 14.2 Related Documents

| Document | Purpose |
|----------|---------|
| [Epic 2 Plan](./epic-2-ai-integration-aichatsdk.md) | Detailed epic specification |
| [Epic 1 Plan](./epic-1-desktop-foundation.md) | Prerequisite epic (complete) |
| [Product Vision](../../architecture/_main/01-Product-Vision.md) | Product context and principles |
| [Business Requirements](../../architecture/_main/03-Business-Requirements.md) | FR-4, FR-5, FR-6, FR-9, FR-10 |
| [System Architecture](../../architecture/_main/04-Architecture.md) | Technical architecture reference |

---

## 15. Approval and Sign-Off

### 15.1 Plan Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Owner | Roy Love | Pending | |
| Technical Lead | TBD | Pending | |
| Development Team | TBD | Pending | |

### 15.2 Epic Completion Sign-Off

| Checkpoint | Criteria | Approver | Status |
|------------|----------|----------|--------|
| Feature 2.1 Complete | All acceptance criteria met | Tech Lead | Pending |
| Feature 2.2 Complete | All acceptance criteria met | Tech Lead | Pending |
| Feature 2.3 Complete | All acceptance criteria met | Tech Lead | Pending |
| Epic 2 Complete | All exit criteria met | Product Owner | Pending |

---

## Appendix A: Technical Specifications

### A.1 Conversation JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "metadata": {
      "type": "object",
      "properties": {
        "created": { "type": "string", "format": "date-time" },
        "lastModified": { "type": "string", "format": "date-time" },
        "provider": { "type": "string" },
        "model": { "type": "string" },
        "title": { "type": "string" },
        "messageCount": { "type": "integer" },
        "projectPath": { "type": "string" }
      },
      "required": ["created", "lastModified", "provider", "model"]
    },
    "messages": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "role": { "enum": ["user", "assistant"] },
          "content": { "type": "string" },
          "timestamp": { "type": "string", "format": "date-time" },
          "toolCalls": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "tool": { "type": "string" },
                "params": { "type": "object" },
                "result": {},
                "approved": { "type": "boolean" }
              }
            }
          }
        },
        "required": ["id", "role", "content", "timestamp"]
      }
    }
  },
  "required": ["id", "metadata", "messages"]
}
```

### A.2 Permission Request Schema

```typescript
interface PermissionRequest {
  id: string;                    // Unique request ID
  toolName: string;              // Tool being requested (read, write, etc.)
  operation: string;             // Human-readable operation description
  filePath?: string;             // Affected file path
  content?: string;              // Content preview (for write operations)
  riskLevel: 'low' | 'medium' | 'high';  // Risk classification
  canTrustSession: boolean;      // Whether "trust session" is allowed
}

interface PermissionResponse {
  requestId: string;
  approved: boolean;
  trustSession: boolean;         // User checked "trust this session"
  timestamp: string;
}
```

### A.3 Tool Schema Template (Phase 2 Foundation)

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      required?: boolean;
    }>;
    required: string[];
  };
  permissionRequired: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

// Example: Read tool definition (implemented in Epic 3)
const readToolDefinition: ToolDefinition = {
  name: 'read',
  description: 'Read the contents of a file',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to read'
      },
      lineStart: {
        type: 'number',
        description: 'Optional starting line number'
      },
      lineEnd: {
        type: 'number',
        description: 'Optional ending line number'
      }
    },
    required: ['path']
  },
  permissionRequired: false,  // Read operations don't require approval
  riskLevel: 'low'
};
```

---

**Document End**

*This master implementation plan provides comprehensive guidance for Epic 2 development. All team members should reference this document throughout the implementation phase.*
