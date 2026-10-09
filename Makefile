UV ?= uv
BACKEND := backend

.PHONY: install dev test lint export-fixtures

install:
	cd $(BACKEND) && $(UV) sync

dev:
	cd $(BACKEND) && $(UV) run uvicorn app.main:app --reload --port 8000

test:
	cd $(BACKEND) && $(UV) run pytest

lint:
	cd $(BACKEND) && $(UV) run ruff check . && $(UV) run ruff format --check . && $(UV) run mypy

export-fixtures:
	cd $(BACKEND) && $(UV) run python -m scripts.export_traces
