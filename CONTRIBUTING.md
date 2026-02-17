# Contributing to boiling-fullstack

First off, thank you for considering contributing to **boiling-fullstack**! Every contribution matters, whether it's a bug fix, a new feature, improved templates, or better documentation.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [How to Contribute](#how-to-contribute)
- [Coding Conventions](#coding-conventions)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Labels Guide](#labels-guide)

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **Docker** & Docker Compose V2
- **Git**

### Setup

```bash
# Fork the repo, then clone your fork
git clone https://github.com/<your-username>/boiling-fullstack.git
cd boiling-fullstack

# Install dependencies
npm install

# Test locally by scaffolding a project
npm run dev -- test-project
# or
node src/index.ts test-project
```

### Testing a Generated Project

After scaffolding a test project, verify it works:

```bash
cd test-project
make up        # Start all services
make logs      # Check for errors
make down      # Stop services
```

## Project Architecture

```
boiling-fullstack/
├── src/                    # CLI source code (TypeScript)
│   ├── index.ts            # Entry point
│   └── ...                 # CLI logic, prompts, generators
├── templates/              # EJS templates for generated projects
│   ├── backend/            # NestJS backend templates
│   ├── frontend-nuxt/      # Nuxt 4 frontend templates
│   ├── frontend-vue/       # Vue 3 + Vite frontend templates
│   ├── docker/             # Dockerfile & docker-compose templates
│   └── ...                 # Makefile, configs, README, etc.
├── package.json
└── tsconfig.json
```

**Key concepts:**

- **`src/`** contains the CLI logic that prompts the user and orchestrates file generation.
- **`templates/`** contains EJS (`.ejs`) templates that are rendered with user choices to produce the final project files.
- When modifying generated output, you typically edit files in `templates/`, not `src/`.

## Development Workflow

1. **Create an issue** (or pick an existing one) before starting work.
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/my-bugfix
   ```
3. **Make your changes** and test them by scaffolding a project.
4. **Commit** following the [commit conventions](#commit-messages).
5. **Push** and open a Pull Request.

## How to Contribute

### 🐛 Fix a Bug

1. Check the [issues](https://github.com/lebowvsky/boiling-fullstack/issues?q=is%3Aissue+is%3Aopen+label%3Abug) page for reported bugs.
2. Reproduce the bug locally.
3. Fix and test by generating a fresh project with various CLI options.

### ✨ Add a Feature

1. Open a **Feature Request** issue first to discuss the idea.
2. Wait for approval before investing time coding.
3. Implement, test, and document the feature.

### 🔨 Improve Templates

1. Identify which template file(s) in `templates/` need changes.
2. Modify the `.ejs` template(s).
3. Test by scaffolding projects with different option combinations (Nuxt vs Vue, CSS vs Sass, single vs multi-frontend).

### 📖 Improve Documentation

Documentation issues are labeled `good first issue` — perfect for first-time contributors!

## Coding Conventions

- **TypeScript** for all CLI source code.
- **ESLint + Prettier** — run before committing:
  ```bash
  npm run lint
  npm run format
  ```
- **Naming**:
  - Files: `kebab-case.ts`
  - Variables/functions: `camelCase`
  - Types/interfaces: `PascalCase`
- **Templates**: Use clear EJS conditionals with comments explaining logic.

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

**Types:**
| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no code change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |
| `template` | Changes to generated project templates |

**Examples:**
```
feat(cli): add Angular frontend option
fix(template): correct Nuxt Dockerfile node version
docs: add troubleshooting section to README
template(backend): add rate limiting to NestJS template
```

## Pull Request Process

1. **Fill out the PR template** — describe what you changed and why.
2. **Link the related issue** — use `Closes #123` in the PR description.
3. **Keep PRs focused** — one feature or fix per PR.
4. **Test all combinations** — if you changed templates, test with different CLI options:
   - Single frontend vs multiple
   - Nuxt vs Vue
   - CSS vs Sass
   - With and without DB admin tool
5. **Wait for review** — maintainers will review and may request changes.

## Labels Guide

| Label | Description |
|-------|-------------|
| `good first issue` | Great for newcomers |
| `help wanted` | We'd love help on this |
| `bug` | Something isn't working |
| `enhancement` | New feature or improvement |
| `template` | Related to generated templates |
| `documentation` | Documentation improvements |
| `triage` | Needs initial review |
| `priority: high` | Should be addressed soon |
| `priority: low` | Nice to have |
| `wontfix` | Not planned |

---

## Questions?

If you have questions about contributing, feel free to open a [Discussion](https://github.com/lebowvsky/boiling-fullstack/discussions) or reach out via an issue.

Thank you for helping make boiling-fullstack better! 🚀
