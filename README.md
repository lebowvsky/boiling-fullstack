# boiling-fullstack

Scaffold fullstack projects with Docker, NestJS backend, and Vue/Nuxt frontends in seconds.

## Features

- **Multi-frontend** — 1 to 5 frontends per project, each independently configured
- **Framework choice** — Nuxt 4 (SSR) or Vue 3 + Vite (SPA) per frontend
- **Styling choice** — CSS or Sass per frontend
- **Backend** — NestJS + TypeORM + PostgreSQL with JWT authentication and Tasks CRUD example
- **API documentation** — Swagger/OpenAPI auto-generated at `/api/docs`
- **Database migrations** — TypeORM migration scripts ready to use
- **Docker Compose** — Dev and production configs with hot reloading
- **Makefile** — All common commands available via `make`
- **Code quality** — ESLint + Prettier pre-configured for all services
- **DB admin** — Optional pgAdmin or Adminer
- **Auto-generated README** — Each scaffolded project includes full documentation

## Quick Start

```bash
npx boiling-fullstack my-project
```

The interactive CLI guides you through the setup:

```
◆  Project name: my-project
◆  Number of frontends (1-5): 2
◆  Frontend 1 - Service name: app
◆  Frontend 1 - Framework: Nuxt
◆  Frontend 1 - Styling: Sass
◆  Frontend 1 - Port: 3000
◆  Frontend 2 - Service name: backoffice
◆  Frontend 2 - Framework: Vue
◆  Frontend 2 - Styling: Plain CSS
◆  Frontend 2 - Port: 3010
◆  Backend port: 3001
◆  Database, DB admin tool...
◆  Generate project? Yes

✔  Project generated successfully!
```

Then start everything:

```bash
cd my-project
make up
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose V2

## Generated Structure

Example with 2 frontends (`app` Nuxt + `backoffice` Vue):

```
my-project/
├── app/                          # Nuxt 4 frontend
│   ├── app/
│   │   ├── app.vue
│   │   └── pages/
│   │       └── index.vue
│   ├── Dockerfile
│   ├── nuxt.config.ts
│   ├── package.json
│   └── tsconfig.json
├── backoffice/                   # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── App.vue
│   │   └── main.ts
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                      # NestJS + TypeORM
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   ├── tasks/
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.service.ts
│   │   │   ├── tasks.module.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   │       └── task.entity.ts
│   │   ├── config/
│   │   │   ├── typeorm.config.ts
│   │   │   └── data-source.ts
│   │   ├── migrations/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml            # Dev
├── docker-compose.prod.yml       # Production
├── .env                          # Dev env variables
├── .env.production               # Prod env variables (placeholders)
├── Makefile
├── README.md
└── .gitignore
```

## Available Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services (dev) |
| `make down` | Stop all services |
| `make logs` | View all logs |
| `make build` | Rebuild all services |
| `make restart` | Restart all services |
| `make clean` | Stop & remove volumes |
| `make db-shell` | Open PostgreSQL shell |
| `make backend-shell` | Open backend container shell |
| `make lint-back` | Run ESLint on backend |
| `make format-back` | Run Prettier on backend |
| `make migration-generate name=Name` | Generate a TypeORM migration |
| `make migration-run` | Run pending migrations |
| `make up-prod` | Start all services (production) |

## CLI Options

```
Usage: boiling [options] [project-name]

Options:
  -f, --force    Overwrite existing directory
  -v, --verbose  Show shell command output
  -V, --version  Output version number
  -h, --help     Display help
```

## License

MIT
