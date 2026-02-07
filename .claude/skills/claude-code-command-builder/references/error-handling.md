# Error Handling and Resilience

Ce document décrit les stratégies de gestion d'erreurs pour les workflows Claude Code.

## Options de Gestion d'Erreurs

Chaque étape peut définir son comportement en cas d'erreur via le champ `on_error`.

### 1. Stop (Défaut)

Arrête immédiatement le workflow en cas d'erreur.

```yaml
- step: critical_task
  agent: database-writer
  prompt: "Save to production database"
  output_variable: save_result
  on_error: stop  # Arrête tout si échec
```

**Quand l'utiliser :**
- Opérations critiques (écriture en base, déploiement)
- Étapes dont les suivantes dépendent absolument
- Opérations irréversibles

### 2. Continue

Continue vers l'étape suivante même en cas d'erreur.

```yaml
- step: send_notification
  agent: notification-service
  prompt: "Send email notification"
  output_variable: notification_status
  on_error: continue  # Continue même si l'email échoue
```

**Quand l'utiliser :**
- Opérations optionnelles (notifications, logs)
- Tâches dont l'échec n'affecte pas les suivantes
- Collecte de métriques non-critiques

### 3. Retry

Réessaye l'étape un nombre défini de fois avant d'échouer.

```yaml
- step: fetch_external_api
  agent: api-client
  prompt: "Fetch data from API"
  output_variable: api_data
  on_error: retry
  retry_count: 3  # Réessaye jusqu'à 3 fois
```

**Quand l'utiliser :**
- Appels API externes instables
- Opérations réseau
- Services tiers susceptibles d'être temporairement indisponibles

## Patterns de Gestion d'Erreurs

### Pattern 1 : Fallback avec Stratégie Alternative

Utilise une approche alternative si la principale échoue.

```yaml
workflow:
  - step: try_fast_method
    agent: optimizer
    prompt: "Use fast optimization"
    output_variable: result
    on_error: continue
    
  - step: use_fallback
    agent: optimizer
    condition: "result equals ''"  # Si étape précédente a échoué
    prompt: "Use slower but reliable method"
    output_variable: result
```

### Pattern 2 : Circuit Breaker

Arrête le workflow après plusieurs échecs consécutifs.

```yaml
workflow:
  - step: check_service_health
    agent: health-checker
    prompt: "Check API health"
    output_variable: health_status
    on_error: stop  # Si le service est down, pas la peine de continuer
    
  - step: call_service
    agent: api-client
    prompt: "Call service endpoint"
    output_variable: service_data
    on_error: retry
    retry_count: 3
```

### Pattern 3 : Compensation Transaction

Annule les modifications en cas d'erreur.

```yaml
workflow:
  - step: create_draft
    agent: content-creator
    prompt: "Create draft"
    output_variable: draft
    
  - step: publish
    agent: publisher
    prompt: "Publish: {{draft}}"
    output_variable: published
    on_error: stop
    
  - step: rollback_on_error
    agent: rollback-manager
    condition: "published equals ''"
    prompt: "Delete draft: {{draft}}"
    output_variable: rollback_status
```

### Pattern 4 : Graceful Degradation

Continue avec des fonctionnalités réduites.

```yaml
workflow:
  - step: fetch_full_data
    agent: data-fetcher
    prompt: "Fetch complete dataset"
    output_variable: full_data
    on_error: continue
    
  - step: fetch_minimal_data
    agent: data-fetcher
    condition: "full_data equals ''"
    prompt: "Fetch minimal required data"
    output_variable: minimal_data
    
  - step: process
    agent: processor
    prompt: |
      Process data (prefer full if available):
      Full: {{full_data}}
      Minimal: {{minimal_data}}
    output_variable: processed
```

### Pattern 5 : Validation en Amont

Vérifie les prérequis avant les opérations critiques.

```yaml
workflow:
  - step: validate_preconditions
    agent: validator
    prompt: |
      Validate:
      - Database is accessible
      - User has permissions
      - Data format is correct
      Input: {{user_input}}
    output_variable: validation
    on_error: stop
    
  - step: execute_if_valid
    agent: executor
    condition: "validation contains 'success'"
    prompt: "Execute operation with {{user_input}}"
    output_variable: result
```

## Stratégies de Retry

### Retry Simple

```yaml
- step: unstable_operation
  on_error: retry
  retry_count: 3  # Réessaye 3 fois
```

### Retry avec Backoff (À Implémenter)

Pour des retries plus sophistiqués avec délais croissants, créez un agent dédié :

```yaml
- step: api_call_with_backoff
  agent: retry-manager
  prompt: |
    Call API with exponential backoff:
    - Initial delay: 1s
    - Max retries: 5
    - Backoff multiplier: 2
    Endpoint: {{api_endpoint}}
  output_variable: api_result
```

## Logging et Debugging

### Activer les Logs Détaillés

Le script `execute_workflow.py` affiche automatiquement :

```bash
python scripts/execute_workflow.py command.yaml -p param=value

# Affiche :
# ✅ Step completed: step_name
# ❌ Step failed: step_name (attempting retry 1/3)
# ⏭️  Skipping step (condition not met)
```

### Capturer les Erreurs dans le Contexte

```yaml
workflow:
  - step: risky_operation
    agent: executor
    prompt: "Execute risky task"
    output_variable: result
    on_error: continue
    
  - step: log_error_if_any
    agent: logger
    condition: "result equals ''"
    prompt: "Log that risky_operation failed"
    output_variable: error_log
```

## Best Practices

### 1. Définir Explicitement on_error

```yaml
# ❌ Mauvais - comportement implicite
- step: my_step
  agent: my-agent
  
# ✅ Bon - comportement explicite
- step: my_step
  agent: my-agent
  on_error: stop  # Explicite, même si c'est le défaut
```

### 2. Documenter les Stratégies d'Erreur

```yaml
- step: external_api
  description: |
    Calls external weather API. 
    Uses retry because API is sometimes unreliable.
  agent: api-client
  on_error: retry
  retry_count: 3
```

### 3. Tester les Scénarios d'Échec

Créez des commandes de test pour vérifier la gestion d'erreurs :

```yaml
# test-error-handling.yaml
workflow:
  - step: simulate_failure
    agent: test-agent
    prompt: "Intentionally fail to test error handling"
    output_variable: result
    on_error: continue
    
  - step: verify_continued
    agent: test-agent
    prompt: "This should execute even after failure"
    output_variable: continued
```

### 4. Nettoyage en Cas d'Erreur

```yaml
workflow:
  - step: create_temp_files
    agent: file-manager
    prompt: "Create temp files"
    output_variable: temp_files
    
  - step: process
    agent: processor
    prompt: "Process files: {{temp_files}}"
    output_variable: result
    on_error: stop
    
  # Cette étape devrait s'exécuter même en cas d'erreur (à améliorer dans le futur)
  - step: cleanup
    agent: file-manager
    prompt: "Delete temp files: {{temp_files}}"
    output_variable: cleanup_status
```

## Patterns Anti-Erreurs

### ❌ Anti-Pattern 1 : Ignorer les Erreurs Critiques

```yaml
# NE JAMAIS faire ça pour des opérations critiques
- step: deploy_to_production
  on_error: continue  # ❌ Dangereux !
```

### ❌ Anti-Pattern 2 : Retry Infini

```yaml
# Limitez toujours le nombre de retries
- step: unstable_task
  on_error: retry
  retry_count: 100  # ❌ Trop de retries !
```

### ❌ Anti-Pattern 3 : Pas de Validation

```yaml
# Validez avant les opérations critiques
workflow:
  - step: deploy_directly
    agent: deployer
    prompt: "Deploy without validation"  # ❌ Risqué !
```

### ❌ Anti-Pattern 4 : Cascade d'Erreurs

```yaml
workflow:
  - step: step1
    on_error: continue
  - step: step2
    prompt: "Use {{step1_result}}"  # ❌ step1_result peut être vide !
    on_error: continue
  - step: step3
    prompt: "Use {{step2_result}}"  # ❌ Cascade d'erreurs !
```

## Monitoring et Alertes

### Créer des Rapports d'Erreurs

Le script génère automatiquement un rapport qui inclut :

```markdown
# Workflow Execution Report

## Steps
### Step 1: fetch_data
- **Agent:** api-client
- **Status:** ✅ Success
- **Timestamp:** 2024-01-15T10:30:00

### Step 2: process_data
- **Agent:** processor
- **Status:** ❌ Failed (after 3 retries)
- **Timestamp:** 2024-01-15T10:31:00
```

### Intégration avec Systèmes de Monitoring

Créez des agents dédiés au monitoring :

```yaml
workflow:
  - step: main_task
    agent: task-executor
    prompt: "Execute main task"
    output_variable: result
    on_error: continue
    
  - step: report_to_monitoring
    agent: monitoring-reporter
    prompt: |
      Report execution status:
      Task result: {{result}}
      Success: {{result != ''}}
    output_variable: monitoring_status
```

## Exemples Complets

### Exemple 1 : Workflow Résilient avec Fallbacks

```yaml
name: resilient-data-processing
description: Process data with multiple fallback strategies

workflow:
  - step: validate_input
    agent: validator
    prompt: "Validate {{input_file}}"
    output_variable: validation
    on_error: stop
    
  - step: try_fast_processing
    agent: fast-processor
    prompt: "Process: {{input_file}}"
    output_variable: result
    on_error: continue
    retry_count: 2
    
  - step: try_standard_processing
    agent: standard-processor
    condition: "result equals ''"
    prompt: "Process with standard method: {{input_file}}"
    output_variable: result
    on_error: continue
    
  - step: try_slow_but_reliable
    agent: reliable-processor
    condition: "result equals ''"
    prompt: "Process with reliable method: {{input_file}}"
    output_variable: result
    on_error: stop
    
  - step: save_result
    agent: storage
    prompt: "Save: {{result}}"
    output_variable: save_status
```

### Exemple 2 : API Call avec Gestion d'Erreurs Complète

```yaml
name: robust-api-integration
description: Call external API with comprehensive error handling

workflow:
  - step: check_api_health
    agent: health-checker
    prompt: "Check API status: {{api_url}}"
    output_variable: health
    on_error: stop
    
  - step: fetch_data
    agent: api-client
    condition: "health contains 'healthy'"
    prompt: "Fetch from: {{api_url}}"
    output_variable: api_data
    on_error: retry
    retry_count: 3
    
  - step: use_cached_data
    agent: cache-manager
    condition: "api_data equals ''"
    prompt: "Load cached data for {{api_url}}"
    output_variable: cached_data
    
  - step: process_data
    agent: processor
    prompt: |
      Process data (prefer fresh):
      Fresh: {{api_data}}
      Cached: {{cached_data}}
    output_variable: processed
    
  - step: update_cache
    agent: cache-manager
    condition: "api_data != ''"
    prompt: "Update cache with: {{api_data}}"
    output_variable: cache_status
    on_error: continue  # Cache update is optional
```
