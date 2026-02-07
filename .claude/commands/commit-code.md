---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Create a git commit
---

# Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

# Commit Code

Examine the files that have changed and create a commit with a commit message that summarizes the changes. Always try to write a short and concise message that clearly expresses the business logic.

# Commit message

The commit message must start with a gitmoji followed by '$1($2-$3): '
After the commit message you could end with $4
