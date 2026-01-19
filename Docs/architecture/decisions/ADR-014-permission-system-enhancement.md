# ADR-014: Permission System Enhancement (Per-Tool Controls)

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Lighthouse Development Team
**Related**: Epic-3, Feature-3.3, Epic-2 (Foundation), Business Requirements (FR-6)

---

## Context

Epic 2 established foundation permission system with modal dialogs for approve/deny. Epic 3 adds seven file operation tools (read, write, edit, delete, glob, grep, bash), each with different risk levels. Users need more granular control:
- Not all operations equally risky (read vs delete)
- Repetitive prompts disrupt workflow (multiple file writes)
- Power users want to trust AI for session
- Security-conscious users want per-tool control
- Different projects have different risk tolerances

**Requirements:**
- Per-tool permission settings (always-allow, always-deny, prompt)
- "Trust this session" option to skip repetitive prompts
- Dangerous operations (delete, bash) always prompt (no trust option)
- Sandboxing rules (restrict operations to specific directories)
- Permission history logging (audit who approved what)
- Settings persistence across sessions
- UI for managing permissions (future - Epic 4)
- Backward compatible with Epic 2 foundation

**Constraints:**
- Must integrate with existing modal permission system (ADR-008)
- Build on Epic 2 permission infrastructure
- Don't break existing permission workflows
- Keep MVP simple - advanced features in Epic 4

**Risk Levels:**
- **Safe** (read, glob, grep): Read-only operations
- **Moderate** (write, edit): Modify files but recoverable
- **Dangerous** (delete, bash): Destructive, hard to undo

---

## Considered Options

- **Option 1: Per-Tool Permission Levels** - Always-allow, always-deny, prompt per tool
- **Option 2: Risk-Based Auto-Approval** - Auto-approve safe operations, prompt for risky
- **Option 3: Session-Based Trust** - "Trust all operations for this session" checkbox
- **Option 4: Directory-Based Rules** - Different permissions for different directories
- **Option 5: Time-Based Trust** - Trust operations for N minutes, then revert
- **Option 6: No Enhancement** - Keep simple prompt-always from Epic 2

---

## Decision

**We have decided to implement per-tool permission levels (always-allow, always-deny, prompt) with "trust this session" option for moderate-risk operations, while always prompting for dangerous operations.**

### Why This Choice

Per-tool permissions provide flexibility without overwhelming complexity for MVP.

**Key factors:**

1. **Graduated Control**: Different tools have different risk levels - permissions should match

2. **Workflow Efficiency**: "Trust this session" reduces repetitive prompts for batch operations

3. **Safety First**: Dangerous operations (delete, bash) always require explicit approval

4. **User Choice**: Users decide their own risk tolerance per tool

5. **MVP Appropriate**: Simple enough for Epic 3, foundation for Epic 4 enhancements

**Permission model:**

```typescript
// src/services/PermissionService.ts
export enum PermissionLevel {
  ALWAYS_ALLOW = 'always-allow',  // Auto-approve, no prompt
  PROMPT = 'prompt',                // Show permission modal (default)
  ALWAYS_DENY = 'always-deny'       // Auto-deny, no prompt
}

export interface ToolPermission {
  tool: string;
  level: PermissionLevel;
  canTrustSession: boolean;  // Can user skip prompts for session?
  trustedThisSession: boolean;  // Is tool trusted for current session?
}

export const DEFAULT_PERMISSIONS: Record<string, ToolPermission> = {
  // Safe operations - auto-allow by default
  read: {
    tool: 'read',
    level: PermissionLevel.ALWAYS_ALLOW,
    canTrustSession: false,  // N/A (already always-allow)
    trustedThisSession: false
  },
  glob: {
    tool: 'glob',
    level: PermissionLevel.ALWAYS_ALLOW,
    canTrustSession: false,
    trustedThisSession: false
  },
  grep: {
    tool: 'grep',
    level: PermissionLevel.ALWAYS_ALLOW,
    canTrustSession: false,
    trustedThisSession: false
  },

  // Moderate operations - prompt by default, can trust session
  write: {
    tool: 'write',
    level: PermissionLevel.PROMPT,
    canTrustSession: true,  // Can skip prompts for session
    trustedThisSession: false
  },
  edit: {
    tool: 'edit',
    level: PermissionLevel.PROMPT,
    canTrustSession: true,
    trustedThisSession: false
  },

  // Dangerous operations - always prompt, cannot trust session
  delete: {
    tool: 'delete',
    level: PermissionLevel.PROMPT,
    canTrustSession: false,  // ALWAYS prompt (safety)
    trustedThisSession: false
  },
  bash: {
    tool: 'bash',
    level: PermissionLevel.PROMPT,
    canTrustSession: false,  // ALWAYS prompt (safety)
    trustedThisSession: false
  }
};
```

**Permission check flow:**

```typescript
// src/services/PermissionService.ts
export class PermissionService {
  private permissions: Map<string, ToolPermission> = new Map();

  async checkPermission(
    tool: string,
    params: unknown
  ): Promise<PermissionResult> {
    const permission = this.permissions.get(tool) || DEFAULT_PERMISSIONS[tool];

    // 1. Check if always-allow
    if (permission.level === PermissionLevel.ALWAYS_ALLOW) {
      return { granted: true, source: 'always-allow' };
    }

    // 2. Check if always-deny
    if (permission.level === PermissionLevel.ALWAYS_DENY) {
      return { granted: false, source: 'always-deny' };
    }

    // 3. Check if trusted for this session
    if (permission.trustedThisSession && permission.canTrustSession) {
      return { granted: true, source: 'trusted-session' };
    }

    // 4. Show permission modal
    const response = await this.showPermissionModal({
      tool,
      params,
      canTrustSession: permission.canTrustSession
    });

    // 5. Update session trust if user checked "trust this session"
    if (response.trustSession && permission.canTrustSession) {
      this.permissions.set(tool, {
        ...permission,
        trustedThisSession: true
      });
    }

    // 6. Log decision
    await this.logPermissionDecision({
      tool,
      params,
      granted: response.granted,
      source: 'user-prompt',
      trustSession: response.trustSession
    });

    return {
      granted: response.granted,
      source: 'user-prompt'
    };
  }

  // Reset session trust (e.g., when conversation ends)
  resetSessionTrust(): void {
    this.permissions.forEach((permission, tool) => {
      if (permission.trustedThisSession) {
        this.permissions.set(tool, {
          ...permission,
          trustedThisSession: false
        });
      }
    });
  }

  // Load saved permissions from storage
  async loadPermissions(): Promise<void> {
    const saved = await window.api.loadPermissions();
    Object.entries(saved).forEach(([tool, permission]) => {
      this.permissions.set(tool, permission);
    });
  }

  // Save permissions to storage
  async savePermissions(): Promise<void> {
    const permissions = Object.fromEntries(this.permissions);
    await window.api.savePermissions(permissions);
  }
}
```

**Enhanced permission modal:**

```tsx
// src/components/PermissionModal.tsx
interface PermissionModalProps {
  tool: string;
  params: unknown;
  canTrustSession: boolean;  // Show "trust session" checkbox?
  onResponse: (response: PermissionResponse) => void;
}

function PermissionModal({
  tool,
  params,
  canTrustSession,
  onResponse
}: PermissionModalProps) {
  const [trustSession, setTrustSession] = useState(false);
  const riskLevel = getRiskLevel(tool);

  return (
    <Modal>
      <Header risk={riskLevel}>
        <RiskIcon risk={riskLevel} />
        <Title>AI wants to {tool} {/* operation name */}</Title>
      </Header>

      <Body>
        <OperationDetails tool={tool} params={params} />
        <RiskWarning risk={riskLevel} />
      </Body>

      <Footer>
        {canTrustSession && (
          <Checkbox>
            <input
              type="checkbox"
              checked={trustSession}
              onChange={(e) => setTrustSession(e.target.checked)}
            />
            <label>Trust AI for this session (skip future {tool} prompts)</label>
          </Checkbox>
        )}

        {!canTrustSession && (
          <Warning>
            ⚠️ This operation always requires approval for safety
          </Warning>
        )}

        <Actions>
          <Button variant="deny" onClick={() => onResponse({ granted: false })}>
            Deny (Esc)
          </Button>
          <Button
            variant="approve"
            onClick={() => onResponse({ granted: true, trustSession })}
          >
            Approve (Enter)
          </Button>
        </Actions>
      </Footer>
    </Modal>
  );
}
```

**Sandboxing rules (future enhancement - documented here for completeness):**

```typescript
// Epic 4 enhancement - not implemented in Epic 3
interface SandboxRule {
  pattern: string;  // Glob pattern (e.g., "src/**/*")
  tools: string[];  // Which tools allowed
  action: 'allow' | 'deny';
}

// Example: Only allow AI to modify files in src/ directory
const rules: SandboxRule[] = [
  {
    pattern: 'src/**/*',
    tools: ['write', 'edit', 'delete'],
    action: 'allow'
  },
  {
    pattern: '**/*.config.js',
    tools: ['write', 'edit'],
    action: 'deny'  // Never modify config files
  }
];
```

**Why we rejected alternatives:**

- **Risk-based auto-approval**: Less user control, some users want to see all operations
- **Session trust only**: Not granular enough, users want per-tool control
- **Directory-based rules**: Too complex for MVP, adds significant UI complexity
- **Time-based trust**: Confusing UX (when does trust expire?), hard to communicate
- **No enhancement**: Repetitive prompts too disruptive, doesn't address workflow efficiency

---

## Consequences

### Positive

- **Flexible Control**: Users choose risk tolerance per tool
- **Workflow Efficiency**: "Trust session" reduces repetitive prompts for batch operations
- **Safety Preserved**: Dangerous operations always require approval
- **Simple UX**: Checkbox in existing modal, no new UI needed for MVP
- **Audit Trail**: All permission decisions logged with source (always-allow, trusted, user-prompt)
- **Foundation for Epic 4**: Per-tool settings enable preferences UI in Epic 4

### Negative

- **Session State Complexity**: Must track trusted state per tool, reset on conversation end
- **User Confusion**: "Trust session" concept may need explanation
- **No Directory Rules**: Cannot restrict AI to specific folders (Epic 4 enhancement)
- **Persistence Required**: Must save permission levels across app restarts

### Mitigation Strategies

**For session state:**
- Clear session trust on conversation end (natural boundary)
- Provide "Reset Trust" button in chat interface
- Show indicator when tools are trusted (e.g., "🔓 write trusted for session")

**For user confusion:**
- Tooltip on "trust session" checkbox explaining behavior
- Help documentation with examples
- Default to safest option (not checked)
- Show warning for first-time trust

**For directory rules:**
- Document as Epic 4 enhancement
- For MVP, sandboxing to project root sufficient (ADR-011)
- Gather feedback on need for directory rules

**For persistence:**
- Store permissions in Electron userData (JSON file)
- Validate on load (schema checking)
- Provide "Reset to Defaults" option
- Default to safe settings if file corrupted

---

## References

- Epic 2 Plan: `Docs/implementation/_main/epic-2-ai-integration-aichatsdk.md` (Permission foundation)
- Epic 3 Plan: `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md` (Enhancement)
- Business Requirements: FR-6 (Permission and Safety Controls)
- Product Vision: Human in Control principle
- Related ADRs:
  - ADR-008: Permission System UX Pattern (Foundation)
  - ADR-010: File Operation Tool Architecture
  - ADR-011: Directory Sandboxing Approach
  - ADR-012: Bash Command Safety Strategy
- Implementation:
  - `src/services/PermissionService.ts`
  - `src/components/PermissionModal.tsx`
  - `src/storage/permissions.json` (persistence)

---

**Last Updated**: 2026-01-19
