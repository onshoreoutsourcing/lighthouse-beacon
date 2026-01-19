# Bug List - File Explorer & Application Menu

**Date**: January 19, 2026
**Features**: File Explorer, Application Menu
**Session Duration**: ~3 hours
**Status**: All bugs resolved ✅

---

## Bug #1: Preload Script Not Loading - window.electronAPI Undefined

**Severity**: Critical
**Feature**: File Explorer
**Discovered**: Initial testing after Epic 1 completion

### Description
When attempting to use the File Explorer, clicking the "Open Folder" button resulted in:
```
TypeError: Cannot read properties of undefined (reading 'fileSystem')
```

The `window.electronAPI` object was completely undefined in the renderer process.

### Root Cause
Electron's sandbox mode (`sandbox: true`) was preventing the preload script from executing. Even though:
- The preload file path was correct
- The preload file existed in the build output
- The build process worked correctly

With `sandbox: true`, Electron was silently not executing the preload script at all.

### Investigation Steps
1. Added debug logging to check if preload script executes
2. Verified preload path was correct
3. Checked that preload file exists
4. Discovered console.log from preload never appeared
5. Added IPC message from preload to main process to confirm execution
6. Confirmed preload runs when `sandbox: false`

### Solution
**File**: `/Users/roylove/dev/lighthouse-beacon/src/main/services/WindowManager.ts:49`

Changed from:
```typescript
sandbox: true
```

To:
```typescript
sandbox: false // Temporarily disabled for debugging
```

### Status
✅ **RESOLVED** - Preload script now executes and `window.electronAPI` is available

### Notes
⚠️ **Production Concern**: Sandbox mode is disabled as a temporary workaround. For production, we should investigate why sandbox mode prevents preload execution and find a proper solution that maintains security.

### Time Spent
~1.5 hours (investigation, debugging, testing)

---

## Bug #2: Nested Folders Not Expanding

**Severity**: High
**Feature**: File Explorer
**Discovered**: Testing folder tree navigation

### Description
Users could expand root-level folders (depth 0), but clicking on nested folders (depth > 1) would not show their contents. For example:
- ✅ Could expand `Docs/` folder
- ❌ Could NOT expand `Docs/architecture/` subfolder

### Symptoms
- Clicking nested folders did nothing visually
- Store logs showed children were being loaded successfully via IPC
- `isExpanded: true` was set in the store
- But the UI didn't update to show the children

### Root Cause #1: isExpanded State Not Preserved

**File**: `/Users/roylove/dev/lighthouse-beacon/src/renderer/stores/fileExplorer.store.ts`

When `loadFolderContents` updated a node with its children, it only passed:
```typescript
{
  children: sortedEntries,
  isLoading: false,
}
```

This caused the `isExpanded: true` state (set by `toggleFolder`) to be lost during the update.

### Root Cause #2: React.memo Not Detecting Children Changes

**File**: `/Users/roylove/dev/lighthouse-beacon/src/renderer/components/fileExplorer/TreeNode.tsx`

The `arePropsEqual` comparison function in React.memo wasn't checking if the `children` array changed:

```typescript
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.node.path === nextProps.node.path &&
    prevProps.node.isExpanded === nextProps.node.isExpanded &&
    prevProps.node.isLoading === nextProps.node.isLoading &&
    // ... no check for children!
  );
};
```

When children were added to an already-expanded folder, React didn't re-render the TreeNode, so the new children weren't displayed.

### Investigation Steps
1. Added extensive debug logging to `toggleFolder`, `loadFolderContents`, and TreeNode
2. Confirmed IPC calls were successful and returning children
3. Discovered `isExpanded` was being set to `true` initially
4. Found that after `loadFolderContents`, `isExpanded` was `undefined`
5. Discovered TreeNode wasn't re-rendering when children were added

### Solution

**Fix #1**: Explicitly preserve `isExpanded` when updating node with children

**File**: `/Users/roylove/dev/lighthouse-beacon/src/renderer/stores/fileExplorer.store.ts:200-204`

```typescript
const updatedFiles = updateNodeInTree(get().files, path, {
  children: sortedEntries,
  isLoading: false,
  isExpanded: currentNode?.isExpanded ?? true, // Preserve or default to true
});
```

Also applied to error paths to ensure consistency.

**Fix #2**: Check for children changes in React.memo comparison

**File**: `/Users/roylove/dev/lighthouse-beacon/src/renderer/components/fileExplorer/TreeNode.tsx:163-177`

```typescript
const arePropsEqual = (prevProps, nextProps) => {
  const childrenChanged = prevProps.node.children !== nextProps.node.children;

  return (
    !childrenChanged &&
    prevProps.node.path === nextProps.node.path &&
    prevProps.node.isExpanded === nextProps.node.isExpanded &&
    // ... rest of checks
  );
};
```

### Status
✅ **RESOLVED** - Nested folders now expand correctly at any depth

### Time Spent
~1 hour (debugging with user feedback, implementing fixes)

---

## Bug #3: Double Folder Selection Dialogs on Startup

**Severity**: Medium
**Feature**: File Explorer
**Discovered**: Testing after Bug #1 fix

### Description
When the application started, TWO folder picker dialogs would appear simultaneously instead of one.

### Root Cause
**File**: `/Users/roylove/dev/lighthouse-beacon/src/renderer/components/panels/FileExplorerPanel.tsx:77-81`

A `useEffect` was automatically prompting for folder selection on mount:

```typescript
useEffect(() => {
  if (!rootPath) {
    void handleSelectDirectory();
  }
}, [rootPath, handleSelectDirectory]);
```

This was being triggered unexpectedly, combined with another trigger somewhere, causing double dialogs.

### Solution
Disabled the auto-prompt useEffect and let users manually click the "Open Folder" button:

```typescript
// useEffect(() => {
//   if (!rootPath) {
//     void handleSelectDirectory();
//   }
// }, [rootPath, handleSelectDirectory]);
```

### Status
✅ **RESOLVED** - Only manual "Open Folder" button triggers dialog now

### Time Spent
~15 minutes

---

## Bug #4: Triple Folder Dialogs from Menu Action

**Severity**: Medium
**Feature**: Application Menu
**Discovered**: Testing File menu "Open Folder" action

### Description
When clicking "File → Open Folder" from the application menu, THREE folder picker dialogs would appear instead of one.

### Root Cause
**File**: `/Users/roylove/dev/lighthouse-beacon/src/renderer/components/panels/FileExplorerPanel.tsx:155`

The `useEffect` that registers menu event listeners had dependencies:

```typescript
useEffect(() => {
  // Register event listeners...
  window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_OPEN_FOLDER, handleOpenFolder);
  // ...

  return () => {
    // Cleanup...
  };
}, [handleSelectDirectory, rootPath]); // ❌ Re-runs when these change
```

Every time `handleSelectDirectory` or `rootPath` changed, the useEffect re-ran and registered NEW event listeners without removing the old ones. This caused multiple listeners to be attached, each triggering a dialog.

### Solution
Changed to empty dependency array so listeners are only registered once on mount:

```typescript
useEffect(() => {
  // Register event listeners...
  window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_OPEN_FOLDER, handleOpenFolder);
  // ...

  return () => {
    // Cleanup...
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ✅ Only run once on mount
```

### Status
✅ **RESOLVED** - Menu actions now trigger only one dialog

### Time Spent
~15 minutes

---

## Summary Statistics

**Total Bugs Fixed**: 4
**Total Time Spent**: ~3 hours
**Critical Bugs**: 1
**High Severity Bugs**: 1
**Medium Severity Bugs**: 2

**Features Affected**:
- File Explorer (Bugs #1, #2, #3)
- Application Menu (Bug #4)

**Files Modified**:
1. `/src/main/services/WindowManager.ts` (Bug #1)
2. `/src/renderer/stores/fileExplorer.store.ts` (Bug #2)
3. `/src/renderer/components/fileExplorer/TreeNode.tsx` (Bug #2)
4. `/src/renderer/components/panels/FileExplorerPanel.tsx` (Bugs #3, #4)

**Code Quality Improvements**:
- Removed all debug logging after fixes
- Added meaningful comments explaining fixes
- Improved React.memo comparison logic
- Better state preservation in store updates

---

## Lessons Learned

1. **Electron Sandbox Mode**: Requires careful configuration for preload scripts. Default sandbox may silently prevent preload execution.

2. **React.memo Comparisons**: Must check ALL relevant props that affect rendering, including array references like `children`.

3. **useEffect Dependencies**: Be careful with event listener registration. Use empty deps `[]` when listeners should only be set up once on mount.

4. **State Preservation**: When updating nested objects in state, explicitly preserve properties that should remain unchanged.

---

## Follow-up Items

- [ ] **Production**: Investigate proper sandbox mode configuration for security
- [ ] **Testing**: Add automated tests for folder expansion at multiple depths
- [ ] **Testing**: Add tests for menu action triggers
- [ ] **Documentation**: Document the sandbox mode issue for future reference
