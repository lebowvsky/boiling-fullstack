---
allowed-tools: Bash(git status:*), Bash(git diff:*), Read, Task, Glob
description: Launch code-reviewer agent to review modified files or a specific file
---

# Context

- Current git status: !`git status --short`
- Current git diff: !`git diff HEAD --stat`
- Current branch: !`git branch --show-current`

# Review Command

Launch the code-reviewer agent to perform a comprehensive code review.

## Behavior

When the user runs `/review`:
- If no parameters (`$1`) are provided, review all modified files in the git working tree
- If a file path is provided as `$1`, review only that specific file

## Implementation

1. **Check if file parameter was provided:**
   - If `$1` is empty, proceed with reviewing all modified files
   - If `$1` is provided, validate it exists and review only that file

2. **For all modified files (no parameter):**
   - Get list of modified files from git status
   - If no modified files found, inform user there are no changes to review
   - Launch code-reviewer agent with prompt to review all modified files

3. **For single file (parameter provided):**
   - Verify the file exists at path `$1`
   - If file doesn't exist, inform user and suggest checking the path
   - Launch code-reviewer agent with prompt to review only that specific file

## Agent Prompt

Use the Task tool to launch the code-reviewer agent with the appropriate prompt:

**For all modified files:**
```
Review all modified files in this repository for code quality, security, and maintainability issues.

Focus on:
- Code quality and best practices
- Potential bugs or security issues
- Performance concerns
- Maintainability and readability
- Vue.js 2.7 and TypeScript specific patterns
- Compliance with project standards from CLAUDE.md

Create a comprehensive code review report as specified in your agent instructions.
```

**For single file:**
```
Review the file `$1` for code quality, security, and maintainability issues.

Focus on:
- Code quality and best practices
- Potential bugs or security issues
- Performance concerns
- Maintainability and readability
- Vue.js 2.7 and TypeScript specific patterns
- Compliance with project standards from CLAUDE.md

Create a comprehensive code review report as specified in your agent instructions.
```
