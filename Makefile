# Artifact Atlas — developer task runner
#
# Local-first dev: FastAPI backend (api/, :8000) + Next.js frontend (web/, :3000).
# Run `make` or `make help` for the target list.
#
# NOTE: uvicorn must launch from inside api/ so the local `app/` package wins over
# any globally-installed `app` package. The recipes cd into api/ for you.

API_DIR  := api
WEB_DIR  := web
API_HOST ?= 127.0.0.1
API_PORT ?= 8000
WEB_PORT ?= 3000

# macOS ships GNU Make 3.81, which does NOT support .ONESHELL or .SHELLFLAGS
# (added in 3.82). Each recipe line therefore runs in its OWN shell — so any
# multi-line shell logic (the `dev` target's trap + background jobs + wait) is
# written as a single \-continued command so it shares one shell. This works
# identically on make 3.81 and 4.x.
SHELL := /bin/bash

.DEFAULT_GOAL := help

.PHONY: help install install-api install-web dev api web \
        test test-api test-web test-e2e validate demo-data lint typecheck clean

help: ## Show this help
	@echo "Artifact Atlas — make targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

## ---- setup -------------------------------------------------------------

install: install-api install-web ## Install all dependencies (api + web)

install-api: ## Install API deps (FastAPI, uvicorn, pytest)
	cd $(API_DIR) && pip install -e '.[dev]'

install-web: ## Install web deps (npm)
	cd $(WEB_DIR) && npm install

## ---- run ---------------------------------------------------------------

dev: ## Run API + web together (Ctrl-C stops both)
	@echo "→ API  http://$(API_HOST):$(API_PORT)  (docs at /docs)"
	@echo "→ Web  http://localhost:$(WEB_PORT)"
	@echo "  (Ctrl-C stops both)"
	@trap 'kill 0' EXIT INT TERM; \
		( cd $(API_DIR) && uvicorn app.main:app --reload --host $(API_HOST) --port $(API_PORT) ) & \
		( cd $(WEB_DIR) && npm run dev -- --port $(WEB_PORT) ) & \
		wait

api: ## Run only the FastAPI backend (:8000, --reload)
	@echo "→ API  http://$(API_HOST):$(API_PORT)  (docs at /docs)"
	cd $(API_DIR) && uvicorn app.main:app --reload --host $(API_HOST) --port $(API_PORT)

web: ## Run only the Next.js frontend (:3000)
	@echo "→ Web  http://localhost:$(WEB_PORT)"
	cd $(WEB_DIR) && npm run dev -- --port $(WEB_PORT)

## ---- quality -----------------------------------------------------------

test: test-api test-web ## Run API + web unit/component tests

test-api: ## Run API test suite (pytest)
	cd $(API_DIR) && python3 -m pytest -q

test-web: ## Run web unit/component tests (vitest)
	cd $(WEB_DIR) && npm run test

test-e2e: ## Run web E2E smoke tests (playwright)
	cd $(WEB_DIR) && npm run test:e2e

lint: ## Lint web (next lint)
	cd $(WEB_DIR) && npm run lint

typecheck: ## Type-check web (tsc --noEmit)
	cd $(WEB_DIR) && npm run typecheck

validate: ## Validate registry JSONL/YAML exports
	python3 scripts/validate_registry_exports.py

demo-data: ## Generate richer demo data into the registry
	python3 scripts/generate_demo_data.py

## ---- housekeeping ------------------------------------------------------

clean: ## Remove build/test caches (api + web)
	rm -rf $(API_DIR)/.pytest_cache $(API_DIR)/.mypy_cache $(API_DIR)/.ruff_cache
	find $(API_DIR) -type d -name __pycache__ -prune -exec rm -rf {} +
	rm -rf $(WEB_DIR)/.next $(WEB_DIR)/test-results $(WEB_DIR)/playwright-report
	echo "cleaned."
