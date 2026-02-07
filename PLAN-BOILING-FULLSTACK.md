# PLAN DE RÉALISATION — `boiling-fullstack` CLI

## Contexte

Tu dois créer un CLI Node.js/TypeScript appelé `boiling-fullstack` qui scaffolde un projet full-stack conteneurisé prêt à l'emploi. L'utilisateur lance `npx boiling-fullstack mon-projet`, répond à des prompts interactifs, et obtient un projet complet avec frontend(s), backend, base de données PostgreSQL, Docker Compose, hot reloading, et Makefile.

---

## PHASE 1 — Initialisation du projet CLI

### 1.1 Structure du projet CLI

Crée cette arborescence :

```
boiling-fullstack/
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
├── src/
│   ├── index.ts              # Entry point avec shebang #!/usr/bin/env node
│   ├── cli.ts                # Prompts interactifs
│   ├── scaffolder.ts         # Logique de génération (copie + rendu templates)
│   ├── types.ts              # Interfaces TypeScript
│   └── utils/
│       ├── template.ts       # Rendu EJS des fichiers templates
│       ├── shell.ts          # Wrappers pour execa (git init, npm install)
│       └── validation.ts     # Validation des noms, ports, etc.
├── templates/                # Tous les fichiers templates (voir Phase 2)
│   ├── frontend/
│   │   ├── nuxt/
│   │   └── vue/
│   ├── backend/
│   │   └── nestjs/
│   ├── docker/
│   ├── root/
│   └── shared/
```

### 1.2 package.json du CLI

```json
{
  "name": "boiling-fullstack",
  "version": "1.0.0",
  "description": "CLI pour scaffolder un projet full-stack conteneurisé (Nuxt/Vue + NestJS + PostgreSQL + Docker)",
  "bin": {
    "boiling-fullstack": "./dist/index.js"
  },
  "files": ["dist", "templates"],
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["cli", "fullstack", "docker", "nuxt", "vue", "nestjs", "scaffold", "boilerplate"]
}
```

### 1.3 Dépendances à installer

```bash
npm install commander @clack/prompts chalk picocolors ejs fs-extra execa validate-npm-package-name
npm install -D typescript @types/node @types/fs-extra @types/ejs ts-node
```

### 1.4 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "templates"]
}
```

---

## PHASE 2 — Types et modèles de données

### 2.1 Fichier `src/types.ts`

```ts
export interface FrontendConfig {
  name: string;                // Nom du service (ex: "app", "backoffice") — sert aussi de nom de dossier et de service Docker
  framework: 'nuxt' | 'vue';  // Choix du framework
  port: number;                // Port exposé sur l'hôte
}

export interface ProjectConfig {
  projectName: string;         // Nom du projet (et du dossier racine)
  frontends: FrontendConfig[]; // 1 à 5 frontends
  backendPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
}
```

---

## PHASE 3 — CLI et prompts interactifs

### 3.1 Fichier `src/index.ts`

- Shebang `#!/usr/bin/env node`
- Utilise `commander` pour parser un argument optionnel `<project-name>`
- Appelle `runCli()` depuis `cli.ts`

### 3.2 Fichier `src/cli.ts`

Flow des prompts avec `@clack/prompts` :

```
1. Intro avec bannière ASCII "boiling-fullstack"
2. Si pas d'argument : demander le nom du projet
   - Validation : kebab-case, pas de caractères spéciaux, pas de dossier existant
3. Demander le nombre de frontends (1 à 5)
4. Pour chaque frontend (boucle) :
   a. Nom du service (défaut: "app" pour le 1er, "frontend-N" pour les suivants)
      - Validation : kebab-case, unicité
   b. Framework : Nuxt 4 ou Vue 3 (Vite)
   c. Port (défaut: 3000 pour le 1er, +10 pour chaque suivant)
      - Validation : 1024-65535, unicité parmi tous les ports (y compris backend et 5432)
5. Port backend (défaut: 3001)
   - Validation : unicité avec les ports frontend et 5432
6. Nom de la base PostgreSQL (défaut: nom du projet avec underscores)
7. Utilisateur DB (défaut: "postgres")
8. Mot de passe DB (défaut: généré aléatoirement, affiché, type "password" pour le prompt)
9. Récapitulatif de la configuration + confirmation (oui/non)
10. Lancement du scaffolding
```

**Règles importantes :**
- Tous les ports doivent être uniques entre eux ET différents de 5432 (PostgreSQL)
- Les noms de services doivent être uniques
- Le nom du projet doit être un nom de package npm valide (utiliser `validate-npm-package-name`)

---

## PHASE 4 — Templates

### 4.1 Template Frontend Nuxt (`templates/frontend/nuxt/`)

Crée un projet Nuxt 4 minimal mais fonctionnel :

```
templates/frontend/nuxt/
├── package.json.ejs
├── nuxt.config.ts.ejs
├── tsconfig.json
├── app.vue
├── pages/
│   └── index.vue
├── Dockerfile
├── .dockerignore
├── .eslintrc.cjs.ejs
├── .prettierrc
```

**`package.json.ejs`** — dépendances :
- `nuxt` (dernière version stable)
- `@nuxt/eslint` 
- `typescript`
- `prettier`
- `eslint`
- Scripts : `dev`, `build`, `preview`, `lint`, `lint:fix`, `format`

**`nuxt.config.ts.ejs`** :
```ts
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  typescript: { strict: true },
  vite: {
    server: {
      watch: { usePolling: true },  // Nécessaire pour le hot reload dans Docker
      hmr: { port: 24678 }
    }
  },
  devServer: {
    host: '0.0.0.0',
    port: 3000
  }
})
```

**`Dockerfile`** (multi-stage) :
```dockerfile
# --- Development ---
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- Build ---
FROM development AS build
RUN npm run build

# --- Production ---
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV NUXT_HOST=0.0.0.0
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

**`app.vue`** :
```vue
<template>
  <NuxtPage />
</template>
```

**`pages/index.vue`** :
```vue
<template>
  <div>
    <h1>🚀 <%= name %> — Powered by Nuxt</h1>
    <p>Frontend "<%= name %>" is running.</p>
  </div>
</template>
```

**`.dockerignore`** :
```
node_modules
.nuxt
.output
dist
.git
*.md
```

**ESLint** : configuration flat config compatible Nuxt + TypeScript + Prettier.

**Prettier** (`.prettierrc`) :
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

### 4.2 Template Frontend Vue (`templates/frontend/vue/`)

Crée un projet Vue 3 + Vite minimal :

```
templates/frontend/vue/
├── package.json.ejs
├── vite.config.ts.ejs
├── tsconfig.json
├── index.html.ejs
├── src/
│   ├── main.ts
│   ├── App.vue
│   └── vite-env.d.ts
├── Dockerfile
├── .dockerignore
├── .eslintrc.cjs.ejs
├── .prettierrc
```

**`package.json.ejs`** — dépendances :
- `vue`
- `vite`
- `@vitejs/plugin-vue`
- `vue-tsc`
- `typescript`
- `eslint`, `prettier`, `eslint-plugin-vue`, `@typescript-eslint/eslint-plugin`
- Scripts : `dev`, `build`, `preview`, `lint`, `lint:fix`, `format`

**`vite.config.ts.ejs`** :
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true  // Hot reload Docker
    }
  }
})
```

**`Dockerfile`** (multi-stage) :
```dockerfile
# --- Development ---
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# --- Build ---
FROM development AS build
RUN npm run build

# --- Production ---
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`index.html.ejs`** :
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= name %></title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### 4.3 Template Backend NestJS (`templates/backend/nestjs/`)

```
templates/backend/nestjs/
├── package.json.ejs
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── Dockerfile
├── .dockerignore
├── .eslintrc.cjs.ejs
├── .prettierrc
├── src/
│   ├── main.ts.ejs
│   ├── app.module.ts.ejs
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── config/
│   │   └── typeorm.config.ts.ejs
│   └── auth/                    # Module Auth JWT
│       ├── auth.module.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.guard.ts
│       ├── jwt.strategy.ts
│       ├── dto/
│       │   ├── login.dto.ts
│       │   └── register.dto.ts
│       └── entities/
│           └── user.entity.ts
```

**`package.json.ejs`** — dépendances :
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- `@nestjs/typeorm`, `typeorm`, `pg`
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
- `@nestjs/config`
- `class-validator`, `class-transformer`
- `bcrypt`
- DevDeps : `@nestjs/cli`, `@nestjs/testing`, `typescript`, `eslint`, `prettier`, `@types/bcrypt`, `@types/passport-jwt`
- Scripts : `start`, `start:dev`, `start:debug`, `build`, `lint`, `lint:fix`, `format`, `migration:generate`, `migration:run`, `migration:revert`

**`src/main.ts.ejs`** :
```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(3001);
  console.log(`🚀 Backend running on http://localhost:3001`);
}
bootstrap();
```

**`src/config/typeorm.config.ts.ejs`** :
```ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
});
```

**`src/app.module.ts.ejs`** :
```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Module Auth JWT** — Implémente :
- Entity `User` (id, email, password hashé, createdAt, updatedAt)
- DTO `LoginDto` (email, password avec class-validator)
- DTO `RegisterDto` (email, password avec validation)
- `AuthService` : register (hash bcrypt), login (retourne JWT)
- `AuthController` : POST `/auth/register`, POST `/auth/login`
- `JwtStrategy` : validation du token depuis les headers Authorization Bearer
- `AuthGuard` : guard réutilisable pour protéger les routes
- Le secret JWT vient de `process.env.JWT_SECRET`

**`app.controller.ts`** :
```ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return { message: 'API is running', status: 'ok' };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
```

**Dockerfile backend** (multi-stage) :
```dockerfile
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

FROM development AS build
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1
CMD ["node", "dist/main.js"]
```

### 4.4 Templates racine (`templates/root/`)

**`docker-compose.yml.ejs`** :

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    restart: unless-stopped
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "<%= backendPort %>:3001"
    env_file:
      - .env
    environment:
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: development
    depends_on:
      db:
        condition: service_healthy
    command: npm run start:dev

<% frontends.forEach((fe) => { %>
  <%= fe.name %>:
    build:
      context: ./<%= fe.name %>
      dockerfile: Dockerfile
      target: development
    restart: unless-stopped
    volumes:
      - ./<%= fe.name %>:/app
      - /app/node_modules
<% if (fe.framework === 'nuxt') { %>
      - /app/.nuxt
<% } %>
    ports:
<% if (fe.framework === 'nuxt') { %>
      - "<%= fe.port %>:3000"
<% } else { %>
      - "<%= fe.port %>:5173"
<% } %>
    environment:
      API_URL: http://backend:<%= backendPort %>
      NODE_ENV: development
    depends_on:
      - backend
<% if (fe.framework === 'nuxt') { %>
    command: npx nuxt dev --host 0.0.0.0
<% } else { %>
    command: npx vite --host 0.0.0.0
<% } %>

<% }); %>
volumes:
  pgdata:
```

**`.env.ejs`** :
```env
# === Database ===
DB_NAME=<%= dbName %>
DB_USER=<%= dbUser %>
DB_PASSWORD=<%= dbPassword %>

# === Backend ===
BACKEND_PORT=<%= backendPort %>
JWT_SECRET=<%= jwtSecret %>
NODE_ENV=development

# === Ports ===
<% frontends.forEach((fe) => { %>
<%= fe.name.toUpperCase().replace(/-/g, '_') %>_PORT=<%= fe.port %>
<% }); %>
```

Note : `jwtSecret` est une chaîne aléatoire de 64 caractères générée par le CLI (utiliser `crypto.randomBytes(32).toString('hex')`).

**`Makefile.ejs`** :
```makefile
include .env
export

# === Commandes principales ===
up:
	docker compose up --build -d

down:
	docker compose down

restart:
	docker compose down && docker compose up --build -d

logs:
	docker compose logs -f

ps:
	docker compose ps

# === Backend ===
shell-back:
	docker compose exec backend sh

logs-back:
	docker compose logs -f backend

lint-back:
	docker compose exec backend npm run lint

# === Base de données ===
db-shell:
	docker compose exec db psql -U $(DB_USER) -d $(DB_NAME)

migrate:
	docker compose exec backend npm run migration:run

migrate-revert:
	docker compose exec backend npm run migration:revert

# === Frontends ===
<% frontends.forEach((fe) => { %>
shell-<%= fe.name %>:
	docker compose exec <%= fe.name %> sh

logs-<%= fe.name %>:
	docker compose logs -f <%= fe.name %>

lint-<%= fe.name %>:
	docker compose exec <%= fe.name %> npm run lint

<% }); %>

# === Nettoyage ===
clean:
	docker compose down -v --rmi local

prune:
	docker system prune -af
```

**`README.md.ejs`** :

Génère un README complet et structuré avec :
- Titre du projet et description
- Architecture (liste des services avec framework, port)
- Prérequis (Docker, Docker Compose, Node.js)
- Quick start (`make up`, URLs d'accès)
- Liste de toutes les commandes Make disponibles
- Variables d'environnement (tableau)
- Structure du projet (arborescence)
- Section Auth API (endpoints POST /auth/register, POST /auth/login avec exemples curl)
- Notes de développement (hot reload, accès DB, etc.)

**`.gitignore`** (template statique, pas EJS) :
```
node_modules/
dist/
.nuxt/
.output/
.env
*.log
.DS_Store
```

---

## PHASE 5 — Logique de scaffolding

### 5.1 Fichier `src/utils/template.ts`

Deux fonctions principales :

```ts
// Rend un fichier .ejs et écrit le résultat (sans l'extension .ejs)
async function renderTemplateFile(templatePath: string, outputPath: string, data: object): Promise<void>

// Copie récursivement un dossier de templates en rendant tous les .ejs
async function copyAndRenderDir(templateDir: string, outputDir: string, data: object): Promise<void>
```

**Règles** :
- Les fichiers `.ejs` sont rendus avec les données puis écrits sans l'extension `.ejs`
- Les fichiers sans `.ejs` sont copiés tels quels
- Les dossiers sont créés récursivement

### 5.2 Fichier `src/utils/shell.ts`

```ts
async function runCommand(cmd: string, args: string[], cwd: string): Promise<void>
async function gitInit(cwd: string): Promise<void>
async function npmInstall(cwd: string): Promise<void>
```

### 5.3 Fichier `src/utils/validation.ts`

```ts
function isValidProjectName(name: string): true | string
function isValidServiceName(name: string, existing: string[]): true | string  
function isValidPort(port: number, usedPorts: number[]): true | string
```

### 5.4 Fichier `src/scaffolder.ts`

Séquence de scaffolding :

```
1. Créer le dossier racine `<projectName>/`
2. Pour chaque frontend dans config.frontends :
   a. Déterminer le template source (nuxt ou vue)
   b. copyAndRenderDir vers `<projectName>/<frontend.name>/`
3. copyAndRenderDir du backend vers `<projectName>/backend/`
4. Rendre les fichiers racine :
   - docker-compose.yml.ejs → docker-compose.yml
   - .env.ejs → .env
   - Makefile.ejs → Makefile
   - README.md.ejs → README.md
   - Copier .gitignore (statique)
5. Afficher un spinner pendant chaque étape
6. git init + premier commit "Initial scaffold by boiling-fullstack"
7. Afficher le récapitulatif final :
   - Chemin du projet
   - Commande pour démarrer : `cd <projectName> && make up`
   - URLs d'accès à chaque service
   - Credentials DB
```

**Ne PAS lancer `npm install`** dans les sous-dossiers — Docker s'en charge au build. Cela évite les problèmes de compatibilité d'OS entre la machine hôte et le conteneur.

---

## PHASE 6 — Détails techniques importants

### 6.1 Hot Reloading dans Docker

C'est LE point critique. Pour chaque frontend dans le docker-compose :

**Volumes** :
```yaml
volumes:
  - ./<service>:/app          # Bind mount du code source
  - /app/node_modules         # Volume anonyme pour isoler node_modules
  - /app/.nuxt                # (Nuxt uniquement) Isoler le cache .nuxt
```

**Nuxt** — dans `nuxt.config.ts` :
- `vite.server.watch.usePolling: true` (obligatoire sur Linux/Docker)
- `vite.server.hmr.port: 24678`
- `devServer.host: '0.0.0.0'`

**Vue/Vite** — dans `vite.config.ts` :
- `server.host: '0.0.0.0'`
- `server.watch.usePolling: true`

**NestJS** — utilise `start:dev` qui lance `nest start --watch`. Le polling est géré par le bind mount.

### 6.2 Healthchecks

- **PostgreSQL** : `pg_isready` dans le compose, avec `condition: service_healthy` sur le backend
- **Backend** : endpoint GET `/health` + HEALTHCHECK dans le Dockerfile de production

### 6.3 Sécurité Docker

- Dockerfile de production : `USER node` (non-root)
- Images Alpine uniquement (`node:20-alpine`, `postgres:16-alpine`)
- Jamais de secrets en dur dans les Dockerfiles
- `.dockerignore` strict sur chaque service

### 6.4 ESLint + Prettier

Chaque sous-projet (front et back) a sa propre config ESLint + Prettier :
- **Nuxt** : `@nuxt/eslint` (flat config)
- **Vue** : `eslint-plugin-vue` + `@typescript-eslint`
- **NestJS** : `@typescript-eslint` + config standard NestJS

Prettier est identique partout (même `.prettierrc`).

---

## PHASE 7 — Test et validation

Une fois tout généré, vérifie que :

1. **`npm run build`** du CLI compile sans erreur
2. **Crée un projet test** : `node dist/index.js test-project` avec 2 frontends (1 Nuxt, 1 Vue)
3. **`docker compose config`** dans le projet généré ne retourne pas d'erreur YAML
4. **`docker compose up --build`** démarre tous les services
5. **Hot reload fonctionne** : modifier un fichier .vue dans un frontend et vérifier que le navigateur se met à jour
6. **L'API répond** : `curl http://localhost:3001` retourne `{ "message": "API is running", "status": "ok" }`
7. **L'auth fonctionne** :
   - `curl -X POST http://localhost:3001/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"Test1234!"}'`
   - `curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"Test1234!"}'`
8. **Le Makefile fonctionne** : `make up`, `make down`, `make logs`, `make db-shell`
9. **ESLint fonctionne** : `make lint-back`, `make lint-<frontend-name>`

---

## Résumé des priorités

| Priorité | Élément |
|----------|---------|
| 🔴 Critique | Hot reloading fonctionnel dans Docker (usePolling, volumes) |
| 🔴 Critique | docker-compose.yml dynamique (N frontends) |
| 🔴 Critique | Healthcheck PostgreSQL + depends_on condition |
| 🟠 Important | Auth JWT complète et fonctionnelle |
| 🟠 Important | Templates EJS correctement rendus |
| 🟡 Standard | ESLint + Prettier préconfigurés |
| 🟡 Standard | README auto-généré |
| 🟢 Nice to have | Bannière ASCII au lancement du CLI |
| 🟢 Nice to have | Spinner pendant le scaffolding |

---

## Contraintes

- Node.js 20+ requis
- Docker Compose V2 (commande `docker compose` sans tiret)
- Pas de `npm install` dans le scaffolder — Docker gère les dépendances
- Tous les fichiers templates doivent être inclus dans le package (champ `files` du package.json)
- Le CLI doit fonctionner avec `npx boiling-fullstack` après publication npm
