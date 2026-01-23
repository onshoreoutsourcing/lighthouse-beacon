# RAG Knowledge Base Enhancement - Brainstorming & Questions

**Date:** 2026-01-23
**Status:** Initial Analysis - Awaiting User Input
**Planning Document:** `/Docs/planning/rag-knowledge-base-planning.md`
**Project:** Lighthouse Chat IDE (Beacon)

---

## Step 0: Scope Determination

### Analysis Summary

Based on the planning document analysis:

| Factor | Assessment | Implication |
|--------|------------|-------------|
| **Timeline** | 8-11 weeks (4 phases) | Significant initiative |
| **New Components** | VectorService, RAGService, DocumentProcessor, Knowledge Tab UI, Chat Integration | Major architectural additions |
| **New Libraries** | vector-lite, rag-lite, Transformers.js | Technology integration |
| **IPC Channels** | 6+ new channels (kb:add-files, kb:remove, ai:send-message-rag, etc.) | Substantial main/renderer coordination |
| **State Management** | New Zustand store (Knowledge Store) | UI state complexity |
| **UI Components** | Knowledge Tab, RAG toggle, Source citations | Multiple new interfaces |
| **Integration Points** | File Explorer context menu, Chat interface, AIService | Cross-cutting concerns |

### Scope Recommendation: **Epic**

**Rationale:**
1. **Duration**: 8-11 weeks exceeds typical feature scope (1-3 weeks) and aligns with Epic scale (2-3 months)
2. **Architectural Impact**: Introduces new service layer (VectorService, RAGService), new processing pipeline (DocumentProcessor), and new UI paradigm (Knowledge Tab)
3. **Multiple Features**: Naturally decomposes into 4+ distinct features:
   - Feature 10.1: Vector Service & Embedding Infrastructure
   - Feature 10.2: Knowledge Base UI
   - Feature 10.3: RAG Pipeline & Context Retrieval
   - Feature 10.4: Chat Integration & Source Citations
4. **Cross-Cutting Integration**: Touches File Explorer, Chat, Editor, and introduces new sidebar tab
5. **Comparable Scope**: Similar in complexity to Epic 9 (Visual Workflow Generator) which was 5 features over 10-12 weeks

**Recommended Epic Number**: **Epic 10** (follows Epic 9 - Visual Workflow Generator)

---

## Step 1: Architecture Context Integration

### Alignment with Existing Architecture

#### Service Layer Integration (Main Process)

From `04-Architecture.md`, services follow this pattern:
```
Main Process Services:
- FileSystemService: File I/O operations
- AIService: AI provider coordination
- ToolExecutionService: File operation tool execution
- PermissionService: Operation approval logic
+ VectorService (NEW): Vector database & embeddings
+ RAGService (NEW): Document chunking & context retrieval
+ DocumentProcessor (NEW): Background processing queue
```

**Integration Points:**
1. **FileSystemService**: DocumentProcessor reads file contents via existing service
2. **AIService**: RAGService augments prompts before sending to AI providers
3. **PermissionService**: Consider permissions for Knowledge Base operations (optional)
4. **SettingsService**: Store RAG configuration (model, weights, limits)

#### Renderer Layer Integration

From `04-Architecture.md`, stores pattern:
```
Zustand Stores:
- useFileExplorerStore: Directory tree, selection
- useEditorStore: Open files, active tab
- useChatStore: Conversation history
+ useKnowledgeStore (NEW): Indexed documents, processing state
```

**UI Integration:**
1. **Left Panel**: Add Knowledge Tab alongside File Explorer (tab navigation)
2. **Chat Interface**: Add RAG toggle button, source citation display
3. **File Explorer**: Add "Add to Knowledge" context menu item

#### IPC Channel Design

Following existing patterns from `04-Architecture.md`:
```typescript
// New IPC channels
const RAG_CHANNELS = {
  KB_ADD_FILES: 'kb:add-files',
  KB_ADD_FOLDER: 'kb:add-folder',
  KB_REMOVE_DOCUMENT: 'kb:remove-document',
  KB_GET_DOCUMENTS: 'kb:get-documents',
  KB_GET_STATISTICS: 'kb:get-statistics',
  KB_SEARCH: 'kb:search',
  AI_SEND_MESSAGE_RAG: 'ai:send-message-rag',
} as const;
```

### ADR Alignment Check

| ADR | Relevance | Alignment Status |
|-----|-----------|------------------|
| ADR-001 Electron | VectorService runs in main process | Aligned |
| ADR-003 Zustand | useKnowledgeStore follows pattern | Aligned |
| ADR-006 AIChatSDK | RAG integrates with existing AI flow | Needs Review - how to inject context? |
| ADR-008 Permission System | RAG operations: indexing, search - permission needs? | Decision Needed |
| ADR-009 Streaming | RAG responses should stream | Aligned |
| ADR-011 Directory Sandboxing | Indexed files must respect sandbox | Aligned - use PathValidator |

### Dependencies on Completed Epics

| Dependency | Epic | Status | Notes |
|------------|------|--------|-------|
| AI Chat Interface | Epic 2 | Complete | RAG toggle integrates into existing chat |
| File Explorer | Epic 1 | Complete | Context menu integration |
| AIChatSDK Integration | Epic 2 | Complete | RAG augments existing flow |
| FileSystemService | Epic 1 | Complete | Document reading via existing service |
| Streaming Responses | Epic 2 | Complete | RAG responses use same streaming |
| Permission System | Epic 2/3 | Complete | May need enhancement for RAG |

---

## Step 2: Open Questions & Decisions Needed

### Technical Questions (from Planning Document)

#### Q1: Embedding Strategy
**Question:** Use all-MiniLM-L6-v2 via Transformers.js only, or support multiple models?

**Options:**
- **A) Single Model (all-MiniLM-L6-v2)**: Simpler, proven quality, smaller bundle
- **B) Selectable Models**: More flexibility, larger bundle, more testing
- **C) Local + Cloud Hybrid**: Local for privacy, cloud option for speed

**Trade-offs:**
| Option | Bundle Size | Speed | Flexibility | Maintenance |
|--------|-------------|-------|-------------|-------------|
| A | ~40MB | ~2s/doc | Low | Low |
| B | ~100MB | Variable | High | High |
| C | ~40MB base | Best of both | Medium | Medium |

**Recommendation Pending User Input**

#### Q2: Index Size Limits
**Question:** Hard limit at 10K documents, or allow unlimited with warnings?

**Options:**
- **A) Hard Limit (10K)**: Predictable performance, clear boundary
- **B) Soft Limit with Warning**: Flexibility for power users
- **C) Tiered Performance**: Different strategies by size (in-memory <5K, hybrid 5K-50K)

**Memory Impact Analysis:**
| Documents | Estimated Memory | Performance |
|-----------|------------------|-------------|
| 1,000 | ~50MB | Excellent |
| 5,000 | ~250MB | Good |
| 10,000 | ~500MB | Acceptable |
| 50,000 | ~2.5GB | Degraded |

**Recommendation Pending User Input**

#### Q3: Chunking Strategy
**Question:** Fixed-size (500 tokens) for MVP, or invest in language-aware chunking?

**Options:**
- **A) Fixed-Size MVP**: 500 tokens, 50 token overlap - simple, works everywhere
- **B) Language-Aware**: AST-based for code, paragraph-based for docs
- **C) Hybrid**: Fixed-size MVP, language-aware in Phase 2

**Trade-offs:**
| Option | Quality | Complexity | Timeline Impact |
|--------|---------|------------|-----------------|
| A | Good (70-80%) | Low | None |
| B | Better (85-95%) | High | +2-3 weeks |
| C | Good then Better | Medium | Phased |

**Recommendation Pending User Input**

#### Q4: Search Parameter Exposure
**Question:** Expose search tuning parameters to users, or keep defaults?

**Options:**
- **A) Hidden Defaults**: Simple UX, reasonable defaults
- **B) Advanced Settings Panel**: Power users can tune
- **C) Smart Defaults + Override**: Defaults work well, option to customize

**Parameters Under Consideration:**
- Top-K results (default: 5)
- Semantic/keyword weight ratio (default: 70/30)
- Minimum relevance threshold (default: 0.3)
- Maximum context tokens (default: 4000)

**Recommendation Pending User Input**

### UX Questions (from Planning Document)

#### Q5: RAG Default Behavior
**Question:** Should RAG be enabled by default when Knowledge Base has documents?

**Options:**
- **A) Always Off by Default**: User explicitly enables per conversation
- **B) On When KB Has Documents**: Automatic when content available
- **C) Remember User Preference**: Per-project or global setting

**Considerations:**
- New users might be confused if RAG changes behavior unexpectedly (A)
- Power users want automatic context without clicking (B)
- Best of both worlds but more complexity (C)

**Recommendation Pending User Input**

#### Q6: Auto-Indexing on Project Open
**Question:** Should we auto-index the open folder on first launch?

**Options:**
- **A) Manual Only**: User explicitly adds files/folders
- **B) Prompt on Open**: "Would you like to index this project?"
- **C) Smart Auto-Index**: Index common patterns (src/, lib/) automatically

**Considerations:**
- Auto-indexing large repos could be slow/resource-intensive
- User expectation varies (some want immediate, some want control)
- First-time experience matters for adoption

**Recommendation Pending User Input**

#### Q7: Source Citation Display
**Question:** Show sources expanded or collapsed by default?

**Options:**
- **A) Collapsed by Default**: Less clutter, click to expand
- **B) Expanded by Default**: Full transparency, more information
- **C) Adaptive**: Collapsed if >3 sources, expanded if 1-3

**Considerations:**
- Screen real estate in chat panel is limited
- Users value transparency but don't want overwhelming details
- Clickability to open source files is key feature

**Recommendation Pending User Input**

#### Q8: Context Preview
**Question:** Should users see what context is being sent before message?

**Options:**
- **A) No Preview**: Send immediately, show sources after response
- **B) Preview Mode**: Show context that will be sent, user confirms
- **C) Optional Preview**: Toggle in settings for power users

**Considerations:**
- Preview adds friction but improves transparency
- Debugging bad retrievals easier with preview
- Most users probably just want answers

**Recommendation Pending User Input**

### Product/Priority Questions

#### Q9: MVP Scope Confirmation
**Question:** Is 1K-10K document limit acceptable for MVP?

**Context:** Planning document suggests this range for vector-lite library performance.

**Recommendation:** Accept 10K limit for MVP with clear documentation of limits.

#### Q10: Indexing Performance Acceptance
**Question:** Is ~2s per document indexing acceptable?

**Context:** Transformers.js local embedding generation takes ~2s per document.

**Considerations:**
- 100 files = ~3 minutes
- 1000 files = ~30 minutes
- Background processing with progress bar makes this acceptable
- Alternative (cloud embeddings) compromises privacy

**Recommendation:** Accept 2s/doc with excellent progress UX.

#### Q11: Implementation Priority
**Question:** Which phase should we focus on first?

**Planning Document Phases:**
1. Foundation (vector-lite integration) - 3-4 weeks
2. Knowledge Base UI - 2-3 weeks
3. RAG Pipeline (rag-lite integration) - 2 weeks
4. Chat Integration - 1-2 weeks

**Options:**
- **A) Sequential as Planned**: Foundation -> UI -> RAG -> Chat
- **B) Parallel Tracks**: Foundation + UI in parallel, then RAG + Chat
- **C) Value-First**: Minimal foundation, quick UI, iterate

**Recommendation Pending User Input**

#### Q12: Future Cloud Embeddings
**Question:** Plan for cloud embeddings, or local-only forever?

**Options:**
- **A) Local-Only Forever**: Strongest privacy stance
- **B) Plan Architecture for Both**: Local MVP, cloud optional later
- **C) Both from Start**: User chooses local or cloud

**Recommendation:** B - Architect for extensibility but ship local-only MVP

---

## Step 3: Integration Considerations

### Potential Conflicts

#### Conflict 1: Knowledge Tab vs. File Explorer Space
**Issue:** Adding Knowledge Tab to left panel increases sidebar complexity
**Mitigation:** Use tab navigation (similar to VS Code's activity bar) rather than splitting panel

#### Conflict 2: RAG Context Size vs. AI Provider Limits
**Issue:** Large context from RAG + conversation history could exceed provider context windows
**Mitigation:** Implement context budget management - allocate X tokens for RAG, Y for history

#### Conflict 3: Indexing Performance vs. UX
**Issue:** 2s/doc indexing could feel slow for large batches
**Mitigation:**
- Background processing with clear progress indicators
- Batch progress (e.g., "Indexing 23/100 files...")
- Cancellation support

### Performance Budgets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Single doc index | 2s | 5s |
| Batch index (100 files) | 3min | 10min |
| Search query | 50ms | 200ms |
| RAG context retrieval | 100ms | 500ms |
| UI responsiveness during indexing | 60fps | 30fps |
| Memory usage (10K docs) | 400MB | 600MB |

### Security Considerations

1. **Path Validation**: All indexed file paths must pass PathValidator (ADR-011)
2. **No External Data Transmission**: Embeddings generated locally, never sent externally
3. **SOC Logging**: Index operations logged to SOC for traceability
4. **Permission Integration**: Consider whether indexing requires explicit permission

---

## Summary: Questions Requiring User Input

### Critical Decisions (Must Answer Before Planning)

1. **Scope Confirmation**: Is Epic 10 the right scope, or should this be smaller?
2. **Embedding Strategy (Q1)**: Single model (A), multiple (B), or hybrid (C)?
3. **Index Limits (Q2)**: Hard limit (A), soft limit (B), or tiered (C)?
4. **RAG Default (Q5)**: Off by default (A), on when KB has content (B), or remember preference (C)?

### Important Decisions (Can Finalize During Feature Planning)

5. **Chunking Strategy (Q3)**: Fixed-size MVP (A), language-aware (B), or hybrid (C)?
6. **Search Parameters (Q4)**: Hidden (A), advanced panel (B), or smart defaults (C)?
7. **Auto-Indexing (Q6)**: Manual only (A), prompt (B), or smart auto (C)?
8. **Source Display (Q7)**: Collapsed (A), expanded (B), or adaptive (C)?
9. **Context Preview (Q8)**: No preview (A), always (B), or optional (C)?

### Recommendations Pending Validation

10. **MVP Document Limit (Q9)**: Recommending 10K limit - acceptable?
11. **Indexing Speed (Q10)**: Recommending 2s/doc with good UX - acceptable?
12. **Phase Priority (Q11)**: Sequential as planned, or adjust?
13. **Future Cloud Support (Q12)**: Recommending architect for extensibility - aligned?

---

## Next Steps

**Awaiting User Input On:**
1. Scope confirmation (Epic vs. Feature)
2. Critical decisions (Q1, Q2, Q5)
3. Priority and timeline expectations
4. Any additional requirements or constraints

**Once Questions Answered:**
- Create formal Epic 10 master plan document
- Define Features 10.1-10.4 structure
- Create detailed wave plans for first feature
- Begin architectural conformance validation

---

**Document Status:** Awaiting Review
**Next Action:** User provides answers to questions above
