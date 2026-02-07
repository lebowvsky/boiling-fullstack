---
allowed-tools: Bash(python:*), Bash(ls:*), Read, Write, Edit
description: Create a new command using the claude-code-command-builder skill
---

# Create Command

Use the claude-code-command-builder skill to create a new Claude Code command with workflow orchestration capabilities.

## Parameters

- `$1`: Command name (required) - The name of the command to create (e.g., "migrate-vue-component")
- `$2`: Command description (optional) - Description of what the command does

## Behavior

This command will:

1. **Validate parameters**: Ensure command name is provided
2. **Initialize command**: Use the skill's init script to create the command structure
3. **Open for editing**: Display the created file path and offer to open it for customization

## Implementation

### Step 1: Validate Input

If `$1` is empty:
- Inform the user that a command name is required
- Provide usage example: `/create-command my-command "My command description"`
- Exit

### Step 2: Prepare Description

- If `$2` is provided, use it as the description
- If `$2` is empty, use a default description: "New workflow command"

### Step 3: Execute Init Script

Run the command builder initialization script:

```bash
python .claude/skills/claude-code-command-builder/scripts/init_command.py "$1" \
  --description "$2" \
  --output-dir .claude/commands
```

### Step 4: Confirm Creation

After successful creation:
- Inform the user the command was created at `.claude/commands/$1.yaml`
- Suggest next steps:
  1. Edit the YAML file to customize workflow steps
  2. Validate with: `python .claude/skills/claude-code-command-builder/scripts/validate_command.py .claude/commands/$1.yaml`
  3. Test with: `python .claude/skills/claude-code-command-builder/scripts/execute_workflow.py .claude/commands/$1.yaml --dry-run`

### Step 5: Offer Assistance

Ask the user if they want to:
- Read the created file
- Edit the workflow steps
- Review the skill documentation at `.claude/skills/claude-code-command-builder/SKILL.md`

## Example Usage

```
/create-command migrate-component "Migrate Vue component to Composition API"
```

This creates `.claude/commands/migrate-component.yaml` with a basic template ready for customization.

## Skill Reference

The claude-code-command-builder skill provides:
- Workflow orchestration across multiple agents
- Parameter passing between steps
- Conditional execution
- Error handling (stop, continue, retry)
- Variable interpolation

For detailed documentation, see `.claude/skills/claude-code-command-builder/SKILL.md`
