# Feature 2.2: Chat Interface and Streaming

## Feature Overview
- **Feature ID:** Feature-2.2
- **Epic:** Epic 2 - AI Integration with AIChatSDK
- **Status:** Planning
- **Duration:** 2-3 waves (8 days estimated)
- **Priority:** Critical (P0)

## Implementation Scope

This Feature delivers the complete chat interface UI that enables users to have conversational interactions with AI in the Lighthouse Chat IDE. It replaces the placeholder right panel from Epic 1 with a fully functional chat experience including real-time streaming visualization, message history, markdown rendering, and conversation persistence.

**Objectives:**
- Build a professional chat interface component in the right panel
- Implement real-time streaming response visualization with 60 FPS performance
- Create message history display with clear user/AI distinction
- Enable conversation persistence across application restarts
- Provide markdown rendering with syntax highlighting for code blocks
- Implement clickable file path links that open files in the editor

## Technical Requirements

### Functional Requirements
- **FR-2.2.1:** Chat interface displays in right panel, replacing Epic 1 placeholder
- **FR-2.2.2:** Message history shows all messages in conversation with timestamps
- **FR-2.2.3:** User messages visually distinguished from AI messages (different styling/colors)
- **FR-2.2.4:** Text input field accepts user messages with Enter key or button submission
- **FR-2.2.5:** AI responses stream in real-time as tokens are generated (not after completion)
- **FR-2.2.6:** Streaming indicator (blinking cursor) visible while AI is responding
- **FR-2.2.7:** Markdown content renders with proper formatting (headers, lists, emphasis)
- **FR-2.2.8:** Code blocks display with syntax highlighting appropriate to language
- **FR-2.2.9:** File paths in AI responses are highlighted and clickable
- **FR-2.2.10:** Clicking file path opens the file in Monaco editor (center panel)
- **FR-2.2.11:** Auto-scroll to latest message during streaming (smooth scroll)
- **FR-2.2.12:** User can scroll up to read older messages while streaming continues
- **FR-2.2.13:** "Scroll to bottom" button appears when user scrolls up during streaming
- **FR-2.2.14:** Conversation persists to local storage (survives app restart)
- **FR-2.2.15:** New conversation can be started (clears current conversation)
- **FR-2.2.16:** Cancel button to stop AI response generation mid-stream

### Non-Functional Requirements
- **Performance:**
  - Streaming response start time: < 2 seconds from message send
  - UI frame rate during streaming: 60 FPS (< 16ms frame time)
  - Token rendering rate: 50+ tokens/second without jank
  - Message history scroll: smooth at 60 FPS with 1000+ messages
  - Conversation load time: < 100ms for typical conversations (< 500 messages)
  - Memory usage during long conversation: < 600MB total application

- **Security:**
  - No API keys exposed in renderer process
  - Input sanitization before sending to AI
  - No XSS vulnerabilities in markdown rendering
  - Conversation files stored with appropriate permissions

- **Scalability:**
  - Handle conversations with 1000+ messages
  - Support responses up to 10,000 tokens
  - Multiple conversations stored simultaneously

- **Reliability:**
  - Graceful handling of streaming interruptions
  - Auto-save conversation after each AI response
  - Atomic file writes to prevent corruption
  - Recovery from partial saves on app crash

### Technical Constraints
- Must use React 18+ concurrent features (useDeferredValue)
- Must integrate with AIChatSDK streaming API from Feature 2.1
- Must use Zustand for state management (consistent with Epic 1)
- Must use IPC for all main process communication
- Must store conversations in Electron userData directory
- Must follow 50ms token buffering pattern per ADR-009

## Dependencies

**Prerequisites (must complete before this Feature):**
- **Feature 2.1 (AIChatSDK Integration):** Complete and verified
  - Working AIService with streaming capability
  - IPC channels for AI communication (`ai:send-message`, `ai:stream-message`, `ai:cancel`)
  - Error handling for AI communication failures
  - SOC logging integration
- **Epic 1 (Desktop Foundation):** Complete
  - Three-panel layout functional
  - Monaco editor integration (for file link navigation)
  - IPC communication layer established
  - Zustand store patterns established

**Enables (this Feature enables):**
- Feature 2.3 (Tool Framework and Permissions) - requires conversation context
- Epic 3 (File Operation Tools) - tools display results in chat interface
- Epic 4 (Advanced Features) - conversation search, filtering, management

**External Dependencies:**
- **react-markdown:** Markdown rendering library (pnpm add react-markdown)
- **remark-gfm:** GitHub Flavored Markdown support (pnpm add remark-gfm)
- **react-syntax-highlighter:** Code block syntax highlighting (pnpm add react-syntax-highlighter)
- **uuid:** Unique ID generation for messages/conversations (pnpm add uuid)

## Logical Unit Tests

Unit tests validate the chat interface components and state management work correctly in isolation.

**Test Cases:**

1. **ChatStore Message Management**
   - Adding user message updates messages array with correct role and timestamp
   - Adding AI message updates messages array with assistant role
   - Clearing conversation resets messages array to empty
   - Loading conversation populates messages array from JSON

2. **ChatStore Streaming State**
   - Starting stream sets isStreaming to true
   - Updating streaming message appends tokens to current message content
   - Completing stream sets isStreaming to false and finalizes message
   - Canceling stream sets isStreaming to false and marks message as incomplete

3. **Conversation Persistence (via IPC mock)**
   - Save conversation creates valid JSON file with correct schema
   - Load conversation returns messages array from JSON file
   - Save after each AI response triggers with debounce (max 1/second)
   - Atomic write uses temp file then rename

4. **Message Rendering**
   - User messages render with user styling class
   - AI messages render with assistant styling class
   - Timestamps display in human-readable format
   - Long messages do not break layout

5. **Markdown Rendering**
   - Headers render with correct hierarchy (h1-h6)
   - Code blocks render with syntax highlighting
   - Inline code renders with monospace styling
   - Lists render with proper indentation
   - Links render as clickable anchors

6. **File Path Detection**
   - Absolute paths (e.g., `/src/index.ts`) are detected
   - Relative paths (e.g., `./components/App.tsx`) are detected
   - Paths with spaces handled correctly
   - Non-path text not incorrectly identified as paths

## Testing Strategy and Acceptance Criteria

### Testing Strategy

- **Unit Tests:** Jest for ChatStore, ConversationStorage, message utilities
  - Mock IPC communication
  - Mock AIChatSDK streaming
  - Test state transitions and edge cases
  - Target: 80% code coverage for services and stores

- **Integration Tests:** React Testing Library for component integration
  - ChatInterface with ChatStore integration
  - Message rendering with markdown content
  - File link clicking triggers editor open
  - IPC communication with main process handlers

- **End-to-End Tests:** Playwright/Electron testing
  - Complete conversation flow (send message, receive streaming response)
  - Conversation persistence (restart app, verify message recovery)
  - File link navigation (click path, verify editor opens)
  - Error handling (simulate API error, verify graceful degradation)

- **Performance Tests:** Chrome DevTools Profiler
  - Frame rate during streaming (target: 60 FPS)
  - Memory usage during long conversation (target: < 600MB)
  - Streaming start latency (target: < 2 seconds)
  - Custom timing for token render rate

### Acceptance Criteria

- [ ] Chat interface displays in right panel (replacing placeholder)
- [ ] Message history shows user and AI messages with distinct styling
- [ ] User can type messages and send via Enter key or button
- [ ] AI responses stream in real-time (tokens appear as generated)
- [ ] Streaming indicator (cursor) visible while AI is responding
- [ ] Streaming response starts within 2 seconds of message send
- [ ] UI maintains 60 FPS during streaming (no jank or stuttering)
- [ ] Code blocks have syntax highlighting for common languages
- [ ] File paths are highlighted and clickable
- [ ] Clicking file path opens file in Monaco editor
- [ ] Auto-scroll to latest message during streaming
- [ ] User can scroll up during streaming without being forced down
- [ ] "Scroll to bottom" button appears when scrolled up during stream
- [ ] Conversation persists across application restarts
- [ ] Can start new conversation (clears current)
- [ ] Can cancel streaming response mid-generation
- [ ] All tests passing with 80% code coverage
- [ ] Security scan passed (no XSS vulnerabilities)
- [ ] Documentation updated

## Integration Points

### Integration with Other Features

- **Feature 2.1 (AIChatSDK Integration):**
  - Consumes AIService for sending messages and receiving streams
  - Uses IPC channels: `ai:send-message`, `ai:stream-message`, `ai:cancel`
  - Handles error events from AI communication failures
  - Receives streaming tokens via AsyncIterator pattern

- **Feature 2.3 (Tool Framework):**
  - Chat interface displays tool execution requests
  - Tool results appear as part of AI message content
  - Permission prompts triggered from chat context
  - Tool call metadata stored in conversation JSON

### Integration with Epic 1 Components

- **Monaco Editor (EditorStore):**
  - File link clicks trigger `openFile` action in EditorStore
  - Reuse existing file opening logic and tab management
  - No changes needed to Monaco integration

- **Three-Panel Layout:**
  - ChatInterface component mounts in right panel container
  - Respects existing panel sizing and resizing
  - No changes needed to layout system

- **IPC Layer:**
  - Add new channels for conversation storage operations
  - Extend existing IPC security whitelist
  - Follow established contextBridge patterns

### External Integrations

- **AIChatSDK:**
  - Streaming token delivery via AsyncIterator
  - Message format compatible with AIChatSDK conversation structure
  - SOC logging automatic via AIChatSDK (no additional integration)

- **File System (via IPC):**
  - Conversation JSON files in `app.getPath('userData')/conversations/`
  - Read/write operations through main process handlers
  - Atomic writes with temp file pattern

## Implementation Phases

### Wave 2.2.1: Core Chat UI and State Management
**Scope:** Build the foundational chat interface components and state management layer

**Deliverables:**
- ChatInterface React component with message list and input area
- ChatStore (Zustand) with message state management
- Message rendering with user/AI distinction
- Text input with send functionality (Enter key and button)
- Basic message styling with TailwindCSS
- Integration with Feature 2.1 AIService for sending messages
- IPC handlers for chat operations

**Key Tasks:**
1. Create ChatInterface component structure
2. Implement ChatStore with Zustand (messages, sendMessage, addMessage)
3. Build MessageList component with user/AI styling
4. Build MessageInput component with send functionality
5. Connect ChatInterface to AIService via IPC
6. Implement basic message display without streaming
7. Unit tests for ChatStore state transitions
8. Integration tests for message send/receive flow

**Acceptance Criteria (Wave 2.2.1):**
- [ ] ChatInterface renders in right panel
- [ ] User can type and send messages
- [ ] Messages display with user/AI distinction
- [ ] Messages sent to AI via Feature 2.1 integration
- [ ] Non-streaming responses display correctly
- [ ] Unit tests passing for ChatStore

**Estimated Effort:** 3 days

---

### Wave 2.2.2: Streaming Visualization and Performance
**Scope:** Implement real-time streaming response rendering with 60 FPS performance

**Deliverables:**
- StreamingMessage component with token buffering
- requestAnimationFrame-based rendering (50ms batching)
- React 18 useDeferredValue for markdown parsing
- Streaming cursor indicator
- Auto-scroll during streaming
- "Scroll to bottom" button when user scrolls up
- Cancel streaming functionality
- Performance monitoring and optimization

**Key Technical Implementation (per ADR-009):**
```typescript
// 50ms token buffering with requestAnimationFrame
function StreamingMessage({ messageId }: Props) {
  const [tokens, setTokens] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const deferredTokens = useDeferredValue(tokens);

  useEffect(() => {
    const stream = aiService.streamMessage(messageId);
    let buffer = '';
    let rafId: number;

    async function processStream() {
      for await (const token of stream) {
        buffer += token;
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            setTokens(buffer);
            rafId = 0;
          });
        }
      }
      setTokens(buffer);
      setIsComplete(true);
    }

    processStream();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [messageId]);

  return (
    <MessageContainer>
      <Markdown content={deferredTokens} />
      {!isComplete && <StreamingCursor />}
    </MessageContainer>
  );
}
```

**Key Tasks:**
1. Implement StreamingMessage component with token buffering
2. Integrate useDeferredValue for markdown rendering
3. Build StreamingCursor component (blinking indicator)
4. Implement auto-scroll behavior with IntersectionObserver
5. Add "scroll to bottom" button logic
6. Implement cancel streaming via IPC
7. Performance testing with Chrome DevTools
8. Optimize to achieve 60 FPS target

**Acceptance Criteria (Wave 2.2.2):**
- [ ] Streaming tokens appear in real-time (< 2s start)
- [ ] UI maintains 60 FPS during streaming
- [ ] Streaming cursor visible during response
- [ ] Auto-scroll follows streaming content
- [ ] User can scroll up without being forced down
- [ ] "Scroll to bottom" appears when scrolled up
- [ ] Cancel button stops streaming mid-generation
- [ ] Performance tests passing

**Estimated Effort:** 3 days

---

### Wave 2.2.3: Markdown Rendering and File Links
**Scope:** Implement rich message formatting with markdown and interactive file paths

**Deliverables:**
- Markdown rendering with react-markdown
- Syntax highlighting for code blocks (react-syntax-highlighter)
- GitHub Flavored Markdown support (remark-gfm)
- File path detection and highlighting
- Clickable file links that open in editor
- XSS security validation for rendered content

**Key Tasks:**
1. Integrate react-markdown with remark-gfm
2. Configure react-syntax-highlighter for code blocks
3. Build custom renderer for file path detection
4. Implement file path click handler (triggers EditorStore.openFile)
5. Style code blocks with syntax highlighting themes
6. Security audit for XSS vulnerabilities
7. Unit tests for file path detection regex
8. Integration tests for file link navigation

**File Path Detection Pattern:**
```typescript
// Detect common file path patterns in AI responses
const FILE_PATH_PATTERN = /(?:^|\s)((?:\.{0,2}\/)?(?:[\w.-]+\/)*[\w.-]+\.[a-zA-Z0-9]+)(?:\s|$|:|,)/g;

function FilePathLink({ path, onClick }: Props) {
  const handleClick = () => {
    // Trigger EditorStore.openFile via IPC
    window.electron.openFile(path);
    onClick?.();
  };

  return (
    <span
      className="file-link cursor-pointer text-blue-500 hover:underline"
      onClick={handleClick}
    >
      {path}
    </span>
  );
}
```

**Acceptance Criteria (Wave 2.2.3):**
- [ ] Markdown renders with proper formatting
- [ ] Code blocks have syntax highlighting
- [ ] File paths are detected and highlighted
- [ ] Clicking file path opens file in editor
- [ ] No XSS vulnerabilities in markdown rendering
- [ ] Unit tests for file path detection
- [ ] Integration tests for editor navigation

**Estimated Effort:** 2 days

---

### Wave 2.2.4: Conversation Persistence
**Scope:** Implement conversation save/load for persistence across app restarts

**Deliverables:**
- ConversationStorage service (main process)
- IPC handlers for save/load/list operations
- Auto-save after each AI response (debounced)
- Atomic writes with temp file pattern
- Load conversation on app startup
- New conversation creation
- Conversation JSON schema implementation

**Storage Structure (per ADR-007):**
```
{app.getPath('userData')}/conversations/
  |- {uuid}.json (individual conversations)
  |- metadata.json (conversation index)
```

**Conversation JSON Schema:**
```typescript
interface Conversation {
  id: string;  // UUID
  metadata: {
    created: string;  // ISO 8601 timestamp
    lastModified: string;
    provider: string;
    model: string;
    title: string;  // Auto-generated from first message
    messageCount: number;
    projectPath?: string;
  };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    toolCalls?: Array<{
      id: string;
      tool: string;
      params: unknown;
      result?: unknown;
      approved?: boolean;
    }>;
  }>;
}
```

**Key Tasks:**
1. Create ConversationStorage service in main process
2. Implement save operation with atomic writes
3. Implement load operation with error handling
4. Implement list operation for conversation index
5. Add IPC handlers: `conversation:save`, `conversation:load`, `conversation:list`
6. Implement auto-save after AI response (debounced 1s)
7. Load last conversation on app startup
8. Add "New Conversation" button and handler
9. Unit tests for storage operations
10. Integration tests for persistence across restart

**Acceptance Criteria (Wave 2.2.4):**
- [ ] Conversations save to JSON files automatically
- [ ] Conversations load on app startup
- [ ] Atomic writes prevent corruption
- [ ] "New Conversation" clears current and starts fresh
- [ ] Conversation survives app restart
- [ ] Error handling for corrupted files
- [ ] Unit tests for ConversationStorage
- [ ] Integration test for restart persistence

**Estimated Effort:** 2 days (can overlap with Wave 2.2.3)

## Architecture and Design

### Component Architecture

```
ChatInterface (Right Panel)
├── ChatHeader
│   ├── ConversationTitle
│   └── NewConversationButton
├── MessageList
│   ├── Message (user) [multiple]
│   │   └── MessageContent
│   ├── Message (assistant) [multiple]
│   │   ├── StreamingMessage (if streaming)
│   │   │   ├── Markdown
│   │   │   │   ├── CodeBlock (syntax highlighted)
│   │   │   │   └── FilePathLink (clickable)
│   │   │   └── StreamingCursor
│   │   └── MessageContent (if complete)
│   │       └── Markdown
│   └── ScrollToBottomButton (conditional)
└── MessageInput
    ├── TextArea
    ├── SendButton
    └── CancelButton (conditional, during streaming)
```

### State Management (ChatStore)

```typescript
// src/stores/chatStore.ts
interface ChatState {
  // Conversation data
  currentConversationId: string | null;
  messages: ChatMessage[];

  // Streaming state
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingContent: string;

  // UI state
  inputValue: string;
  isScrolledToBottom: boolean;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateStreamingContent: (content: string) => void;
  completeStreaming: () => void;
  cancelStreaming: () => void;
  clearConversation: () => void;
  loadConversation: (id: string) => Promise<void>;
  setInputValue: (value: string) => void;
  setScrolledToBottom: (value: boolean) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}
```

### IPC Channel Additions

```typescript
// New IPC channels for Feature 2.2
export const IPC_CHANNELS = {
  // ... existing channels from Epic 1 and Feature 2.1

  // Conversation Storage (Feature 2.2)
  CONVERSATION_SAVE: 'conversation:save',
  CONVERSATION_LOAD: 'conversation:load',
  CONVERSATION_LIST: 'conversation:list',
  CONVERSATION_DELETE: 'conversation:delete',
  CONVERSATION_NEW: 'conversation:new',
};
```

### Data Flow

```
User Input Flow:
1. User types in MessageInput
2. User presses Enter or clicks Send
3. ChatStore.sendMessage() called
4. Message added to ChatStore.messages (role: user)
5. IPC call to main process: ai:send-message
6. AIService sends message via AIChatSDK
7. Streaming tokens arrive via ai:stream-message events
8. ChatStore.updateStreamingContent() called per token batch
9. StreamingMessage component renders tokens
10. On stream complete, ChatStore.completeStreaming() called
11. Auto-save triggers via IPC: conversation:save

File Link Click Flow:
1. User clicks file path in rendered markdown
2. FilePathLink onClick handler fires
3. IPC call to main process: file:open
4. Main process sends to renderer: EditorStore.openFile()
5. Monaco editor opens file in center panel
```

## Security Considerations

- **XSS Prevention:** Use react-markdown with sanitization; disable dangerous HTML; validate file paths before opening
- **Input Sanitization:** Validate user input before sending to AI; prevent prompt injection where possible
- **IPC Security:** Whitelist only required channels in contextBridge; validate all IPC parameters
- **File Path Validation:** Validate file paths are within project directory before opening; prevent path traversal attacks
- **Conversation Data:** Store locally only; no cloud uploads; respect user data ownership
- **API Keys:** Never expose in renderer process; all AI communication through main process IPC

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Streaming causes UI jank | Medium | Medium | 50ms buffering per ADR-009; useDeferredValue; performance testing throughout development |
| Markdown rendering XSS vulnerability | High | Low | Use react-markdown default sanitization; security audit; no dangerouslySetInnerHTML |
| Large conversations slow to load | Medium | Low | Lazy loading for messages > 500; pagination for very old messages; monitor file sizes |
| Conversation file corruption | High | Low | Atomic writes with temp file + rename; error handling for corrupted files; consider backup copy |
| File path detection false positives | Low | Medium | Refine regex pattern; add heuristics (file must exist); user can report misdetections |
| Memory leak during long streaming | Medium | Low | Clean up event listeners; use AbortController; monitor memory in development |

## Definition of Done

- [ ] All functional requirements (FR-2.2.1 through FR-2.2.16) implemented
- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing (80% coverage for ChatStore, ConversationStorage)
- [ ] Integration tests written and passing
- [ ] Performance targets achieved:
  - [ ] Streaming start < 2 seconds
  - [ ] 60 FPS during streaming
  - [ ] < 100ms conversation load time
- [ ] Code reviewed and approved
- [ ] Security scan passed (no XSS vulnerabilities)
- [ ] Documentation updated:
  - [ ] Component documentation
  - [ ] IPC channel reference updated
  - [ ] User guide for chat interface
- [ ] Feature deployed to development environment
- [ ] Manual testing completed by development team

## Related Documentation

- **Epic Plan:** [Epic 2 Master Plan](./epic-2-ai-integration-master-plan.md)
- **Epic Detailed Plan:** [Epic 2 AI Integration](./epic-2-ai-integration-aichatsdk.md)
- **Product Requirements:** [Business Requirements](../../architecture/_main/03-Business-Requirements.md) (FR-4, FR-5)
- **Architecture:** [System Architecture](../../architecture/_main/04-Architecture.md)
- **Feature 2.1 (Prerequisite):** [Feature 2.1 Plan](./feature-2.1-aichatsdk-integration.md)

## Architecture Decision Records (ADRs)

- **[ADR-007: Conversation Storage Strategy](../../architecture/decisions/ADR-007-conversation-storage-strategy.md)**
  - Defines JSON files in Electron userData directory
  - Specifies conversation JSON schema
  - Defines auto-save and atomic write patterns

- **[ADR-009: Streaming Response Implementation](../../architecture/decisions/ADR-009-streaming-response-implementation.md)**
  - Specifies 50ms token buffering with requestAnimationFrame
  - Mandates React 18 useDeferredValue for markdown rendering
  - Defines 60 FPS performance target
  - Provides reference implementation code

---

**Template Version:** 1.0
**Created:** 2026-01-19
**Last Updated:** 2026-01-19
