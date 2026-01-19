---
description:
  Archive completed sprint documentation to clean folders for next sprint
---

# Documentation Archive Command

Run **after sprint complete**, before starting next sprint.

## Configuration

**Docs Root:** `Docs/`

**Canonical Folders:** architecture/, planning/, implementation/, reports/,
dev_notes/

**Permanent Keepers (Never Archive):**

- README.md (in any folder)
- architecture/decisions/ (entire folder - all ADRs)
- Files ending in -INDEX.md
- DOCUMENTATION_INDEX.md

## Command Modes

User can invoke with:

1. **Full archive** - `/docs-archive`
   - Archive all canonical folders
   - Keep only permanent keepers

2. **With skip list** - `/docs-archive skip <files>`
   - Archive all except skipped files + keepers
   - Examples: `skip planning/roadmap.md architecture/new-design.md`
   - Supports wildcards: `skip planning/MULTI_*`

3. **Preview mode** - `/docs-archive preview`
   - Show what WOULD be archived
   - Don't move any files

4. **Single folder** - `/docs-archive <folder>`
   - Archive only specified folder
   - Examples: `planning`, `reports`

## Instructions for Claude

When this command is invoked:

1. **Parse the command** to determine mode and parameters
2. **Invoke docs-lifecycle-manager agent** with:
   - Mode (full, preview, single folder)
   - Skip list (if provided)
   - Target folder (if single folder mode)
   - Config (pass the config above)

The agent has the logic to execute the archival.
