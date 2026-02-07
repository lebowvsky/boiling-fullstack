#!/usr/bin/env python3
"""
Validate a Claude Code command workflow YAML file.
Checks syntax, structure, and agent references.
"""

import sys
import argparse
import yaml
from pathlib import Path
from typing import Dict, List, Any

class CommandValidator:
    """Validator for command workflow files."""
    
    def __init__(self, agents_dir: Path = Path('.claude/agents')):
        self.agents_dir = agents_dir
        self.errors: List[str] = []
        self.warnings: List[str] = []
        
    def validate_file(self, filepath: Path) -> bool:
        """Validate a command file and return True if valid."""
        if not filepath.exists():
            self.errors.append(f"File not found: {filepath}")
            return False
            
        try:
            with open(filepath, 'r') as f:
                content = f.read()
                
            # Split frontmatter and body
            parts = content.split('---')
            if len(parts) < 3:
                self.errors.append("Invalid YAML structure: missing frontmatter")
                return False
                
            frontmatter = yaml.safe_load(parts[1])
            body_content = '---'.join(parts[2:])
            body = yaml.safe_load(body_content)
            
            # Validate frontmatter
            self._validate_frontmatter(frontmatter)
            
            # Validate body structure
            if body:
                self._validate_parameters(body.get('parameters', []))
                self._validate_workflow(body.get('workflow', []))
                self._validate_output(body.get('output', {}))
            
            return len(self.errors) == 0
            
        except yaml.YAMLError as e:
            self.errors.append(f"YAML parsing error: {e}")
            return False
        except Exception as e:
            self.errors.append(f"Unexpected error: {e}")
            return False
    
    def _validate_frontmatter(self, frontmatter: Dict[str, Any]):
        """Validate frontmatter metadata."""
        required_fields = ['name', 'description']
        
        for field in required_fields:
            if field not in frontmatter:
                self.errors.append(f"Missing required frontmatter field: {field}")
            elif not frontmatter[field]:
                self.errors.append(f"Frontmatter field '{field}' is empty")
    
    def _validate_parameters(self, parameters: List[Dict[str, Any]]):
        """Validate parameters section."""
        if not isinstance(parameters, list):
            self.errors.append("Parameters must be a list")
            return
            
        param_names = set()
        
        for i, param in enumerate(parameters):
            if not isinstance(param, dict):
                self.errors.append(f"Parameter {i} must be a dictionary")
                continue
                
            # Check required fields
            if 'name' not in param:
                self.errors.append(f"Parameter {i} missing 'name' field")
            else:
                name = param['name']
                if name in param_names:
                    self.errors.append(f"Duplicate parameter name: {name}")
                param_names.add(name)
                
            if 'type' not in param:
                self.warnings.append(f"Parameter '{param.get('name', i)}' missing 'type' field")
                
            if 'required' not in param:
                self.warnings.append(f"Parameter '{param.get('name', i)}' missing 'required' field")
    
    def _validate_workflow(self, workflow: List[Dict[str, Any]]):
        """Validate workflow steps."""
        if not isinstance(workflow, list):
            self.errors.append("Workflow must be a list")
            return
            
        if not workflow:
            self.errors.append("Workflow is empty")
            return
            
        step_names = set()
        output_variables = set()
        
        for i, step in enumerate(workflow):
            if not isinstance(step, dict):
                self.errors.append(f"Workflow step {i} must be a dictionary")
                continue
                
            # Check required fields
            required_fields = ['step', 'agent', 'prompt']
            for field in required_fields:
                if field not in step:
                    self.errors.append(f"Step {i} missing required field: {field}")
            
            # Validate step name
            step_name = step.get('step', f'step_{i}')
            if step_name in step_names:
                self.errors.append(f"Duplicate step name: {step_name}")
            step_names.add(step_name)
            
            # Validate agent reference
            agent_name = step.get('agent')
            if agent_name:
                self._validate_agent_reference(agent_name)
            
            # Track output variables
            if 'output_variable' in step:
                output_variables.add(step['output_variable'])
            
            # Validate variable references in prompt
            prompt = step.get('prompt', '')
            self._validate_variable_references(prompt, output_variables, i)
            
            # Validate on_error value
            on_error = step.get('on_error', 'stop')
            if on_error not in ['stop', 'continue', 'retry']:
                self.errors.append(f"Step {i}: invalid on_error value '{on_error}'. Must be: stop, continue, or retry")
    
    def _validate_agent_reference(self, agent_name: str):
        """Check if the referenced agent file exists."""
        agent_file = self.agents_dir / f"{agent_name}.md"
        
        if not self.agents_dir.exists():
            self.warnings.append(f"Agents directory not found: {self.agents_dir}")
            return
            
        if not agent_file.exists():
            self.warnings.append(f"Agent file not found: {agent_file}")
    
    def _validate_variable_references(self, prompt: str, available_vars: set, step_index: int):
        """Validate that referenced variables are defined."""
        import re
        
        # Find all {{variable}} references
        pattern = r'\{\{(\w+)\}\}'
        references = re.findall(pattern, prompt)
        
        for var in references:
            if var not in available_vars:
                self.warnings.append(
                    f"Step {step_index}: variable '{var}' referenced but not defined in previous steps"
                )
    
    def _validate_output(self, output: Dict[str, Any]):
        """Validate output configuration."""
        if not output:
            self.warnings.append("No output configuration defined")
            return
            
        format_type = output.get('format', 'markdown')
        if format_type not in ['markdown', 'json', 'text']:
            self.warnings.append(f"Unknown output format: {format_type}")
    
    def print_results(self):
        """Print validation results."""
        if self.errors:
            print("\n❌ ERRORS:")
            for error in self.errors:
                print(f"  • {error}")
        
        if self.warnings:
            print("\n⚠️  WARNINGS:")
            for warning in self.warnings:
                print(f"  • {warning}")
        
        if not self.errors and not self.warnings:
            print("✅ Command file is valid!")
        elif not self.errors:
            print("\n✅ Command file is valid (with warnings)")

def main():
    parser = argparse.ArgumentParser(
        description='Validate a Claude Code command workflow file'
    )
    parser.add_argument(
        'command_file',
        type=Path,
        help='Path to the command YAML file'
    )
    parser.add_argument(
        '--agents-dir',
        type=Path,
        default=Path('.claude/agents'),
        help='Path to agents directory (default: .claude/agents)'
    )
    
    args = parser.parse_args()
    
    validator = CommandValidator(agents_dir=args.agents_dir)
    is_valid = validator.validate_file(args.command_file)
    validator.print_results()
    
    sys.exit(0 if is_valid else 1)

if __name__ == '__main__':
    main()
