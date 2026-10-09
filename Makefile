UV ?= uv
BACKEND := backend
FRONTEND := frontend

.PHONY: install dev dev-backend dev-frontend test test-backend test-frontend lint lint-backend lint-frontend export-fixtures build

install:
	cd $(BACKEND) && $(UV) sync
	cd $(FRONTEND) && npm ci

dev:
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	cd $(BACKEND) && $(UV) run uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd $(FRONTEND) && VITE_API_MODE=http npm run dev

test: test-backend test-frontend

test-backend:
	cd $(BACKEND) && $(UV) run pytest

test-frontend:
	cd $(FRONTEND) && npm test

lint: lint-backend lint-frontend

lint-backend:
	cd $(BACKEND) && $(UV) run ruff check . && $(UV) run ruff format --check . && $(UV) run mypy

lint-frontend:
	cd $(FRONTEND) && npm run lint && npm run typecheck

export-fixtures:
	cd $(BACKEND) && $(UV) run python -m scripts.export_traces

build:
	cd $(FRONTEND) && VITE_API_MODE=memory npm run build
