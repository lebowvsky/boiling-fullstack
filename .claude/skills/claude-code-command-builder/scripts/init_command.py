#!/usr/bin/env python3
"""
Initialize a new Claude Code command workflow.
Creates a YAML configuration file with the proper structure.
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime

COMMAND_TEMPLATE = """---
name: {name}
description: {description}
created: {timestamp}
---

# Command: {name}

## Parameters
parameters:
  - name: example_param
    type: string
    required: true
    description: Description of the parameter
    default: null

## Workflow
workflow:
  # Step 1: Initial action
  - step: step_1
    agent: vue-developer  # Name of the agent file (without .md)
    description: Brief description of what this step does
    prompt: |
      Your instructions for the agent.
      You can use parameter interpolation: {{example_param}}
    output_variable: step_1_result
    on_error: stop  # Options: stop, continue, retry
    retry_count: 0
    
  # Step 2: Use output from previous step
  - step: step_2
    agent: code-reviewer
    description: Review the output from step 1
    prompt: |
      Review this code:
      {{step_1_result}}
    output_variable: step_2_result
    on_error: stop
    
  # Step 3: Conditional execution (optional)
  - step: step_3
    agent: vue-developer
    description: Final refactoring
    condition: "step_2_result contains 'critical'"  # Simple condition
    prompt: |
      Refactor based on this review:
      {{step_2_result}}
      
      Original code:
      {{step_1_result}}
    output_variable: final_result

## Output
output:
  # Define what the command returns
  format: markdown  # Options: markdown, json, text
  variables:
    - final_result
  save_to: .claude/command-outputs/{name}-{{timestamp}}.md
"""

def create_command(name: str, description: str, output_dir: Path):
    """Create a new command configuration file."""
    timestamp = datetime.now().isoformat()
    
    # Sanitize name for filename
    filename = name.lower().replace(' ', '-').replace('_', '-')
    output_file = output_dir / f"{filename}.yaml"
    
    # Check if file already exists
    if output_file.exists():
        print(f"❌ Error: Command file already exists: {output_file}")
        return False
    
    # Create parent directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write the command file
    content = COMMAND_TEMPLATE.format(
        name=name,
        description=description,
        timestamp=timestamp
    )
    
    output_file.write_text(content)
    
    print(f"✅ Created command: {output_file}")
    print(f"\nNext steps:")
    print(f"1. Edit {output_file} to customize the workflow")
    print(f"2. Define your parameters and workflow steps")
    print(f"3. Run 'python scripts/validate_command.py {output_file}' to validate")
    print(f"4. Execute with 'python scripts/execute_workflow.py {output_file}'")
    
    return True

def main():
    parser = argparse.ArgumentParser(
        description='Initialize a new Claude Code command workflow'
    )
    parser.add_argument(
        'name',
        help='Name of the command (e.g., "migrate-vue-component")'
    )
    parser.add_argument(
        '--description',
        '-d',
        default='',
        help='Description of what the command does'
    )
    parser.add_argument(
        '--output-dir',
        '-o',
        type=Path,
        default=Path('.claude/commands'),
        help='Output directory for the command file (default: .claude/commands)'
    )
    
    args = parser.parse_args()
    
    description = args.description or f"Execute {args.name} workflow"
    
    success = create_command(args.name, description, args.output_dir)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
