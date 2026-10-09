UV ?= uv
BACKEND := backend

.PHONY: install test lint

install:
	cd $(BACKEND) && $(UV) sync

test:
	cd $(BACKEND) && $(UV) run pytest

lint:
	cd $(BACKEND) && $(UV) run ruff check . && $(UV) run ruff format --check . && $(UV) run mypy
