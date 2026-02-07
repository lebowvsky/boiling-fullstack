---
name: claude-code-command-builder
description: Create and manage complex Claude Code commands that orchestrate multiple sub-agents in workflows. Use when the user wants to create commands for Claude Code, especially commands that involve sequential execution of multiple agents (e.g., "create a command that migrates Vue code with vue-developer, then reviews with code-reviewer, then refactors"), or when they want to build automated workflows with conditional logic and context passing between agents.
---

# Claude Code Command Builder

Build powerful, reusable Claude Code commands that orchestrate multiple sub-agents in sophisticated workflows. This skill helps you create YAML-based command definitions with parameter passing, conditional execution, error handling, and comprehensive context management.

## Core Capabilities

This skill enables you to:

1. **Create command structures** - Initialize new command YAML files with proper templates
2. **Orchestrate sub-agents** - Chain multiple agents together with context passing
3. **Validate commands** - Check syntax, structure, and agent references
4. **Execute workflows** - Run commands with parameter interpolation and error handling
5. **Design complex flows** - Implement conditional logic, retries, and fallback strategies

## Quick Start

### Creating a New Command

Use the initialization script to create a new command structure:

```bash
python scripts/init_command.py "my-command-name" \
  --description "Description of what the command does" \
  --output-dir .claude/commands
```

This generates a complete YAML template with:
- Frontmatter metadata (name, description, created timestamp)
- Parameters section for user inputs
- Workflow section with example steps
- Output configuration
- Usage examples

### Command File Structure

Commands are YAML files with this structure:

```yaml
---
name: command-name
description: What the command does
created: ISO timestamp
---

parameters:
  - name: param_name
    type: string
    required: true
    description: Parameter description
    default: null

workflow:
  - step: step_name
    agent: agent-file-name  # Without .md extension
    description: What this step does
    prompt: |
      Instructions for the agent.
      Use {{param_name}} for parameter interpolation.
    output_variable: step_result
    on_error: stop  # stop, continue, or retry
    retry_count: 0
    condition: "variable contains 'text'"  # Optional

output:
  format: markdown  # markdown, json, or text
  variables:
    - step_result
  save_to: .claude/outputs/{{name}}-{{timestamp}}.md
```

## Workflow Design Patterns

### Pattern 1: Sequential Processing

Each step builds on the previous one:

```yaml
workflow:
  - step: migrate
    agent: vue-developer
    prompt: "Convert {{component}} to Composition API"
    output_variable: migrated_code
    
  - step: review
    agent: code-reviewer
    prompt: "Review: {{migrated_code}}"
    output_variable: review_report
    
  - step: refactor
    agent: vue-developer
    prompt: |
      Refactor based on: {{review_report}}
      Code: {{migrated_code}}
    output_variable: final_code
```

### Pattern 2: Conditional Execution

Steps execute based on conditions:

```yaml
workflow:
  - step: analyze
    agent: code-analyzer
    output_variable: analysis
    
  - step: fix_critical
    condition: "analysis contains 'critical'"
    agent: fixer
    prompt: "Fix: {{analysis}}"
```

### Pattern 3: Error Handling with Retry

```yaml
workflow:
  - step: external_api
    agent: api-client
    on_error: retry
    retry_count: 3
    output_variable: api_data
    
  - step: fallback
    condition: "api_data equals ''"
    agent: cache-loader
    prompt: "Load cached data"
```

## Context Passing Between Agents

Variables flow between steps via `output_variable`:

1. **Step defines variable**: `output_variable: migration_result`
2. **Later steps use it**: `{{migration_result}}` in prompts
3. **System variables available**: `{{timestamp}}`, all parameters

### Variable Interpolation

```yaml
parameters:
  - name: component_name

workflow:
  - step: step1
    prompt: "Process {{component_name}}"  # Uses parameter
    output_variable: result1
    
  - step: step2
    prompt: |
      Previous result: {{result1}}  # Uses output from step1
      Component: {{component_name}}  # Still has parameter access
      Time: {{timestamp}}  # System variable
```

## Validation and Execution

### Validate a Command

Before running, validate the command structure:

```bash
python scripts/validate_command.py .claude/commands/my-command.yaml \
  --agents-dir .claude/agents
```

The validator checks:
- YAML syntax correctness
- Required frontmatter fields (name, description)
- Parameter definitions
- Agent file existence
- Variable references (warns if undefined)
- on_error values (stop, continue, retry)
- Workflow structure completeness

### Execute a Command

Run a validated command with parameters:

```bash
python scripts/execute_workflow.py .claude/commands/my-command.yaml \
  --param param1=value1 \
  --param param2=value2 \
  --agents-dir .claude/agents
```

The executor:
1. Loads and parses the command
2. Initializes context with parameters
3. Executes each step sequentially
4. Passes context between steps
5. Handles errors according to `on_error` settings
6. Saves output to specified location

### Dry Run Mode

Test without actually executing agents:

```bash
python scripts/execute_workflow.py command.yaml \
  --param component=Test \
  --dry-run
```

## Error Handling Strategies

### Stop (Default)

Immediately stops workflow on error:

```yaml
- step: critical_operation
  on_error: stop  # Fails fast
```

### Continue

Proceeds to next step even if current fails:

```yaml
- step: optional_notification
  on_error: continue  # Non-critical
```

### Retry

Retries the step before failing:

```yaml
- step: unstable_api
  on_error: retry
  retry_count: 3  # Tries 3 times
```

## Advanced Features

### Conditional Logic

Use simple conditions to control flow:

```yaml
condition: "variable contains 'text'"  # Substring check
condition: "variable equals 'exact'"   # Exact match
```

### Multiple Variable Context

Pass multiple pieces of context:

```yaml
prompt: |
  Analysis: {{analysis}}
  Original code: {{original}}
  Review: {{review}}
  Requirements: {{requirements}}
```

### Output Configuration

Control how results are saved:

```yaml
output:
  format: markdown  # or json, text
  variables:
    - final_result
    - intermediate_data
  save_to: .claude/outputs/{{name}}-{{timestamp}}.md
```

## Reference Files

For detailed information on specific topics, read these reference files:

- **`references/workflow-patterns.md`** - Comprehensive workflow design patterns including sequential, conditional, migration, refactoring, and documentation workflows. Read when designing complex multi-step processes.

- **`references/context-passing.md`** - Deep dive into passing data between agents, variable interpolation, accumulation patterns, and debugging context issues. Essential for understanding how data flows through workflows.

- **`references/error-handling.md`** - Complete guide to error handling strategies, retry patterns, circuit breakers, graceful degradation, and resilience patterns. Read when building robust production workflows.

## Asset Templates

Use these templates as starting points:

- **`assets/command-template.yaml`** - Complete annotated template with all features demonstrated. Copy and customize for new commands.

- **`assets/examples/migrate-vue-component.yaml`** - Real-world example of a Vue migration command with review and refactoring. Shows practical agent orchestration.

- **`assets/examples/comprehensive-code-audit.yaml`** - Complex multi-faceted audit workflow with conditional execution and multiple specialized agents. Demonstrates advanced patterns.

## Best Practices

### 1. Clear Naming

Use descriptive names for steps and variables:

```yaml
# ❌ Bad
output_variable: result1

# ✅ Good
output_variable: typescript_migration_result
```

### 2. Comprehensive Prompts

Provide complete context in agent prompts:

```yaml
prompt: |
  Task: Migrate Vue component to Composition API
  
  Requirements:
  - Use <script setup>
  - Add TypeScript types
  - Preserve all functionality
  
  Component: {{component_name}}
  Path: {{component_path}}
```

### 3. Document Each Step

Use the `description` field:

```yaml
- step: migrate_component
  description: Convert Vue 2 Options API to Vue 3 Composition API with full TypeScript support
```

### 4. Appropriate Error Handling

Match error handling to step criticality:

```yaml
- step: save_to_production
  on_error: stop  # Critical

- step: send_slack_notification
  on_error: continue  # Optional
```

### 5. Validate Variables

Ensure variables are defined before use. The validator will warn about undefined references.

## Integration with Your Project

### Agent Directory Structure

Place your agent definitions in `.claude/agents/`:

```
.claude/
├── agents/
│   ├── vue-developer.md
│   ├── code-reviewer.md
│   ├── security-auditor.md
│   └── ...
└── commands/
    ├── migrate-component.yaml
    ├── audit-codebase.yaml
    └── ...
```

### Agent File Format

Agents are markdown files with YAML frontmatter:

```markdown
---
name: agent-name
description: What the agent does
tools: Read, Write, Edit, Bash
model: inherit
color: blue
---

Agent instructions and capabilities...
```

## Common Use Cases

### Vue Component Migration

Create commands that:
1. Migrate Options API → Composition API
2. Add TypeScript types
3. Review code quality
4. Apply refactoring

### Code Quality Workflows

Build commands that:
1. Analyze code structure
2. Check security vulnerabilities
3. Review performance
4. Generate improvement plans

### Documentation Generation

Design commands that:
1. Analyze code structure
2. Generate API documentation
3. Create usage examples
4. Produce final docs

### Continuous Refactoring

Implement commands that:
1. Identify code smells
2. Prioritize issues
3. Apply fixes incrementally
4. Validate each change

## Troubleshooting

### Variable Not Interpolating

- Check spelling: `{{varaible}}` vs `{{variable}}`
- Ensure variable defined in earlier step via `output_variable`
- Run validator to check for undefined references

### Agent Not Found

- Verify agent file exists in agents directory
- Check filename matches (without .md): `agent: vue-developer` → `vue-developer.md`
- Use `--agents-dir` to specify correct path

### Workflow Not Executing

- Run validator first: `python scripts/validate_command.py command.yaml`
- Check YAML syntax is valid
- Ensure required parameters are provided
- Review error messages in execution output

### Condition Not Working

- Conditions are case-insensitive substring checks
- Format: `"variable contains 'text'"` or `"variable equals 'exact'"`
- Ensure variable exists in context

## Example: Creating Your First Command

Here's a complete walkthrough:

```bash
# 1. Initialize command
python scripts/init_command.py migrate-and-review \
  --description "Migrate Vue component and review code" \
  --output-dir .claude/commands

# 2. Edit the generated file (.claude/commands/migrate-and-review.yaml)
# Add your parameters, workflow steps, and output config

# 3. Validate
python scripts/validate_command.py .claude/commands/migrate-and-review.yaml

# 4. Test with dry-run
python scripts/execute_workflow.py .claude/commands/migrate-and-review.yaml \
  --param component=MyComponent \
  --dry-run

# 5. Execute for real
python scripts/execute_workflow.py .claude/commands/migrate-and-review.yaml \
  --param component=MyComponent
```

## Production Considerations

### Version Control

Commit your commands to version control:

```bash
git add .claude/commands/
git commit -m "Add migration workflow command"
```

### Team Collaboration

Share commands across your team:
- Commands are declarative and readable
- Easy to review in pull requests
- Can be customized per project

### Monitoring

Track command execution:
- Check `.claude/command-outputs/` for results
- Review execution logs for errors
- Monitor agent performance

### Maintenance

Keep commands up to date:
- Update agent references as agents evolve
- Refine prompts based on results
- Add new patterns as needs emerge

## Summary

This skill provides a complete framework for building sophisticated Claude Code workflows. Use it to:

- Orchestrate multiple agents in complex sequences
- Pass context seamlessly between processing steps
- Handle errors gracefully with retries and fallbacks
- Create reusable, parameterized command templates
- Build robust, production-ready automation

Start with the templates and examples, then customize to your specific needs!
