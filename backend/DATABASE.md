# Database Setup Guide

## Prerequisites

- PostgreSQL 14+ installed and running
- Python 3.11+ with uv package manager

## Initial Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE awsome_shop;
CREATE USER awsome_shop WITH PASSWORD 'awsome_shop';
GRANT ALL PRIVILEGES ON DATABASE awsome_shop TO awsome_shop;

# For PostgreSQL 15+, also grant schema privileges
\c awsome_shop
GRANT ALL ON SCHEMA public TO awsome_shop;
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the database URL:

```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql+asyncpg://awsome_shop:awsome_shop@localhost:5432/awsome_shop
```

### 3. Install Dependencies

```bash
make install
# or
uv sync
```

## Database Migrations

### Create a New Migration

```bash
make migrate msg="description of changes"
# or
uv run alembic revision --autogenerate -m "description of changes"
```

### Apply Migrations

```bash
make upgrade
# or
uv run alembic upgrade head
```

### Rollback Last Migration

```bash
make downgrade
# or
uv run alembic downgrade -1
```

### Check Migration Status

```bash
uv run alembic current
```

### View Migration History

```bash
uv run alembic history
```

## Development

### Run Development Server

```bash
make dev
# or
uv run uvicorn main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Run Tests

```bash
make test
# or
uv run pytest -v
```

## Database Architecture

The application uses:
- **SQLAlchemy 2.0** with async support
- **Alembic** for database migrations
- **asyncpg** as the PostgreSQL driver
- **Connection pooling** for efficient resource usage

### Connection Pool Settings

- Pool size: 10 connections
- Max overflow: 20 connections
- Pool recycle: 3600 seconds (1 hour)
- Pre-ping: Enabled (checks connection health)

## Troubleshooting

### Connection Issues

If you get connection errors:

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l | grep awsome_shop
   ```

3. Test connection:
   ```bash
   psql -U awsome_shop -d awsome_shop
   ```

### Migration Issues

If migrations fail:

1. Check current migration status:
   ```bash
   uv run alembic current
   ```

2. View migration history:
   ```bash
   uv run alembic history
   ```

3. If needed, manually fix and stamp:
   ```bash
   uv run alembic stamp head
   ```

## Production Considerations

For production deployments:

1. Use strong passwords and secure connection strings
2. Enable SSL/TLS for database connections
3. Configure appropriate pool sizes based on load
4. Set up database backups
5. Monitor connection pool usage
6. Use read replicas for read-heavy workloads
