# Find My Devops Bugs

This workflow identifies and reviews bugs in Azure Devops assigned to you that are active.

## Step 1: Get Azure Devops project
- Get projects from Devops
- CRITICAL: Ask user which project to search
- Use this project for all future steps

## Step 2: Find active bugs for current user
- Search work items in the project for active bugs assigned to the current user
If bugs found:
    - Review the bugs
    - Provide brief summary of the bugs
    - Continue to Step 3
If NO bugs found:
    - Tell the user they must write outstanding code, no defects found! And end the command

## Step 3: Create Bug Notes
- create directory `docs/implementation/_bug-fix/{username}`
- Foreach bug found in Step 2:
    - Create {bug-number}-{bug-name}-notes.md
    - This file should have brief key details about the bug, links to devops work item, and instructions to the user on how to recreate the bug, and key files of interest.

## Step 4: Provide Summary
- Let the user know key information about each of the bugs, listed in order of criticality.
- Summary should include: 
    - description of the bug
    - steps to reproduce
    - bug note file location (docs/implementation/_bug-fix/{username})
