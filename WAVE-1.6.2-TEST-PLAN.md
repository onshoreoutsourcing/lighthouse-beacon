# Wave 1.6.2 Test Plan
## Bidirectional Sync and Edge Cases Testing

**Date:** January 19, 2026
**Wave:** 1.6.2 - Final Wave of Epic 1
**Status:** Ready for Manual Testing

---

## Test Environment Setup

### Prerequisites
1. Application running: `pnpm dev`
2. Console open for monitoring warnings/errors
3. Test directory with diverse file types
4. Network monitor (optional) for IPC debugging

### Test Data Requirements
Create a test directory with:
- Regular text files (.txt, .md, .js, .ts, .json)
- Binary files (.png, .jpg, .gif, .pdf, .exe)
- Large text files (> 1MB, ideally 5-10MB)
- Small files (< 1KB)
- Nested folders with files

---

## Test Suite 1: Bidirectional Sync

### Test 1.1: Explorer → Editor Sync (Already Working)
**Steps:**
1. Start application
2. Select a project directory
3. Click a file in the file explorer

**Expected Results:**
- ✅ File opens in editor
- ✅ Tab appears with filename
- ✅ File remains selected/highlighted in explorer
- ✅ File content displays in editor

**Status:** PASS (implemented in Wave 1.6.1)

---

### Test 1.2: Editor → Explorer Sync (NEW)
**Steps:**
1. Open 3 files (A, B, C) in editor via explorer
2. Click on tab B (middle tab)
3. Observe file explorer

**Expected Results:**
- ✅ Tab B becomes active in editor
- ✅ File B becomes highlighted in explorer
- ✅ Previous selection (file A or C) is unhighlighted
- ✅ Sync happens instantly (< 50ms)

**Verification:**
- Check explorer has correct file highlighted
- Only one file is highlighted at a time
- No console errors

---

### Test 1.3: Tab Switching Sync
**Steps:**
1. Open files: README.md, package.json, tsconfig.json
2. Click each tab in sequence
3. Watch explorer selection change

**Expected Results:**
- ✅ Explorer selection follows tab clicks
- ✅ Each click updates selection within 50ms
- ✅ No flickering or double-highlights
- ✅ Smooth visual transition

**Verification:**
- Use React DevTools to verify state changes
- Check selectedFilePath in fileExplorer store
- Verify activeFilePath in editor store

---

## Test Suite 2: Tab Close Operations

### Test 2.1: Close Non-Active Tab
**Steps:**
1. Open 3 files (A, B, C)
2. Activate tab B (click it)
3. Close tab A (click X on tab A)

**Expected Results:**
- ✅ Tab A closes and disappears
- ✅ Tab B remains active
- ✅ File B remains selected in explorer
- ✅ No selection change in explorer

**Verification:**
- openFiles array has 2 items (B, C)
- activeFilePath is still B
- selectedFilePath is still B

---

### Test 2.2: Close Active Tab (Middle)
**Steps:**
1. Open 3 files (A, B, C)
2. Activate tab B (middle tab)
3. Close tab B (click X)

**Expected Results:**
- ✅ Tab B closes
- ✅ Tab C becomes active (next tab takes position)
- ✅ File C becomes selected in explorer
- ✅ Smooth transition, no flicker

**Verification:**
- openFiles array has 2 items (A, C)
- activeFilePath is now C
- selectedFilePath is now C

---

### Test 2.3: Close Active Tab (Last)
**Steps:**
1. Open 3 files (A, B, C)
2. Activate tab C (last tab)
3. Close tab C (click X)

**Expected Results:**
- ✅ Tab C closes
- ✅ Tab B becomes active (previous tab)
- ✅ File B becomes selected in explorer
- ✅ Smooth transition

**Verification:**
- openFiles array has 2 items (A, B)
- activeFilePath is now B
- selectedFilePath is now B

---

### Test 2.4: Close Last Remaining Tab
**Steps:**
1. Open 1 file (A)
2. Close tab A (click X)

**Expected Results:**
- ✅ Tab A closes
- ✅ Editor shows welcome/empty state
- ✅ Explorer has NO file selected (no highlight)
- ✅ No error messages

**Verification:**
- openFiles array is empty: []
- activeFilePath is null
- selectedFilePath is null
- No visual highlight in explorer tree

---

### Test 2.5: Rapid Tab Closing
**Steps:**
1. Open 5-7 files
2. Rapidly close tabs by clicking X repeatedly
3. Close them in random order (active and non-active)

**Expected Results:**
- ✅ All tabs close successfully
- ✅ Explorer selection updates for each active tab close
- ✅ No race conditions
- ✅ No console errors
- ✅ Final state: all tabs closed, no selection

**Verification:**
- Check for any React warnings in console
- Verify state consistency after each close
- No "Cannot read property of undefined" errors

---

## Test Suite 3: Binary File Detection

### Test 3.1: Open Image File
**Steps:**
1. Place a .png, .jpg, or .gif in project directory
2. Click the image file in explorer

**Expected Results:**
- ✅ Error message appears: "Cannot display binary file: [filename]. Binary files are not supported in the text editor."
- ✅ NO tab is created
- ✅ File is NOT added to openFiles array
- ✅ Application does not crash
- ✅ Error is dismissible

**Verification:**
- Check error state in editor store
- Verify openFiles array length unchanged
- Check for corrupted text in editor (should not appear)

---

### Test 3.2: Open PDF File
**Steps:**
1. Place a .pdf file in project directory
2. Click the PDF file in explorer

**Expected Results:**
- ✅ Binary file error message appears
- ✅ Error includes filename
- ✅ NO tab created
- ✅ Can dismiss error and continue working

---

### Test 3.3: Open Executable/Binary
**Steps:**
1. Place an executable (.exe, .bin, compiled binary) in project
2. Click the file in explorer

**Expected Results:**
- ✅ Binary file error message appears
- ✅ NO crash or freeze
- ✅ Application remains responsive
- ✅ Can open other files after dismissing error

---

### Test 3.4: Binary Detection Accuracy
**Steps:**
1. Create a text file with null bytes: `echo -e "Hello\x00World" > test.txt`
2. Click test.txt in explorer

**Expected Results:**
- ✅ Detected as binary (contains \0)
- ✅ Error message appears
- ✅ NO tab created

**Note:** This tests the null byte detection mechanism.

---

## Test Suite 4: Large File Handling

### Test 4.1: Medium-Large File (1-5MB)
**Steps:**
1. Create or find a text file between 1-5MB
2. Click the file in explorer
3. Observe console output

**Expected Results:**
- ✅ Console warning appears: "Large file detected: [filename] ([size] KB). Performance may be affected."
- ✅ File loads successfully
- ✅ Tab is created
- ✅ Content displays in editor
- ✅ Syntax highlighting works (may be slower)
- ✅ File is editable

**Verification:**
- Check console for warning message
- Verify file size calculation is accurate
- Test scrolling and editing performance

---

### Test 4.2: Very Large File (5-10MB)
**Steps:**
1. Find or generate a large text file (5-10MB)
2. Click the file in explorer
3. Wait for loading to complete

**Expected Results:**
- ✅ Console warning appears with accurate size
- ✅ File loads (may take 1-5 seconds)
- ✅ Content displays
- ✅ No crash or freeze
- ✅ Monaco editor handles rendering
- ✅ Syntax highlighting may be degraded/slower

**Verification:**
- Monitor main process memory usage
- Check for memory leaks
- Test scrolling performance

---

### Test 4.3: Extremely Large File (>10MB)
**Steps:**
1. Try to open a file > 10MB
2. Observe behavior

**Expected Results:**
- ✅ Console warning appears
- ✅ May be very slow to load
- ✅ Should not crash application
- ✅ User can still interact with UI

**Note:** Monaco editor may struggle with files > 10MB. This is expected behavior.

---

### Test 4.4: Small File (No Warning)
**Steps:**
1. Open a small file < 1MB (e.g., 50KB)
2. Check console

**Expected Results:**
- ✅ NO warning in console
- ✅ File loads quickly
- ✅ Normal performance

**Verification:**
- Confirm threshold is 1MB (1024KB)
- Files under threshold should not warn

---

## Test Suite 5: State Consistency

### Test 5.1: Store Synchronization
**Steps:**
1. Open React DevTools
2. Navigate to Zustand stores (fileExplorer, editor)
3. Open several files
4. Switch tabs
5. Close tabs
6. Monitor both stores in real-time

**Expected Results:**
- ✅ editor.activeFilePath === fileExplorer.selectedFilePath (always)
- ✅ When activeFilePath changes, selectedFilePath updates
- ✅ When selectedFilePath is null, activeFilePath is null
- ✅ No desync between stores

**Verification:**
- Use Zustand DevTools extension
- Watch state changes in real-time
- Verify sync happens within same render cycle

---

### Test 5.2: useEffect Dependency Array
**Steps:**
1. Review code for the bidirectional sync useEffect
2. Verify dependencies: [activeFilePath, selectedFilePath, selectFile]
3. Test that infinite loops don't occur

**Expected Results:**
- ✅ No infinite re-render loops
- ✅ Effect only runs when dependencies change
- ✅ No console warnings about missing dependencies

**Verification:**
```typescript
useEffect(() => {
  if (activeFilePath !== null && activeFilePath !== selectedFilePath) {
    selectFile(activeFilePath);
  }
  if (activeFilePath === null && selectedFilePath !== null) {
    selectFile(null);
  }
}, [activeFilePath, selectedFilePath, selectFile]);
```

---

### Test 5.3: Race Condition Resistance
**Steps:**
1. Rapidly perform these actions:
   - Click file in explorer
   - Immediately click different tab
   - Immediately close a tab
   - Click another file
2. Repeat 10-20 times

**Expected Results:**
- ✅ No race conditions
- ✅ State remains consistent
- ✅ No console errors
- ✅ Selection always matches active file

**Verification:**
- Zustand's immutable updates prevent races
- State updates are atomic
- No "setState on unmounted component" warnings

---

## Test Suite 6: Error Handling

### Test 6.1: File Read Error
**Steps:**
1. Open a file
2. While file is open, delete it from filesystem (outside app)
3. Try to switch to that tab

**Expected Results:**
- ✅ Should handle gracefully
- ✅ Error message if re-read attempted
- ✅ No crash

---

### Test 6.2: Permission Error
**Steps:**
1. Create a file with no read permissions (chmod 000)
2. Try to open it

**Expected Results:**
- ✅ Error message appears
- ✅ NO tab created
- ✅ Error mentions permission issue

---

### Test 6.3: Network Drive Disconnect (if applicable)
**Steps:**
1. Open project from network drive
2. Disconnect network
3. Try to navigate files

**Expected Results:**
- ✅ Graceful error handling
- ✅ No crash

---

## Performance Benchmarks

### Sync Latency
- **Target:** < 50ms
- **Measure:** Time between tab click and explorer selection update
- **Tool:** Browser Performance tab or console.time()

### Large File Load Time
- **1MB file:** < 500ms
- **5MB file:** < 2 seconds
- **10MB file:** < 5 seconds

### Memory Usage
- **Baseline (no files):** ~50-100MB
- **10 files open:** < 200MB
- **5MB file open:** < 300MB

---

## Regression Testing

After Wave 1.6.2, verify previous functionality still works:

### Wave 1.1: Desktop Window
- ✅ Application launches
- ✅ Window displays
- ✅ Layout is correct

### Wave 1.2: Directory Picker
- ✅ Directory picker opens on first launch
- ✅ Can change directory from footer
- ✅ Selected directory loads

### Wave 1.3: File Tree
- ✅ Folders expand/collapse
- ✅ Lazy loading works
- ✅ Tree rendering is correct

### Wave 1.4-1.5: Monaco Editor
- ✅ Syntax highlighting works
- ✅ Multiple tabs work
- ✅ Content displays correctly

### Wave 1.6.1: Explorer → Editor
- ✅ Clicking files opens them
- ✅ Loading states show
- ✅ Errors display properly

---

## Definition of Done Checklist

- [ ] All Test Suite 1 tests pass (Bidirectional Sync)
- [ ] All Test Suite 2 tests pass (Tab Close Operations)
- [ ] All Test Suite 3 tests pass (Binary File Detection)
- [ ] All Test Suite 4 tests pass (Large File Handling)
- [ ] All Test Suite 5 tests pass (State Consistency)
- [ ] All Test Suite 6 tests pass (Error Handling)
- [ ] Performance benchmarks met
- [ ] Regression tests pass
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors during normal operation
- [ ] No memory leaks detected

---

## Known Limitations (Expected Behavior)

1. **Monaco Editor Performance:** Files > 10MB may be slow (Monaco limitation)
2. **Binary Detection:** Uses null byte check (simple but effective)
3. **Large File Warning:** Console only (no user-facing warning yet)
4. **Syntax Highlighting:** May degrade for very large files (Monaco behavior)

---

## Bug Report Template

If issues are found during testing, use this format:

```markdown
**Test:** [Test ID, e.g., Test 2.2]
**Issue:** [Brief description]
**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Console Output:**
[Any errors or warnings]

**Environment:**
- OS: [macOS/Windows/Linux]
- Node version: [version]
- Electron version: [version]
```

---

## Success Criteria

Wave 1.6.2 is complete when:
1. All critical tests pass (Suite 1-4)
2. No regressions from previous waves
3. Code quality standards met
4. Epic 1 exit criteria achieved

---

**Test Plan Created:** January 19, 2026
**Ready for Testing:** Yes
**Epic 1 Status:** Ready for Final Verification
