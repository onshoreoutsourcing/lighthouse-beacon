# Epic 8: Agentic Tool Integration

**Status:** Planning
**Date Created:** 2026-01-21
**Priority:** High
**Dependencies:** Epic 2 (AI Integration), Epic 3 (File Operation Tools)

---

## Problem Statement

The AI chat interface (Epic 2) currently functions as a basic text-based Q&A system. When users ask the AI to perform file operations (e.g., "create a document called wizzle.md"), the AI generates bash commands and file operation instructions as **formatted text in markdown code blocks**, but these commands are **never executed**.

### User Experience Issue

**Current Behavior:**
```
User: "create a document in the docs folder called wizzle.md"
AI Response:
  "I'll help you create a document called wizzle.md in the docs folder.

  ```bash
  cat > docs/wizzle.md << 'EOF'
  # Wizzle
  ...
  EOF
  ```

  The file docs/wizzle.md has been created!"
```

**Reality:** The file is NOT created. The AI is hallucinating the result.

**Expected Behavior (Like Claude Code):**
```
User: "create a document in the docs folder called wizzle.md"
AI: [Actually executes WriteTool to create the file]
AI Response: "Created /Users/roylove/dev/lighthouse-beacon/Docs/wizzle.md"
```

### Follow-up Issue

When the user asks "what is the full path to the file created in this conversation?", the AI loses context because:
1. No file was actually created
2. The AI's working directory context is lost between messages
3. The AI hallucinates a path like `/root/docs/wizzle.md` which is incorrect

---

## Investigation Summary

### What We Have (Already Implemented)

✅ **All Tool Implementations** (Epic 3.1)
- `BashTool.ts` - Execute bash commands with sandboxing
- `ReadTool.ts` - Read files with path validation
- `WriteTool.ts` - Write new files
- `EditTool.ts` - Edit existing files
- `GrepTool.ts` - Search file contents
- `GlobTool.ts` - Find files by pattern
- `DeleteTool.ts` - Delete files/directories
- `PathValidator.ts` - Security validation for all paths

✅ **Tool IPC Handlers** (`src/main/ipc/toolHandlers.ts`)
- Registered and working
- Available for renderer to call
- Permission system integrated

✅ **AI Chat Interface** (Epic 2.2)
- Message history management
- Streaming support
- Conversation persistence
- AIService integration via AIChatSDK

### What's Missing (The Gap)

❌ **No Anthropic Tool Use API Integration**
- AIChatSDK is initialized but doesn't define tools
- AI doesn't know it CAN use tools
- No tool schemas sent to Anthropic API

❌ **No Tool Execution Loop**
- Chat interface only does: `User Message → AI Response → Display`
- Should do: `User Message → AI Response (with tool calls) → Execute Tools → Feed Results Back → AI Continues`

❌ **No Tool Detection/Parsing**
- When AI responds with tool use, we don't detect it
- Anthropic's tool use format isn't parsed
- Tool results aren't formatted back to AI

---

## Architecture Analysis

### Current Architecture (Basic Chat)

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ "create file"
       ▼
┌─────────────────────────────────┐
│  ChatInterface.tsx              │
│  (src/renderer/components/chat) │
└──────┬──────────────────────────┘
       │ sendMessage()
       ▼
┌─────────────────────────────────┐
│  useChatStore                   │
│  (src/renderer/stores)          │
└──────┬──────────────────────────┘
       │ IPC: AI_STREAM_MESSAGE
       ▼
┌─────────────────────────────────┐
│  aiHandlers.ts                  │
│  (src/main/ipc)                 │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  AIService.ts                   │
│  (src/main/services)            │
└──────┬──────────────────────────┘
       │ AIChatSDK.streamChat()
       │ NO TOOLS DEFINED ❌
       ▼
┌─────────────────────────────────┐
│  Anthropic API                  │
│  (claude-sonnet-4-5-20250929)   │
└──────┬──────────────────────────┘
       │ Text response only
       ▼
┌─────────────────────────────────┐
│  Display as Markdown            │
│  Commands NOT executed ❌       │
└─────────────────────────────────┘
```

### Target Architecture (Agentic Tool Use)

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ "create file"
       ▼
┌─────────────────────────────────┐
│  ChatInterface.tsx              │
│  + Tool execution UI            │
└──────┬──────────────────────────┘
       │ sendMessage()
       ▼
┌─────────────────────────────────┐
│  AgenticChatStore ✨ NEW        │
│  - Tool detection               │
│  - Execution loop               │
│  - Result handling              │
└──────┬──────────────────────────┘
       │ IPC: AI_STREAM_MESSAGE_WITH_TOOLS
       ▼
┌─────────────────────────────────┐
│  agenticHandlers.ts ✨ NEW      │
│  - Tool execution coordinator   │
│  - Permission checks            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  AIService.ts (Enhanced)        │
│  + Tool definitions             │
│  + Tool use parsing             │
└──────┬──────────────────────────┘
       │ AIChatSDK.streamChat(
       │   messages,
       │   tools: [bash, read, write, ...] ✅
       │ )
       ▼
┌─────────────────────────────────┐
│  Anthropic API                  │
│  Returns tool_use blocks        │
└──────┬──────────────────────────┘
       │ { type: "tool_use",
       │   name: "bash",
       │   input: { command: "..." }}
       ▼
┌─────────────────────────────────┐
│  Tool Execution                 │
│  - Parse tool request           │
│  - Check permissions            │
│  - Execute via existing tools   │
│  - Format results               │
└──────┬──────────────────────────┘
       │ tool_result
       ▼
┌─────────────────────────────────┐
│  Feed Back to AI                │
│  AI continues with context      │
└─────────────────────────────────┘
```

---

## Anthropic Tool Use API Overview

### How Tool Use Works

Anthropic's Claude models support tool use through a structured message format where:

1. **Tools are defined** in the API request with schemas describing their purpose and parameters
2. **AI responds** with tool use blocks when it wants to execute actions
3. **Tool results** are sent back to the AI as part of the conversation
4. **AI continues** with knowledge of what actually happened

### Key Concepts

- **Tool Schema:** JSON schema defining tool name, description, and input parameters
- **Tool Use Block:** AI's request to execute a tool with specific inputs
- **Tool Result Block:** Response from tool execution fed back to AI
- **Multi-Turn Loop:** Conversation continues until AI has all information needed

### Reference Documentation
- [Anthropic Tool Use Guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Tool Use Examples](https://github.com/anthropics/anthropic-cookbook/tree/main/tool_use)

---

## High-Level Components Needed

### Component 1: Tool Schema Definitions

**Purpose:** Define all available tools in Anthropic's tool schema format

**Scope:**
- Schema for bash command execution
- Schema for file read/write/edit operations
- Schema for file search (grep/glob)
- Schema for file deletion
- Integration point with existing tool implementations

---

### Component 2: Agentic Execution Loop

**Purpose:** Coordinate the request-tool-execute-respond cycle

**Scope:**
- Parse AI responses for tool use requests
- Execute requested tools via existing implementations
- Format tool results for AI consumption
- Continue conversation until AI completion
- Handle errors and edge cases

---

### Component 3: Tool Execution UI

**Purpose:** Visual feedback for tool execution in chat interface

**Scope:**
- Display when AI is using tools
- Show tool parameters and inputs
- Display tool execution results
- Success/failure indicators
- Collapsible/expandable output sections

---

### Component 4: Permission & Safety System

**Purpose:** Ensure safe tool execution with appropriate user control

**Scope:**
- Permission levels for different tool types
- User prompts for dangerous operations
- "Allow once" vs "Always allow" options
- Integration with existing PermissionService
- Audit trail of tool executions

---

## Success Criteria

✅ **Functional:**
- User asks AI to create a file → File is created
- User asks "what's the path?" → AI knows the actual path
- AI can chain multiple operations (create file, edit file, verify)

✅ **Safety:**
- Dangerous operations require permission
- Tool execution is sandboxed
- User can cancel in-progress operations

✅ **User Experience:**
- Clear indication when AI is using tools
- Tool execution feels fast and responsive
- Errors are handled gracefully

---

## Comparison to Claude Code

**What Claude Code Does:**
- Full agentic tool use via Anthropic API
- Edit, Bash, Read, Write, Grep, Glob tools
- Multi-turn execution loops
- Permission system for dangerous operations
- Real-time tool execution display

**Our Current Gap:**
- ❌ No tool schemas defined
- ❌ No agentic execution loop
- ❌ No tool use detection
- ✅ All underlying tools implemented (Epic 3)

**Our Advantage:**
- ✅ Desktop app with Electron (more control)
- ✅ Multi-provider support (not just Anthropic)
- ✅ Visual IDE interface (file explorer, editor)

---

## Open Questions

1. **Tool Concurrency:** Should AI be allowed to execute multiple tools in parallel?
2. **Long-Running Operations:** How to handle operations that take >5 seconds?
3. **Streaming + Tools:** Can we stream text while executing tools?
4. **Context Window:** How many tool results before we hit token limits?
5. **Multi-Provider:** Do OpenAI, Gemini have tool use? (Yes, but different formats)

---

## Related Documentation

- **Epic 2:** AI Integration (AIService, AIChatSDK)
- **Epic 3:** File Operation Tools (BashTool, WriteTool, etc.)
- **Feature 2.1:** AIChatSDK Integration
- **Feature 3.1:** MVP Tool Framework

---

## Investigation Log

**Date:** 2026-01-21
**Investigated By:** Claude (Development Agent)

**Findings:**
1. User reported AI generates bash commands but doesn't execute them
2. Traced through: ChatInterface → useChatStore → aiHandlers → AIService
3. Confirmed: AIService calls AIChatSDK without tool definitions
4. Verified: All tool implementations exist (BashTool, WriteTool, etc.)
5. Identified: Need Anthropic tool use API integration
6. Root cause: Basic text chat, not agentic tool use

**Recommendation:** Implement Epic 8 to enable true agentic behavior

---

**Next Steps:**
1. Review this planning document with stakeholders
2. Conduct deeper technical investigation into Anthropic tool use API
3. Research how other AI IDEs (Claude Code, Cursor, Windsurf) implement tool use
4. Define detailed requirements for each component
5. Create detailed feature breakdown and wave planning
6. Design integration approach with existing codebase
