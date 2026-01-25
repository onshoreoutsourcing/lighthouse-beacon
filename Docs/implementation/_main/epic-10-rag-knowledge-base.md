# Epic 10: RAG Knowledge Base - Master Implementation Plan

**Version:** 1.0
**Date:** January 23, 2026
**Status:** Planning Complete - Ready for Feature Planning
**Project:** Lighthouse Chat IDE (Beacon)
**Epic Owner:** System Architect
**Target Release:** Phase 7

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Strategic Context](#strategic-context)
3. [Feature Breakdown](#feature-breakdown)
4. [Architecture Integration](#architecture-integration)
5. [Memory Management Strategy](#memory-management-strategy)
6. [Technology Stack](#technology-stack)
7. [Implementation Phases](#implementation-phases)
8. [Dependencies and Prerequisites](#dependencies-and-prerequisites)
9. [Success Criteria](#success-criteria)
10. [Risk Management](#risk-management)

---

## Executive Summary

### What We're Building

**RAG Knowledge Base** integrates into Lighthouse Chat IDE, enabling developers to build a searchable knowledge base from their codebase and use it to ground AI responses in actual code. This provides context-aware AI assistance with full source attribution and transparency.

**Core Value Proposition:**
- **Local-First Privacy**: All embeddings generated locally via Transformers.js - no data sent externally
- **Memory-Managed**: Smart memory budgeting (500MB max) with real-time usage tracking
- **Transparent Citations**: Source attributions show exactly which files informed AI responses
- **Toggle-Based Control**: RAG off by default, user explicitly enables per project

### User Decisions (Critical)

The following decisions have been made by the Product Owner:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Embedding Strategy** | Single model (all-MiniLM-L6-v2) | Simpler MVP, proven quality, smaller bundle |
| **Index Limits** | Memory-based (NOT document count) | Real limit is memory usage, not document count |
| **Memory Budget** | 500MB maximum | Balances capacity with desktop performance |
| **RAG Default** | Toggle-based, OFF by default | User explicitly enables, persist preference per project |

### Strategic Value

This epic positions Lighthouse as:
1. **Context-Aware AI Platform** - AI responses grounded in actual codebase
2. **Privacy-First Tool** - Local embeddings maintain developer trust
3. **Enterprise-Ready** - SOC logging, memory monitoring, audit trails
4. **Competitive Differentiator** - Combines RAG with visual IDE (unique positioning)

### Industry Validation

Research into vector-lite, rag-lite, and similar libraries validates:
- Hybrid vector search (semantic + keyword) provides best retrieval quality
- Transformers.js enables browser/Electron embedding generation
- 500MB memory budget supports 5,000-10,000 document chunks effectively
- Local embeddings acceptable for desktop apps with async processing

---

## Strategic Context

### Project Context

#### Product Vision Alignment

From PRODUCT-SUMMARY.md:
> Lighthouse Chat IDE enables natural language interaction with codebases through conversational file operations. Users describe what they want, and the AI performs operations using specialized tools.

RAG Knowledge Base extends this vision:
- **From**: AI operates on individual files based on user requests
- **To**: AI understands entire codebase context for more relevant responses

#### Business Requirements Alignment

From 03-Business-Requirements.md:
- **FR-5**: Multi-provider AI support (Claude, GPT, etc.) - RAG integrates with existing flow
- **FR-10**: SOC Traceability - RAG operations logged for compliance
- **NFR-1**: Real-time streaming - RAG-augmented responses stream normally
- **NFR-3**: Security sandboxing - Indexed files respect project directory

#### Architecture Alignment

From 04-Architecture.md patterns:
- **Service-Oriented Architecture**: VectorService, RAGService follow established patterns
- **Component-Based UI**: Knowledge Tab, RAG toggle follow React patterns
- **Zustand State Management**: useKnowledgeStore follows existing stores
- **IPC Bridge Pattern**: kb:* handlers follow IPC conventions
- **SOLID Principles**: Dependency injection, interface-based programming

#### User Experience Alignment

From 05-User-Experience.md:
- **Visual First, Conversational Always**: Knowledge Tab provides visual management
- **AI Transparency**: Source citations show what informed responses
- **Human-AI Collaboration**: Users control what gets indexed
- **Progressive Disclosure**: Basic RAG simple, advanced tuning available
- **Privacy by Default**: All processing local, no external data transmission

### Competitive Positioning

**Lighthouse RAG vs. Alternatives:**

| Feature | GitHub Copilot | Cursor | Continue.dev | **Lighthouse** |
|---------|---------------|--------|--------------|----------------|
| Local Embeddings | No (cloud) | No (cloud) | Optional | **Yes (always)** |
| Source Citations | Limited | Limited | Basic | **Full attribution** |
| Memory Monitoring | N/A | N/A | N/A | **Yes (budgeted)** |
| Toggle Control | Always on | Always on | Config-based | **Explicit toggle** |
| Visual Management | None | None | Basic | **Full UI** |
| Multi-Provider | No | No | Yes | **Yes** |
| SOC Logging | No | No | No | **Yes** |

**Unique Value:** Only IDE with local-only RAG, full source citations, memory-budgeted indexing, and visual knowledge base management.

---

## Feature Breakdown

This Epic consists of **4 Features** organized into **2 Phases** (MVP + Integration):

### Feature 10.1: Vector Service & Embedding Infrastructure
**Phase:** 1 - Foundation
**Duration:** 3-4 weeks
**Waves:** 3 waves (10.1.1-10.1.3)

**Scope:**
- vector-lite integration for hybrid vector search
- Transformers.js embedding generation (all-MiniLM-L6-v2)
- Index persistence to disk (JSON-based)
- Memory monitoring and budget enforcement

**Deliverables:**
- `VectorService.ts` - vector-lite wrapper with memory monitoring
- `EmbeddingService.ts` - Transformers.js integration
- `MemoryMonitor.ts` - Real-time memory usage tracking
- `IndexPersistence.ts` - Save/load index to disk
- `vector-service.types.ts` - TypeScript interfaces

**Technical Details:**

```typescript
// src/main/services/vector/VectorService.ts
export class VectorService {
  private readonly MEMORY_BUDGET_MB = 500;
  private memoryMonitor: MemoryMonitor;

  constructor(
    private embeddingService: EmbeddingService,
    private persistence: IndexPersistence
  ) {
    this.memoryMonitor = new MemoryMonitor(this.MEMORY_BUDGET_MB);
  }

  async addDocument(doc: DocumentInput): Promise<AddResult> {
    // Check memory budget before adding
    const projectedMemory = this.memoryMonitor.projectMemoryUsage(doc);
    if (projectedMemory > this.MEMORY_BUDGET_MB * 1024 * 1024) {
      return {
        success: false,
        error: 'MEMORY_BUDGET_EXCEEDED',
        currentUsage: this.memoryMonitor.getCurrentUsage(),
        budgetMB: this.MEMORY_BUDGET_MB
      };
    }

    // Generate embeddings locally
    const embedding = await this.embeddingService.embed(doc.content);

    // Add to vector index
    await this.vectorIndex.add({
      id: doc.id,
      embedding,
      metadata: doc.metadata
    });

    // Update memory tracking
    this.memoryMonitor.recordAddition(doc);

    return { success: true, documentId: doc.id };
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // Hybrid search: semantic + keyword
    const queryEmbedding = await this.embeddingService.embed(query);
    return this.vectorIndex.hybridSearch(queryEmbedding, query, options);
  }

  getMemoryStatus(): MemoryStatus {
    return {
      usedMB: this.memoryMonitor.getCurrentUsageMB(),
      budgetMB: this.MEMORY_BUDGET_MB,
      percentUsed: this.memoryMonitor.getPercentUsed(),
      documentsIndexed: this.vectorIndex.documentCount,
      chunksIndexed: this.vectorIndex.chunkCount
    };
  }
}
```

**Dependencies:**
- Transformers.js library (local embedding model)
- vector-lite library (hybrid vector search)
- Node.js process.memoryUsage() for monitoring
- FileSystemService for index persistence

**Success Criteria:**
- Embeddings generate locally in < 2s per document
- Hybrid search returns relevant results in < 50ms
- Memory usage tracked accurately within 5% margin
- Memory budget enforced - operations fail gracefully when exceeded
- Index persists to disk and loads on restart

---

### Feature 10.2: Knowledge Base UI
**Phase:** 1 - Foundation
**Duration:** 2-3 weeks
**Waves:** 3 waves (10.2.1-10.2.3)

**Scope:**
- Knowledge Tab in left sidebar (next to File Explorer)
- Document list with status indicators (indexed, processing, error)
- Add Files/Folder buttons with progress indicators
- Memory usage display with warning thresholds
- Right-click context menu integration ("Add to Knowledge")

**Deliverables:**
- `KnowledgeTab.tsx` - Main sidebar tab component
- `DocumentList.tsx` - Indexed document list with status
- `MemoryUsageBar.tsx` - Visual memory budget indicator
- `AddFilesDialog.tsx` - File/folder selection UI
- `useKnowledgeStore.ts` - Zustand store for KB state

**UI Components:**

```typescript
// src/renderer/components/knowledge/KnowledgeTab.tsx
export const KnowledgeTab: FC = () => {
  const {
    documents,
    memoryStatus,
    isIndexing,
    addFiles,
    removeDocument
  } = useKnowledgeStore();

  return (
    <div className="knowledge-tab">
      <div className="knowledge-header">
        <h3>Knowledge Base</h3>
        <div className="knowledge-actions">
          <Button onClick={() => addFiles('files')}>Add Files</Button>
          <Button onClick={() => addFiles('folder')}>Add Folder</Button>
        </div>
      </div>

      <MemoryUsageBar
        usedMB={memoryStatus.usedMB}
        budgetMB={memoryStatus.budgetMB}
        showWarning={memoryStatus.percentUsed > 80}
      />

      {isIndexing && (
        <IndexingProgress
          current={indexingProgress.current}
          total={indexingProgress.total}
          currentFile={indexingProgress.currentFile}
        />
      )}

      <DocumentList
        documents={documents}
        onRemove={removeDocument}
      />
    </div>
  );
};

// src/renderer/components/knowledge/MemoryUsageBar.tsx
export const MemoryUsageBar: FC<MemoryUsageBarProps> = ({
  usedMB,
  budgetMB,
  showWarning
}) => {
  const percent = (usedMB / budgetMB) * 100;

  return (
    <div className="memory-usage-bar">
      <div className="memory-bar-container">
        <div
          className={`memory-bar-fill ${percent > 90 ? 'critical' : percent > 80 ? 'warning' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="memory-label">
        {usedMB.toFixed(1)}MB / {budgetMB}MB
        {showWarning && <WarningIcon className="warning-icon" />}
      </span>
    </div>
  );
};
```

**State Management:**

```typescript
// src/renderer/stores/knowledge.store.ts
interface KnowledgeState {
  documents: IndexedDocument[];
  memoryStatus: MemoryStatus;
  isIndexing: boolean;
  indexingProgress: IndexingProgress | null;
  ragEnabled: boolean; // Toggle state (persisted per project)

  // Actions
  addFiles: (mode: 'files' | 'folder') => Promise<void>;
  removeDocument: (docId: string) => Promise<void>;
  refreshMemoryStatus: () => Promise<void>;
  toggleRag: () => void;
  loadProjectSettings: (projectPath: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>()(
  devtools(
    persist(
      (set, get) => ({
        documents: [],
        memoryStatus: { usedMB: 0, budgetMB: 500, percentUsed: 0 },
        isIndexing: false,
        indexingProgress: null,
        ragEnabled: false, // OFF by default

        addFiles: async (mode) => {
          const files = await window.electronAPI.dialog.showOpenDialog({
            properties: mode === 'folder'
              ? ['openDirectory']
              : ['openFile', 'multiSelections']
          });

          if (files.canceled) return;

          set({ isIndexing: true });

          for (const filePath of files.filePaths) {
            await window.electronAPI.knowledge.addFile(filePath);
          }

          set({ isIndexing: false });
          await get().refreshMemoryStatus();
        },

        toggleRag: () => {
          set((state) => ({ ragEnabled: !state.ragEnabled }));
        },
      }),
      {
        name: 'knowledge-store',
        partialize: (state) => ({ ragEnabled: state.ragEnabled })
      }
    ),
    { name: 'KnowledgeStore' }
  )
);
```

**Dependencies:**
- Feature 10.1: VectorService (IPC calls for indexing)
- Existing File Explorer (context menu integration)
- Existing Zustand patterns (ADR-003)
- Existing IPC patterns (ADR-001)

**Success Criteria:**
- Knowledge Tab visible in left sidebar
- Documents show correct status (indexed, processing, error)
- Memory usage bar updates in real-time during indexing
- Warning appears when memory usage > 80%
- Context menu "Add to Knowledge" works from File Explorer
- RAG toggle persists per project

---

### Feature 10.3: RAG Pipeline & Context Retrieval
**Phase:** 2 - Integration
**Duration:** 2-3 weeks
**Waves:** 3 waves (10.3.1-10.3.3)

**Scope:**
- rag-lite integration for document chunking
- Context retrieval from vector database
- Prompt construction with injected context
- Source attribution tracking
- Context budget management (token limits)

**Deliverables:**
- `RAGService.ts` - rag-lite wrapper
- `DocumentChunker.ts` - Fixed-size chunking (500 tokens, 50 overlap)
- `ContextBuilder.ts` - Build augmented prompts with retrieved context
- `SourceTracker.ts` - Track which sources informed responses
- `rag-service.types.ts` - TypeScript interfaces

**Technical Details:**

```typescript
// src/main/services/rag/RAGService.ts
export class RAGService {
  private readonly MAX_CONTEXT_TOKENS = 4000;
  private readonly TOP_K_RESULTS = 5;
  private readonly MIN_RELEVANCE_SCORE = 0.3;

  constructor(
    private vectorService: VectorService,
    private documentChunker: DocumentChunker,
    private contextBuilder: ContextBuilder
  ) {}

  async processDocument(filePath: string): Promise<ProcessResult> {
    // Read file content
    const content = await this.fileSystemService.readFile(filePath);

    // Chunk document (500 tokens, 50 overlap)
    const chunks = this.documentChunker.chunk(content, {
      chunkSize: 500,
      overlap: 50,
      metadata: { filePath, timestamp: Date.now() }
    });

    // Add chunks to vector index
    const results = await Promise.all(
      chunks.map(chunk => this.vectorService.addDocument({
        id: `${filePath}:${chunk.startLine}-${chunk.endLine}`,
        content: chunk.text,
        metadata: {
          filePath,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          chunkIndex: chunk.index
        }
      }))
    );

    return {
      success: results.every(r => r.success),
      chunksCreated: chunks.length,
      errors: results.filter(r => !r.success).map(r => r.error)
    };
  }

  async retrieveContext(query: string): Promise<RetrievedContext> {
    // Hybrid search for relevant chunks
    const searchResults = await this.vectorService.search(query, {
      topK: this.TOP_K_RESULTS,
      minScore: this.MIN_RELEVANCE_SCORE,
      hybridWeight: { semantic: 0.7, keyword: 0.3 }
    });

    if (searchResults.length === 0) {
      return { chunks: [], sources: [], contextText: '' };
    }

    // Build context within token budget
    const context = this.contextBuilder.buildContext(searchResults, {
      maxTokens: this.MAX_CONTEXT_TOKENS
    });

    return {
      chunks: context.chunks,
      sources: context.sources,
      contextText: context.text,
      tokensUsed: context.tokenCount
    };
  }

  buildAugmentedPrompt(
    userMessage: string,
    context: RetrievedContext,
    systemPrompt?: string
  ): AugmentedPrompt {
    const contextSection = context.contextText
      ? `\n\n## Relevant Code Context\n\nThe following code from the project may be relevant:\n\n${context.contextText}\n\n---\n\n`
      : '';

    return {
      systemPrompt: systemPrompt
        ? `${systemPrompt}${contextSection}`
        : `You are a helpful AI assistant with access to the user's codebase.${contextSection}`,
      userMessage,
      sources: context.sources,
      metadata: {
        ragEnabled: true,
        chunksRetrieved: context.chunks.length,
        tokensUsed: context.tokensUsed
      }
    };
  }
}
```

**Chunking Strategy:**

```typescript
// src/main/services/rag/DocumentChunker.ts
export class DocumentChunker {
  chunk(content: string, options: ChunkOptions): Chunk[] {
    const { chunkSize, overlap, metadata } = options;
    const lines = content.split('\n');
    const chunks: Chunk[] = [];

    let currentChunk: string[] = [];
    let currentTokens = 0;
    let startLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineTokens = this.estimateTokens(line);

      if (currentTokens + lineTokens > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          text: currentChunk.join('\n'),
          startLine,
          endLine: startLine + currentChunk.length - 1,
          index: chunks.length,
          metadata
        });

        // Start new chunk with overlap
        const overlapLines = Math.floor(overlap / this.avgTokensPerLine);
        currentChunk = currentChunk.slice(-overlapLines);
        startLine = i - overlapLines + 1;
        currentTokens = this.estimateTokens(currentChunk.join('\n'));
      }

      currentChunk.push(line);
      currentTokens += lineTokens;
    }

    // Don't forget last chunk
    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join('\n'),
        startLine,
        endLine: startLine + currentChunk.length - 1,
        index: chunks.length,
        metadata
      });
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
```

**Dependencies:**
- Feature 10.1: VectorService (search, add documents)
- rag-lite library (chunking utilities)
- Existing FileSystemService (read files)
- Token counting utility

**Success Criteria:**
- Documents chunk correctly (500 tokens, 50 overlap)
- Context retrieval returns relevant results in < 100ms
- Context stays within 4000 token budget
- Sources tracked accurately for attribution
- Graceful fallback when no relevant context found

---

### Feature 10.4: Chat Integration & Source Citations
**Phase:** 2 - Integration
**Duration:** 2 weeks
**Waves:** 2 waves (10.4.1-10.4.2)

**Scope:**
- RAG toggle button in chat UI
- Automatic context retrieval when RAG enabled
- Source citation display in chat messages
- Click-to-open source files at specific lines
- RAG status indicator during message send

**Deliverables:**
- `RAGToggle.tsx` - Chat toggle button with document count
- `SourceCitations.tsx` - Collapsible source display
- `SourceCitationItem.tsx` - Individual source with click-to-open
- `useChatRAG.ts` - Hook for RAG-augmented chat flow
- Chat store integration for RAG state

**UI Components:**

```typescript
// src/renderer/components/chat/RAGToggle.tsx
export const RAGToggle: FC = () => {
  const { ragEnabled, toggleRag } = useKnowledgeStore();
  const { documents, memoryStatus } = useKnowledgeStore();

  const documentCount = documents.length;
  const hasDocuments = documentCount > 0;

  return (
    <button
      className={`rag-toggle ${ragEnabled ? 'active' : ''}`}
      onClick={toggleRag}
      disabled={!hasDocuments}
      title={hasDocuments
        ? `${ragEnabled ? 'Disable' : 'Enable'} Knowledge Base context`
        : 'Add documents to Knowledge Base first'
      }
    >
      <SearchIcon />
      <span>Knowledge Base</span>
      {hasDocuments && (
        <span className="doc-count">({documentCount} docs)</span>
      )}
    </button>
  );
};

// src/renderer/components/chat/SourceCitations.tsx
export const SourceCitations: FC<SourceCitationsProps> = ({ sources }) => {
  const [expanded, setExpanded] = useState(sources.length <= 3);

  if (sources.length === 0) return null;

  return (
    <div className="source-citations">
      <button
        className="sources-header"
        onClick={() => setExpanded(!expanded)}
      >
        <DocumentIcon />
        <span>{sources.length} source{sources.length !== 1 ? 's' : ''}</span>
        <ChevronIcon direction={expanded ? 'down' : 'right'} />
      </button>

      {expanded && (
        <div className="sources-list">
          {sources.map((source, i) => (
            <SourceCitationItem key={i} source={source} />
          ))}
        </div>
      )}
    </div>
  );
};

// src/renderer/components/chat/SourceCitationItem.tsx
export const SourceCitationItem: FC<SourceCitationItemProps> = ({ source }) => {
  const { openFile } = useEditorStore();

  const handleClick = () => {
    openFile(source.filePath, { line: source.startLine });
  };

  return (
    <button className="source-item" onClick={handleClick}>
      <FileIcon />
      <span className="source-path">{source.relativePath}</span>
      <span className="source-lines">
        L{source.startLine}-{source.endLine}
      </span>
      <span className="source-relevance">
        {Math.round(source.relevanceScore * 100)}%
      </span>
    </button>
  );
};
```

**Chat Integration Hook:**

```typescript
// src/renderer/hooks/useChatRAG.ts
export const useChatRAG = () => {
  const { ragEnabled } = useKnowledgeStore();
  const { sendMessage: originalSendMessage } = useChatStore();

  const sendMessageWithRAG = async (message: string): Promise<ChatResponse> => {
    if (!ragEnabled) {
      // Standard chat flow
      return originalSendMessage(message);
    }

    // RAG-augmented flow
    try {
      // 1. Retrieve relevant context
      const context = await window.electronAPI.rag.retrieveContext(message);

      // 2. Send message with augmented prompt
      const response = await window.electronAPI.ai.sendMessageRAG({
        message,
        context: context.contextText,
        sources: context.sources
      });

      // 3. Return response with sources for display
      return {
        ...response,
        sources: context.sources,
        ragMetadata: {
          chunksRetrieved: context.chunks.length,
          tokensUsed: context.tokensUsed
        }
      };
    } catch (error) {
      // Fallback to standard chat on RAG error
      console.warn('RAG retrieval failed, falling back to standard chat:', error);
      return originalSendMessage(message);
    }
  };

  return {
    sendMessage: sendMessageWithRAG,
    ragEnabled
  };
};
```

**IPC Handlers:**

```typescript
// src/main/ipc/rag-handlers.ts
ipcMain.handle('rag:retrieve-context', async (event, query: string) => {
  return await ragService.retrieveContext(query);
});

ipcMain.handle('ai:send-message-rag', async (event, params: RAGMessageParams) => {
  const { message, context, sources } = params;

  // Build augmented prompt
  const augmentedPrompt = ragService.buildAugmentedPrompt(message, {
    contextText: context,
    sources,
    chunks: []
  });

  // Send to AI service with augmented prompt
  const response = await aiService.sendMessage(
    augmentedPrompt.userMessage,
    { systemPrompt: augmentedPrompt.systemPrompt }
  );

  // Log RAG operation to SOC
  await socLogger.logRAGOperation({
    query: message,
    sourcesUsed: sources.length,
    contextTokens: augmentedPrompt.metadata.tokensUsed
  });

  return { response, sources };
});
```

**Dependencies:**
- Feature 10.3: RAGService (context retrieval)
- Existing Chat UI (ADR-002, ADR-009)
- Existing AIService (ADR-006)
- Existing Editor (open files at line)

**Success Criteria:**
- RAG toggle visible in chat UI
- Toggle shows document count
- Context retrieves automatically when RAG enabled
- Sources display with file paths and line numbers
- Click source opens file at correct line
- Graceful fallback if retrieval fails
- RAG preference persists per project

---

## Architecture Integration

### Component Architecture

#### Main Process Layer (Node.js)

**New Services:**

```
src/main/services/
├── vector/
│   ├── VectorService.ts      # vector-lite wrapper
│   ├── EmbeddingService.ts   # Transformers.js embeddings
│   ├── MemoryMonitor.ts      # Memory budget tracking
│   └── IndexPersistence.ts   # Save/load index
├── rag/
│   ├── RAGService.ts         # rag-lite wrapper
│   ├── DocumentChunker.ts    # Fixed-size chunking
│   ├── ContextBuilder.ts     # Prompt construction
│   └── SourceTracker.ts      # Attribution tracking
└── document/
    └── DocumentProcessor.ts   # Background processing queue
```

**IPC Handlers:**

```typescript
// src/main/ipc/knowledge-handlers.ts
const KNOWLEDGE_CHANNELS = {
  KB_ADD_FILE: 'kb:add-file',
  KB_ADD_FOLDER: 'kb:add-folder',
  KB_REMOVE_DOCUMENT: 'kb:remove-document',
  KB_GET_DOCUMENTS: 'kb:get-documents',
  KB_GET_MEMORY_STATUS: 'kb:get-memory-status',
  KB_SEARCH: 'kb:search',
} as const;

// src/main/ipc/rag-handlers.ts
const RAG_CHANNELS = {
  RAG_RETRIEVE_CONTEXT: 'rag:retrieve-context',
  AI_SEND_MESSAGE_RAG: 'ai:send-message-rag',
} as const;
```

#### Renderer Process Layer (React)

**New Components:**

```
src/renderer/components/
├── knowledge/
│   ├── KnowledgeTab.tsx      # Left sidebar tab
│   ├── DocumentList.tsx      # Indexed documents
│   ├── DocumentItem.tsx      # Single document row
│   ├── MemoryUsageBar.tsx    # Memory budget display
│   ├── IndexingProgress.tsx  # Progress indicator
│   └── AddFilesDialog.tsx    # File selection
└── chat/
    ├── RAGToggle.tsx         # Chat toggle button
    ├── SourceCitations.tsx   # Source list
    └── SourceCitationItem.tsx # Single source
```

**State Management:**

```
src/renderer/stores/
└── knowledge.store.ts        # New Zustand store
```

#### Shared Layer

```
src/shared/types/
├── knowledge.types.ts        # Document, MemoryStatus types
├── rag.types.ts             # Context, Source, Chunk types
└── vector.types.ts          # Embedding, SearchResult types
```

### Integration with Existing Systems

#### FileSystemService Integration

```typescript
// DocumentProcessor uses FileSystemService for reading
class DocumentProcessor {
  async processFile(filePath: string): Promise<ProcessResult> {
    // Validate path within project (ADR-011)
    const validation = await this.pathValidator.validate(filePath);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Read via existing service
    const content = await this.fileSystemService.readFile(validation.absolutePath);

    // Process through RAG pipeline
    return this.ragService.processDocument(content, { filePath });
  }
}
```

#### AIService Integration

```typescript
// RAG augments existing AI flow
class RAGEnabledAIService {
  async sendMessage(message: string, options: RAGOptions): Promise<AIResponse> {
    if (!options.ragEnabled) {
      return this.aiService.sendMessage(message);
    }

    // Retrieve context
    const context = await this.ragService.retrieveContext(message);

    // Build augmented prompt
    const augmented = this.ragService.buildAugmentedPrompt(message, context);

    // Send via existing AIService (supports all providers)
    return this.aiService.sendMessage(augmented.userMessage, {
      systemPrompt: augmented.systemPrompt
    });
  }
}
```

#### PermissionService Integration

RAG operations do not require additional permission prompts because:
1. Indexing uses already-opened project files (user chose directory)
2. No external data transmission (local embeddings)
3. Read-only operations on files user owns

However, SOC logging captures all RAG operations for audit.

### ADR Alignment

| ADR | RAG Integration | Status |
|-----|-----------------|--------|
| ADR-001 Electron | VectorService, RAGService in main process | Aligned |
| ADR-002 React | Knowledge Tab, RAG Toggle components | Aligned |
| ADR-003 Zustand | useKnowledgeStore follows patterns | Aligned |
| ADR-006 AIChatSDK | RAG augments existing AI flow | Aligned |
| ADR-007 Storage | Index persistence follows patterns | Aligned |
| ADR-009 Streaming | RAG responses stream normally | Aligned |
| ADR-011 Sandboxing | Indexed files must be in project | Aligned |

---

## Memory Management Strategy

### Memory Budget Approach

**Critical User Decision:** Index limits are memory-based, NOT document count based.

**Rationale:**
- Real limit is memory usage, not arbitrary document count
- Different documents have different memory footprints
- Users can see actual resource consumption
- Prevents OOM without artificial limits

### Memory Budget Configuration

```typescript
interface MemoryBudget {
  maxBudgetMB: 500;           // Hard limit
  warningThresholdPercent: 80; // Show warning at 80%
  criticalThresholdPercent: 95; // Block new additions at 95%
}
```

### Memory Monitoring Implementation

```typescript
// src/main/services/vector/MemoryMonitor.ts
export class MemoryMonitor {
  private currentUsageBytes = 0;
  private documentSizes = new Map<string, number>();

  constructor(private budgetMB: number) {}

  recordAddition(doc: DocumentInput, sizeBytes: number): void {
    this.documentSizes.set(doc.id, sizeBytes);
    this.currentUsageBytes += sizeBytes;

    // Log memory update
    logger.info('Memory usage updated', {
      docId: doc.id,
      addedBytes: sizeBytes,
      totalMB: this.getCurrentUsageMB(),
      budgetMB: this.budgetMB,
      percentUsed: this.getPercentUsed()
    });
  }

  recordRemoval(docId: string): void {
    const size = this.documentSizes.get(docId) || 0;
    this.documentSizes.delete(docId);
    this.currentUsageBytes -= size;
  }

  projectMemoryUsage(doc: DocumentInput): number {
    // Estimate memory for embedding + metadata
    const embeddingSize = 384 * 4; // 384 dimensions * 4 bytes per float
    const metadataSize = JSON.stringify(doc.metadata).length * 2;
    const contentSize = doc.content.length * 2; // UTF-16
    return this.currentUsageBytes + embeddingSize + metadataSize + contentSize;
  }

  canAddDocument(doc: DocumentInput): CanAddResult {
    const projected = this.projectMemoryUsage(doc);
    const projectedPercent = (projected / (this.budgetMB * 1024 * 1024)) * 100;

    if (projectedPercent >= 100) {
      return {
        canAdd: false,
        reason: 'BUDGET_EXCEEDED',
        currentMB: this.getCurrentUsageMB(),
        projectedMB: projected / (1024 * 1024),
        budgetMB: this.budgetMB
      };
    }

    return {
      canAdd: true,
      warning: projectedPercent >= 80
        ? `Memory usage will be ${projectedPercent.toFixed(1)}% after adding`
        : undefined
    };
  }

  getCurrentUsageMB(): number {
    return this.currentUsageBytes / (1024 * 1024);
  }

  getPercentUsed(): number {
    return (this.getCurrentUsageMB() / this.budgetMB) * 100;
  }

  getStatus(): MemoryStatus {
    const percentUsed = this.getPercentUsed();
    return {
      usedMB: this.getCurrentUsageMB(),
      budgetMB: this.budgetMB,
      percentUsed,
      status: percentUsed >= 95 ? 'critical'
            : percentUsed >= 80 ? 'warning'
            : 'healthy',
      documentsTracked: this.documentSizes.size
    };
  }
}
```

### Error Handling for OOM Scenarios

```typescript
// Graceful handling when memory budget exceeded
async addFiles(files: string[]): Promise<AddFilesResult> {
  const results: FileResult[] = [];

  for (const file of files) {
    const canAdd = this.memoryMonitor.canAddDocument({ path: file });

    if (!canAdd.canAdd) {
      results.push({
        file,
        success: false,
        error: {
          code: 'MEMORY_BUDGET_EXCEEDED',
          message: `Cannot add ${file}: Memory budget would be exceeded`,
          details: {
            currentMB: canAdd.currentMB,
            projectedMB: canAdd.projectedMB,
            budgetMB: canAdd.budgetMB
          }
        }
      });

      // Notify renderer about memory limit
      this.sendMemoryWarning({
        type: 'budget_exceeded',
        file,
        currentUsage: canAdd.currentMB,
        budget: canAdd.budgetMB
      });

      // Stop processing remaining files
      break;
    }

    // Process file if within budget
    const result = await this.processFile(file);
    results.push({ file, ...result });

    // Show warning if approaching limit
    if (canAdd.warning) {
      this.sendMemoryWarning({
        type: 'approaching_limit',
        message: canAdd.warning
      });
    }
  }

  return { results, memoryStatus: this.memoryMonitor.getStatus() };
}
```

### Logging Strategy

```typescript
// Memory-specific logging
const memoryLogger = createLogger('memory-monitor');

// Log levels:
// - INFO: Memory status updates, successful operations
// - WARN: Approaching memory limit (>80%)
// - ERROR: Memory budget exceeded, OOM prevention

memoryLogger.info('Document indexed', {
  docId,
  memoryAddedMB,
  totalUsedMB,
  percentUsed
});

memoryLogger.warn('Memory approaching limit', {
  percentUsed,
  threshold: 80,
  remainingMB
});

memoryLogger.error('Memory budget exceeded', {
  attemptedFile,
  currentMB,
  projectedMB,
  budgetMB,
  action: 'operation_blocked'
});
```

---

## Technology Stack

### Core Technologies (Existing)

- **Desktop Platform:** Electron (ADR-001)
- **UI Framework:** React 18+ with TypeScript (ADR-002)
- **State Management:** Zustand (ADR-003)
- **Build Tool:** Vite (ADR-005)
- **AI Integration:** AIChatSDK (ADR-006)

### New Dependencies (RAG-Specific)

- **vector-lite:** Hybrid vector search library
  - In-memory vector index
  - Semantic + keyword hybrid search
  - Bundle size: ~50KB

- **Transformers.js:** Local ML inference
  - all-MiniLM-L6-v2 model (~22MB)
  - Browser/Node.js compatible
  - No cloud dependency

- **rag-lite:** RAG pipeline utilities
  - Document chunking
  - Context building
  - Bundle size: ~30KB

### Embedding Model

**Model:** all-MiniLM-L6-v2
- **Dimensions:** 384
- **Size:** ~22MB (downloaded once)
- **Speed:** ~1-2s per document
- **Quality:** Excellent for code/text similarity
- **License:** Apache 2.0

---

## Implementation Phases

### Phase 1: Foundation (6 Waves, 5-7 Weeks)

**Goal:** Core infrastructure and UI for knowledge base management

**Features:**
- Feature 10.1: Vector Service & Embedding Infrastructure (3 waves)
- Feature 10.2: Knowledge Base UI (3 waves)

**Deliverables:**
- Local embedding generation working
- Hybrid vector search functional
- Memory monitoring and budget enforcement
- Knowledge Tab with document management
- Memory usage display with warnings

**Success Criteria:**
- User can add files to knowledge base via UI
- Documents indexed with local embeddings
- Memory usage tracked and displayed
- Budget enforcement prevents OOM
- Index persists across restarts

---

### Phase 2: Integration (5 Waves, 4-5 Weeks)

**Goal:** RAG pipeline and chat integration

**Features:**
- Feature 10.3: RAG Pipeline & Context Retrieval (3 waves)
- Feature 10.4: Chat Integration & Source Citations (2 waves)

**Deliverables:**
- Document chunking pipeline
- Context retrieval from vector database
- RAG toggle in chat UI
- Source citation display
- Click-to-open source files

**Success Criteria:**
- RAG toggle enables context-aware responses
- Sources displayed with file paths and lines
- Click source opens file at correct location
- Graceful fallback when no context found
- RAG preference persists per project

---

## Dependencies and Prerequisites

### External Dependencies

**Required Before Epic Start:**
- Epic 1: Desktop Foundation (Electron, React, Zustand) - COMPLETE
- Epic 2: AI Integration (AIService, streaming, multi-provider) - COMPLETE
- Epic 3: File Operations (FileSystemService, PathValidator) - COMPLETE

**User System Requirements:**
- 4GB+ RAM (500MB for RAG + app overhead)
- 50MB disk space for embedding model
- Internet connection for initial model download

### Internal Dependencies

**Feature Dependencies:**

```
Feature 10.1 (Vector Service)
    ↓
Feature 10.2 (Knowledge UI) ← depends on 10.1 for memory status
    ↓
Feature 10.3 (RAG Pipeline) ← depends on 10.1 for vector search
    ↓
Feature 10.4 (Chat Integration) ← depends on 10.2 (toggle), 10.3 (retrieval)
```

**No parallel Feature development** - must complete in sequence.

### ADR Requirements

| ADR | Requirement | Notes |
|-----|-------------|-------|
| ADR-001 | Services in main process | VectorService, RAGService |
| ADR-003 | Zustand store patterns | useKnowledgeStore |
| ADR-006 | AIService integration | RAG augments existing flow |
| ADR-011 | Path validation | Indexed files must be in project |

---

## Success Criteria

### MVP Success (Phase 1 Complete)

**Technical Criteria:**
- [ ] Embeddings generate locally via Transformers.js
- [ ] Hybrid search returns relevant results in < 50ms
- [ ] Memory budget (500MB) tracked and enforced
- [ ] Warning displayed when memory > 80%
- [ ] Operations blocked when memory > 95%
- [ ] Index persists to disk, loads on restart
- [ ] Knowledge Tab visible in left sidebar
- [ ] Documents show correct status indicators
- [ ] Context menu integration works

**Performance Criteria:**
- [ ] Single document indexing < 2s
- [ ] Batch index (100 files) < 5 minutes
- [ ] Memory tracking accurate within 5%
- [ ] UI responsive during indexing (60fps)

---

### Full Success (Phase 2 Complete)

**Technical Criteria:**
- [ ] All MVP criteria met
- [ ] Document chunking works correctly (500 tokens, 50 overlap)
- [ ] Context retrieval returns relevant chunks
- [ ] Context budget (4000 tokens) respected
- [ ] RAG toggle visible and functional in chat
- [ ] Source citations display with file paths and lines
- [ ] Click source opens file at correct line
- [ ] Graceful fallback when no relevant context
- [ ] RAG preference persists per project

**User Experience Criteria:**
- [ ] User can enable RAG for project in < 30 seconds
- [ ] Context-aware responses noticeably more relevant
- [ ] Sources help users verify AI responses
- [ ] No crashes or data loss
- [ ] Memory warnings clear and actionable

**Performance Criteria:**
- [ ] Context retrieval < 100ms
- [ ] Full RAG flow (retrieve + prompt + AI) < 3s
- [ ] Source citation render < 50ms

---

## Risk Management

### Technical Risks

#### Risk 1: Transformers.js Performance (Medium)

**Description:** Embedding generation may be too slow in Electron, especially on older hardware.

**Impact:** Slow indexing, poor user experience, abandoned feature.

**Mitigation:**
- Use Web Workers for embedding generation (non-blocking)
- Show clear progress with time estimates
- Allow cancellation of batch operations
- Cache embeddings - don't re-compute on restart

**Contingency:** If performance inadequate, offer cloud embedding option (opt-in, privacy trade-off documented).

---

#### Risk 2: Memory Budget Accuracy (Medium)

**Description:** Memory estimates may not accurately reflect actual usage.

**Impact:** False warnings, unexpected OOM, or unused capacity.

**Mitigation:**
- Calibrate estimates against actual measurements
- Add 10% safety margin to projections
- Monitor process.memoryUsage() for validation
- Log discrepancies for debugging

**Contingency:** Add manual garbage collection trigger, adjust budget dynamically based on actual usage.

---

#### Risk 3: Search Quality (Medium)

**Description:** Hybrid search may not return relevant results for all query types.

**Impact:** Poor RAG responses, user frustration, feature abandonment.

**Mitigation:**
- Test with real codebases during development
- Tune semantic/keyword weights (default 70/30)
- Provide fallback to standard chat if no good results
- Log search quality metrics for improvement

**Contingency:** Add user feedback mechanism ("Was this helpful?"), tune based on feedback.

---

#### Risk 4: Large File Handling (Low)

**Description:** Very large files may cause memory spikes or long processing times.

**Impact:** OOM during indexing, unresponsive UI.

**Mitigation:**
- Skip files > 1MB by default
- Chunk large files before embedding
- Process files sequentially, not in parallel
- Monitor memory during processing

**Contingency:** Add file size limits, warn users about large files.

---

### Operational Risks

#### Risk 5: User Confusion (Medium)

**Description:** Users may not understand when/why to use RAG, or how to manage knowledge base.

**Impact:** Low adoption, support burden, feature seen as too complex.

**Mitigation:**
- Clear onboarding for Knowledge Tab
- Tooltips explaining RAG toggle
- Documentation with use cases
- Memory display with plain language ("Using 150MB of 500MB")

**Contingency:** Simplify UI further, add guided tour.

---

#### Risk 6: Index Corruption (Low)

**Description:** Index file may become corrupted, losing all indexed documents.

**Impact:** Data loss, user must re-index entire project.

**Mitigation:**
- Atomic writes (write to temp file, then rename)
- Backup previous index before overwrite
- Validate index integrity on load
- Clear error message with recovery instructions

**Contingency:** Add index repair tool, automatic re-indexing option.

---

## Next Steps

### Immediate Actions

1. **Review and Approve Master Plan** - Product Owner review, sign-off
2. **Create Feature Plans** - Detailed Feature 10.1-10.4 plans
3. **Create ADR-018** - RAG Knowledge Base Architecture Decision
4. **Begin Wave Planning** - Detailed wave plans for Feature 10.1

### Feature Planning Sequence

```
Epic 10 Master Plan (this document)
    ↓
Feature 10.1 Plan → Feature 10.2 Plan → Feature 10.3 Plan → Feature 10.4 Plan
    ↓
Wave Plans (detailed implementation for each Feature)
    ↓
Implementation (backend-specialist, frontend-specialist agents)
```

### Sign-Off Requirements

**Required Approvals:**
- [ ] Product Owner (business value, scope, priorities)
- [ ] System Architect (architecture integration, technical approach)
- [ ] Development Team Lead (implementation feasibility, timeline)

**Approval Criteria:**
- Master plan aligns with Product Vision and User Decisions
- Memory-based limit approach correctly implemented
- Architecture integration follows established ADR patterns
- Feature breakdown logical, dependencies clear
- Risk mitigation strategies adequate

---

**Master Plan Status:** Ready for Review

**Next Document:** `feature-10.1-vector-service-embedding-infrastructure.md`

---

*This master plan incorporates user decisions on embedding strategy (single model), memory-based limits (500MB budget), and RAG toggle behavior (off by default, per-project persistence).*
