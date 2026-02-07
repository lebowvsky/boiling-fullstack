# Context Passing Between Agents

Ce document explique comment passer efficacement des données entre les sous-agents dans un workflow.

## Mécanisme de Base

Les données sont transmises via des **variables de sortie** (`output_variable`) qui deviennent disponibles pour les étapes suivantes.

```yaml
workflow:
  - step: step1
    agent: agent-a
    output_variable: result_a  # ← Définit la variable
    
  - step: step2
    agent: agent-b
    prompt: "Use this: {{result_a}}"  # ← Utilise la variable
```

## Types de Données Passables

### 1. Code Source

Le cas le plus courant : passer du code entre agents.

```yaml
workflow:
  - step: generate
    agent: vue-developer
    prompt: "Create a Vue component for {{feature}}"
    output_variable: component_code
    
  - step: review
    agent: code-reviewer
    prompt: |
      Review this component:
      ```vue
      {{component_code}}
      ```
    output_variable: review_feedback
    
  - step: improve
    agent: vue-developer
    prompt: |
      Improve the component based on this feedback:
      {{review_feedback}}
      
      Original component:
      {{component_code}}
    output_variable: improved_code
```

### 2. Rapports d'Analyse

Passer des analyses structurées entre agents.

```yaml
workflow:
  - step: analyze
    agent: code-analyzer
    prompt: "Analyze {{file}} for patterns"
    output_variable: analysis_report
    
  - step: suggest_improvements
    agent: architecture-advisor
    prompt: |
      Based on this analysis, suggest architectural improvements:
      {{analysis_report}}
    output_variable: suggestions
    
  - step: implement
    agent: vue-developer
    prompt: |
      Implement these suggestions:
      {{suggestions}}
      
      Current analysis:
      {{analysis_report}}
    output_variable: implementation
```

### 3. Listes et Données Structurées

Passer des listes d'items, des configurations, etc.

```yaml
workflow:
  - step: find_components
    agent: file-scanner
    prompt: "List all Vue components in {{directory}}"
    output_variable: component_list
    
  - step: analyze_each
    agent: component-analyzer
    prompt: |
      Analyze each component in this list:
      {{component_list}}
    output_variable: analysis_results
    
  - step: generate_report
    agent: report-generator
    prompt: |
      Generate a summary report from:
      {{analysis_results}}
    output_variable: final_report
```

### 4. Métadonnées et Statistiques

Passer des informations de contexte.

```yaml
workflow:
  - step: collect_metrics
    agent: metrics-collector
    prompt: "Collect code metrics for {{project}}"
    output_variable: metrics
    
  - step: identify_issues
    agent: code-reviewer
    prompt: |
      Identify issues based on these metrics:
      {{metrics}}
    output_variable: issues
    
  - step: prioritize
    agent: project-manager
    prompt: |
      Prioritize these issues considering project metrics:
      Issues: {{issues}}
      Metrics: {{metrics}}
    output_variable: prioritized_tasks
```

## Patterns de Passage de Contexte

### Pattern 1 : Accumulation de Contexte

Chaque étape ajoute du contexte pour les suivantes.

```yaml
workflow:
  - step: step1
    prompt: "..."
    output_variable: context_1
    
  - step: step2
    prompt: |
      Context from step 1: {{context_1}}
      Now do...
    output_variable: context_2
    
  - step: step3
    prompt: |
      Previous contexts:
      Step 1: {{context_1}}
      Step 2: {{context_2}}
      Now finalize...
    output_variable: final_result
```

### Pattern 2 : Transformation en Pipeline

Chaque étape transforme la sortie de la précédente.

```yaml
workflow:
  - step: raw_data
    prompt: "Extract data from {{source}}"
    output_variable: raw
    
  - step: clean_data
    prompt: "Clean this data: {{raw}}"
    output_variable: cleaned
    
  - step: transform_data
    prompt: "Transform: {{cleaned}}"
    output_variable: transformed
    
  - step: format_output
    prompt: "Format: {{transformed}}"
    output_variable: final
```

### Pattern 3 : Contexte Partagé

Plusieurs étapes utilisent le même contexte de base.

```yaml
workflow:
  - step: load_config
    prompt: "Load configuration"
    output_variable: config
    
  - step: task_a
    prompt: |
      Using config: {{config}}
      Do task A
    output_variable: result_a
    
  - step: task_b
    prompt: |
      Using config: {{config}}
      Do task B
    output_variable: result_b
    
  - step: combine
    prompt: |
      Combine results:
      A: {{result_a}}
      B: {{result_b}}
      Config: {{config}}
    output_variable: combined
```

### Pattern 4 : Contexte Conditionnel

Le contexte passé dépend de conditions.

```yaml
workflow:
  - step: analyze
    prompt: "Analyze {{code}}"
    output_variable: analysis
    
  - step: light_refactor
    condition: "analysis contains 'minor'"
    prompt: |
      Light refactoring:
      {{analysis}}
    output_variable: refactored
    
  - step: heavy_refactor
    condition: "analysis contains 'major'"
    prompt: |
      Major refactoring:
      {{analysis}}
    output_variable: refactored
    
  - step: finalize
    prompt: "Finalize: {{refactored}}"
    output_variable: final
```

## Best Practices

### 1. Nommage des Variables de Contexte

```yaml
# ❌ Mauvais - noms génériques
output_variable: result
output_variable: data
output_variable: output

# ✅ Bon - noms descriptifs
output_variable: migrated_component
output_variable: security_audit_report
output_variable: optimized_bundle
```

### 2. Structuration des Prompts

Organisez clairement le contexte dans les prompts :

```yaml
prompt: |
  # Context from previous steps
  Migration result: {{migration_result}}
  Test coverage: {{test_coverage}}
  
  # Current task
  Now perform security audit on the migrated code.
  
  # Specific requirements
  - Check for XSS vulnerabilities
  - Verify input sanitization
  - Review authentication logic
```

### 3. Limitation de la Taille du Contexte

Ne passez que les informations nécessaires :

```yaml
# ❌ Mauvais - passe tout
prompt: |
  Full context:
  {{entire_codebase}}
  {{all_dependencies}}
  {{complete_history}}

# ✅ Bon - passe l'essentiel
prompt: |
  Relevant code section:
  {{modified_component}}
  
  Related dependencies:
  {{direct_imports}}
```

### 4. Validation du Contexte

Vérifiez que les variables existent avant de les utiliser :

```yaml
# Le script execute_workflow.py affichera un warning si une variable
# est référencée mais pas définie.

# Assurez-vous que chaque variable utilisée a été définie dans une
# étape précédente via output_variable
```

## Variables Système Disponibles

En plus des variables définies dans le workflow, ces variables système sont toujours disponibles :

- `{{timestamp}}` - ISO timestamp de l'exécution
- Tous les paramètres de la commande (définis dans `parameters`)

```yaml
parameters:
  - name: component_name
    type: string
    required: true

workflow:
  - step: process
    prompt: |
      Processing component: {{component_name}}
      Execution time: {{timestamp}}
    output_variable: result
```

## Debugging du Contexte

Le script `execute_workflow.py` affiche le contexte à chaque étape :

```bash
python scripts/execute_workflow.py command.yaml -p component=MyComponent

# Affichera :
# 📊 Parameters:
#    • component: MyComponent
#    • timestamp: 2024-01-15T10:30:00
#
# 📍 Step 1: migrate
# 📝 Prompt for vue-developer:
# Convert component MyComponent...
```

## Exemples Complets

### Exemple 1 : Migration avec Contexte Riche

```yaml
workflow:
  - step: analyze_current
    agent: code-analyzer
    prompt: "Analyze {{component_path}}"
    output_variable: current_analysis
    
  - step: migrate
    agent: vue-developer
    prompt: |
      Migrate to Vue 3 Composition API + TypeScript.
      
      Current analysis:
      {{current_analysis}}
      
      Component: {{component_name}}
      Path: {{component_path}}
    output_variable: migrated_code
    
  - step: review
    agent: code-reviewer
    prompt: |
      Review this migration:
      
      Original analysis:
      {{current_analysis}}
      
      Migrated code:
      {{migrated_code}}
    output_variable: review_report
    
  - step: optimize
    agent: vue-developer
    prompt: |
      Optimize based on review:
      {{review_report}}
      
      Current code:
      {{migrated_code}}
      
      Original context:
      {{current_analysis}}
    output_variable: final_code
```

### Exemple 2 : Pipeline de Données

```yaml
workflow:
  - step: extract
    agent: data-extractor
    prompt: "Extract data from {{source_file}}"
    output_variable: raw_data
    
  - step: validate
    agent: data-validator
    prompt: |
      Validate this data structure:
      {{raw_data}}
    output_variable: validation_report
    
  - step: transform
    agent: data-transformer
    condition: "validation_report contains 'valid'"
    prompt: |
      Transform this validated data:
      {{raw_data}}
      
      Validation: {{validation_report}}
    output_variable: transformed_data
    
  - step: load
    agent: data-loader
    prompt: |
      Load into database:
      {{transformed_data}}
      
      Source: {{source_file}}
      Validation: {{validation_report}}
    output_variable: load_status
```
