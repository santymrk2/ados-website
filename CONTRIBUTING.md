# Contributing to ADOS Website

This repository uses a disciplined branch model. Follow it. Random branches and direct pushes create deployment risk.

## Branches

- `develop` is the integration and testing branch.
- `main` is the production branch.

Allowed pull request targets:

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

## Pull Requests

Every PR must pass CI before merge. CI validates branch rules, lint, typecheck, build, database schema push, database hardening, and Playwright tests.

Do not merge broken CI because "it works locally". Locally is not production. Cut the crap and fix the real failure.

## Agent Workflow

Before editing this repository with Codex or another agent, load the project skill that matches the work:

- `$ados-website`: app code, docs, env vars, local Docker, Drizzle, MinIO, Playwright, and project conventions.
- `$ados-ci-dokploy`: GitHub Actions, GHCR tags, Dokploy webhooks, branch protection, deploys, hotfixes, and backports.

Framework-specific work still needs the framework skill too: Next.js, React, TypeScript, Tailwind, or Playwright. One skill does not magically replace fundamentals.

## Testing Deploys

Merging to `develop` publishes:

```text
ghcr.io/santymrk2/ados-website:staging
```

Dokploy testing redeploys from that image.

## Production Releases

Production releases happen by opening and merging:

```text
develop -> main
```

After merge, GitHub Actions publishes:

```text
ghcr.io/santymrk2/ados-website:latest
```

Dokploy production redeploys from that image.

## Hotfixes

Use hotfixes only for production urgency.

```text
main -> hotfix/<short-description> -> main
```

After the hotfix PR merges, GitHub Actions opens a `backport/* -> develop` PR. Review it and merge it. Do not leave `develop` behind production.

## Backports

Backport PRs are automatic but not auto-merged. If there is a conflict, resolve it manually and verify the intent. Automation moves the bricks; engineers still own the building.

## Local Checks

Useful local commands:

```bash
bun install
bun run lint
bun run typecheck
bun run test:e2e
```

Production builds are enforced in GitHub Actions. Do not use local build success as a substitute for CI.
