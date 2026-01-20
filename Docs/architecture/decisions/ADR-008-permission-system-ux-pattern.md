# ADR-008: Permission System UX Pattern

**Status**: Implemented
**Date**: 2026-01-19
**Implementation Date**: 2026-01-20
**Deciders**: Lighthouse Development Team
**Related**: Epic-2, Feature-2.3, Product Vision (Human in Control), Business Requirements (FR-6)
**Implemented In**: Wave 2.3.2 (PermissionModal.tsx, PermissionStore.ts)

---

## Context

Lighthouse Chat IDE enables AI to perform file operations conversationally. This is powerful but requires robust permission controls to ensure:
- User maintains authority over all file system changes (Product Vision: "Human in Control")
- AI cannot perform destructive operations without explicit approval
- User understands what operation AI is requesting before it executes
- Workflow remains efficient (not too many disruptive prompts)
- All decisions logged for audit trail (SOC compliance)

**Requirements:**
- Permission prompt before write/delete/bash operations
- Show operation details (type, parameters, affected files)
- Clear approve/deny actions
- Remember user decisions (optional "trust this session")
- Non-blocking for read-only operations (read, glob, grep)
- Log all permission decisions to SOC
- Work in Electron renderer process (UI)
- Integrate with AIChatSDK tool execution

**Constraints:**
- Must not block AI streaming responses (async prompt)
- Should not require approval for every single read operation (too disruptive)
- Dangerous operations (delete, bash) always require confirmation
- Epic 2 is foundation - Epic 3 will add per-tool granularity
- UX must be clear to non-technical users

**User Stories:**
- As a user, I want to approve AI file changes before they happen
- As a user, I want to understand what operation AI is requesting
- As a user, I want to trust AI for a session without constant prompts
- As a developer, I want to review dangerous operations (delete, bash)

---

## Considered Options

- **Option 1: Modal Dialog with Operation Details** - Block UI with modal showing full details
- **Option 2: Toast Notification with Approve/Deny** - Non-blocking toast in corner
- **Option 3: Inline Prompt in Chat Interface** - Show prompt directly in conversation
- **Option 4: Permission Bar at Bottom** - Persistent bar with pending operations queue
- **Option 5: Auto-Approve with Undo** - Execute immediately, provide undo button
- **Option 6: Command Palette Style** - Keyboard-driven permission flow

---

## Decision

**We have decided to use a modal dialog for permission prompts with clear operation details, approve/deny buttons, and optional "trust this session" checkbox.**

### Why This Choice

Modal dialogs provide the clearest, most deliberate approval flow while ensuring users cannot miss permission requests.

**Key factors:**

1. **User Awareness**: Modal blocks UI, forcing user to acknowledge the permission request. Critical for destructive operations.

2. **Information Display**: Modal provides sufficient space to show:
   - Operation type (write, delete, bash)
   - Full parameters (file path, command, content preview)
   - Risk level (color-coded: green=safe, yellow=caution, red=dangerous)
   - Impact description ("This will overwrite existing file")

3. **Clear Actions**: Large, color-coded buttons:
   - "Approve" (green) - Execute operation
   - "Deny" (red) - Cancel operation
   - "Trust This Session" (checkbox) - Skip future prompts for this operation type

4. **Familiar Pattern**: Users understand modal dialogs from existing applications (VS Code, IDEs, OS)

5. **Keyboard Accessible**: Enter=approve, Escape=deny, Tab to navigate

6. **Async Design**: Modal doesn't block AI response streaming - shows after response complete

**Modal structure:**

```tsx
<PermissionModal>
  <Header>
    <Icon risk="high" /> {/* Red warning icon for dangerous operations */}
    <Title>AI wants to delete a file</Title>
  </Header>

  <Body>
    <Operation>
      <Label>Operation:</Label>
      <Value>delete</Value>
    </Operation>

    <Details>
      <Label>File:</Label>
      <Code>src/oldFeature.ts</Code>
    </Details>

    <Impact risk="high">
      ⚠️ This will permanently delete the file. This action cannot be undone.
    </Impact>
  </Body>

  <Footer>
    <Checkbox>
      <input type="checkbox" id="trust" />
      <label>Trust AI for this session (skip future delete prompts)</label>
    </Checkbox>

    <Actions>
      <Button variant="deny" onClick={handleDeny}>
        Deny (Esc)
      </Button>
      <Button variant="approve" onClick={handleApprove}>
        Approve (Enter)
      </Button>
    </Actions>
  </Footer>
</PermissionModal>
```

**Permission levels (Epic 2 foundation, Epic 3 enhancement):**

| Operation | Default Permission | Can Trust Session? |
|-----------|-------------------|-------------------|
| read      | Always allow      | N/A               |
| glob      | Always allow      | N/A               |
| grep      | Always allow      | N/A               |
| write     | Prompt            | Yes               |
| edit      | Prompt            | Yes               |
| delete    | Prompt (high risk)| No (always prompt)|
| bash      | Prompt (high risk)| No (always prompt)|

**Why we rejected alternatives:**

- **Toast notification**: Too easy to miss, especially for dangerous operations
- **Inline chat prompt**: Clutters conversation history, harder to implement clear approve/deny
- **Permission bar**: Less noticeable, user might not see pending operations
- **Auto-approve with undo**: Too risky - user might not notice operation happened
- **Command palette**: Unfamiliar pattern, harder to discover

---

## Consequences

### Positive

- **User Control**: User explicitly approves every dangerous operation
- **Clear Communication**: Operation details fully visible before execution
- **Safety First**: Impossible to miss permission request (modal blocks)
- **Flexible Trust**: "Trust this session" reduces repetitive prompts
- **Audit Trail**: All approve/deny decisions logged to SOC
- **Accessible**: Keyboard shortcuts for power users
- **Familiar UX**: Pattern users recognize from existing tools

### Negative

- **Workflow Interruption**: Modal blocks UI until user responds
- **Context Switching**: User must shift focus from conversation to permission prompt
- **Repetitive for Batch Operations**: Multiple file writes require multiple approvals (mitigated by "trust session")
- **Blocking Nature**: Cannot interact with app while modal open
- **Visual Clutter**: Modal overlays conversation (temporary)

### Mitigation Strategies

**For workflow interruption:**
- Implement "trust this session" to reduce repetitive prompts
- Batch similar operations when possible (Epic 3 enhancement)
- Make modal dismissible with Escape key for quick deny
- Show modal only after AI response complete (don't interrupt streaming)

**For batch operations:**
- Epic 3 will add "approve all" option for multiple similar operations
- Consider queue system for multiple pending operations
- Allow keyboard shortcuts to approve rapidly (Enter, Enter, Enter)

**For context switching:**
- Keep modal compact - only essential information
- Position modal near chat area (less eye travel)
- Auto-focus approve button (Enter key approves immediately)

**For user fatigue:**
- Monitor prompt frequency in analytics
- Tune default permissions based on user feedback
- Epic 4 adds per-tool granular settings in preferences

---

## References

- Product Vision: Docs/architecture/_main/01-Product-Vision.md (Section: Human in Control)
- Business Requirements: FR-6 (Permission and Safety Controls)
- Epic 2 Plan: `Docs/implementation/_main/epic-2-ai-integration-aichatsdk.md`
- Epic 3 Plan: `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md` (Permission enhancements)
- [VS Code Permission Prompts](https://code.visualstudio.com/) - Similar pattern
- Related ADRs:
  - ADR-002: React + TypeScript for UI
  - ADR-006: AIChatSDK Integration Approach
- Implementation: `src/components/PermissionModal.tsx`
- Designs: Docs/architecture/_main/06-Design.md (Permission Flow)

---

**Last Updated**: 2026-01-19
