# ADOS Website

Plataforma web para gestionar talleres, actividades y participantes de ADOS (Associacio de Down Catalunya).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL + Drizzle ORM
- **Object storage**: MinIO through S3-compatible APIs
- **Testing**: Playwright
- **Deployment**: Docker + GHCR + Dokploy

## Agent Skills

This project has machine-local Codex skills that coders and agents must load before touching the repo:

| Skill | Use it for |
| --- | --- |
| `$ados-website` | App code, docs, env vars, local Docker, Drizzle, MinIO, Playwright, and project conventions |
| `$ados-ci-dokploy` | GitHub Actions, GHCR image tags, Dokploy webhooks, branch protection, releases, hotfixes, and backports |

The skill files live at:

```text
~/.codex/skills/ados-website/SKILL.md
~/.codex/skills/ados-ci-dokploy/SKILL.md
```

`AGENTS.md` is the repo-level entrypoint for agent behavior. Keep it aligned with this README and `CONTRIBUTING.md`.

## Local Development

### Prerequisites

- Bun 1.3.13
- Docker and Docker Compose for the full local stack

### App Only

```bash
bun install
bun dev
```

Open `http://localhost:3000`.

### Full Docker Stack

```bash
docker compose up --build
```

This starts:

- Next.js app: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`

Default local credentials:
- PostgreSQL: `ados` / `ados_password`
- MinIO: `minioadmin` / `minioadmin`
- App viewer password: `viewer123`
- App admin password: `admin123`

Database helpers for local or disposable environments:

```bash
bun run db:push
bun run db:migrate
bun run db:harden
```

Use `db:push` only for local or disposable databases. Shared environments must use
versioned migrations with `bun run db:migrate`.

## Scripts

| Command | Description |
| --- | --- |
| `bun dev` | Start the development server |
| `bun build` | Build the production app |
| `bun start` | Start the production server |
| `bun lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript checks without emitting files |
| `bun run test:e2e` | Run Playwright E2E tests |
| `bun run db:push` | Push Drizzle schema changes |
| `bun run db:migrate` | Run Drizzle migrations |
| `bun run db:harden` | Apply database hardening SQL |

## Environment Variables

Required in Dokploy:

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
MINIO_BUCKET_NAME=activados

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com

# Public app URL
NEXT_PUBLIC_APP_URL=
```

`MINIO_ENDPOINT` should be the internal service URL reachable by the app container. `MINIO_PUBLIC_URL` should be the browser-reachable URL used for signed image URLs.

## Project Structure

```text
src/
├── app/          # Next.js App Router routes and API handlers
├── components/   # UI and feature components
├── hooks/        # React hooks
├── lib/          # Database, schema, utilities, cache, logger
├── services/     # MinIO and web-push services
├── store/        # Client state
└── types/        # Shared TypeScript types

tests/            # Playwright tests and page objects
public/           # Static assets and PWA files
```

## Branch Model

This repository uses two long-lived branches:

- `develop`: integration and testing
- `main`: production

Allowed pull request flows:

```text
feature/*     -> develop
fix/*         -> develop
refactor/*    -> develop
enhancement/* -> develop
dependabot/*  -> develop
backport/*    -> develop

develop       -> main
hotfix/*      -> main
```

Do not push directly to `develop` or `main`. Open a pull request and let CI validate it.

## CI/CD

GitHub Actions is split by responsibility:

- `CI`: validates pull requests into `develop` and `main`.
- `Deploy Staging`: validates and deploys every push to `develop`.
- `Deploy Production`: validates and deploys every push to `main`.
- `Hotfix Backport`: opens a backport PR to `develop` after a merged `hotfix/* -> main` PR.

The quality gate runs:

1. dependency install with `bun install --frozen-lockfile`;
2. ESLint;
3. TypeScript typecheck;
4. production build;
5. Drizzle migrations against a CI PostgreSQL service;
6. database hardening against CI PostgreSQL;
7. Playwright tests.

## Dokploy

### Testing

| Field | Value |
| --- | --- |
| Image | `ghcr.io/santymrk2/ados-website:staging` |
| Registry | GitHub Container Registry |
| Dockerfile | `./Dockerfile` |
| GitHub environment | `staging` |
| GitHub secret | `DOKPLOY_STAGING_WEBHOOK_URL` |

### Production

| Field | Value |
| --- | --- |
| Image | `ghcr.io/santymrk2/ados-website:latest` |
| Registry | GitHub Container Registry |
| Dockerfile | `./Dockerfile` |
| GitHub environment | `production` |
| GitHub secret | `DOKPLOY_PRODUCTION_WEBHOOK_URL` |

In Dokploy, configure registry authentication for `ghcr.io` with a GitHub token that can read packages.

The production image starts the standalone Next.js server directly. Schema changes and hardening must be handled explicitly as part of your deployment process instead of relying on container startup side effects.

### Database Migrations

Deploys do not run database migrations automatically at container startup. Run
the migrations explicitly against the target environment before relying on the
new app image:

```bash
bun run db:migrate
```

For staging, run migrations against the testing database before or immediately
after deploying `ghcr.io/santymrk2/ados-website:staging`.

For production, run the same migration command against the production database
before or during the `develop -> main` release. The image includes
`drizzle.config.ts` and the `drizzle/` migration directory so operators can run
Drizzle from the deployed container or another trusted environment with database
network access.

## Release Workflow

### Normal Release

1. Merge day-to-day work into `develop`.
2. Confirm testing deploy from `ghcr.io/santymrk2/ados-website:staging`.
3. Open a PR from `develop` to `main`.
4. Merge after CI and review.
5. GitHub Actions publishes `ghcr.io/santymrk2/ados-website:latest`.
6. Dokploy production redeploys from `latest`.

No backport is needed for normal releases because production receives code that already came from `develop`.

### Hotfix

1. Branch from `main` using `hotfix/<short-description>`.
2. Open a PR to `main`.
3. Merge after CI and review.
4. GitHub Actions publishes `latest` and redeploys production.
5. GitHub Actions opens a `backport/* -> develop` PR.
6. Review and merge the backport PR so testing catches up with production.

## Required GitHub Repository Settings

### Actions

- Set workflow permissions to **Read and write permissions**.
- Enable **Allow GitHub Actions to create and approve pull requests**.
- Verify GitHub Actions can publish packages to GHCR.

### Environments

Create:

- `staging` with secret `DOKPLOY_STAGING_WEBHOOK_URL`.
- `production` with secret `DOKPLOY_PRODUCTION_WEBHOOK_URL`.

Recommended for `production`: require reviewer approval before deployment.

### Branch Protection

Protect `develop`:

- require pull request before merging;
- require status checks `Branch Rules` and `Quality Gate`;
- block force pushes;
- block branch deletion.

Protect `main`:

- require pull request before merging;
- require status checks `Branch Rules` and `Quality Gate`;
- require at least one approval;
- block force pushes;
- block branch deletion.

## CodeGraph Index

This project uses CodeGraph for structural code search.

```bash
codegraph init -i
codegraph status
```

## License

MIT
