# Workflow Patterns

Ce document décrit les patterns courants pour orchestrer des sous-agents dans Claude Code.

## Pattern 1 : Workflow Séquentiel Simple

Le pattern le plus basique où chaque étape s'exécute l'une après l'autre, chaque étape utilisant les résultats de la précédente.

```yaml
workflow:
  - step: analyze
    agent: code-reviewer
    prompt: "Analyze this code: {{code}}"
    output_variable: analysis_result
    
  - step: refactor
    agent: vue-developer
    prompt: |
      Refactor based on this analysis:
      {{analysis_result}}
    output_variable: refactored_code
```

**Cas d'usage :**
- Migration puis révision
- Analyse puis refactoring
- Génération puis validation

## Pattern 2 : Workflow avec Conditions

Exécution conditionnelle basée sur les résultats des étapes précédentes.

```yaml
workflow:
  - step: review
    agent: code-reviewer
    prompt: "Review this PR"
    output_variable: review
    
  - step: fix_critical
    agent: vue-developer
    condition: "review contains 'critical'"
    prompt: |
      Fix these critical issues:
      {{review}}
    output_variable: fixes
    
  - step: optimize
    agent: vue-developer
    condition: "review contains 'performance'"
    prompt: |
      Optimize based on:
      {{review}}
    output_variable: optimizations
```

**Conditions supportées :**
- `variable contains 'text'` - Vérifie si la variable contient le texte
- `variable equals 'value'` - Vérifie l'égalité exacte

## Pattern 3 : Workflow de Migration Multi-étapes

Pattern spécialisé pour la migration de code avec validation à chaque étape.

```yaml
workflow:
  - step: migrate_to_typescript
    agent: vue-developer
    prompt: |
      Convert {{component_name}} to TypeScript
      Path: {{component_path}}
    output_variable: typescript_code
    
  - step: migrate_to_composition
    agent: vue-developer
    prompt: |
      Convert this component to Composition API:
      {{typescript_code}}
    output_variable: composition_code
    
  - step: review_migration
    agent: code-reviewer
    prompt: |
      Review this migrated code:
      {{composition_code}}
    output_variable: migration_review
    
  - step: apply_fixes
    agent: vue-developer
    condition: "migration_review contains 'issue'"
    prompt: |
      Apply these migration fixes:
      {{migration_review}}
      
      Current code:
      {{composition_code}}
    output_variable: final_code
```

## Pattern 4 : Workflow avec Gestion d'Erreurs

Utilisation de `on_error` et `retry_count` pour la robustesse.

```yaml
workflow:
  - step: external_api_call
    agent: api-integration
    prompt: "Fetch data from API"
    output_variable: api_data
    on_error: retry
    retry_count: 3
    
  - step: process_data
    agent: data-processor
    prompt: "Process: {{api_data}}"
    output_variable: processed
    on_error: continue  # Continue même si cette étape échoue
    
  - step: save_results
    agent: file-manager
    prompt: "Save: {{processed}}"
    output_variable: save_status
    on_error: stop  # Arrêter si la sauvegarde échoue
```

**Options `on_error` :**
- `stop` (défaut) : Arrête le workflow
- `continue` : Continue vers l'étape suivante
- `retry` : Réessaye l'étape (utilise `retry_count`)

## Pattern 5 : Workflow de Qualité Continue

Pattern pour maintenir la qualité du code tout au long du développement.

```yaml
workflow:
  - step: implement_feature
    agent: vue-developer
    prompt: |
      Implement feature: {{feature_name}}
      Requirements: {{requirements}}
    output_variable: implementation
    
  - step: write_tests
    agent: test-engineer
    prompt: |
      Write tests for:
      {{implementation}}
    output_variable: tests
    
  - step: review_code
    agent: code-reviewer
    prompt: |
      Review implementation and tests:
      Code: {{implementation}}
      Tests: {{tests}}
    output_variable: review
    
  - step: refactor_if_needed
    agent: vue-developer
    condition: "review contains 'refactor'"
    prompt: |
      Refactor based on review:
      {{review}}
      
      Code: {{implementation}}
    output_variable: final_implementation
```

## Pattern 6 : Workflow de Documentation

Génération automatique de documentation à partir du code.

```yaml
workflow:
  - step: analyze_code
    agent: code-analyzer
    prompt: "Analyze structure of {{file_path}}"
    output_variable: code_structure
    
  - step: generate_api_docs
    agent: documentation-writer
    prompt: |
      Generate API documentation for:
      {{code_structure}}
    output_variable: api_docs
    
  - step: generate_examples
    agent: example-generator
    prompt: |
      Generate usage examples based on:
      {{code_structure}}
    output_variable: examples
    
  - step: combine_documentation
    agent: documentation-writer
    prompt: |
      Combine into final documentation:
      API Docs: {{api_docs}}
      Examples: {{examples}}
    output_variable: final_docs
```

## Pattern 7 : Workflow de Refactoring Incrémental

Refactoring par petites étapes avec validation.

```yaml
workflow:
  - step: identify_smells
    agent: code-reviewer
    prompt: "Identify code smells in {{file_path}}"
    output_variable: smells
    
  - step: prioritize
    agent: refactoring-planner
    prompt: |
      Prioritize these issues:
      {{smells}}
    output_variable: priorities
    
  - step: refactor_priority_1
    agent: vue-developer
    prompt: |
      Refactor highest priority issue:
      {{priorities}}
    output_variable: refactor_1
    
  - step: test_refactor_1
    agent: test-engineer
    prompt: "Test: {{refactor_1}}"
    output_variable: test_1
    
  - step: refactor_priority_2
    agent: vue-developer
    condition: "test_1 contains 'pass'"
    prompt: |
      Refactor next priority:
      {{priorities}}
      Current: {{refactor_1}}
    output_variable: refactor_2
```

## Best Practices

### 1. Nommage des Variables

Utilisez des noms descriptifs pour les `output_variable` :

```yaml
# ❌ Mauvais
output_variable: result1

# ✅ Bon
output_variable: typescript_migration_result
```

### 2. Prompts Clairs et Contextuels

Fournissez toujours le contexte nécessaire dans les prompts :

```yaml
# ❌ Mauvais
prompt: "Review the code"

# ✅ Bon
prompt: |
  Review this Vue 3 component that was just migrated from Options API to Composition API.
  Focus on:
  - Proper use of reactive refs
  - TypeScript type safety
  - Composition API best practices
  
  Code:
  {{migrated_code}}
```

### 3. Gestion d'Erreurs Appropriée

Choisissez `on_error` selon la criticité :

```yaml
# Critique : arrêter si échec
- step: save_to_database
  on_error: stop
  
# Non-critique : continuer
- step: send_notification
  on_error: continue
  
# Instable : réessayer
- step: external_api
  on_error: retry
  retry_count: 3
```

### 4. Documentation des Steps

Utilisez toujours le champ `description` :

```yaml
- step: migrate_component
  description: Convert Vue 2 Options API to Vue 3 Composition API with TypeScript
  agent: vue-developer
  # ...
```

## Anti-Patterns à Éviter

### ❌ Variables Undefined

```yaml
# N'utilisez pas de variables qui n'ont pas été définies
- step: step2
  prompt: "Use {{undefined_var}}"  # Erreur !
```

### ❌ Conditions Complexes

```yaml
# Les conditions complexes ne sont pas supportées
condition: "var1 contains 'x' AND var2 equals 'y' OR var3 > 5"
```

### ❌ Chaînes Trop Longues

```yaml
# Limitez à 5-7 étapes maximum par workflow
# Si plus long, divisez en plusieurs commandes
```

### ❌ Pas de Sortie Définie

```yaml
# Définissez toujours ce que la commande produit
output:
  format: markdown
  variables:
    - final_result
  save_to: .claude/outputs/{{timestamp}}.md
```
