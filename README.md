# ADOS Website

Plataforma web para la gestión de talleres y actividades de ADOS (Associació de Down Catalunya).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL + Drizzle ORM
- **Testing**: Playwright (E2E)
- **Deployment**: Docker + Dokploy

## Getting Started

### Prerequisites

- Bun >= 1.0
- Node.js >= 20 (solo para desarrollo local con docker-compose)
- Docker & Docker Compose

### Local Development

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker Development

```bash
# Start all services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Database

```bash
# Local development only: push schema to a disposable database
bun run db:push

# Run migrations
bun run db:migrate

# Apply hardening constraints after schema creation
bun run db:harden
```

## Testing

```bash
# Run all tests
bunx playwright test

# Run tests with UI
bunx playwright test --ui

# Run specific test file
bunx playwright test tests/example.spec.ts
```

## Build

### Docker Production

```bash
# Build image
docker build -t adosh-website .

# Run container
docker run -p 3000:3000 adosh-website
```

## Environment Variables

```env
# Database
DATABASE_URL=

# Authentication
AUTH_SECRET=
ADMIN_PASSWORD=
VIEWER_PASSWORD=
CRON_SECRET=

# MinIO/S3-compatible image storage
MINIO_ENDPOINT=
MINIO_PUBLIC_URL=
MINIO_ROOT_USER=
MINIO_ROOT_PASSWORD=
MINIO_BUCKET_NAME=

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# Other
NEXT_PUBLIC_APP_URL=
```

## Project Structure

```
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   └── ...
├── lib/                    # Utilities & configs
├── db/                     # Drizzle ORM setup
│   ├── schema/             # Database tables
│   └── migrations/        # SQL migrations
├── public/                 # Static assets
└── tests/                  # Playwright E2E tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript without emitting files |
| `bun run db:push` | Push Drizzle schema for local/disposable databases |
| `bun run db:migrate` | Run Drizzle migrations |
| `bun run db:harden` | Apply DB integrity hardening SQL |
| `bunx playwright test` | Run E2E tests |

## CodeGraph Index

Este proyecto usa [CodeGraph](https://opencode.ai) para indexar el AST del código y permitir búsquedas estructurales rápidas desde el asistente AI.

```bash
# Reindexar después de cambios grandes (nuevos archivos, refactors, etc.)
codegraph init -i

# Verificar estado del índice
codegraph status
```

El watcher de CodeGraph detecta cambios en tiempo real con ~500ms de delay, pero después de cambios estructurales grandes conviene reindexar manualmente.

## Git Workflow

```
develop → (PR) → main → tag → deploy
```

- **develop**: Branch de desarrollo
- **main**: Branch de producción
- **tags**: Versiones (v1.0.0, etc.)

El CI corre en todo push/PR. El CD (Docker push a ghcr.io) solo corre en push a `main` o con tags.

## Deploy with Dokploy

### Production

| Campo | Valor |
|-------|-------|
| Image | `ghcr.io/santymrk2/ados-website` |
| Tag | `latest` |
| Registry | GitHub Container Registry |
| Dockerfile | `./Dockerfile` |

### Staging/Test Environment

| Campo | Valor |
|-------|-------|
| Image | `ghcr.io/santymrk2/ados-website` |
| Tag | `staging` |
| Registry | GitHub Container Registry |
| Dockerfile | `./Dockerfile` |

### Registry Authentication in Dokploy

En Dokploy, vas a **Settings → Registry** y agregás:

- **Registry URL**: `ghcr.io`
- **Username**: Tu username de GitHub
- **Password**: GitHub Personal Access Token (con permisos `read:packages`)

### Release Workflow

```bash
# Para PRODUCCIÓN (dispara build + push latest a ghcr.io)
git checkout main
git pull
git push origin main

# O con tag (dispara build + push latest + v1.0.0 a ghcr.io)
git tag v1.0.0
git push origin v1.0.0

# Para STAGING (dispara build + push staging a ghcr.io)
git checkout develop
git push origin develop
```

El CI/CD llama al webhook de Dokploy automáticamente para redeploy.

## License

MIT
