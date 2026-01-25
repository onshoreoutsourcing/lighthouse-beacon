# Feature 10.4: Chat Integration & Source Citations

## Feature Overview
- **Feature ID:** Feature-10.4
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Planning
- **Duration:** 2 waves, 2 weeks
- **Priority:** High (User-facing RAG integration)

## Implementation Scope

Feature 10.4 integrates the RAG Knowledge Base into the Chat Interface, making context-aware AI responses available to users. This includes a RAG toggle button, automatic context retrieval when RAG is enabled, source citation display in chat messages, and click-to-open functionality for source files.

**Objectives:**
- Add RAG toggle button to Chat Interface with document count indicator
- Automatically retrieve context when RAG enabled and user sends message
- Display source citations below AI responses in collapsible section
- Enable click-to-open for source citations (opens file at specific line)
- Show RAG status indicator during message processing
- Gracefully fallback to standard chat when retrieval fails
- Integrate with existing chat streaming without blocking

## Technical Requirements

### Functional Requirements
- **FR-10.4.1**: RAG toggle button visible in Chat Interface toolbar
- **FR-10.4.2**: Toggle shows document count when documents indexed (e.g., "RAG (42 docs)")
- **FR-10.4.3**: Toggle disabled when no documents indexed with tooltip explanation
- **FR-10.4.4**: Automatic context retrieval when RAG enabled and user sends message
- **FR-10.4.5**: Source citations displayed below AI responses in collapsible section
- **FR-10.4.6**: Each source citation shows file path, line range, and relevance score
- **FR-10.4.7**: Click source citation opens file in editor at specified line
- **FR-10.4.8**: RAG status indicator during context retrieval (e.g., "Searching knowledge base...")
- **FR-10.4.9**: Graceful fallback when retrieval fails (proceed with standard chat, show warning)
- **FR-10.4.10**: RAG toggle state persists per project in Zustand store

### Non-Functional Requirements
- **Performance:**
  - RAG toggle responds within 50ms
  - Context retrieval doesn't block AI streaming (parallel operations)
  - Source citations render within 100ms
  - Click-to-open file loads within 500ms

- **Usability:**
  - RAG toggle clearly indicates enabled/disabled state
  - Source citations easy to identify and expand/collapse
  - Click target for source citations large enough (minimum 44x44px)
  - Clear visual feedback during context retrieval
  - Error messages provide actionable guidance

- **Accessibility:**
  - RAG toggle has ARIA label and role
  - Source citations keyboard accessible (Tab navigation)
  - Screen reader announces RAG status changes
  - High contrast mode support for toggle and citations

- **Reliability:**
  - RAG failures don't crash chat
  - Source citations always match actual retrieved context
  - File paths validated before opening
  - State persistence reliable across restarts

### Technical Constraints
- Must integrate with existing Chat Interface (Epic 2)
- Must respect streaming architecture (ADR-009)
- Must work with all AI providers (Claude, GPT, Gemini, Ollama)
- Must not block message sending or streaming
- Must follow Zustand patterns (ADR-003)

## Dependencies

**Prerequisites (must complete before this Feature):**
- ✅ Feature 10.2: Knowledge Base UI (RAG toggle component pattern, useKnowledgeStore)
- ✅ Feature 10.3: RAG Pipeline (context retrieval backend)
- ✅ Epic 2: AI Integration (Chat Interface, AIService)
- ✅ Epic 4: Code Editor (Editor store for opening files at line numbers)

**Enables (this Feature enables):**
- End-to-end RAG experience for users
- Context-aware AI responses with source transparency
- Complete Epic 10 - RAG Knowledge Base

**External Dependencies:**
- **Feature 10.3 RAGService**: Context retrieval and prompt augmentation
- **Feature 10.2 useKnowledgeStore**: RAG toggle state, document count
- **Chat Interface**: Existing chat UI components
- **Editor Store**: Opening files at specific lines

## Logical Unit Tests

Unit tests will render chat components and verify RAG integration:

**Test Cases:**
1. **Test: RAG Toggle Visibility**
   - Render Chat Interface
   - Verify RAG toggle button visible in toolbar
   - Verify toggle shows correct initial state (OFF by default)

2. **Test: RAG Toggle with No Documents**
   - Set document count to 0
   - Render RAG toggle
   - Verify toggle disabled
   - Verify tooltip says "Add documents to Knowledge Base first"

3. **Test: RAG Toggle with Documents**
   - Set document count to 15
   - Render RAG toggle
   - Verify toggle enabled
   - Verify label shows "(15 docs)"
   - Click toggle
   - Verify state changes to ON

4. **Test: Context Retrieval on Message Send**
   - Enable RAG toggle
   - Send message "How does authentication work?"
   - Verify IPC call made to rag:retrieve-context
   - Verify status indicator shows "Searching knowledge base..."
   - Verify AI message sent with augmented prompt

5. **Test: Source Citations Display**
   - Receive AI response with 3 sources
   - Verify source citations section appears below response
   - Verify header shows "3 sources"
   - Verify section initially collapsed
   - Click header to expand
   - Verify 3 source citations displayed

6. **Test: Source Citation Click-to-Open**
   - Render source citation for "src/auth/validator.ts:45-67"
   - Click citation
   - Verify IPC call to open file
   - Verify file opens in editor at line 45

7. **Test: Graceful Fallback**
   - Enable RAG, send message
   - Mock retrieval failure
   - Verify warning message shown
   - Verify AI message proceeds without RAG augmentation
   - Verify no crash, chat still functional

8. **Test: RAG Status Indicator**
   - Enable RAG, send message
   - Verify status indicator appears with spinner
   - Mock retrieval completion
   - Verify status indicator disappears

9. **Test: Toggle State Persistence**
   - Enable RAG toggle
   - Reload application
   - Verify RAG toggle still enabled (persisted)

10. **Test: Streaming Not Blocked**
    - Enable RAG, send message
    - Verify context retrieval happens in parallel with AI streaming
    - Verify tokens stream while context retrieved
    - Verify no noticeable delay

## Testing Strategy and Acceptance Criteria

### Testing Strategy
- **Unit Tests:**
  - `RAGToggle.test.tsx`: Toggle rendering, state changes, document count
  - `SourceCitations.test.tsx`: Citations display, expand/collapse
  - `SourceCitationItem.test.tsx`: Individual citation, click-to-open
  - `useChatRAG.test.ts`: RAG-augmented chat hook logic

- **Integration Tests:**
  - End-to-end: Toggle RAG → Send message → Receive response with sources → Click source → File opens
  - Fallback test: RAG failure → Warning shown → Chat continues normally
  - Cross-provider test: RAG works with Claude, GPT, Gemini, Ollama

- **Accessibility Tests:**
  - Keyboard navigation through toggle and citations
  - Screen reader announcements
  - ARIA labels verification

- **Performance Tests:**
  - Measure RAG overhead on message sending (target < 200ms)
  - Verify streaming not delayed by context retrieval
  - Measure citation rendering time (target < 100ms)

### Acceptance Criteria
- [ ] RAG toggle visible in Chat Interface toolbar
- [ ] Toggle shows document count when documents indexed
- [ ] Toggle disabled with tooltip when no documents
- [ ] Context retrieval automatic when RAG enabled
- [ ] Status indicator shows during context retrieval
- [ ] Source citations displayed below AI responses
- [ ] Citations show file path, line range, relevance score
- [ ] Citations collapsible/expandable
- [ ] Click citation opens file at correct line in editor
- [ ] Graceful fallback when retrieval fails (warning, chat continues)
- [ ] RAG toggle state persists per project
- [ ] AI streaming not blocked by context retrieval
- [ ] All unit tests passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Accessibility audit passed (WCAG 2.1 Level AA)
- [ ] Performance benchmarks met
- [ ] Cross-provider testing passed
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Integration Points

### Integration with Other Features
- **Feature 10.2 (Knowledge Base UI):** Shares RAG toggle component pattern, useKnowledgeStore
- **Feature 10.3 (RAG Pipeline):** Uses RAGService for context retrieval and prompt augmentation

### Integration with Other Epics
- **Epic 2 (AI Integration):** Extends Chat Interface with RAG functionality
- **Epic 4 (Code Editor):** Uses Editor store to open files at specific lines

### External Integrations
- **Chat Interface**: Existing chat UI components
- **Editor Store**: Opening files at line numbers
- **IPC Bridge**: Communication with RAGService in main process

## Implementation Phases

### Wave 10.4.1: RAG Toggle & Context Retrieval Integration
- Create RAGToggle component with document count
- Implement useChatRAG hook for RAG-augmented message flow
- Add context retrieval on message send when RAG enabled
- Implement RAG status indicator during retrieval
- Integrate with existing chat streaming (non-blocking)
- Write unit tests for toggle and hook
- **Deliverables:** RAGToggle.tsx, useChatRAG.ts, status indicator, tests

### Wave 10.4.2: Source Citations & Click-to-Open
- Create SourceCitations component (collapsible list)
- Create SourceCitationItem component with click handler
- Integrate with Editor store for file opening
- Add graceful fallback for retrieval errors
- Implement source citation rendering in chat messages
- Write unit and integration tests
- **Deliverables:** SourceCitations.tsx, SourceCitationItem.tsx, integration, tests

## Architecture and Design

### Component Architecture

```
src/renderer/components/chat/
├── ChatInterface.tsx          # Existing - extended with RAG toggle
├── RAGToggle.tsx              # NEW - Toggle button with doc count
├── RAGStatusIndicator.tsx     # NEW - "Searching knowledge base..."
├── SourceCitations.tsx        # NEW - Collapsible source list
├── SourceCitationItem.tsx     # NEW - Individual source with click
└── __tests__/                 # Component tests

src/renderer/hooks/
└── useChatRAG.ts              # NEW - Hook for RAG-augmented chat

src/renderer/components/chat/MessageList.tsx  # Extended to show sources
```

**Component Hierarchy:**

```
ChatInterface (existing, extended)
├── ChatToolbar
│   ├── Existing buttons
│   └── RAGToggle ← NEW
│       ├── SearchIcon
│       ├── "Knowledge Base" label
│       └── Document count badge
├── MessageList
│   └── ChatMessage[]
│       ├── Message content
│       └── SourceCitations ← NEW (if message has sources)
│           ├── Header (collapsible)
│           │   ├── DocumentIcon
│           │   ├── "N sources"
│           │   └── ChevronIcon
│           └── SourceCitationItem[] (when expanded)
│               ├── FileIcon
│               ├── File path
│               ├── Line range
│               └── Relevance %
└── MessageInput
    └── RAGStatusIndicator ← NEW (conditional)
```

### Data Model

**ChatMessage Extended:**
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceAttribution[];  // NEW - RAG sources
  ragMetadata?: RAGMetadata;      // NEW - RAG metrics
}
```

**RAGMetadata:**
```typescript
interface RAGMetadata {
  ragEnabled: true;
  chunksRetrieved: number;
  tokensUsed: number;
  retrievalTimeMs: number;
}
```

**SourceAttribution** (from Feature 10.3):
```typescript
interface SourceAttribution {
  filePath: string;
  relativePath: string;
  startLine: number;
  endLine: number;
  relevanceScore: number;
  chunkText: string;
}
```

### UI Design

**RAG Toggle States:**

```typescript
// Disabled (no documents)
<button className="rag-toggle disabled" disabled title="Add documents to Knowledge Base first">
  <SearchIcon className="opacity-50" />
  <span>Knowledge Base</span>
</button>

// Enabled, OFF
<button className="rag-toggle" onClick={toggleRag}>
  <SearchIcon />
  <span>Knowledge Base</span>
  <span className="doc-count">(15 docs)</span>
</button>

// Enabled, ON (active state)
<button className="rag-toggle active" onClick={toggleRag}>
  <SearchIcon className="text-blue-500" />
  <span>Knowledge Base</span>
  <span className="doc-count text-blue-500">(15 docs)</span>
</button>
```

**Source Citations:**

```typescript
// Collapsed (default)
<div className="source-citations">
  <button className="sources-header" onClick={toggleExpand}>
    <DocumentIcon />
    <span>3 sources</span>
    <ChevronRight />
  </button>
</div>

// Expanded
<div className="source-citations expanded">
  <button className="sources-header" onClick={toggleExpand}>
    <DocumentIcon />
    <span>3 sources</span>
    <ChevronDown />
  </button>
  <div className="sources-list">
    <SourceCitationItem source={source1} />
    <SourceCitationItem source={source2} />
    <SourceCitationItem source={source3} />
  </div>
</div>

// Individual source
<button className="source-item" onClick={handleClick}>
  <FileIcon />
  <span className="source-path">src/auth/validator.ts</span>
  <span className="source-lines">L45-67</span>
  <span className="source-relevance">87%</span>
</button>
```

### Chat Flow with RAG

**Standard Chat Flow (RAG OFF):**
```
User types message → Click send → AI processes → Stream response → Display
```

**RAG-Augmented Chat Flow (RAG ON):**
```
User types message
  ↓
Click send
  ↓
Show "Searching knowledge base..." indicator
  ↓
Retrieve context (parallel)    +    AI processes (parallel)
  ↓                                     ↓
Context retrieved                   Stream starts
  ↓                                     ↓
Augment prompt                      Continue streaming
  ↓                                     ↓
Hide status indicator               Display response
  ↓                                     ↓
                Display source citations below response
```

**Key Implementation Detail:** Context retrieval happens in parallel with AI streaming to avoid delaying the response. The augmented prompt is sent as the initial system prompt, so streaming begins immediately.

### Integration with Existing Chat

**ChatInterface.tsx Extended:**

```typescript
export const ChatInterface: React.FC = () => {
  const { messages, sendMessage, isStreaming } = useChatStore();
  const { ragEnabled, toggleRag } = useKnowledgeStore();
  const { sendMessageWithRAG } = useChatRAG();

  const handleSendMessage = async (message: string) => {
    if (ragEnabled) {
      // RAG-augmented flow
      await sendMessageWithRAG(message);
    } else {
      // Standard flow
      await sendMessage(message);
    }
  };

  return (
    <div className="chat-interface">
      <ChatToolbar>
        {/* Existing toolbar items */}
        <RAGToggle />
      </ChatToolbar>

      <MessageList messages={messages} />

      <MessageInput onSend={handleSendMessage} isDisabled={isStreaming} />
    </div>
  );
};
```

**useChatRAG Hook:**

```typescript
export const useChatRAG = () => {
  const { ragEnabled } = useKnowledgeStore();
  const { sendMessage: originalSendMessage, addMessage } = useChatStore();

  const sendMessageWithRAG = async (message: string): Promise<void> => {
    if (!ragEnabled) {
      return originalSendMessage(message);
    }

    try {
      // Show status indicator
      setRAGStatus('Searching knowledge base...');

      // Retrieve context (non-blocking)
      const context = await window.electronAPI.rag.retrieveContext(message);

      // Hide status indicator
      setRAGStatus(null);

      // Send message with RAG context
      const response = await window.electronAPI.ai.sendMessageRAG({
        message,
        context: context.contextText,
        sources: context.sources
      });

      // Add assistant message with sources
      addMessage({
        role: 'assistant',
        content: response.content,
        sources: context.sources,
        ragMetadata: {
          ragEnabled: true,
          chunksRetrieved: context.chunks.length,
          tokensUsed: context.tokensUsed,
          retrievalTimeMs: response.retrievalTime
        }
      });

    } catch (error) {
      // Graceful fallback
      console.warn('RAG retrieval failed, falling back to standard chat:', error);
      showWarning('Could not retrieve knowledge base context. Proceeding with standard chat.');
      await originalSendMessage(message);
    }
  };

  return {
    sendMessageWithRAG,
    ragEnabled
  };
};
```

## Security Considerations

- **Path Validation**: File paths from citations validated before opening (existing PathValidator)
- **Source Attribution Accuracy**: Sources match actual retrieved chunks (verified in Feature 10.3)
- **No Data Leakage**: Citations only show code chunks user already has access to
- **XSS Prevention**: Source citations sanitized before rendering (React escaping)
- **Click-jacking**: Click handlers validate source of event

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| RAG overhead delays responses | High | Medium | Parallel retrieval and streaming; measure latency; optimize if needed |
| Users confused by source citations | Medium | Medium | Clear UI design; tooltips; user guide; onboarding |
| Click-to-open fails for edge cases | Medium | Low | Robust path validation; error handling; clear error messages |
| RAG toggle state not persisting | Low | Low | Extensive persistence testing; fallback to OFF if load fails |
| Source citations clutter UI | Medium | Low | Default to collapsed; only show when relevant; user can hide |
| Context retrieval fails silently | High | Low | Graceful fallback; show warning; log error; continue with standard chat |

## Definition of Done

- [ ] RAG toggle component created and integrated into Chat Interface
- [ ] Toggle shows document count when documents indexed
- [ ] Toggle disabled with tooltip when no documents
- [ ] Context retrieval automatic when RAG enabled
- [ ] RAG status indicator shows during retrieval
- [ ] Source citations component created
- [ ] Citations display below AI responses
- [ ] Citations collapsible/expandable
- [ ] Citations show file path, line range, relevance score
- [ ] Click citation opens file at correct line in editor
- [ ] Graceful fallback when retrieval fails
- [ ] Warning message shown on retrieval failure
- [ ] RAG toggle state persists per project
- [ ] AI streaming not blocked by context retrieval
- [ ] All unit tests written and passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Accessibility audit passed (WCAG 2.1 Level AA)
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility verified
- [ ] Performance benchmarks met (RAG overhead < 200ms)
- [ ] Cross-provider testing passed (Claude, GPT, Gemini, Ollama)
- [ ] Visual design matches VS Code aesthetic
- [ ] Code reviewed and approved
- [ ] User documentation updated
- [ ] JSDoc documentation complete

## Related Documentation

- Epic Plan: Docs/implementation/_main/epic-10-rag-knowledge-base.md
- Feature 10.2: Docs/implementation/_main/feature-10.2-knowledge-base-ui.md
- Feature 10.3: Docs/implementation/_main/feature-10.3-rag-pipeline-context-retrieval.md
- Architecture: Docs/architecture/_main/04-Architecture.md
- UX Design: Docs/architecture/_main/05-User-Experience.md
- ADR-018: RAG Knowledge Base Architecture

## Architecture Decision Records (ADRs)

- **ADR-018**: RAG Knowledge Base Architecture (toggle-based RAG, source citations)
- **ADR-002**: React UI Framework (component patterns)
- **ADR-003**: Zustand State Management (chat store, knowledge store)
- **ADR-009**: AI Streaming (non-blocking RAG integration)

---

**Feature Plan Version:** 1.0
**Last Updated:** January 23, 2026
**Status:** Ready for Wave Planning
