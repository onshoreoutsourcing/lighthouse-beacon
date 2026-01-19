# ADR-007: Conversation Storage Strategy

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Lighthouse Development Team
**Related**: Epic-2, Feature-2.2, Business Requirements (FR-4)

---

## Context

Lighthouse Chat IDE needs to persist conversation history so users can:
- Resume conversations after closing the application
- Search through past conversations (future feature)
- Export conversations for sharing or documentation
- Maintain complete audit trail of AI interactions

**Requirements:**
- Persist multi-turn conversations with AI
- Store conversation metadata (creation date, last modified, provider used)
- Support conversation save/load operations
- Enable future search and filtering capabilities
- User-controlled data (no cloud uploads without permission)
- Fast read/write performance (< 100ms)
- Human-readable format for debugging and auditing
- Cross-platform compatibility (Windows, macOS, Linux)

**Constraints:**
- Electron desktop application (Node.js + Chromium)
- Users control their data (local storage only)
- Must work offline (no internet dependency)
- Conversations may contain thousands of messages
- Some conversations may include large code snippets
- Must integrate with Electron userData directory

**Existing System:**
- Electron app with main/renderer process architecture
- IPC communication for file system access
- No database infrastructure currently

---

## Considered Options

- **Option 1: JSON Files in Electron userData** - One JSON file per conversation
- **Option 2: SQLite Database** - Relational database for structured queries
- **Option 3: IndexedDB** - Browser-based NoSQL database in renderer process
- **Option 4: LevelDB** - Embedded key-value store
- **Option 5: Plain Text Files** - Markdown or text format
- **Option 6: Do Nothing** - In-memory only, lost on app close

---

## Decision

**We have decided to store conversations as JSON files in the Electron userData directory, with one file per conversation identified by unique UUID.**

### Why This Choice

JSON files provide the best balance of simplicity, performance, auditability, and user control for MVP needs.

**Key factors:**

1. **Simplicity**: No database setup, no schema migrations, no query complexity. Just `fs.readFile()` and `fs.writeFile()`.

2. **Human-Readable**: JSON files can be opened in any text editor for debugging, auditing, or manual inspection. Critical for transparency (Product Vision: "Human in Control").

3. **Electron userData Integration**: Electron provides standard `app.getPath('userData')` location that's platform-appropriate and user-accessible.

4. **Performance Sufficient**: Reading/writing JSON files takes < 50ms for typical conversations (< 10,000 messages). Good enough for MVP.

5. **No External Dependencies**: Built-in Node.js `fs/promises` module. No additional libraries or databases to maintain.

6. **User Control**: Users can backup, delete, or export conversations by copying JSON files. No database lock-in.

7. **Future-Proof**: Easy to migrate to database later if search/query needs grow. JSON files remain as export format.

**File structure:**

```
{app.getPath('userData')}/conversations/
├── 123e4567-e89b-12d3-a456-426614174000.json
├── 234e5678-f90b-23d4-b567-537725285111.json
└── metadata.json (conversation list)
```

**Conversation JSON format:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "metadata": {
    "created": "2026-01-19T10:30:00Z",
    "lastModified": "2026-01-19T11:45:00Z",
    "provider": "anthropic-claude",
    "model": "claude-3-sonnet",
    "title": "Refactor authentication system",
    "messageCount": 42,
    "projectPath": "/Users/dev/myproject"
  },
  "messages": [
    {
      "id": "msg-001",
      "role": "user",
      "content": "Show me the authentication code",
      "timestamp": "2026-01-19T10:30:00Z"
    },
    {
      "id": "msg-002",
      "role": "assistant",
      "content": "I'll read the authentication files...",
      "timestamp": "2026-01-19T10:30:05Z",
      "toolCalls": [
        {
          "id": "tool-001",
          "tool": "read",
          "params": { "path": "src/auth.ts" },
          "result": "..."
        }
      ]
    }
  ]
}
```

**Auto-save strategy:**
- Save after each completed AI response (not every token)
- Use atomic writes (write to temp file, then rename)
- Debounce rapid saves (max 1 save per second)

**Why we rejected alternatives:**

- **SQLite**: Overkill for MVP. Adds complexity for querying we don't need yet. Migration overhead.
- **IndexedDB**: Renderer-process only. Would require IPC for main process access. More complex than needed.
- **LevelDB**: No human-readable format. Harder to debug. No significant performance advantage for our use case.
- **Plain Text**: Difficult to parse structured data (tool calls, metadata). Would need custom format.
- **Do Nothing**: Unacceptable UX - users lose conversations on app close.

---

## Consequences

### Positive

- **Simple Implementation**: Use built-in `fs/promises`, no dependencies
- **Fast Development**: No database schema, migrations, or ORM setup
- **Easy Debugging**: Open JSON files in text editor to inspect conversations
- **User Friendly**: Users can backup conversations by copying files
- **Platform Compatible**: Works identically on Windows, macOS, Linux
- **Privacy Preserved**: All data stored locally, no cloud dependency
- **Future Migration**: Easy to read JSON files and import to database later
- **Audit Trail**: Complete conversation history in human-readable format

### Negative

- **No Full-Text Search**: Cannot efficiently search across all conversations (future limitation)
- **No Complex Queries**: Cannot easily filter by date range, provider, or metadata without loading all files
- **File System Limits**: Large number of conversations (10,000+) may slow down directory listing
- **Concurrent Access**: Multiple app instances could conflict (rare edge case)
- **Large Conversations**: Files with 10,000+ messages may become slow to load (> 100KB)

### Mitigation Strategies

**For search limitation:**
- Build in-memory index on app startup (acceptable for MVP with <1,000 conversations)
- If search becomes critical, migrate to SQLite in Epic 4 or 5
- Keep JSON as export format even after migration

**For large conversations:**
- Implement lazy loading (load only recent N messages initially)
- Provide "load more" UI for older messages
- Monitor file sizes and warn users if conversation exceeds reasonable size
- Consider conversation splitting for very long sessions (future)

**For concurrent access:**
- Lock conversation file during writes
- Detect file modification conflicts and prompt user to reload
- For MVP, document that multiple instances not recommended

**For file system limits:**
- Implement pagination in conversation list UI
- Archive old conversations to subdirectories (e.g., by year)
- Monitor conversation count and suggest archiving if > 1,000

---

## References

- [Electron App Paths](https://www.electronjs.org/docs/latest/api/app#appgetpathname)
- [Node.js fs/promises](https://nodejs.org/api/fs.html#promises-api)
- Product Vision: Docs/architecture/_main/01-Product-Vision.md (Section: Human in Control)
- Business Requirements: FR-4 (AI Chat Interface with History)
- Epic 2 Plan: `Docs/implementation/_main/epic-2-ai-integration-aichatsdk.md`
- Related ADRs:
  - ADR-001: Electron as Desktop Framework
  - ADR-006: AIChatSDK Integration Approach
- Implementation: `src/services/ConversationStorage.ts`

---

**Last Updated**: 2026-01-19
