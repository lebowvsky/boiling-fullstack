#!/usr/bin/env python3
"""
Execute a Claude Code command workflow.
Orchestrates multiple agents and passes context between them.
"""

import sys
import argparse
import yaml
import re
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

class WorkflowExecutor:
    """Executes a command workflow with multiple agents."""
    
    def __init__(self, command_file: Path, agents_dir: Path, params: Dict[str, str]):
        self.command_file = command_file
        self.agents_dir = agents_dir
        self.params = params
        self.context: Dict[str, Any] = {}
        self.results: List[Dict[str, Any]] = []
        
    def load_command(self) -> Optional[Dict[str, Any]]:
        """Load and parse the command file."""
        try:
            with open(self.command_file, 'r') as f:
                content = f.read()
            
            # Split frontmatter and body
            parts = content.split('---')
            if len(parts) < 3:
                print("❌ Invalid command file format")
                return None
            
            frontmatter = yaml.safe_load(parts[1])
            body_content = '---'.join(parts[2:])
            body = yaml.safe_load(body_content)
            
            return {
                'metadata': frontmatter,
                'config': body
            }
            
        except Exception as e:
            print(f"❌ Error loading command file: {e}")
            return None
    
    def interpolate_variables(self, text: str, context: Dict[str, Any]) -> str:
        """Replace {{variable}} placeholders with values from context."""
        def replace(match):
            var_name = match.group(1)
            value = context.get(var_name, f"{{{{UNDEFINED:{var_name}}}}}")
            return str(value)
        
        return re.sub(r'\{\{(\w+)\}\}', replace, text)
    
    def evaluate_condition(self, condition: str, context: Dict[str, Any]) -> bool:
        """Evaluate a simple condition string."""
        if not condition:
            return True
        
        # Simple condition parser for: "variable contains 'value'"
        match = re.match(r"(\w+)\s+contains\s+'([^']+)'", condition)
        if match:
            var_name, value = match.groups()
            var_value = str(context.get(var_name, ''))
            return value.lower() in var_value.lower()
        
        # Simple condition parser for: "variable equals 'value'"
        match = re.match(r"(\w+)\s+equals\s+'([^']+)'", condition)
        if match:
            var_name, value = match.groups()
            var_value = str(context.get(var_name, ''))
            return var_value == value
        
        print(f"⚠️  Warning: Unsupported condition format: {condition}")
        return True
    
    def execute_step(self, step: Dict[str, Any], step_index: int) -> Optional[str]:
        """Execute a single workflow step."""
        step_name = step.get('step', f'step_{step_index}')
        agent_name = step.get('agent')
        description = step.get('description', '')
        prompt_template = step.get('prompt', '')
        on_error = step.get('on_error', 'stop')
        retry_count = step.get('retry_count', 0)
        
        print(f"\n{'='*60}")
        print(f"📍 Step {step_index + 1}: {step_name}")
        if description:
            print(f"   {description}")
        print(f"   Agent: {agent_name}")
        print(f"{'='*60}\n")
        
        # Check condition
        condition = step.get('condition')
        if condition and not self.evaluate_condition(condition, self.context):
            print(f"⏭️  Skipping step (condition not met): {condition}")
            return None
        
        # Interpolate variables in prompt
        prompt = self.interpolate_variables(prompt_template, self.context)
        
        # Load agent configuration
        agent_file = self.agents_dir / f"{agent_name}.md"
        if not agent_file.exists():
            print(f"❌ Agent file not found: {agent_file}")
            if on_error == 'stop':
                sys.exit(1)
            return None
        
        # Display the prompt that will be sent to the agent
        print(f"📝 Prompt for {agent_name}:")
        print("-" * 60)
        print(prompt)
        print("-" * 60)
        
        # Simulate agent execution (in real implementation, this would call Claude Code)
        print(f"\n🤖 Executing agent: {agent_name}")
        print("   (In production, this would invoke Claude Code with the agent)")
        print("   Command would be: claude-code --agent .claude/agents/{agent_name}.md")
        
        # For now, create a placeholder result
        result = f"[Simulated output from {agent_name} for step '{step_name}']"
        
        print(f"\n✅ Step completed: {step_name}")
        
        return result
    
    def execute(self) -> bool:
        """Execute the complete workflow."""
        # Load command
        command = self.load_command()
        if not command:
            return False
        
        metadata = command['metadata']
        config = command['config']
        
        print(f"\n{'='*60}")
        print(f"🚀 Executing Command: {metadata['name']}")
        print(f"   {metadata['description']}")
        print(f"{'='*60}\n")
        
        # Initialize context with parameters
        self.context = self.params.copy()
        self.context['timestamp'] = datetime.now().isoformat()
        
        # Display parameters
        if self.params:
            print("📊 Parameters:")
            for key, value in self.params.items():
                print(f"   • {key}: {value}")
        
        # Get workflow steps
        workflow = config.get('workflow', [])
        if not workflow:
            print("❌ No workflow steps defined")
            return False
        
        # Execute each step
        for i, step in enumerate(workflow):
            result = self.execute_step(step, i)
            
            # Store result in context
            output_var = step.get('output_variable')
            if output_var and result:
                self.context[output_var] = result
            
            # Store step result
            self.results.append({
                'step': step.get('step', f'step_{i}'),
                'agent': step.get('agent'),
                'result': result,
                'timestamp': datetime.now().isoformat()
            })
        
        # Handle output
        self._save_output(metadata, config.get('output', {}))
        
        print(f"\n{'='*60}")
        print("✅ Workflow completed successfully!")
        print(f"{'='*60}\n")
        
        return True
    
    def _save_output(self, metadata: Dict[str, Any], output_config: Dict[str, Any]):
        """Save workflow output to file."""
        if not output_config:
            return
        
        output_format = output_config.get('format', 'markdown')
        output_vars = output_config.get('variables', [])
        save_to = output_config.get('save_to', '')
        
        if not save_to:
            return
        
        # Interpolate variables in save path
        save_path = Path(self.interpolate_variables(save_to, self.context))
        save_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Generate output content
        if output_format == 'markdown':
            content = self._generate_markdown_output(metadata, output_vars)
        elif output_format == 'json':
            content = self._generate_json_output(output_vars)
        else:
            content = self._generate_text_output(output_vars)
        
        # Save to file
        save_path.write_text(content)
        print(f"\n💾 Output saved to: {save_path}")
    
    def _generate_markdown_output(self, metadata: Dict[str, Any], variables: List[str]) -> str:
        """Generate markdown output."""
        lines = [
            f"# {metadata['name']}",
            "",
            f"**Description:** {metadata['description']}",
            f"**Executed:** {self.context.get('timestamp', 'N/A')}",
            "",
            "## Parameters",
            ""
        ]
        
        for key, value in self.params.items():
            lines.append(f"- **{key}:** {value}")
        
        lines.extend(["", "## Results", ""])
        
        for var in variables:
            value = self.context.get(var, 'N/A')
            lines.extend([
                f"### {var}",
                "",
                "```",
                str(value),
                "```",
                ""
            ])
        
        lines.extend(["", "## Execution Steps", ""])
        
        for i, result in enumerate(self.results, 1):
            lines.extend([
                f"### Step {i}: {result['step']}",
                "",
                f"- **Agent:** {result['agent']}",
                f"- **Timestamp:** {result['timestamp']}",
                ""
            ])
        
        return "\n".join(lines)
    
    def _generate_json_output(self, variables: List[str]) -> str:
        """Generate JSON output."""
        output = {
            'context': {var: self.context.get(var) for var in variables},
            'steps': self.results,
            'timestamp': self.context.get('timestamp')
        }
        return json.dumps(output, indent=2)
    
    def _generate_text_output(self, variables: List[str]) -> str:
        """Generate plain text output."""
        lines = []
        for var in variables:
            value = self.context.get(var, 'N/A')
            lines.append(f"{var}:\n{value}\n")
        return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(
        description='Execute a Claude Code command workflow'
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
    parser.add_argument(
        '--param',
        '-p',
        action='append',
        help='Parameter in format key=value (can be specified multiple times)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simulate execution without actually calling agents'
    )
    
    args = parser.parse_args()
    
    # Parse parameters
    params = {}
    if args.param:
        for param in args.param:
            if '=' not in param:
                print(f"❌ Invalid parameter format: {param} (expected key=value)")
                sys.exit(1)
            key, value = param.split('=', 1)
            params[key] = value
    
    executor = WorkflowExecutor(args.command_file, args.agents_dir, params)
    success = executor.execute()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
