---
name: commit
description: Commit to Git
---

Analyze changes and create commits automatically. Follow the repository's commit message style by checking recent commits.

Steps:
1. Check git status to see both staged and unstaged changes
2. If there are staged files, consider only those files and jump directly to step 4
3. If there are NO staged files but there are unstaged changes, stage all modified files one by one
4. Check recent commit messages for style reference with `git log --oneline -5`
5. Analyze the staged changes and create a concise commit message (under 50 chars)
6. Do not include attribution to Claude in the commit message or co-author attribution
7. Create the commit with the already staged files only
8. Confirm that the commit was successful and display nicely the its hash, message and description (if any) that were used
9. Confirm that the commit was successful and log its hash, message and description (if any), following this format:

✅ Commit successful!
Hash: 4f73c78b
Message: Replace sl-input with bkper-amount in account balance adjuster
Description:
- Remove manual input sanitization logic
- Leverage built-in amount parsing and formatting
- Simplify amount change handling

**Important**: Do NOT push to remote repository.
