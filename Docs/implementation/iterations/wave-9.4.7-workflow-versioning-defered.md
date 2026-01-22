# Wave 9.4.7: Workflow Versioning

## Wave Overview
- **Wave ID:** Wave-9.4.7
- **Feature:** Feature 9.4 - Advanced Control Flow
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Add workflow versioning with git integration for tracking changes, diffing, and rollback
- **Wave Goal:** Enable users to track workflow changes over time and rollback to previous versions
- **Estimated Hours:** 24 hours

## Wave Goals

1. Create WorkflowVersioning service (git commit, diff, rollback)
2. Implement VersionHistoryPanel component (view commit history)
3. Add git diff view for workflow changes
4. Enable workflow rollback to previous versions
5. Provide merge conflict resolution UI

## User Stories

### User Story 1: Workflow Version Tracking

**As a** workflow designer
**I want** my workflow changes automatically tracked with git
**So that** I have a complete history of workflow evolution

**Acceptance Criteria:**
- [ ] WorkflowVersioning service initializes git repository in workflow directory
- [ ] Workflow saves create git commits automatically
- [ ] Commit messages include: timestamp, user, change summary
- [ ] Version history viewable via VersionHistoryPanel
- [ ] Performance: Git commit adds <200ms overhead to save
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 10 hours

**Objective UCP:** 15 UUCW (Average complexity: 5 transactions - git init, auto-commit on save, commit message generation, version history retrieval, performance optimization)

---

### User Story 2: Workflow Diff and Rollback

**As a** workflow user
**I want** to view workflow changes between versions and rollback if needed
**So that** I can recover from mistakes or compare workflow iterations

**Acceptance Criteria:**
- [ ] VersionHistoryPanel shows commit list with timestamps and messages
- [ ] Click commit to view diff (side-by-side YAML comparison)
- [ ] Diff highlights added/removed/modified nodes and edges
- [ ] "Rollback" button restores workflow to selected version
- [ ] Rollback confirmation dialog prevents accidental data loss
- [ ] Unit tests for diff and rollback (≥90% coverage)
- [ ] Integration tests validate end-to-end versioning

**Priority:** High

**Estimated Hours:** 12 hours

**Objective UCP:** 15 UUCW (Average complexity: 6 transactions - commit list display, diff generation, YAML comparison, rollback logic, confirmation dialog, integration testing)

---

### User Story 3: Merge Conflict Resolution

**As a** workflow designer
**I want** to resolve merge conflicts when collaborating on workflows
**So that** multiple users can work on workflows without losing changes

**Acceptance Criteria:**
- [ ] Merge conflicts detected when multiple users edit same workflow
- [ ] MergeConflictDialog shows conflicting changes side-by-side
- [ ] User chooses: keep local, keep remote, or merge manually
- [ ] Manual merge editor allows combining changes
- [ ] Resolved merge creates new commit
- [ ] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - conflict detection, resolution UI, merge commit)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] Integration tests validate versioning workflow
- [ ] No TypeScript/linter errors
- [ ] Performance: Git operations add <200ms overhead
- [ ] Code reviewed and approved
- [ ] Documentation updated (versioning guide, rollback instructions)
- [ ] Demo: Workflow changes tracked, diff viewed, rollback successful

## Notes

**Architecture References:**
- Feature 9.3 WorkflowService for file operations
- Git CLI or isomorphic-git library for git operations
- ADR-016 for file security considerations

**Git Integration Strategy:**

**Option 1: Git CLI (Recommended):**
- Use `child_process.spawn` to execute git commands
- Pros: Full git feature support, mature
- Cons: Requires git installed on system

**Option 2: isomorphic-git:**
- Pure JavaScript git implementation
- Pros: No external dependencies
- Cons: Limited feature support, performance overhead

**Recommended: Git CLI** (Option 1)

**Workflow Directory Structure:**

```
~/Documents/Lighthouse/workflows/
  .git/                    ← Git repository
  documentation-generator.yaml
  code-review-automation.yaml
  batch-file-processing.yaml
```

**Auto-Commit Behavior:**

```typescript
// On workflow save
async saveWorkflow(workflow: Workflow): Promise<void> {
  // Save YAML file
  await fs.writeFile(workflowPath, yaml.stringify(workflow));

  // Auto-commit to git
  await git.add(workflowPath);
  await git.commit(`Update workflow: ${workflow.name}\n\nTimestamp: ${new Date().toISOString()}\nUser: ${os.userInfo().username}`);
}
```

**Version History UI:**

```
┌────────────────────────────────────────────────┐
│ Version History: documentation-generator       │
├────────────────────────────────────────────────┤
│ 🕐 2026-01-21 14:32 - Update workflow inputs  │
│    Added api_key parameter                    │
│    [View Diff] [Rollback]                     │
│                                                │
│ 🕐 2026-01-21 10:15 - Add error handling      │
│    Added retry policy to API call step        │
│    [View Diff] [Rollback]                     │
│                                                │
│ 🕐 2026-01-20 16:48 - Initial creation        │
│    Created documentation generator workflow    │
│    [View Diff]                                 │
└────────────────────────────────────────────────┘
```

**Diff View UI:**

```
┌──────────────────────────────────────────────────────────┐
│ Diff: 2026-01-21 14:32 vs 2026-01-21 10:15              │
├──────────────────────────────────────────────────────────┤
│ Before (10:15)          │ After (14:32)                  │
├─────────────────────────┼────────────────────────────────┤
│ inputs:                 │ inputs:                        │
│   repository_path: ...  │   repository_path: ...         │
│                         │ + api_key: ...          (NEW) │
│                         │                                │
│ steps:                  │ steps:                         │
│   - id: fetch_data      │   - id: fetch_data             │
│     type: python        │     type: python               │
│     ...                 │     ...                        │
│                         │ +   retry_policy:       (NEW)  │
│                         │ +     max_attempts: 3          │
└─────────────────────────┴────────────────────────────────┘
```

**Rollback Confirmation Dialog:**

```
┌────────────────────────────────────────────────┐
│ Confirm Rollback                               │
├────────────────────────────────────────────────┤
│ Are you sure you want to rollback to:         │
│                                                │
│ Version: 2026-01-21 10:15                      │
│ Message: "Add error handling"                  │
│                                                │
│ ⚠️ This will discard all changes made after   │
│    this version. This action cannot be undone. │
│                                                │
│ [Cancel]                          [Rollback]   │
└────────────────────────────────────────────────┘
```

**Merge Conflict Resolution:**

```
┌────────────────────────────────────────────────┐
│ Merge Conflict Detected                        │
├────────────────────────────────────────────────┤
│ Local Changes:                                 │
│   - Added retry_policy to fetch_data           │
│                                                │
│ Remote Changes:                                │
│   - Added timeout to fetch_data                │
│                                                │
│ Resolution:                                    │
│   ○ Keep Local Changes                         │
│   ○ Keep Remote Changes                        │
│   ● Merge Both Changes (Recommended)           │
│                                                │
│ [Cancel]                            [Resolve]  │
└────────────────────────────────────────────────┘
```

**Implementation Details:**

```typescript
export class WorkflowVersioning {
  constructor(private workflowDir: string) {}

  async init(): Promise<void> {
    // Initialize git repository if not exists
    if (!fs.existsSync(path.join(this.workflowDir, '.git'))) {
      await git.init(this.workflowDir);
    }
  }

  async commit(workflowPath: string, message: string): Promise<string> {
    await git.add(workflowPath);
    const commitHash = await git.commit(message);
    return commitHash;
  }

  async getHistory(workflowPath: string): Promise<Commit[]> {
    const log = await git.log({ file: workflowPath });
    return log.all;
  }

  async diff(workflowPath: string, commit1: string, commit2: string): Promise<string> {
    const diff = await git.diff([commit1, commit2, '--', workflowPath]);
    return diff;
  }

  async rollback(workflowPath: string, commitHash: string): Promise<void> {
    await git.checkout(commitHash, [workflowPath]);
    await git.commit(`Rollback to ${commitHash}`);
  }
}
```

**Security Considerations:**
- Validate workflow files before git commit
- Prevent git operations outside workflow directory
- Redact sensitive data from commit messages

---

**Total Stories:** 3
**Total Hours:** 24 hours
**Total Objective UCP:** 35 UUCW
**Wave Status:** Planning
