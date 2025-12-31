.PHONY: help install dev test migrate upgrade downgrade revision clean

help:
	@echo "AWSomeShop Backend - Available Commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Run development server"
	@echo "  make test       - Run tests"
	@echo "  make migrate    - Create a new migration"
	@echo "  make upgrade    - Apply migrations"
	@echo "  make downgrade  - Rollback last migration"
	@echo "  make revision   - Create empty migration"
	@echo "  make clean      - Clean cache files"

install:
	uv sync

dev:
	uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

test:
	uv run pytest -v

migrate:
	uv run alembic revision --autogenerate -m "$(msg)"

upgrade:
	uv run alembic upgrade head

downgrade:
	uv run alembic downgrade -1

revision:
	uv run alembic revision -m "$(msg)"

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
