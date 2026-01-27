# RAG & Knowledge Base Integration - Planning Document

**Date:** 2026-01-20
**Status:** Initial Planning - For Review
**Project:** Lighthouse Beacon

---

## Overview

We're planning to add RAG (Retrieval-Augmented Generation) capabilities to Lighthouse Beacon, allowing developers to build a searchable knowledge base from their codebase and use it to ground AI responses in actual code.

### Key Libraries

1. **vector-lite** - Hybrid vector search (semantic + keyword) for 1K-10K documents
2. **rag-lite** - RAG pipeline for document chunking, retrieval, and context building

### Core Goals

- Allow developers to add documents to an in-memory vector database
- Retrieve relevant context from codebase when answering questions
- Display source attributions so developers can verify AI responses
- Maintain privacy - all embeddings generated locally via Transformers.js

---

## User Experience Vision

### What Users Will Do

1. **Add documents to Knowledge Base:**
   - Right-click files in Explorer → "Add to Knowledge"
   - Click button to index entire open folder
   - Use file picker to add external files

2. **Manage their Knowledge Base:**
   - View indexed documents in new "Knowledge" tab (left sidebar, next to Explorer)
   - See status indicators (indexed, processing, error)
   - Remove documents as needed

3. **Use RAG in Chat:**
   - Toggle button in chat: "🔍 Knowledge Base (42 docs)"
   - When enabled, AI responses include relevant code context
   - See source citations showing which files informed the answer
   - Click sources to open files at specific lines

### UX Principles

- **Optional, not required** - Chat works fine without RAG enabled
- **Transparent** - Show users when RAG is being used and what sources were referenced
- **Non-blocking** - Adding documents happens in background
- **Graceful fallback** - If no relevant context found, chat works normally

---

## Architecture Overview

### Components to Build

```
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
├─────────────────────────────────────────────────────────────┤
│  Knowledge Tab UI                                            │
│  - Document list                                             │
│  - Add Files/Folder buttons                                  │
│  - Progress indicators                                       │
│  - Statistics display                                        │
│                                                              │
│  Chat RAG Integration                                        │
│  - RAG toggle button                                         │
│  - Source citation display                                   │
│                                                              │
│  Knowledge Store (Zustand)                                   │
│  - Documents state                                           │
│  - Processing queue                                          │
│  - Index statistics                                          │
└──────────────────┬──────────────────────────────────────────┘
                   │ IPC
┌──────────────────▼──────────────────────────────────────────┐
│                    Main Process                              │
├─────────────────────────────────────────────────────────────┤
│  VectorService (vector-lite wrapper)                         │
│  - Embedding generation (Transformers.js)                    │
│  - Hybrid search (semantic + keyword)                        │
│  - Index persistence                                         │
│                                                              │
│  RAGService (rag-lite wrapper)                               │
│  - Document chunking                                         │
│  - Context retrieval                                         │
│  - Prompt construction                                       │
│  - Source attribution                                        │
│                                                              │
│  DocumentProcessor                                           │
│  - Background processing queue                               │
│  - File reading and parsing                                  │
│  - Progress tracking                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Technical Decisions to Make

### 1. Local vs. Remote Embeddings

**Current Plan:** Use Transformers.js for local embedding generation (all-MiniLM-L6-v2 model)

**Trade-offs:**
- ✅ Complete privacy - no data sent externally
- ✅ Works offline
- ❌ Slower than cloud APIs (~2s per document)
- ❌ Uses more memory

**Question:** Is 2s per document acceptable for indexing? Should we support cloud embeddings as an option?

### 2. Index Persistence Strategy

**Current Plan:** Save to disk using electron-store or JSON file

**Trade-offs:**
- ✅ Simple to implement
- ✅ Works with existing infrastructure
- ❌ Full index loaded into memory on startup
- ❌ May not scale beyond 10K documents

**Question:** Should we plan for larger document collections from the start, or is 1K-10K a reasonable limit for MVP?

### 3. File Type Support

**Current Plan:** Support code files (TS, JS, Python, etc.) and documentation (MD, TXT)

**Files to Index:**
- TypeScript/JavaScript (.ts, .tsx, .js, .jsx)
- Python (.py)
- Markdown (.md)
- Plain text (.txt)
- JSON (.json)

**Files to Exclude by Default:**
- node_modules/
- .git/
- dist/, build/
- Binary files
- Large files (>1MB)

**Question:** Any other file types to support? Should exclusion list be configurable?

### 4. Chunking Strategy

**Current Plan:** Fixed-size chunking (500 tokens) with overlap (50 tokens)

**Trade-offs:**
- ✅ Simple and predictable
- ✅ Works for all file types
- ❌ May split functions/classes awkwardly
- ❌ Not optimal for all languages

**Question:** Accept fixed-size for MVP, or invest in language-aware chunking from the start?

### 5. Search Configuration

**Current Plan:** Hybrid search with 70% semantic weight, 30% keyword weight

**Configurable Parameters:**
- Top-K results (default: 5)
- Semantic/keyword weights
- Minimum relevance threshold (default: 0.3)
- Maximum context tokens (default: 4000)

**Question:** Should these be user-configurable in UI, or just reasonable defaults?

---

## Data Flow Examples

### Adding Documents Flow

```
User right-clicks file in Explorer
    ↓
"Add to Knowledge" menu item clicked
    ↓
Renderer sends IPC request: kb:add-files
    ↓
Main: DocumentProcessor reads file content
    ↓
Main: RAGService chunks document (500 token chunks, 50 token overlap)
    ↓
Main: VectorService generates embeddings (Transformers.js)
    ↓
Main: VectorService stores vectors + metadata
    ↓
Main: VectorService persists to disk
    ↓
Main sends IPC event: kb:document-added
    ↓
Renderer: Knowledge store updates
    ↓
Renderer: Knowledge tab shows new document as "Indexed"
```

### RAG-Augmented Chat Flow

```
User types message: "How does authentication work?"
    ↓
User message sent to chat (RAG toggle is ON)
    ↓
Renderer checks: ragEnabled = true, KB has documents
    ↓
Renderer sends IPC: ai:send-message-rag
    ↓
Main: RAGService retrieves relevant chunks
  - Hybrid search for "authentication"
  - Returns top 5 chunks with relevance scores
    ↓
Main: RAGService builds augmented prompt
  - System message includes code context
  - User message unchanged
    ↓
Main: AIService sends to Claude with augmented prompt
    ↓
Main: AIService receives response
    ↓
Main sends IPC response with: { response, sources }
    ↓
Renderer: Chat displays message with source citations
    ↓
User clicks source → File opens at specific line
```

---

## Performance Expectations

### Indexing Performance

- **Single document:** <2s for 500-line file
- **Batch indexing:** ~30s for 100 files
- **Memory usage:** ~50MB for 1K documents, ~500MB for 10K documents

### Search Performance

- **Search latency:** <50ms for 5K documents
- **Context retrieval:** <100ms including search + chunking
- **Full RAG flow:** <2s (retrieve + prompt + AI response)

### Startup Performance

- **Index loading:** <5s for 5K documents

---

## Implementation Phases (High-Level)

### Phase 1: Foundation (vector-lite Integration)
**Goal:** Get hybrid vector search working

**Deliverables:**
- VectorService wrapper around vector-lite
- Embedding generation working (Transformers.js)
- Hybrid search functional (semantic + keyword)
- Index persistence to disk

**Time Estimate:** 3-4 weeks

---

### Phase 2: Knowledge Base UI
**Goal:** Build UI for managing documents

**Deliverables:**
- Knowledge tab in left sidebar
- Document list with status indicators
- Add Files/Folder buttons
- Right-click context menu integration
- Background processing with progress

**Time Estimate:** 2-3 weeks

---

### Phase 3: RAG Pipeline (rag-lite Integration)
**Goal:** Get document chunking and context retrieval working

**Deliverables:**
- RAGService wrapper around rag-lite
- Document chunking implementation
- Context retrieval from vector database
- Prompt construction with injected context
- Source attribution tracking

**Time Estimate:** 2 weeks

---

### Phase 4: Chat Integration
**Goal:** Integrate RAG into existing chat

**Deliverables:**
- RAG toggle button in chat UI
- Automatic context retrieval when enabled
- Source citation display
- Graceful fallbacks

**Time Estimate:** 1-2 weeks

**Total Time Estimate:** 8-11 weeks

---

## Open Questions & Decisions Needed

### Technical Questions

1. **Embedding Model:** Stick with all-MiniLM-L6-v2, or support multiple models?
2. **Index Size Limits:** Hard limit at 10K documents, or allow unlimited?
3. **Chunking Strategy:** Fixed-size for MVP, or invest in language-aware chunking?
4. **Search Tuning:** Expose search parameters to users, or keep hidden?

### UX Questions

1. **Default Behavior:** Should RAG be enabled by default when KB has documents?
2. **Auto-Indexing:** Should we auto-index the open folder on first launch?
3. **Source Display:** Show sources expanded or collapsed by default?
4. **Context Preview:** Should users see what context is being sent before message?

### Product Questions

1. **Scope:** Is 1K-10K document limit acceptable for MVP?
2. **Performance:** Is 2s per document indexing acceptable?
3. **Priority:** Which phase should we focus on first?
4. **Future:** Plan for cloud embeddings, or local-only forever?

---

## Risks & Concerns

### Technical Risks

1. **Performance:** Transformers.js might be too slow in Electron
   - *Mitigation:* Benchmark early, consider worker threads

2. **Memory Usage:** Large document collections could consume too much RAM
   - *Mitigation:* Set clear limits, document sweet spot

3. **Search Quality:** Hybrid search might not return relevant results
   - *Mitigation:* Test with real codebases, tune weights

### UX Risks

1. **Complexity:** Users might not understand when/why to use RAG
   - *Mitigation:* Clear documentation, onboarding tour

2. **Slow Indexing:** Batch indexing might feel unresponsive
   - *Mitigation:* Background processing, progress indicators, cancellation

3. **Clutter:** Source citations might clutter chat UI
   - *Mitigation:* Collapsible by default, compact display

---

## Success Criteria

### MVP is Successful When:

- [ ] Users can add files/folders to knowledge base via UI
- [ ] Documents are indexed with embeddings generated locally
- [ ] Hybrid search returns relevant results in <50ms
- [ ] RAG toggle in chat enables context-aware responses
- [ ] Source citations show which files informed AI's answer
- [ ] System handles 1K-5K documents without performance issues
- [ ] No data sent to external services (privacy maintained)

---

## Next Steps

1. **Review this document** - Discuss approach, answer open questions
2. **Make key decisions** - Resolve technical and UX questions
3. **Refine architecture** - Dive deeper into specific components
4. **Create detailed specs** - Break down into implementable tasks
5. **Start implementation** - Only after planning is complete and approved

---

## Related Documents

- `/Docs/planning/01-Product-Vision.md` - Overall product vision
- `/Docs/planning/IDEAS.md` - Original RAG/KB ideas
- Epic 2 documentation - Existing AI chat implementation
- Epic 3 documentation - File operations (for Explorer integration)

---

**Status:** Awaiting Review
**Next Review Date:** TBD
**Document Owner:** TBD
