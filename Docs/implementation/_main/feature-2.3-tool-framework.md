# Feature 2.3: Tool Framework and Permissions

**Feature ID:** Feature-2.3
**Epic:** Epic-2 (AI Integration with AIChatSDK)
**Status:** Planning
**Priority:** P0 (Critical)
**Estimated Duration:** 5 days (2 waves)
**Dependencies:** Feature 2.2 (Chat Interface and Streaming)

---

## Feature Overview

### Problem Statement

With AIChatSDK integrated (Feature 2.1) and the chat interface functional (Feature 2.2), users can have conversations with AI about their codebase. However, the AI cannot yet suggest or execute any file operations. The tool calling infrastructure needs to be established to enable AI-driven actions, along with a robust permission system that ensures users maintain complete authority over all file system operations.

**Current State:** AI can converse but cannot suggest or execute any tools/operations
**Desired State:** Tool calling infrastructure operational, permission system blocking unapproved operations, framework ready for Epic 3 file operation tools

### Business Value

**Value to Users:**
- **AI can suggest operations**: AI responses can include tool calls that request file operations
- **User maintains control**: Permission modal ensures explicit approval before any operation executes
- **Clear operation details**: Users see exactly what AI wants to do before approving
- **Session trust option**: Reduce repetitive prompts for trusted operation types
- **Audit trail**: All permission decisions logged for review

**Value to Business:**
- **Critical for MVP**: Tool framework is required for Epic 3 file operations (core value proposition)
- **Safety and trust**: Permission system ensures AI cannot act autonomously (Product Vision: Human in Control)
- **Compliance**: 100% SOC logging of tool operations and permission decisions
- **Foundation for future**: Extensible framework supports adding new tools easily

**Success Metrics:**
- Tool calling infrastructure parses 100% of valid AI tool requests correctly
- Permission modal appears for all operations requiring approval
- 100% of unapproved operations are blocked (zero bypass possible)
- Permission decisions logged to SOC within 100ms
- Tool results fed back to AI for continued conversation
- Framework supports adding new tools without modifying core infrastructure

---

## Scope

### In Scope

**Tool Calling Infrastructure:**
- [x] Tool schema definitions (TypeScript interfaces for Epic 3 tools)
- [x] Tool registration system (ToolRegistry for discoverable tools)
- [x] Tool request parsing from AIChatSDK responses
- [x] Tool result formatting for AI feedback
- [x] IPC channels for tool execution (main process) and permission (renderer)

**ToolExecutionService (Main Process):**
- [x] Service class managing tool execution lifecycle
- [x] Integration with AIChatSDK tool calling format
- [x] Permission check before execution
- [x] Execution context management (project root, conversation ID, user ID)
- [x] Error handling with AI-friendly error messages
- [x] SOC logging for all tool executions

**PermissionService (Main Process):**
- [x] Permission level definitions (ALWAYS_ALLOW, PROMPT, ALWAYS_DENY)
- [x] Permission configuration per tool type
- [x] Session trust state management
- [x] Permission request/response IPC handling
- [x] Permission decision logging to SOC

**PermissionModal (Renderer Process):**
- [x] Modal dialog React component
- [x] Operation details display (type, path, preview)
- [x] Risk level color coding (green/yellow/red)
- [x] Approve button (green, Enter key)
- [x] Deny button (red, Escape key)
- [x] "Trust this session" checkbox (for eligible operations)
- [x] Keyboard accessibility (Enter=approve, Escape=deny, Tab navigation)

**Permission Store (Zustand):**
- [x] Pending permission request state
- [x] Session trust settings per tool type
- [x] Permission prompt show/hide actions
- [x] Approve/deny response actions

**Tool Schema Definitions (Read-Only for Phase 2):**
- [x] ToolDefinition TypeScript interface
- [x] Read tool schema (for Epic 3)
- [x] Glob tool schema (for Epic 3)
- [x] Grep tool schema (for Epic 3)
- [x] Write tool schema (for Epic 3)
- [x] Edit tool schema (for Epic 3)
- [x] Delete tool schema (for Epic 3)
- [x] Bash tool schema (for Epic 3)

### Out of Scope

- Actual tool implementations (read, write, edit, delete, glob, grep, bash) - Epic 3
- Batch operation approval ("approve all") - Epic 3 enhancement
- Per-tool granular permission settings UI - Epic 4
- Permission history/audit viewer - Epic 5
- Custom permission rules - Epic 6
- Third-party tool plugins - Future consideration

---

## Technical Design

### Technology Stack

**Infrastructure:**
- **TypeScript** strict mode for all code
- **AIChatSDK** for tool calling format integration
- Rationale: Type safety ensures tool schemas match expected formats

**State Management:**
- **Zustand** v4+ for PermissionStore
- Rationale: Consistent with Epic 1/2 state management pattern (ADR-003)

**IPC Communication:**
- **Electron IPC** via contextBridge for permission prompts
- Rationale: Secure communication between main process (tool execution) and renderer (permission UI)

**Logging:**
- **AIChatSDK SOC Logger** for all permission decisions and tool executions
- Rationale: Automatic SOC integration via existing AIChatSDK infrastructure

### Architecture Overview

```
+-----------------------------------------------------------+
|                    RENDERER PROCESS                        |
|                                                           |
|  +------------------+     +------------------------+      |
|  |   ChatInterface  |     |    PermissionModal     |      |
|  |   (Feature 2.2)  |     |    (Feature 2.3)       |      |
|  +--------+---------+     +------------+-----------+      |
|           |                            |                  |
|           |    +-------------------+   |                  |
|           +--->|  PermissionStore  |<--+                  |
|                |    (Zustand)      |                      |
|                +--------+----------+                      |
|                         |                                 |
+-------------------------|----------------------------------+
                          | IPC
+-------------------------|----------------------------------+
|                    MAIN PROCESS                           |
|                         |                                 |
|  +------------------+   |   +------------------------+    |
|  |   AIService      |<--+-->| PermissionService      |    |
|  | (Feature 2.1)    |       |                        |    |
|  +--------+---------+       +------------------------+    |
|           |                            ^                  |
|           v                            |                  |
|  +-------------------+    +------------------------+      |
|  |ToolExecutionService|<->|    ToolRegistry        |      |
|  |                   |    | (Tool Schema Storage)  |      |
|  +--------+----------+    +------------------------+      |
|           |                                               |
|           v                                               |
|  +-------------------+                                    |
|  |   SOC Logger      |                                    |
|  | (via AIChatSDK)   |                                    |
|  +-------------------+                                    |
|                                                           |
+-----------------------------------------------------------+
```

### Component Architecture

**File Structure:**
```
src/
├── main/
│   ├── services/
│   │   ├── tool-execution.service.ts    # ToolExecutionService
│   │   └── permission.service.ts         # PermissionService
│   ├── tools/
│   │   ├── types.ts                      # Tool interfaces and types
│   │   ├── registry.ts                   # ToolRegistry class
│   │   └── schemas/                      # Tool schema definitions
│   │       ├── read.schema.ts
│   │       ├── write.schema.ts
│   │       ├── edit.schema.ts
│   │       ├── delete.schema.ts
│   │       ├── glob.schema.ts
│   │       ├── grep.schema.ts
│   │       └── bash.schema.ts
│   └── ipc/
│       └── permission-handlers.ts        # IPC handlers for permissions
│
├── renderer/
│   ├── components/
│   │   └── permission/
│   │       ├── PermissionModal.tsx       # Modal component
│   │       ├── OperationDetails.tsx      # Operation details display
│   │       ├── RiskIndicator.tsx         # Color-coded risk level
│   │       └── TrustCheckbox.tsx         # Session trust checkbox
│   ├── stores/
│   │   └── permission.store.ts           # Zustand permission store
│   └── types/
│       └── permission.types.ts           # Permission TypeScript types
│
└── shared/
    └── constants/
        └── permission-levels.ts          # Permission level constants
```

### Data Models

**Tool Definition Interface (src/main/tools/types.ts):**
```typescript
export interface ToolDefinition {
  /** Unique tool identifier */
  name: string;

  /** Human-readable description for AI context */
  description: string;

  /** JSON Schema for tool parameters */
  parameters: ToolParameterSchema;

  /** Whether this tool requires user permission */
  permissionRequired: boolean;

  /** Risk classification for UI display */
  riskLevel: 'low' | 'medium' | 'high';

  /** Whether "trust this session" is allowed */
  canTrustSession: boolean;
}

export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, ToolParameter>;
  required: string[];
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  optional?: boolean;
  enum?: string[];
  items?: ToolParameter;
}

export interface ToolExecutor<TParams = unknown, TResult = unknown> {
  readonly definition: ToolDefinition;

  execute(params: TParams, context: ExecutionContext): Promise<ToolResult<TResult>>;

  validate?(params: TParams): ValidationResult;
}

export interface ExecutionContext {
  projectRoot: string;
  userId: string;
  conversationId: string;
  messageId: string;
  socLogger: SOCLogger;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ToolError;
}

export interface ToolError {
  code: string;
  message: string;       // Human-readable
  aiMessage: string;     // AI-readable (how to recover)
  recoverable: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

**Permission Types (src/shared/constants/permission-levels.ts):**
```typescript
export enum PermissionLevel {
  /** Always allow without prompting (e.g., read operations) */
  ALWAYS_ALLOW = 'ALWAYS_ALLOW',

  /** Prompt user for approval */
  PROMPT = 'PROMPT',

  /** Always deny (for dangerous operations in certain contexts) */
  ALWAYS_DENY = 'ALWAYS_DENY',
}

export interface PermissionConfig {
  [toolName: string]: {
    defaultLevel: PermissionLevel;
    canTrustSession: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export const DEFAULT_PERMISSION_CONFIG: PermissionConfig = {
  read: {
    defaultLevel: PermissionLevel.ALWAYS_ALLOW,
    canTrustSession: false,  // N/A - always allowed
    riskLevel: 'low',
  },
  glob: {
    defaultLevel: PermissionLevel.ALWAYS_ALLOW,
    canTrustSession: false,
    riskLevel: 'low',
  },
  grep: {
    defaultLevel: PermissionLevel.ALWAYS_ALLOW,
    canTrustSession: false,
    riskLevel: 'low',
  },
  write: {
    defaultLevel: PermissionLevel.PROMPT,
    canTrustSession: true,
    riskLevel: 'medium',
  },
  edit: {
    defaultLevel: PermissionLevel.PROMPT,
    canTrustSession: true,
    riskLevel: 'medium',
  },
  delete: {
    defaultLevel: PermissionLevel.PROMPT,
    canTrustSession: false,  // Always prompt for delete
    riskLevel: 'high',
  },
  bash: {
    defaultLevel: PermissionLevel.PROMPT,
    canTrustSession: false,  // Always prompt for bash
    riskLevel: 'high',
  },
};
```

**Permission Request/Response (src/renderer/types/permission.types.ts):**
```typescript
export interface PermissionRequest {
  /** Unique request ID for matching response */
  id: string;

  /** Tool being requested */
  toolName: string;

  /** Human-readable operation description */
  operation: string;

  /** Affected file path (if applicable) */
  filePath?: string;

  /** Content preview for write operations */
  contentPreview?: string;

  /** Risk level for UI styling */
  riskLevel: 'low' | 'medium' | 'high';

  /** Whether "trust this session" checkbox is shown */
  canTrustSession: boolean;

  /** Timestamp of request */
  timestamp: string;
}

export interface PermissionResponse {
  /** Matching request ID */
  requestId: string;

  /** User decision */
  approved: boolean;

  /** Whether user checked "trust this session" */
  trustSession: boolean;

  /** Timestamp of response */
  timestamp: string;
}

export interface PermissionState {
  /** Currently pending permission request (null if none) */
  pendingRequest: PermissionRequest | null;

  /** Session trust settings by tool name */
  sessionTrust: Map<string, boolean>;

  /** Show permission modal with request */
  showPermissionPrompt: (request: PermissionRequest) => void;

  /** Handle user approval */
  approvePermission: (trustSession: boolean) => void;

  /** Handle user denial */
  denyPermission: () => void;

  /** Check if tool is trusted for session */
  isToolTrusted: (toolName: string) => boolean;

  /** Clear all session trust (on conversation end) */
  clearSessionTrust: () => void;
}
```

### Tool Schema Definitions (Epic 3 Ready)

**Read Tool Schema (src/main/tools/schemas/read.schema.ts):**
```typescript
import { ToolDefinition } from '../types';

export const readToolDefinition: ToolDefinition = {
  name: 'read',
  description: 'Read the contents of a file. Use this to examine code, configuration files, or any text file in the project.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The relative path to the file to read (from project root)',
      },
      startLine: {
        type: 'number',
        description: 'Optional starting line number (1-indexed)',
        optional: true,
      },
      endLine: {
        type: 'number',
        description: 'Optional ending line number (1-indexed, inclusive)',
        optional: true,
      },
    },
    required: ['path'],
  },
  permissionRequired: false,
  riskLevel: 'low',
  canTrustSession: false,
};
```

**Write Tool Schema (src/main/tools/schemas/write.schema.ts):**
```typescript
import { ToolDefinition } from '../types';

export const writeToolDefinition: ToolDefinition = {
  name: 'write',
  description: 'Write content to a file. Creates a new file or overwrites an existing file completely.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The relative path to the file to write (from project root)',
      },
      content: {
        type: 'string',
        description: 'The complete content to write to the file',
      },
    },
    required: ['path', 'content'],
  },
  permissionRequired: true,
  riskLevel: 'medium',
  canTrustSession: true,
};
```

**Delete Tool Schema (src/main/tools/schemas/delete.schema.ts):**
```typescript
import { ToolDefinition } from '../types';

export const deleteToolDefinition: ToolDefinition = {
  name: 'delete',
  description: 'Delete a file from the project. This action cannot be undone.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The relative path to the file to delete (from project root)',
      },
    },
    required: ['path'],
  },
  permissionRequired: true,
  riskLevel: 'high',
  canTrustSession: false,  // Always require confirmation
};
```

**Bash Tool Schema (src/main/tools/schemas/bash.schema.ts):**
```typescript
import { ToolDefinition } from '../types';

export const bashToolDefinition: ToolDefinition = {
  name: 'bash',
  description: 'Execute a shell command in the project directory. Use with caution.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
      workingDirectory: {
        type: 'string',
        description: 'Optional working directory (relative to project root)',
        optional: true,
      },
      timeout: {
        type: 'number',
        description: 'Optional timeout in milliseconds (default: 30000)',
        optional: true,
      },
    },
    required: ['command'],
  },
  permissionRequired: true,
  riskLevel: 'high',
  canTrustSession: false,  // Always require confirmation
};
```

### IPC Channel Definitions

**New IPC Channels (src/shared/constants/ipc-channels.ts additions):**
```typescript
export const IPC_CHANNELS = {
  // ... existing channels from Epic 1 and Feature 2.1/2.2 ...

  // Tool Execution (Feature 2.3)
  TOOL_EXECUTE: 'tool:execute',
  TOOL_RESULT: 'tool:result',
  TOOL_SCHEMAS_GET: 'tool:schemas:get',

  // Permissions (Feature 2.3)
  PERMISSION_REQUEST: 'permission:request',
  PERMISSION_RESPONSE: 'permission:response',
  PERMISSION_CHECK: 'permission:check',
  PERMISSION_TRUST_SET: 'permission:trust:set',
  PERMISSION_TRUST_CLEAR: 'permission:trust:clear',
};
```

### Service Implementations

**ToolExecutionService (src/main/services/tool-execution.service.ts):**
```typescript
import { ToolRegistry } from '../tools/registry';
import { PermissionService } from './permission.service';
import { ToolResult, ExecutionContext } from '../tools/types';

export class ToolExecutionService {
  constructor(
    private registry: ToolRegistry,
    private permissionService: PermissionService,
    private socLogger: SOCLogger
  ) {}

  async executeTool(
    toolName: string,
    params: unknown,
    context: ExecutionContext
  ): Promise<ToolResult> {
    const tool = this.registry.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_TOOL',
          message: `Tool "${toolName}" is not registered`,
          aiMessage: `The tool "${toolName}" does not exist. Available tools are: ${this.registry.getNames().join(', ')}`,
          recoverable: true,
        },
      };
    }

    // Validate parameters
    if (tool.validate) {
      const validation = tool.validate(params);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: validation.error || 'Invalid parameters',
            aiMessage: `Invalid parameters for ${toolName}: ${validation.error}`,
            recoverable: true,
          },
        };
      }
    }

    // Check permission
    if (tool.definition.permissionRequired) {
      const permitted = await this.permissionService.checkPermission(
        toolName,
        params,
        context
      );

      if (!permitted) {
        // Log denial to SOC
        await this.socLogger.log({
          event: 'tool.permission.denied',
          toolName,
          params,
          context: {
            conversationId: context.conversationId,
            userId: context.userId,
          },
          timestamp: new Date().toISOString(),
        });

        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'User denied permission for this operation',
            aiMessage: `The user denied permission to execute ${toolName}. You should acknowledge this and suggest an alternative or ask if they would like to proceed differently.`,
            recoverable: true,
          },
        };
      }
    }

    // Execute tool
    try {
      const result = await tool.execute(params, context);

      // Log execution to SOC
      await this.socLogger.log({
        event: 'tool.executed',
        toolName,
        params,
        success: result.success,
        context: {
          conversationId: context.conversationId,
          userId: context.userId,
        },
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      // Log error to SOC
      await this.socLogger.log({
        event: 'tool.error',
        toolName,
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: {
          conversationId: context.conversationId,
          userId: context.userId,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          aiMessage: `An error occurred while executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or use a different approach.`,
          recoverable: true,
        },
      };
    }
  }

  getToolSchemas(): ToolDefinition[] {
    return this.registry.getSchemas();
  }
}
```

**PermissionService (src/main/services/permission.service.ts):**
```typescript
import { BrowserWindow, ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import {
  PermissionLevel,
  DEFAULT_PERMISSION_CONFIG,
} from '../../shared/constants/permission-levels';
import { PermissionRequest, PermissionResponse } from '../../renderer/types/permission.types';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

export class PermissionService {
  private sessionTrust: Map<string, boolean> = new Map();
  private pendingRequests: Map<string, {
    resolve: (approved: boolean) => void;
    reject: (error: Error) => void;
  }> = new Map();

  constructor(private mainWindow: BrowserWindow, private socLogger: SOCLogger) {
    this.setupIpcHandlers();
  }

  private setupIpcHandlers(): void {
    ipcMain.on(IPC_CHANNELS.PERMISSION_RESPONSE, (_, response: PermissionResponse) => {
      this.handlePermissionResponse(response);
    });

    ipcMain.on(IPC_CHANNELS.PERMISSION_TRUST_CLEAR, () => {
      this.clearSessionTrust();
    });
  }

  async checkPermission(
    toolName: string,
    params: unknown,
    context: ExecutionContext
  ): Promise<boolean> {
    const config = DEFAULT_PERMISSION_CONFIG[toolName];

    if (!config) {
      // Unknown tool - require permission
      return this.promptForPermission(toolName, params, context, 'high', false);
    }

    switch (config.defaultLevel) {
      case PermissionLevel.ALWAYS_ALLOW:
        return true;

      case PermissionLevel.ALWAYS_DENY:
        return false;

      case PermissionLevel.PROMPT:
        // Check session trust
        if (config.canTrustSession && this.sessionTrust.get(toolName)) {
          // Log trusted execution to SOC
          await this.socLogger.log({
            event: 'tool.permission.trusted',
            toolName,
            params,
            context: {
              conversationId: context.conversationId,
              userId: context.userId,
            },
            timestamp: new Date().toISOString(),
          });
          return true;
        }

        return this.promptForPermission(
          toolName,
          params,
          context,
          config.riskLevel,
          config.canTrustSession
        );
    }
  }

  private async promptForPermission(
    toolName: string,
    params: unknown,
    context: ExecutionContext,
    riskLevel: 'low' | 'medium' | 'high',
    canTrustSession: boolean
  ): Promise<boolean> {
    const requestId = uuidv4();

    const request: PermissionRequest = {
      id: requestId,
      toolName,
      operation: this.formatOperationDescription(toolName, params),
      filePath: this.extractFilePath(params),
      contentPreview: this.extractContentPreview(params),
      riskLevel,
      canTrustSession,
      timestamp: new Date().toISOString(),
    };

    // Send request to renderer
    this.mainWindow.webContents.send(IPC_CHANNELS.PERMISSION_REQUEST, request);

    // Wait for response
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      // Timeout after 5 minutes (user might be away)
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          resolve(false);  // Default to deny on timeout
        }
      }, 5 * 60 * 1000);
    });
  }

  private handlePermissionResponse(response: PermissionResponse): void {
    const pending = this.pendingRequests.get(response.requestId);

    if (!pending) {
      console.warn('Received permission response for unknown request:', response.requestId);
      return;
    }

    this.pendingRequests.delete(response.requestId);

    // Log decision to SOC
    this.socLogger.log({
      event: 'tool.permission.decided',
      requestId: response.requestId,
      approved: response.approved,
      trustSession: response.trustSession,
      timestamp: response.timestamp,
    });

    // Update session trust if applicable
    if (response.approved && response.trustSession) {
      // We need to know the tool name - store it with the pending request
      // This is simplified - in practice, store toolName with pending request
      this.sessionTrust.set(response.requestId, true);
    }

    pending.resolve(response.approved);
  }

  private formatOperationDescription(toolName: string, params: unknown): string {
    const p = params as Record<string, unknown>;

    switch (toolName) {
      case 'read':
        return `Read file: ${p.path}`;
      case 'write':
        return `Write to file: ${p.path}`;
      case 'edit':
        return `Edit file: ${p.path}`;
      case 'delete':
        return `Delete file: ${p.path}`;
      case 'glob':
        return `Search for files matching: ${p.pattern}`;
      case 'grep':
        return `Search for content: ${p.pattern}`;
      case 'bash':
        return `Execute command: ${p.command}`;
      default:
        return `Execute ${toolName}`;
    }
  }

  private extractFilePath(params: unknown): string | undefined {
    const p = params as Record<string, unknown>;
    return typeof p.path === 'string' ? p.path : undefined;
  }

  private extractContentPreview(params: unknown): string | undefined {
    const p = params as Record<string, unknown>;
    if (typeof p.content === 'string') {
      // Limit preview to first 500 characters
      return p.content.length > 500
        ? p.content.substring(0, 500) + '...'
        : p.content;
    }
    return undefined;
  }

  clearSessionTrust(): void {
    this.sessionTrust.clear();
  }
}
```

**PermissionStore (src/renderer/stores/permission.store.ts):**
```typescript
import { create } from 'zustand';
import { PermissionRequest, PermissionResponse, PermissionState } from '../types/permission.types';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

export const usePermissionStore = create<PermissionState>((set, get) => ({
  pendingRequest: null,
  sessionTrust: new Map(),

  showPermissionPrompt: (request: PermissionRequest) => {
    set({ pendingRequest: request });
  },

  approvePermission: (trustSession: boolean) => {
    const { pendingRequest, sessionTrust } = get();

    if (!pendingRequest) {
      console.warn('No pending permission request to approve');
      return;
    }

    const response: PermissionResponse = {
      requestId: pendingRequest.id,
      approved: true,
      trustSession,
      timestamp: new Date().toISOString(),
    };

    // Update session trust if applicable
    if (trustSession && pendingRequest.canTrustSession) {
      sessionTrust.set(pendingRequest.toolName, true);
    }

    // Send response to main process
    window.electronAPI.sendPermissionResponse(response);

    set({ pendingRequest: null, sessionTrust: new Map(sessionTrust) });
  },

  denyPermission: () => {
    const { pendingRequest } = get();

    if (!pendingRequest) {
      console.warn('No pending permission request to deny');
      return;
    }

    const response: PermissionResponse = {
      requestId: pendingRequest.id,
      approved: false,
      trustSession: false,
      timestamp: new Date().toISOString(),
    };

    // Send response to main process
    window.electronAPI.sendPermissionResponse(response);

    set({ pendingRequest: null });
  },

  isToolTrusted: (toolName: string) => {
    return get().sessionTrust.get(toolName) ?? false;
  },

  clearSessionTrust: () => {
    set({ sessionTrust: new Map() });
    window.electronAPI.clearPermissionTrust();
  },
}));

// Listen for permission requests from main process
window.electronAPI.onPermissionRequest((request: PermissionRequest) => {
  usePermissionStore.getState().showPermissionPrompt(request);
});
```

**PermissionModal Component (src/renderer/components/permission/PermissionModal.tsx):**
```typescript
import React, { useCallback, useEffect, useState } from 'react';
import { usePermissionStore } from '../../stores/permission.store';
import { OperationDetails } from './OperationDetails';
import { RiskIndicator } from './RiskIndicator';
import { TrustCheckbox } from './TrustCheckbox';

export const PermissionModal: React.FC = () => {
  const { pendingRequest, approvePermission, denyPermission } = usePermissionStore();
  const [trustSession, setTrustSession] = useState(false);

  // Reset trust checkbox when new request arrives
  useEffect(() => {
    setTrustSession(false);
  }, [pendingRequest?.id]);

  // Keyboard handlers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!pendingRequest) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        approvePermission(trustSession);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        denyPermission();
      }
    },
    [pendingRequest, trustSession, approvePermission, denyPermission]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!pendingRequest) {
    return null;
  }

  const handleApprove = () => {
    approvePermission(trustSession);
  };

  const handleDeny = () => {
    denyPermission();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-title"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-700">
          <RiskIndicator level={pendingRequest.riskLevel} />
          <h2 id="permission-title" className="ml-3 text-lg font-semibold text-white">
            AI wants to {pendingRequest.toolName}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <OperationDetails request={pendingRequest} />

          {/* Risk warning for high-risk operations */}
          {pendingRequest.riskLevel === 'high' && (
            <div className="mt-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-300 text-sm">
              <strong>Warning:</strong> This operation cannot be undone. Please review carefully.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-850">
          {/* Trust checkbox (if eligible) */}
          {pendingRequest.canTrustSession && (
            <TrustCheckbox
              toolName={pendingRequest.toolName}
              checked={trustSession}
              onChange={setTrustSession}
            />
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={handleDeny}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
            >
              Deny (Esc)
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
              autoFocus
            >
              Approve (Enter)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## Implementation Approach

### Development Phases (Feature Waves)

This feature will be implemented in **2 waves**:

**Wave 2.3.1: Tool Framework Infrastructure (3 days)**
- Define tool TypeScript interfaces and types
- Create ToolRegistry class with registration/lookup
- Define tool schemas for all 7 tools (read, write, edit, delete, glob, grep, bash)
- Create ToolExecutionService with validation and error handling
- Create PermissionService with permission levels
- Set up IPC channels for tool execution and permissions
- Integrate with AIChatSDK tool calling format
- Implement SOC logging for tool operations
- Unit tests for ToolRegistry and ToolExecutionService

**Wave 2.3.2: Permission UI and Integration (2 days)**
- Create PermissionStore (Zustand)
- Build PermissionModal React component
- Implement OperationDetails, RiskIndicator, TrustCheckbox sub-components
- Add keyboard handlers (Enter=approve, Escape=deny)
- Connect permission IPC flow (main <-> renderer)
- Implement session trust functionality
- Implement permission decision SOC logging
- Integration tests for complete permission flow
- Manual testing of all permission scenarios

### User Stories (Feature-Level)

**Story 1: Tool Calling Infrastructure**
- **As an** AI system
- **I want** a framework to request tool executions
- **So that** I can suggest file operations to users during conversation
- **Acceptance Criteria:**
  - Tool schemas define all 7 file operation tools
  - ToolExecutionService parses tool requests correctly
  - Invalid tool requests return helpful error messages
  - Tool results are formatted for AI consumption
  - All tool operations logged to SOC

**Story 2: Permission Approval Flow**
- **As a** user
- **I want** to approve or deny AI tool requests
- **So that** I maintain control over all file operations
- **Acceptance Criteria:**
  - Permission modal appears before write/edit/delete/bash operations
  - Modal shows operation type, file path, and content preview
  - Approve button (green) executes the operation
  - Deny button (red) cancels the operation
  - Enter key approves, Escape key denies
  - Denied operations report back to AI gracefully

**Story 3: Risk-Based Permission Display**
- **As a** user
- **I want** to understand the risk level of operations
- **So that** I can make informed approval decisions
- **Acceptance Criteria:**
  - Low-risk operations (read, glob, grep) auto-approve silently
  - Medium-risk operations (write, edit) show yellow indicator
  - High-risk operations (delete, bash) show red warning
  - High-risk operations include warning message in modal
  - Delete and bash always require confirmation (no trust option)

**Story 4: Session Trust**
- **As a** user
- **I want** to trust AI for similar operations during my session
- **So that** I'm not interrupted by repetitive prompts
- **Acceptance Criteria:**
  - "Trust this session" checkbox appears for write/edit operations
  - Checking trust auto-approves future same-tool operations
  - Trust checkbox NOT shown for delete/bash (always prompt)
  - Session trust clears when conversation ends
  - Trust decisions logged to SOC

### Technical Implementation Details

**Step 1: Define Tool Types and Interfaces**
- Create ToolDefinition, ToolExecutor, ToolResult interfaces
- Create PermissionLevel enum and PermissionConfig
- Create PermissionRequest and PermissionResponse types

**Step 2: Implement ToolRegistry**
- Create Map-based registry for tool storage
- Implement register(), get(), getNames(), getSchemas() methods
- Register all 7 tool schema definitions

**Step 3: Implement ToolExecutionService**
- Create service class with registry and permission dependencies
- Implement executeTool() with validation, permission check, execution
- Implement error handling with AI-friendly messages
- Integrate SOC logging for all operations

**Step 4: Implement PermissionService**
- Create service class with IPC handlers
- Implement checkPermission() with permission level logic
- Implement promptForPermission() with IPC to renderer
- Implement session trust state management

**Step 5: Set Up IPC Channels**
- Add permission IPC channels to constants
- Create IPC handlers in main process
- Add electronAPI methods in preload script
- Set up renderer listeners for permission requests

**Step 6: Build PermissionStore**
- Create Zustand store with pendingRequest state
- Implement showPermissionPrompt, approvePermission, denyPermission actions
- Implement session trust state and actions
- Set up IPC listener for permission requests

**Step 7: Build PermissionModal Component**
- Create modal with operation details display
- Add risk indicator with color coding
- Add approve/deny buttons with styling
- Add keyboard handlers (Enter/Escape)
- Add trust checkbox for eligible operations

**Step 8: Integration Testing**
- Test complete flow: AI requests tool -> permission prompt -> approve/deny -> result
- Test session trust: approve with trust -> subsequent requests auto-approve
- Test denial: deny operation -> AI receives denial message
- Test high-risk: delete/bash always prompt regardless of trust

---

## Testing Strategy

### Unit Testing

**ToolRegistry Tests:**
```typescript
describe('ToolRegistry', () => {
  it('should register and retrieve tools', () => {
    const registry = new ToolRegistry();
    registry.register(mockReadTool);
    expect(registry.get('read')).toBe(mockReadTool);
  });

  it('should return undefined for unknown tools', () => {
    const registry = new ToolRegistry();
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('should return all tool schemas', () => {
    const registry = new ToolRegistry();
    registry.register(mockReadTool);
    registry.register(mockWriteTool);
    const schemas = registry.getSchemas();
    expect(schemas).toHaveLength(2);
  });
});
```

**ToolExecutionService Tests:**
```typescript
describe('ToolExecutionService', () => {
  it('should return error for unknown tool', async () => {
    const result = await service.executeTool('unknown', {}, mockContext);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNKNOWN_TOOL');
  });

  it('should check permission for required tools', async () => {
    await service.executeTool('write', { path: 'test.ts', content: '' }, mockContext);
    expect(mockPermissionService.checkPermission).toHaveBeenCalled();
  });

  it('should skip permission for ALWAYS_ALLOW tools', async () => {
    await service.executeTool('read', { path: 'test.ts' }, mockContext);
    expect(mockPermissionService.checkPermission).not.toHaveBeenCalled();
  });
});
```

**PermissionService Tests:**
```typescript
describe('PermissionService', () => {
  it('should return true for ALWAYS_ALLOW tools', async () => {
    const result = await service.checkPermission('read', { path: 'test.ts' }, mockContext);
    expect(result).toBe(true);
  });

  it('should prompt for PROMPT tools', async () => {
    const promptSpy = jest.spyOn(service, 'promptForPermission');
    await service.checkPermission('write', { path: 'test.ts', content: '' }, mockContext);
    expect(promptSpy).toHaveBeenCalled();
  });

  it('should respect session trust', async () => {
    service.setSessionTrust('write', true);
    const result = await service.checkPermission('write', { path: 'test.ts', content: '' }, mockContext);
    expect(result).toBe(true);
  });

  it('should never trust delete operations', async () => {
    service.setSessionTrust('delete', true);
    const promptSpy = jest.spyOn(service, 'promptForPermission');
    await service.checkPermission('delete', { path: 'test.ts' }, mockContext);
    expect(promptSpy).toHaveBeenCalled();  // Still prompted despite trust
  });
});
```

### Integration Testing

**Permission Flow Integration:**
```typescript
describe('Permission Flow Integration', () => {
  it('should complete approve flow', async () => {
    // 1. Trigger tool execution requiring permission
    const executePromise = service.executeTool('write', mockParams, mockContext);

    // 2. Simulate user approval via IPC
    ipcMain.emit(IPC_CHANNELS.PERMISSION_RESPONSE, null, {
      requestId: expect.any(String),
      approved: true,
      trustSession: false,
      timestamp: expect.any(String),
    });

    // 3. Verify execution completed
    const result = await executePromise;
    expect(result.success).toBe(true);
  });

  it('should complete deny flow', async () => {
    const executePromise = service.executeTool('write', mockParams, mockContext);

    ipcMain.emit(IPC_CHANNELS.PERMISSION_RESPONSE, null, {
      requestId: expect.any(String),
      approved: false,
      trustSession: false,
      timestamp: expect.any(String),
    });

    const result = await executePromise;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PERMISSION_DENIED');
  });
});
```

### Manual Testing

**Test 1: Tool Schema Validation**
- Verify all 7 tool schemas are registered
- Verify schemas match AIChatSDK expected format
- Verify AI can see tool definitions in conversation

**Test 2: Permission Modal Display**
- Trigger write operation, verify modal appears
- Verify operation details displayed correctly
- Verify file path displayed correctly
- Verify content preview displayed (for write operations)

**Test 3: Risk Level Indicators**
- Trigger write operation, verify yellow indicator
- Trigger delete operation, verify red indicator
- Trigger delete operation, verify warning message displayed

**Test 4: Approve/Deny Buttons**
- Click Approve button, verify operation executes
- Click Deny button, verify operation blocked
- Press Enter key, verify approve triggered
- Press Escape key, verify deny triggered

**Test 5: Session Trust**
- Approve write with "trust this session" checked
- Trigger another write, verify auto-approved (no modal)
- Trigger delete, verify modal appears (trust ignored)
- End conversation, verify trust cleared

**Test 6: Denial Feedback to AI**
- Deny a write operation
- Verify AI receives denial message
- Verify AI acknowledges denial in response

**Test 7: SOC Logging**
- Approve an operation, verify SOC log entry
- Deny an operation, verify SOC log entry
- Trust-approve an operation, verify SOC log entry
- Verify all log entries have correct timestamps and details

### Acceptance Criteria

- [ ] Tool calling infrastructure parses AI tool requests correctly
- [ ] All 7 tool schemas defined and registered
- [ ] ToolExecutionService validates parameters before execution
- [ ] Permission modal appears before write/edit/delete/bash operations
- [ ] Modal shows operation details (type, path, preview)
- [ ] Risk level color coding works (green/yellow/red)
- [ ] User can approve (green button, Enter key)
- [ ] User can deny (red button, Escape key)
- [ ] "Trust this session" checkbox functional for write/edit
- [ ] Delete and bash always require confirmation
- [ ] Denied operations reported back to AI with helpful message
- [ ] All permission decisions logged to SOC
- [ ] Tool results fed back to AI for next step
- [ ] Framework ready for Epic 3 tool implementations
- [ ] No permission bypass possible (100% blocking)
- [ ] Keyboard accessibility works (Tab, Enter, Escape)

---

## Dependencies and Risks

### Dependencies

**Prerequisites:**
- Feature 2.1 (AIChatSDK Integration) - provides AI communication
- Feature 2.2 (Chat Interface and Streaming) - provides conversation context

**Enables:**
- Epic 3 (File Operation Tools) - implements actual tool logic
- Epic 4 (Multi-Provider Support) - builds on tool framework
- Epic 5 (Advanced Editor Features) - diff view for tool results

### External Dependencies

| Dependency | Status | Impact if Unavailable | Mitigation |
|------------|--------|----------------------|------------|
| AIChatSDK tool calling | Available | Cannot parse tool requests | Guaranteed (Lighthouse owned) |
| Electron IPC | Available | Cannot prompt for permissions | Built into Electron |
| uuid package | Available | Cannot generate request IDs | Standard npm package |

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Permission prompt too slow** | Medium - delays tool execution | Low | Optimize IPC, test latency < 100ms |
| **User ignores permission prompt** | Low - operation blocked until response | Medium | 5-minute timeout with default deny |
| **Session trust bypasses security** | High - unintended operations | Low | Delete/bash never trustable, clear trust on conversation end |
| **Tool schema format mismatch** | Medium - AI cannot call tools | Low | Validate schemas against AIChatSDK format early |
| **Modal blocks important UI** | Low - user cannot see context | Low | Position modal to minimize overlap, keep compact |
| **Permission state lost on crash** | Medium - user must re-approve | Low | Session trust is ephemeral by design |

---

## Security Considerations

### Permission System Security

**Security Principles:**
1. **Default Deny**: All operations require permission unless explicitly configured as ALWAYS_ALLOW
2. **No Bypass**: Permission modal cannot be dismissed without explicit approve/deny
3. **No Escalation**: Session trust cannot be granted for high-risk operations
4. **Timeout Deny**: No response defaults to deny after timeout
5. **Audit Trail**: All decisions logged to SOC

**Security Requirements:**
- [ ] 100% of unapproved operations blocked
- [ ] No code path allows tool execution without permission check
- [ ] Session trust cannot be set for delete/bash
- [ ] Permission timeout defaults to deny
- [ ] All permission decisions logged with timestamps
- [ ] No sensitive data (content previews) logged to SOC

**Security Testing:**
- [ ] Attempt to execute write without permission - verify blocked
- [ ] Attempt to bypass modal (click outside, close button) - verify blocked
- [ ] Attempt to trust delete operation - verify checkbox hidden
- [ ] Verify timeout behavior - operation denied after 5 minutes

### IPC Security

**IPC Security Requirements:**
- [ ] Permission response validated before processing
- [ ] Only valid request IDs accepted
- [ ] IPC channels whitelisted in contextBridge
- [ ] No arbitrary code execution via IPC

---

## Architectural Alignment

### SOLID Principles

**Single Responsibility:**
- ToolRegistry: Only manages tool registration and lookup
- ToolExecutionService: Only manages tool execution lifecycle
- PermissionService: Only manages permission checking
- PermissionStore: Only manages permission UI state
- PermissionModal: Only renders permission UI

**Open/Closed:**
- New tools can be added by registering new ToolExecutor implementations
- New permission levels can be added without modifying existing code

**Liskov Substitution:**
- All ToolExecutor implementations follow same interface
- Any tool can be executed through ToolExecutionService

**Interface Segregation:**
- ToolExecutor interface is minimal (definition, execute, validate)
- PermissionService exposes only checkPermission and clearSessionTrust

**Dependency Inversion:**
- ToolExecutionService depends on ToolRegistry abstraction
- Components depend on PermissionStore abstraction

### ADR Compliance

- **ADR-002 (React + TypeScript)**: React components with TypeScript strict types
- **ADR-003 (Zustand)**: PermissionStore follows Zustand patterns
- **ADR-006 (AIChatSDK Integration)**: Tool schemas compatible with AIChatSDK
- **ADR-008 (Permission System UX)**: Modal dialog pattern implemented
- **ADR-010 (File Operation Tool Architecture)**: Tool interface matches Epic 3 design

### Development Best Practices

- **Anti-hardcoding**: Permission levels configurable, tool schemas declarative
- **Error handling**: All errors wrapped with AI-friendly messages
- **Logging**: All operations logged to SOC
- **Testing**: Unit tests for services, integration tests for flows
- **Security**: Defense in depth with multiple permission checks

---

## Success Criteria

**Feature Complete When:**
- [ ] All acceptance criteria met
- [ ] Tool framework parses AI tool requests correctly
- [ ] Permission modal blocks operations until user response
- [ ] Approve/deny flow works with buttons and keyboard
- [ ] Session trust works for eligible operations
- [ ] High-risk operations always prompt
- [ ] All decisions logged to SOC
- [ ] Tool results feed back to AI
- [ ] Framework ready for Epic 3 implementation

**Measurement:**
- Permission prompt latency: < 100ms (from tool request to modal display)
- Permission response latency: < 50ms (from button click to execution)
- Blocking rate: 100% of unapproved operations blocked
- SOC logging: 100% of decisions logged
- Accessibility: Keyboard navigation works for all interactions

**Epic 2 Exit Criteria (Met by This Feature):**
- Chat interface displays conversation history
- AI responses stream smoothly without UI blocking
- Users can send messages and receive AI responses
- **Tool calling infrastructure ready for file operation tools**
- **Permission prompts appear and work correctly**
- **All AI operations logged to SOC via AIChatSDK**
- No critical bugs in AI communication or chat UI

---

## Related Documentation

### Architecture Decision Records

- [ADR-006: AIChatSDK Integration Approach](../../architecture/decisions/ADR-006-aichatsdk-integration-approach.md) - Import pattern for AIChatSDK
- [ADR-008: Permission System UX Pattern](../../architecture/decisions/ADR-008-permission-system-ux-pattern.md) - Modal dialog design decisions
- [ADR-010: File Operation Tool Architecture](../../architecture/decisions/ADR-010-file-operation-tool-architecture.md) - Tool interface design for Epic 3

### Related Documents

- Epic 2 Master Plan: `Docs/implementation/_main/epic-2-ai-integration-master-plan.md`
- Epic 2 Detailed Plan: `Docs/implementation/_main/epic-2-ai-integration-aichatsdk.md`
- Epic 3 Plan: `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md` (enabled by this feature)
- Product Vision: `Docs/architecture/_main/01-Product-Vision.md` (Human in Control principle)
- Business Requirements: `Docs/architecture/_main/03-Business-Requirements.md` (FR-6, FR-9)

---

**Feature Owner:** Roy Love
**Created Date:** 2026-01-19
**Last Updated:** 2026-01-19
**Status:** Planning
**Next Review:** After Wave 2.3.2 completion
