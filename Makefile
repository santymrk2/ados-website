.PHONY: help dev build test test:e2e test:ui test:debug lint db:push db:migrate docker docker:build docker:up docker:down docker:clean ci

# ==========================================
# Development
# ==========================================

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start development server
	bun dev

install: ## Install dependencies
	bun install --frozen-lockfile

# ==========================================
# Build
# ==========================================

build: ## Build for production
	bun run build

lint: ## Run ESLint
	bun run lint

# ==========================================
# Database
# ==========================================

db:push: ## Push database schema
	bun run db:push

db:migrate: ## Run database migrations
	bun run db:migrate

# ==========================================
# Testing
# ==========================================

test: ## Run all tests
	bunx playwright test

test:e2e: ## Run E2E tests
	bunx playwright test

test:ui: ## Run tests with Playwright UI
	bunx playwright test --ui

test:debug: ## Run tests in debug mode
	bunx playwright test --debug

test:headed: ## Run tests headed (with browser visible)
	bunx playwright test --headed

test:grep: ## Run tests matching pattern
	bunx playwright test --grep "$(PATTERN)"

# ==========================================
# Docker
# ==========================================

docker: ## Build and run with docker-compose
	docker compose up --build

docker:build: ## Build Docker image
	docker build -t adosh-website .

docker:up: ## Start docker-compose services
	docker compose up -d

docker:down: ## Stop docker-compose services
	docker compose down

docker:clean: ## Remove containers, volumes, and images
	docker compose down -v --rmi local

docker:logs: ## View logs
	docker compose logs -f

# ==========================================
# CI (local)
# ==========================================

ci: lint build test:e2e ## Run CI pipeline locally (lint + build + test)