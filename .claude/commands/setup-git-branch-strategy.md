# Setup Git Branch Strategy

**Target Audience:** Claude Code agents implementing branch protection
**Estimated Time:** 5-10 minutes
**Prerequisites:** Repository with admin access, `gh` CLI authenticated

## Required Skills

### After Setup Completion (Step 5)

1. **git-repository-setup-validation**: Validate repository setup was successful
   - Validates: `main` and `development` branches exist
   - Validates: Main branch protection configured correctly
   - Validates: Development branch is not protected
   - Validates: Workflow files created
   - **ALWAYS invoke after completing setup to confirm success**

## Overview

This guide implements a standard development workflow:
- `development` branch for all active work
- `main` branch protected, requires PRs
- Automated enforcement: only `development → main` PRs allowed

## Step 1: Create Development Branch

**Check if branch exists first:**
```bash
git fetch origin
git branch -a | grep -E '(^\s*development$|remotes/origin/development$)'
```

**If branch exists locally or remotely:**
```bash
# Switch to existing branch
git checkout development
git pull origin development
```

**If branch does NOT exist (create new):**
```bash
git checkout -b development
git push -u origin development
```

**Smart Command (checks first):**
```bash
if git show-ref --verify --quiet refs/heads/development; then
  echo "✓ Development branch exists locally, switching to it"
  git checkout development
elif git ls-remote --heads origin development | grep -q development; then
  echo "✓ Development branch exists remotely, checking out"
  git checkout -b development --track origin/development
else
  echo "✓ Creating new development branch"
  git checkout -b development
  git push -u origin development
fi
```

**Expected Output:**
```
✓ [Creating new development branch OR Switching to existing branch]
Switched to branch 'development'
```

**Verification:**
```bash
git branch --show-current
# Should output: development
```

## Step 2: Create PR Branch Validation Workflow

**File:** `.github/workflows/pr-branch-check.yml`

**Action:** Create this file with the following content:

```yaml
name: PR Branch Check

on:
  pull_request:
    branches:
      - main

jobs:
  check-source-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Validate PR Source Branch
        run: |
          SOURCE_BRANCH="${{ github.head_ref }}"
          TARGET_BRANCH="${{ github.base_ref }}"

          echo "🔍 Checking PR branch policy..."
          echo "   Source: $SOURCE_BRANCH"
          echo "   Target: $TARGET_BRANCH"

          if [ "$TARGET_BRANCH" = "main" ] && [ "$SOURCE_BRANCH" != "development" ]; then
            echo ""
            echo "❌ ERROR: PRs to 'main' must come from 'development' branch"
            echo ""
            echo "Current PR: $SOURCE_BRANCH → main"
            echo "Required:   development → main"
            echo ""
            echo "Please create your PR from the 'development' branch instead."
            exit 1
          fi

          echo "✅ Branch policy check passed!"
          echo "   PR from '$SOURCE_BRANCH' to '$TARGET_BRANCH' is allowed"
```

**What This Does:**
- Runs on every PR to `main`
- Checks if source branch is `development`
- Exits with error (status 1) if not from `development`
- Provides clear error message

## Step 3: Commit and Push Workflow

**Commands:**
```bash
git add .github/workflows/pr-branch-check.yml
git commit -m "🔒 Add PR branch validation workflow

- Enforces that PRs to main must come from development branch
- Automatic check runs on all PRs to main
- Prevents agents/users from creating PRs from wrong branches"
git push
```

**Expected Output:**
```
[development abc1234] 🔒 Add PR branch validation workflow
 1 file changed, 33 insertions(+)
 create mode 100644 .github/workflows/pr-branch-check.yml
```

## Step 4: Enable Branch Protection on Main

**Command:**
```bash
gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input - <<'EOF'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["check-source-branch"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

**Important:** Replace `{owner}/{repo}` with actual values (e.g., `onshoreoutsourcing/Project-Docs-Automation`)

**What This Does:**
- Requires PRs before merging to main (no direct commits)
- Requires `check-source-branch` status check to pass
- Disables force pushes and branch deletion
- Sets review count to 0 (can be increased later)

**Expected Output:** Large JSON response showing protection settings

## Step 5: Verify Branch Protection

**Command:**
```bash
gh api repos/{owner}/{repo}/branches/main/protection | jq '{required_status_checks, required_pull_request_reviews}'
```

**Expected Output:**
```json
{
  "required_status_checks": {
    "strict": false,
    "contexts": [
      "check-source-branch"
    ],
    "checks": [
      {
        "context": "check-source-branch",
        "app_id": null
      }
    ]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0
  }
}
```

**Verification Checklist:**
- ✅ `required_status_checks.contexts` includes `"check-source-branch"`
- ✅ `required_pull_request_reviews` exists
- ✅ Currently on `development` branch

## Step 5a: Validate Setup with Skill

**Invoke git-repository-setup-validation skill:**

After completing all setup steps, validate the configuration:

```
Invoke git-repository-setup-validation skill to confirm:
- ✅ main and development branches exist
- ✅ Main branch protection configured with required settings
- ✅ Development branch is not protected (allows feature merges)
- ✅ PR validation workflow exists (.github/workflows/pr-branch-check.yml)
- ✅ Workflow references correct branches
```

**Expected Result:**
- Status: ✅ PASS or ⚠️ WARNING
- Report shows all critical checks passing
- Any warnings documented for follow-up

**If validation FAILS:**
- Review error messages from validation report
- Fix identified issues
- Re-run validation until PASS status achieved

**If validation shows WARNINGS:**
- Document warnings for future improvements
- Proceed if all critical checks pass

## Step 6: Test the Enforcement (Optional but Recommended)

**Test 1: Create a valid PR (should pass)**
```bash
# Make a test change on development
echo "test" >> test.txt
git add test.txt
git commit -m "Test commit"
git push

# Create PR from development to main
gh pr create --base main --head development --title "Test PR" --body "Testing branch enforcement"
```

**Expected:** PR created, check runs and passes ✅

**Test 2: Verify protection prevents direct push**
```bash
# Try to push directly to main (should fail)
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "Direct commit"
git push
```

**Expected:** Push rejected with error about branch protection

## Common Issues and Solutions

### Issue 1: `gh` command not found
**Solution:** Install GitHub CLI: https://cli.github.com/

### Issue 2: "Resource not accessible by integration"
**Solution:** Authenticate with admin permissions:
```bash
gh auth refresh -h github.com -s admin:org
```

### Issue 3: Status check not appearing
**Solution:** Wait 1-2 minutes for workflow to register, or create a test PR to trigger it

### Issue 4: Already on main branch
**Solution:** Switch to development first:
```bash
git checkout development
```

## Summary of What's Enforced

**✅ Allowed:**
- PRs from `development` → `main`
- All work happens on `development` branch
- Merge via GitHub PR interface

**❌ Blocked:**
- Direct commits to `main`
- PRs from any branch except `development` to `main`
- Force pushes to `main`
- Deleting `main` branch

## Agent Notes

**When to Use This Guide:**
- User requests "set up development branch workflow"
- User asks to "protect main branch"
- User wants to "enforce PR workflow"
- User mentions "prevent direct commits to main"

**Required Context:**
- Repository name and owner
- Current branch name
- Whether you have admin access

**After Implementation:**
- Always work on `development` branch
- Create PRs from `development` to `main` for any changes
- Never commit directly to `main`

**Script Mode Execution:**
If executing all at once, use this consolidated script:

```bash
#!/bin/bash
set -e  # Exit on error

OWNER="your-org"
REPO="your-repo"

echo "Step 1: Check and create/switch to development branch"
git fetch origin
if git show-ref --verify --quiet refs/heads/development; then
  echo "✓ Development branch exists locally, switching to it"
  git checkout development
  git pull origin development
elif git ls-remote --heads origin development | grep -q development; then
  echo "✓ Development branch exists remotely, checking out"
  git checkout -b development --track origin/development
else
  echo "✓ Creating new development branch"
  git checkout -b development
  git push -u origin development
fi

echo "Step 2: Create workflow file"
mkdir -p .github/workflows
cat > .github/workflows/pr-branch-check.yml <<'WORKFLOW'
name: PR Branch Check
on:
  pull_request:
    branches:
      - main
jobs:
  check-source-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Validate PR Source Branch
        run: |
          SOURCE_BRANCH="${{ github.head_ref }}"
          TARGET_BRANCH="${{ github.base_ref }}"
          echo "🔍 Checking PR branch policy..."
          echo "   Source: $SOURCE_BRANCH"
          echo "   Target: $TARGET_BRANCH"
          if [ "$TARGET_BRANCH" = "main" ] && [ "$SOURCE_BRANCH" != "development" ]; then
            echo ""
            echo "❌ ERROR: PRs to 'main' must come from 'development' branch"
            echo ""
            echo "Current PR: $SOURCE_BRANCH → main"
            echo "Required:   development → main"
            echo ""
            echo "Please create your PR from the 'development' branch instead."
            exit 1
          fi
          echo "✅ Branch policy check passed!"
          echo "   PR from '$SOURCE_BRANCH' to '$TARGET_BRANCH' is allowed"
WORKFLOW

echo "Step 3: Commit workflow"
git add .github/workflows/pr-branch-check.yml
git commit -m "🔒 Add PR branch validation workflow"
git push

echo "Step 4: Enable branch protection"
gh api repos/$OWNER/$REPO/branches/main/protection -X PUT --input - <<'EOF'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["check-source-branch"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

echo "✅ Setup complete!"
echo "Current branch: $(git branch --show-current)"
echo "Branch protection enabled on main"
echo "Only development → main PRs allowed"
```

**Usage:**
```bash
# Edit OWNER and REPO variables first
vim setup-branch-protection.sh
bash setup-branch-protection.sh
```

## Checklist for Agent Implementation

Before starting:
- [ ] Confirm you have admin access to repository
- [ ] Verify `gh` CLI is authenticated
- [ ] Note the repository owner and name
- [ ] Check current branch name

During implementation:
- [ ] Step 1: Create and push development branch
- [ ] Step 2: Create PR workflow file
- [ ] Step 3: Commit and push workflow
- [ ] Step 4: Enable branch protection via API
- [ ] Step 5: Verify protection settings
- [ ] Step 5a: **Invoke git-repository-setup-validation skill** (REQUIRED)

After implementation:
- [ ] Confirm validation status is PASS or WARNING (not FAIL)
- [ ] Confirm currently on development branch
- [ ] Test by trying to push to main (should fail)
- [ ] Inform user of new workflow
- [ ] Remind user: all work now happens on development

## Template Response to User

After completing setup and validation, use this response:

```
✅ Development branch workflow is now enforced!

**Setup Completed:**
- Created `development` branch (you're currently on it)
- Main branch is now protected
- Added automated check: only development → main PRs allowed
- Validated configuration: ✅ PASS [or ⚠️ WARNING with details]

**New Workflow:**
1. Work on `development` branch (current)
2. Push changes: `git push`
3. Create PR: `gh pr create --base main --head development`
4. Merge via GitHub (after check passes)

**What's Enforced:**
- ✅ PRs from development → main (allowed)
- ❌ Direct commits to main (blocked)
- ❌ PRs from other branches → main (blocked)
- ❌ Force push to main (blocked)

**Validation Results:**
[Include summary from git-repository-setup-validation skill:
- Branch structure: ✅ PASS
- Main protection: ✅ PASS
- Development setup: ✅ PASS
- Workflow files: ✅ PASS]

No more accidental commits to main!
```

---

**Version:** 1.0
**Last Updated:** 2025-01-19
**Tested With:** GitHub CLI 2.x, Git 2.x
