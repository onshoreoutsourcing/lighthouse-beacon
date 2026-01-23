# Wave 10.3.3: Prompt Augmentation & SOC Integration

## Wave Overview
- **Wave ID:** Wave-10.3.3
- **Feature:** Feature 10.3 - RAG Pipeline & Context Retrieval
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Planning
- **Scope:** Implement prompt augmentation with retrieved context and SOC compliance logging
- **Wave Goal:** Complete RAG pipeline with AI-ready prompts and audit trail

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement buildAugmentedPrompt for system prompt construction
2. Integrate RAGService with existing AIService flow
3. Add SOC logging for all RAG operations
4. Implement graceful fallback when retrieval fails or returns empty

## User Stories

### User Story 1: Prompt Augmentation with Context

**As a** developer using Lighthouse Chat IDE
**I want** retrieved context injected into AI prompts automatically
**So that** the AI has relevant codebase knowledge to answer my questions

**Acceptance Criteria:**
- [ ] buildAugmentedPrompt constructs system prompt with context section
- [ ] Context formatted clearly with file paths and code blocks
- [ ] Original user message preserved unchanged
- [ ] Source metadata attached for later citation display
- [ ] Prompt construction completes in <50ms
- [ ] Unit tests verify prompt structure and content

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

### User Story 2: AIService Integration

**As a** developer using Lighthouse Chat IDE
**I want** RAG-augmented prompts sent through the existing AI pipeline
**So that** RAG works with all supported AI providers

**Acceptance Criteria:**
- [ ] RAGService integrates with AIService without modification
- [ ] Augmented prompts work with Claude, GPT, Gemini, Ollama
- [ ] Streaming responses function normally with RAG context
- [ ] Provider-specific limits respected (context windows)
- [ ] Integration tests verify cross-provider compatibility

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

### User Story 3: SOC Compliance Logging

**As a** compliance officer
**I want** all RAG operations logged for audit purposes
**So that** we maintain traceability of AI-assisted decisions

**Acceptance Criteria:**
- [ ] RAG operations logged via existing SOC logger
- [ ] Logs include: query, sources count, tokens used, timestamp
- [ ] Logs include: provider, retrieval success/failure
- [ ] Sensitive content not logged (only metadata)
- [ ] Logging follows existing SOC patterns (Epic 7)
- [ ] Integration tests verify log entries created

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

### User Story 4: Graceful Fallback Handling

**As a** developer using Lighthouse Chat IDE
**I want** chat to continue normally if RAG retrieval fails
**So that** I can still interact with the AI even when knowledge base is unavailable

**Acceptance Criteria:**
- [ ] Empty retrieval proceeds with standard (non-RAG) chat
- [ ] Retrieval errors logged but don't crash the application
- [ ] User informed via subtle indicator (not blocking alert)
- [ ] Timeout handling for slow retrievals (max 5 seconds)
- [ ] Fallback clearly documented for troubleshooting
- [ ] Unit tests verify all fallback scenarios

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] Cross-provider testing verified (Claude, GPT, Gemini, Ollama)
- [ ] SOC logging verified via log inspection
- [ ] Fallback scenarios verified via error injection
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved
- [ ] JSDoc documentation complete

## Notes

- Context section uses markdown formatting for readability
- System prompt augmentation preserves any existing system prompt
- SOC logging uses structured JSON format for queryability
- Fallback maintains user experience continuity

## Dependencies

- **Prerequisites:** Wave 10.3.1 (chunking), Wave 10.3.2 (retrieval), Epic 2 (AIService)
- **Enables:** Feature 10.4 (chat integration)

---

**Total Stories:** 4
**Total Hours:** 36
**Total Objective UCP:** 28
**Wave Status:** Planning
